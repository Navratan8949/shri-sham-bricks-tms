const mongoose = require("mongoose");

const fastagTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["recharge", "toll_deduction", "adjustment"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    tollPlaza: {
      type: String,
      trim: true,
      default: "",
    },
    reference: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMode: {
      type: String,
      default: "upi",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const fastagSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    tagId: {
      type: String,
      required: [true, "FASTag ID / Barcode is required"],
      trim: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle assignment is required"],
    },
    provider: {
      type: String,
      enum: [
        "IDFC FIRST Bank",
        "ICICI Bank",
        "State Bank of India (SBI)",
        "Paytm Payments Bank",
        "Axis Bank",
        "Kotak Mahindra Bank",
        "Bank of Baroda",
        "HDFC Bank",
        "Airtel Payments Bank",
        "Other",
      ],
      default: "IDFC FIRST Bank",
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    minBalanceThreshold: {
      type: Number,
      default: 500,
    },
    status: {
      type: String,
      enum: ["active", "low_balance", "blacklisted", "inactive", "closed"],
      default: "active",
    },
    lastRechargeDate: {
      type: Date,
      default: null,
    },
    lastRechargeAmount: {
      type: Number,
      default: 0,
    },
    monthlyTollExpense: {
      type: Number,
      default: 0,
    },
    totalTollDeducted: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    transactions: [fastagTransactionSchema],
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

fastagSchema.index({ companyId: 1, tagId: 1 }, { unique: true });
fastagSchema.index({ companyId: 1, vehicleId: 1 });

module.exports = mongoose.model("Fastag", fastagSchema);
