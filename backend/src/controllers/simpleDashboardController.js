const mongoose = require("mongoose");
const SupplyOrder = require("../models/SupplyOrder");
const VehicleExpense = require("../models/VehicleExpense");
const Vehicle = require("../models/Vehicle");

exports.getSummary = async (req, res) => {
  try {
    if (!req.user.companyId || !mongoose.Types.ObjectId.isValid(req.user.companyId)) {
      return res.status(400).json({ success: false, message: "A valid company context is required" });
    }
    const companyId = new mongoose.Types.ObjectId(req.user.companyId);
    const { fromDate, toDate } = req.query;
    const dateRange = (field) => (fromDate || toDate ? { [field]: { ...(fromDate ? { $gte: new Date(`${fromDate}T00:00:00+05:30`) } : {}), ...(toDate ? { $lte: new Date(`${toDate}T23:59:59.999+05:30`) } : {}) } } : {});
    const orderMatch = { companyId, customerId: { $exists: true }, materialId: { $exists: true }, ...dateRange("orderDate") };
    const expenseMatch = { companyId, ...dateRange("expenseDate") };
    const vehicles = await Vehicle.find({
      companyId,
      ownerType: { $ne: "market" },
      ownership: { $ne: "market" }
    }).populate("driverId", "name").lean();
    const ownVehicleIds = vehicles.map((v) => v._id);
    const [orders, expenses] = await Promise.all([
      SupplyOrder.find({ ...orderMatch, vehicleId: { $in: ownVehicleIds } }).populate("materialId", "name unit").lean(),
      VehicleExpense.find({ ...expenseMatch, vehicleId: { $in: ownVehicleIds } }).populate("vehicleId", "vehicleNumber").lean()
    ]);
    const sales = orders.reduce((s, o) => s + Number(o.taxableAmount || 0), 0);
    const gst = orders.reduce((s, o) => s + Number(o.gstAmount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const categoryTotals = expenses.reduce((a, e) => { a[e.category] = (a[e.category] || 0) + Number(e.amount || 0); return a; }, {});
    const byVehicle = vehicles.map(v => {
      const os = orders.filter(o => String(o.vehicleId) === String(v._id));
      const es = expenses.filter(e => String(e.vehicleId?._id || e.vehicleId) === String(v._id));
      const sumCat = (c) => es.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount || 0), 0);
      const revenue = os.reduce((s, o) => s + Number(o.taxableAmount || 0), 0);
      const gst = os.reduce((s, o) => s + Number(o.gstAmount || 0), 0);
      const cost = es.reduce((s, e) => s + Number(e.amount || 0), 0);
      const volume = {};
      os.forEach(o => { const key = `${o.materialId?.name || "Material"} (${o.unit})`; volume[key] = (volume[key] || 0) + Number(o.quantity || 0); });
      return { _id: v._id, vehicleNumber: v.vehicleNumber, driverName: v.driverId?.name || "", deliveries: os.length, revenue, gst, fuel: sumCat("fuel"), driverKharcha: sumCat("driver_kharcha"), maintenance: sumCat("maintenance"), tyre: sumCat("tyre"), fastag: sumCat("fastag"), other: sumCat("other"), totalExpenses: cost, netProfit: revenue - cost, volume };
    });
    const volume = {};
    orders.forEach(o => { const key = `${o.materialId?.name || "Material"} (${o.unit})`; volume[key] = (volume[key] || 0) + Number(o.quantity || 0); });
    res.json({ success: true, data: { kpis: { totalDeliveries: orders.length, sales, gst, grossBilled: sales + gst, totalExpenses, netProfit: sales - totalExpenses, volume }, categoryTotals, vehicles: byVehicle } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
