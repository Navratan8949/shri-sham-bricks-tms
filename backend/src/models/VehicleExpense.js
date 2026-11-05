const mongoose = require("mongoose");

const vehicleExpenseSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  expenseDate: { type: Date, default: Date.now, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
  category: { type: String, enum: ["fuel", "driver_kharcha", "maintenance", "tyre", "fastag", "other"], required: true },
  amount: { type: Number, required: true, min: 0 },
  litres: { type: Number, default: 0, min: 0 },
  paidVia: { type: String, enum: ["cash", "online", "bank", "cheque"], default: "cash" },
  slipNumber: { type: String, trim: true, default: "" },
  notes: { type: String, trim: true, default: "" },
  legacySource: { type: String, default: undefined },
  legacySourceId: { type: mongoose.Schema.Types.ObjectId, default: undefined }
}, { timestamps: true });

vehicleExpenseSchema.index({ companyId: 1, vehicleId: 1, expenseDate: -1 });
vehicleExpenseSchema.index({ companyId: 1, legacySource: 1, legacySourceId: 1 }, { unique: true, partialFilterExpression: { legacySource: { $type: "string" }, legacySourceId: { $type: "objectId" } } });
module.exports = mongoose.models.VehicleExpense || mongoose.model("VehicleExpense", vehicleExpenseSchema);
