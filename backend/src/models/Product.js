const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    category: {
      type: String,
      trim: true,
      default: "Clay Bricks",
    },

    unit: {
      type: String,
      trim: true,
      default: "Pieces",
    },

    standardRate: {
      type: Number,
      required: true,
      default: 7.5,
      min: 0,
    },

    hsnCode: {
      type: String,
      trim: true,
      default: "6901",
    },

    gstRate: {
      type: Number,
      default: 5,
      min: 0,
    },

    dimensions: {
      type: String,
      trim: true,
      default: '9" x 4.25" x 2.75"',
    },

    grade: {
      type: String,
      trim: true,
      default: "1st Class (A-Grade)",
    },

    purchaseRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentStock: {
      type: Number,
      default: 0,
    },

    minStockAlert: {
      type: Number,
      default: 1000,
    },

    storageLocation: {
      type: String,
      trim: true,
      default: "Main Kiln Yard",
    },

    defaultSupplier: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ companyId: 1, name: 1 });
productSchema.index({ companyId: 1, code: 1 });

module.exports = mongoose.model("Product", productSchema);

