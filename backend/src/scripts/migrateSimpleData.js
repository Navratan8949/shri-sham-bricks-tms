require("dotenv").config();
const mongoose = require("mongoose");
const SupplyOrder = require("../models/SupplyOrder");
const Material = require("../models/Material");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const VehicleExpense = require("../models/VehicleExpense");
const Fuel = require("../models/Fuel");
const Maintenance = require("../models/Maintenance");
const Tyre = require("../models/Tyre");
const Expense = require("../models/Expense");

const apply = process.argv.includes("--apply");
const units = (value) => {
  const v = String(value || "").toLowerCase();
  if (["pcs", "piece", "pieces", "nos", "number"].includes(v)) return "Pcs";
  if (["cft", "cu ft"].includes(v)) return "CFT";
  if (["trolley"].includes(v)) return "Trolley";
  if (["brass"].includes(v)) return "Brass";
  return "Ton";
};
const gst = (value) => [0, 5, 12, 18].includes(Number(value)) ? Number(value) : 5;

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Legacy migration mode: ${apply ? "APPLY" : "DRY RUN"}`);

  let migratedOrders = 0, skippedOrders = 0;
  const legacyOrders = await SupplyOrder.collection.find({ $or: [{ customerId: { $exists: false } }, { materialId: { $exists: false } }] }).toArray();
  for (const old of legacyOrders) {
    const companyId = old.companyId;
    if (!old.vehicleId || !old.partyId || !(await Vehicle.exists({ _id: old.vehicleId, companyId, ownerType: { $ne: "market" }, ownership: { $ne: "market" } }))) {
      skippedOrders++;
      console.log(`SKIP supply order ${old.soNumber || old._id}: missing customer/own vehicle assignment`);
      continue;
    }
    const customer = await Customer.findOne({ _id: old.partyId, companyId });
    if (!customer) { skippedOrders++; continue; }
    const product = old.productId ? await Product.findOne({ _id: old.productId, companyId }) : null;
    const materialName = product?.name || old.productName || "Bricks";
    let material = await Material.findOne({ companyId, name: materialName });
    if (!material) {
      if (!apply) { migratedOrders++; continue; }
      material = await Material.create({ companyId, name: materialName, unit: units(product?.unit || old.unit), defaultRate: Number(product?.standardRate ?? old.rate ?? 0), gstRate: gst(product?.gstRate), status: "active" });
    }
    const quantity = Number(old.quantity || 0), rate = Number(old.rate || 0);
    const taxableAmount = Math.round(quantity * rate * 100) / 100;
    const gstRate = gst(product?.gstRate);
    const gstAmount = Math.round(taxableAmount * gstRate) / 100;
    const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;
    const advanceReceived = Number(old.advanceReceived || 0);
    const paymentStatus = advanceReceived <= 0 ? "pending" : advanceReceived >= grandTotal ? "paid" : "partial";
    const update = {
      soNumber: old.soNumber || `SSB-SUP-${String(old._id).slice(-8)}`,
      orderDate: old.soDate || old.createdAt || new Date(),
      customerId: customer._id, materialId: material._id, quantity, unit: material.unit, rate,
      taxableAmount, gstRate, gstAmount, grandTotal,
      loadingSite: old.originHub || "Quarry / Kiln Yard",
      unloadingSite: old.deliverySite || old.destinationCity || customer.siteAddress || customer.address || "Not specified",
      vehicleId: old.vehicleId, driverId: old.driverId || null, advanceReceived,
      balanceDue: Math.max(0, grandTotal - advanceReceived), paymentStatus,
      remarks: old.remarks || ""
    };
    if (apply) await SupplyOrder.collection.updateOne({ _id: old._id }, { $set: update });
    migratedOrders++;
  }

  const expenseSources = [
    { name: "Fuel", Model: Fuel, category: "fuel", date: "fuelDate", amount: "totalAmount", litres: "quantity" },
    { name: "Maintenance", Model: Maintenance, category: "maintenance", date: "maintenanceDate", amount: "totalCost" },
    { name: "Tyre", Model: Tyre, category: "tyre", date: "purchaseDate", amount: "purchasePrice" }
  ];
  let migratedExpenses = 0, skippedExpenses = 0;
  for (const source of expenseSources) {
    const docs = await source.Model.find({ vehicleId: { $ne: null } }).lean();
    for (const old of docs) {
      if (!old.companyId || !old.vehicleId || !(Number(old[source.amount]) > 0) || !(await Vehicle.exists({ _id: old.vehicleId, companyId: old.companyId, ownerType: { $ne: "market" }, ownership: { $ne: "market" } }))) { skippedExpenses++; continue; }
      const exists = await VehicleExpense.exists({ companyId: old.companyId, legacySource: source.name, legacySourceId: old._id });
      if (exists) continue;
      const payload = {
        companyId: old.companyId, vehicleId: old.vehicleId, driverId: old.driverId || null,
        category: source.category, amount: Number(old[source.amount]), expenseDate: old[source.date] || old.createdAt || new Date(),
        litres: Number(old[source.litres] || 0), paidVia: "cash",
        slipNumber: old.receiptNumber || old.invoiceNumber || old.tyreNumber || "",
        notes: old.notes || old.description || old.remarks || `Migrated from ${source.name}`,
        legacySource: source.name, legacySourceId: old._id
      };
      if (apply) await VehicleExpense.create(payload);
      migratedExpenses++;
    }
  }

  const legacyVehicleExpenses = await Expense.find({ vehicleId: { $ne: null }, status: { $ne: "cancelled" } }).lean();
  for (const old of legacyVehicleExpenses) {
    if (!old.companyId || !old.vehicleId || !(Number(old.amount) > 0) || !(await Vehicle.exists({ _id: old.vehicleId, companyId: old.companyId, ownerType: { $ne: "market" }, ownership: { $ne: "market" } }))) { skippedExpenses++; continue; }
    if (await VehicleExpense.exists({ companyId: old.companyId, legacySource: "Expense", legacySourceId: old._id })) continue;
    const key = String(old.category || "").toLowerCase();
    const category = key.includes("diesel") || key === "urea" ? "fuel" : key.includes("driver") ? "driver_kharcha" : key.includes("tyre") || key.includes("puncture") ? "tyre" : key.includes("maintenance") || key.includes("repair") ? "maintenance" : "other";
    const payload = { companyId: old.companyId, vehicleId: old.vehicleId, driverId: old.driverId || null, category, amount: Number(old.amount), expenseDate: old.expenseDate || old.createdAt || new Date(), paidVia: "cash", slipNumber: old.receiptNumber || old.expenseNumber || "", notes: old.description || old.remarks || `Migrated from expense ${old.expenseNumber || ""}`, legacySource: "Expense", legacySourceId: old._id };
    if (apply) await VehicleExpense.create(payload);
    migratedExpenses++;
  }

  console.log({ migratedOrders, skippedOrders, migratedExpenses, skippedExpenses, applied: apply });
  await mongoose.disconnect();
}
main().catch(async e => { console.error(e); await mongoose.disconnect().catch(()=>{}); process.exit(1); });
