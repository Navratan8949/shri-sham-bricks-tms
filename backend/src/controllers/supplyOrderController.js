const SupplyOrder = require("../models/SupplyOrder");
const Customer = require("../models/Customer");
const Material = require("../models/Material");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

const recalc = (body) => {
  const quantity = Number(body.quantity);
  const rate = Number(body.rate);
  const gstRate = Number(body.gstRate ?? 5);
  const advanceReceived = Math.round(Number(body.advanceReceived || 0));
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Quantity must be greater than zero");
  if (!Number.isFinite(rate) || rate < 0) throw new Error("Rate cannot be negative");
  if (![0, 5, 12, 18].includes(gstRate)) throw new Error("Invalid GST rate");
  if (!Number.isFinite(advanceReceived) || advanceReceived < 0) throw new Error("Advance cannot be negative");
  const taxableAmount = Math.round(quantity * rate);
  const gstAmount = Math.round((taxableAmount * gstRate) / 100);
  const grandTotal = taxableAmount + gstAmount;
  if (advanceReceived > grandTotal) {
    throw new Error(`Payment received (₹${advanceReceived.toLocaleString("en-IN")}) cannot exceed total bill (₹${grandTotal.toLocaleString("en-IN")})`);
  }
  const balanceDue = Math.max(0, grandTotal - advanceReceived);
  const paymentStatus = advanceReceived <= 0 ? "pending" : advanceReceived >= grandTotal ? "paid" : "partial";
  return { quantity, rate: Math.round(rate), gstRate, advanceReceived, taxableAmount, gstAmount, grandTotal, balanceDue, paymentStatus };
};

exports.getSupplyOrders = async (req, res) => {
  try {
    const ownVehicleIds = await Vehicle.find({ companyId: req.user.companyId, ownerType: { $ne: "market" }, ownership: { $ne: "market" } }).distinct("_id");
    const q = { companyId: req.user.companyId, vehicleId: { $in: ownVehicleIds }, customerId: { $exists: true }, materialId: { $exists: true } };
    const { search, fromDate, toDate, paymentStatus } = req.query;
    if (paymentStatus && paymentStatus !== "all") q.paymentStatus = paymentStatus;
    if (fromDate || toDate) q.orderDate = { ...(fromDate ? { $gte: new Date(`${fromDate}T00:00:00+05:30`) } : {}), ...(toDate ? { $lte: new Date(`${toDate}T23:59:59.999+05:30`) } : {}) };
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const [customers, materials, vehicles] = await Promise.all([
        Customer.find({ companyId: req.user.companyId, name: re }).distinct("_id"),
        Material.find({ companyId: req.user.companyId, name: re }).distinct("_id"),
        Vehicle.find({ companyId: req.user.companyId, vehicleNumber: re }).distinct("_id")
      ]);
      q.$or = [{ customerId: { $in: customers } }, { materialId: { $in: materials } }, { vehicleId: { $in: vehicles } }, { unloadingSite: re }, { loadingSite: re }];
    }
    const data = await SupplyOrder.find(q).populate("customerId", "name phone siteAddress address gstin gstNumber").populate("materialId", "name unit gstRate").populate("vehicleId", "vehicleNumber vehicleType").populate("driverId", "name phone").sort({ orderDate: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getSupplyOrderById = async (req, res) => {
  try {
    const data = await SupplyOrder.findOne({ _id: req.params.id, companyId: req.user.companyId, customerId: { $exists: true }, materialId: { $exists: true } }).populate("customerId materialId vehicleId driverId");
    if (!data) return res.status(404).json({ success: false, message: "Supply order not found" });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createSupplyOrder = async (req, res) => {
  try {
    const b = req.body;
    const companyId = req.user.companyId;
    const [customer, material, vehicle] = await Promise.all([
      Customer.findOne({ _id: b.customerId, companyId, status: "active" }),
      Material.findOne({ _id: b.materialId, companyId, status: "active" }),
      Vehicle.findOne({ _id: b.vehicleId, companyId, status: "active" })
    ]);
    if (!customer) return res.status(400).json({ success: false, message: "Select an active customer" });
    if (!material) return res.status(400).json({ success: false, message: "Select an active material" });
    if (!vehicle || vehicle.ownerType === "market" || vehicle.ownership === "market") return res.status(400).json({ success: false, message: "Only own-fleet vehicles can be selected" });
    const driverId = b.driverId || vehicle.driverId || null;
    if (driverId && !(await Driver.exists({ _id: driverId, companyId, status: "active" }))) return res.status(400).json({ success: false, message: "Select a valid active driver" });
    const finalUnloadingSite = String(b.unloadingSite || customer.siteAddress || customer.address || "").trim();
    if (!finalUnloadingSite) return res.status(400).json({ success: false, message: "Unloading site is required" });
    const calc = recalc({ ...b, gstRate: b.gstRate ?? material.gstRate });
    const data = await SupplyOrder.create({
      companyId,
      soNumber: `SSB-SUP-${Date.now()}`,
      customerId: customer._id, materialId: material._id,
      orderDate: b.orderDate || new Date(), unit: material.unit, ...calc,
      loadingSite: b.loadingSite || "Quarry / Kiln Yard",
      unloadingSite: finalUnloadingSite,
      vehicleId: vehicle._id, driverId,
      paymentMode: b.paymentMode || "cash",
      paymentReference: b.paymentReference || "",
      remarks: b.remarks || "", createdBy: req.user._id || null
    });
    res.status(201).json({ success: true, data: await data.populate(["customerId", "materialId", "vehicleId", "driverId"]) });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.updateSupplyOrder = async (req, res) => {
  try {
    const data = await SupplyOrder.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!data) return res.status(404).json({ success: false, message: "Supply order not found" });
    const b = { ...data.toObject(), ...req.body };
    if (req.body.customerId && req.body.unloadingSite === undefined) {
      const selectedCustomer = await Customer.findOne({ _id: req.body.customerId, companyId: req.user.companyId });
      if (selectedCustomer) b.unloadingSite = selectedCustomer.siteAddress || selectedCustomer.address || b.unloadingSite;
    }
    if (req.body.vehicleId && req.body.driverId === undefined) {
      const selectedVehicle = await Vehicle.findOne({ _id: req.body.vehicleId, companyId: req.user.companyId });
      if (selectedVehicle) b.driverId = selectedVehicle.driverId || null;
    }
    if (b.customerId && !(await Customer.exists({ _id: b.customerId, companyId: req.user.companyId }))) return res.status(400).json({ success: false, message: "Invalid customer" });
    if (b.materialId && !(await Material.exists({ _id: b.materialId, companyId: req.user.companyId }))) return res.status(400).json({ success: false, message: "Invalid material" });
    if (b.vehicleId && !(await Vehicle.exists({ _id: b.vehicleId, companyId: req.user.companyId, ownerType: { $ne: "market" }, ownership: { $ne: "market" } }))) return res.status(400).json({ success: false, message: "Invalid own-fleet vehicle" });
    if (b.driverId && !(await Driver.exists({ _id: b.driverId, companyId: req.user.companyId, status: "active" }))) return res.status(400).json({ success: false, message: "Invalid active driver" });
    const calc = recalc(b);
    ["customerId", "materialId", "vehicleId", "orderDate", "loadingSite", "unloadingSite", "remarks", "paymentMode", "paymentReference"].forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
    if (req.body.driverId !== undefined || req.body.vehicleId !== undefined) data.driverId = b.driverId || null;
    Object.assign(data, calc);
    await data.save();
    res.json({ success: true, data: await data.populate(["customerId", "materialId", "vehicleId", "driverId"]) });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.deleteSupplyOrder = async (req, res) => {
  try {
    const data = await SupplyOrder.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!data) return res.status(404).json({ success: false, message: "Supply order not found" });
    res.json({ success: true, message: "Supply order deleted" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
