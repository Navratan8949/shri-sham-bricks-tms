const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  name: { type: String, required: true, trim: true },
  unit: { type: String, enum: ["Ton", "CFT", "Pcs", "Trolley", "Brass"], default: "Ton" },
  defaultRate: { type: Number, default: 0, min: 0 },
  gstRate: { type: Number, enum: [0, 5, 12, 18], default: 5 },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

materialSchema.index({ companyId: 1, name: 1 }, { unique: true });
module.exports = mongoose.models.Material || mongoose.model("Material", materialSchema);
