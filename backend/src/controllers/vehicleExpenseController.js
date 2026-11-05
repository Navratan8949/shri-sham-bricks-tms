const VehicleExpense = require("../models/VehicleExpense");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

exports.list = async (req, res) => {
  try {
    const { fromDate, toDate, vehicleId, category } = req.query;
    const ownVehicleIds = await Vehicle.find({ companyId: req.user.companyId, ownerType: { $ne: "market" }, ownership: { $ne: "market" } }).distinct("_id");
    const q = { companyId: req.user.companyId, vehicleId: vehicleId ? { $in: ownVehicleIds.filter(id => String(id) === String(vehicleId)) } : { $in: ownVehicleIds } };
    if (category && category !== "all") q.category = category;
    if (fromDate || toDate) q.expenseDate = { ...(fromDate ? { $gte: new Date(`${fromDate}T00:00:00+05:30`) } : {}), ...(toDate ? { $lte: new Date(`${toDate}T23:59:59.999+05:30`) } : {}) };
    const data = await VehicleExpense.find(q).populate("vehicleId", "vehicleNumber vehicleType").populate("driverId", "name phone").sort({ expenseDate: -1 });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { vehicleId, driverId, category, amount, litres, expenseDate, paidVia, slipNumber, notes } = req.body;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId: req.user.companyId, ownerType: { $ne: "market" }, ownership: { $ne: "market" } });
    if (!vehicle) return res.status(400).json({ success: false, message: "Select a valid own-fleet vehicle" });
    const finalDriverId = driverId || vehicle.driverId || null;
    if (finalDriverId && !(await Driver.exists({ _id: finalDriverId, companyId: req.user.companyId }))) return res.status(400).json({ success: false, message: "Invalid driver" });
    const data = await VehicleExpense.create({ companyId: req.user.companyId, vehicleId, driverId: finalDriverId, category, amount: Math.round(Number(amount)), litres: Number(litres) || 0, expenseDate: expenseDate || new Date(), paidVia: paidVia || "cash", slipNumber, notes });
    res.status(201).json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { vehicleId, driverId, category, amount, litres, expenseDate, paidVia, slipNumber, notes } = req.body;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, companyId: req.user.companyId, ownerType: { $ne: "market" }, ownership: { $ne: "market" } });
    if (!vehicle) return res.status(400).json({ success: false, message: "Select a valid own-fleet vehicle" });
    const finalDriverId = driverId || vehicle.driverId || null;
    if (finalDriverId && !(await Driver.exists({ _id: finalDriverId, companyId: req.user.companyId }))) return res.status(400).json({ success: false, message: "Invalid driver" });
    const data = await VehicleExpense.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { vehicleId, driverId: finalDriverId, category, amount: Math.round(Number(amount)), litres: Number(litres) || 0, expenseDate: expenseDate || new Date(), paidVia: paidVia || "cash", slipNumber, notes },
      { new: true, runValidators: true }
    );
    if (!data) return res.status(404).json({ success: false, message: "Expense not found" });
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const data = await VehicleExpense.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!data) return res.status(404).json({ success: false, message: "Expense not found" });
    res.json({ success: true, message: "Expense deleted" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
