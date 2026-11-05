const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    vehicleType: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleName: {
      type: String,
      trim: true,
      default: "",
    },

    make: {
      type: String,
      trim: true,
      default: "Tata Motors",
    },

    model: {
      type: String,
      trim: true,
      default: "",
    },

    yearOfManufacture: {
      type: Number,
      default: new Date().getFullYear(),
    },

    fuelType: {
      type: String,
      enum: ["Diesel", "CNG", "LNG", "Electric", "Other", "diesel", "cng", "lng", "electric", "other"],
      default: "Diesel",
      set: (v) => {
        if (!v) return "Diesel";
        const map = { diesel: "Diesel", cng: "CNG", lng: "LNG", electric: "Electric", other: "Other" };
        return map[v.toLowerCase()] || v;
      },
    },

    payloadCapacity: {
      type: Number,
      default: 20,
      min: 0,
    },

    chassisNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    engineNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    defaultDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    ownerType: {
      type: String,
      enum: ["own", "market", "company", "self"],
      default: "own",
    },

    ownership: {
      type: String,
      enum: ["own", "market", "company", "self"],
      default: "own",
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },

    ownerName: {
      type: String,
      trim: true,
    },

    vendorName: {
      type: String,
      trim: true,
    },

    ownerPhone: {
      type: String,
      trim: true,
    },

    currentOdometer: {
      type: Number,
      default: 0,
      min: 0,
    },

    // RTO Documents & Compliance Expiry
    rcNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    rcExpiryDate: {
      type: Date,
      default: null,
    },
    fitnessNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    fitnessExpiryDate: {
      type: Date,
      default: null,
    },
    insuranceCompany: {
      type: String,
      trim: true,
      default: "",
    },
    insurancePolicyNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    insuranceExpiryDate: {
      type: Date,
      default: null,
    },
    permitNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    permitExpiryDate: {
      type: Date,
      default: null,
    },
    pucNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    pucExpiryDate: {
      type: Date,
      default: null,
    },
    roadTaxExpiryDate: {
      type: Date,
      default: null,
    },

    rcDocument: {
      type: String,
      default: "",
    },
    insuranceDocument: {
      type: String,
      default: "",
    },
    fitnessDocument: {
      type: String,
      default: "",
    },
    permitDocument: {
      type: String,
      default: "",
    },
    pucDocument: {
      type: String,
      default: "",
    },
    roadTaxDocument: {
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
      enum: ["active", "inactive", "under_maintenance", "maintenance"],
      default: "active",
      set: (v) =>
        !v || (typeof v === "string" && (!v.trim() || v.trim().toLowerCase().startsWith("select")))
          ? "active"
          : typeof v === "string"
            ? v.trim().toLowerCase().replace(" ", "_")
            : v,
    },
  },
  {
    timestamps: true,
  },
);

vehicleSchema.pre("save", function () {
  const isMarket = this.ownerType === "market" || this.ownership === "market";
  if (isMarket) {
    this.ownerType = "market";
    this.ownership = "market";
    if (this.ownerName && !this.vendorName) {
      this.vendorName = this.ownerName;
    } else if (this.vendorName && !this.ownerName) {
      this.ownerName = this.vendorName;
    }
  } else {
    this.ownerType = "own";
    this.ownership = "own";
    this.vendorName = "";
    this.vendorId = null;
    this.ownerPhone = "";
  }
});

vehicleSchema.index({ companyId: 1, vehicleNumber: 1 }, { unique: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
