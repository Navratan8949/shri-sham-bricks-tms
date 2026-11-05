const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    photo: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
      default: "",
    },

    assignedVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    address: {
      type: String,
      trim: true,
    },

    aadhaarNumber: {
      type: String,
      trim: true,
    },

    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
    },

    licenseExpiryDate: {
      type: Date,
    },

    emergencyContactName: {
      type: String,
      trim: true,
      default: "",
    },

    emergencyContact: {
      type: String,
      trim: true,
      default: "",
    },

    monthlySalary: {
      type: Number,
      default: 0,
      min: 0,
    },

    dailyAllowance: {
      type: Number,
      default: 0,
      min: 0,
    },

    dutyStatus: {
      type: String,
      enum: ["On Duty", "Off Duty", "On Leave", "Resigned", "active", "inactive"],
      default: "On Duty",
      trim: true,
    },

    dateOfJoining: {
      type: Date,
      default: Date.now,
    },

    licenseScan: {
      type: String,
      default: "",
    },

    aadharScan: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      set: (v) =>
        !v || (typeof v === "string" && (!v.trim() || v.trim().toLowerCase().startsWith("select")))
          ? "active"
          : typeof v === "string"
            ? v.trim().toLowerCase()
            : v,
    },
  },
  {
    timestamps: true,
  },
);

driverSchema.index({ companyId: 1, phone: 1 }, { unique: true });

driverSchema.index(
  { companyId: 1, licenseNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { licenseNumber: { $type: "string", $gt: "" } },
  },
);

module.exports = mongoose.model("Driver", driverSchema);
