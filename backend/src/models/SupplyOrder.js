const mongoose = require("mongoose");

const supplyOrderSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  soNumber: { type: String, required: true, trim: true, uppercase: true },
  orderDate: { type: Date, default: Date.now, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: String, enum: ["Ton", "CFT", "Pcs", "Trolley", "Brass"], default: "Ton" },
  rate: { type: Number, required: true, min: 0 },
  taxableAmount: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, enum: [0, 5, 12, 18], default: 5 },
  gstAmount: { type: Number, default: 0, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  loadingSite: { type: String, trim: true, default: "Quarry / Kiln Yard" },
  unloadingSite: { type: String, trim: true, required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
  advanceReceived: { type: Number, default: 0, min: 0 },
  balanceDue: { type: Number, default: 0, min: 0 },
  paymentStatus: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
  paymentMode: { type: String, enum: ["cash", "online", "bank", "cheque"], default: "cash" },
  paymentReference: { type: String, trim: true, default: "" },
  remarks: { type: String, trim: true, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

supplyOrderSchema.index({ companyId: 1, soNumber: 1 });
supplyOrderSchema.index({ companyId: 1, orderDate: -1 });
supplyOrderSchema.index({ companyId: 1, customerId: 1 });
module.exports = mongoose.models.SupplyOrder || mongoose.model("SupplyOrder", supplyOrderSchema);
