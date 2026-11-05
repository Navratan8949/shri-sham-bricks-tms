const Fastag = require("../models/Fastag");
const Vehicle = require("../models/Vehicle");

// ======================================================
// CREATE FASTAG ENTRY
// ======================================================
const createFastag = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const enteredBy = req.user.userId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company context is required",
      });
    }

    const {
      tagId,
      vehicleId,
      provider,
      accountNumber,
      currentBalance,
      minBalanceThreshold,
      status,
      lastRechargeDate,
      lastRechargeAmount,
      monthlyTollExpense,
      remarks,
    } = req.body;

    if (!tagId || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: "FASTag ID and Vehicle selection are required",
      });
    }

    // Check duplicate tag ID within company
    const existing = await Fastag.findOne({
      companyId,
      tagId: tagId.trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `FASTag ID "${tagId.trim()}" is already registered in your company fleet`,
      });
    }

    const balance = Number(currentBalance || 0);
    const minThreshold = Number(minBalanceThreshold || 500);
    let finalStatus = status || "active";
    if (finalStatus === "active" && balance < minThreshold) {
      finalStatus = "low_balance";
    }

    const initialTransactions = [];
    if (balance > 0) {
      initialTransactions.push({
        type: "recharge",
        amount: balance,
        balanceBefore: 0,
        balanceAfter: balance,
        reference: "INITIAL_REGISTRATION",
        paymentMode: "bank_transfer",
        remarks: "Initial opening balance on FASTag registration",
        date: new Date(),
      });
    }

    const fastag = await Fastag.create({
      companyId,
      tagId: tagId.trim(),
      vehicleId,
      provider: provider || "IDFC FIRST Bank",
      accountNumber: accountNumber ? accountNumber.trim() : "",
      currentBalance: balance,
      minBalanceThreshold: minThreshold,
      status: finalStatus,
      lastRechargeDate: lastRechargeDate || (lastRechargeAmount ? new Date() : null),
      lastRechargeAmount: Number(lastRechargeAmount || balance || 0),
      monthlyTollExpense: Number(monthlyTollExpense || 0),
      totalTollDeducted: 0,
      remarks: remarks ? remarks.trim() : "",
      transactions: initialTransactions,
      enteredBy,
    });

    const populated = await Fastag.findById(fastag._id)
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("enteredBy", "name email");

    return res.status(201).json({
      success: true,
      message: "FASTag registered successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Create fastag error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create FASTag record",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL FASTAGS
// ======================================================
const getFastags = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { vehicleId, status, provider, search } = req.query;

    const query = { companyId };
    if (vehicleId) query.vehicleId = vehicleId;
    if (status) query.status = status;
    if (provider) query.provider = provider;

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { tagId: { $regex: q, $options: "i" } },
        { accountNumber: { $regex: q, $options: "i" } },
        { provider: { $regex: q, $options: "i" } },
        { remarks: { $regex: q, $options: "i" } },
      ];
    }

    const fastags = await Fastag.find(query)
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("enteredBy", "name email")
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: fastags.length,
      data: fastags,
    });
  } catch (error) {
    console.error("Get fastags error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch FASTags",
      error: error.message,
    });
  }
};

// ======================================================
// GET FASTAG BY ID
// ======================================================
const getFastagById = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const fastag = await Fastag.findOne({
      _id: req.params.id,
      companyId,
    })
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("enteredBy", "name email");

    if (!fastag) {
      return res.status(404).json({
        success: false,
        message: "FASTag record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: fastag,
    });
  } catch (error) {
    console.error("Get fastag by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch FASTag details",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE FASTAG
// ======================================================
const updateFastag = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const fastag = await Fastag.findOne({ _id: id, companyId });
    if (!fastag) {
      return res.status(404).json({
        success: false,
        message: "FASTag record not found",
      });
    }

    const {
      tagId,
      vehicleId,
      provider,
      accountNumber,
      currentBalance,
      minBalanceThreshold,
      status,
      lastRechargeDate,
      lastRechargeAmount,
      rechargeAmount,
      deductAmount,
      monthlyTollExpense,
      remarks,
    } = req.body;

    if (tagId && tagId.trim() !== fastag.tagId) {
      const duplicate = await Fastag.findOne({
        companyId,
        tagId: tagId.trim(),
        _id: { $ne: id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `FASTag ID "${tagId.trim()}" is already assigned to another vehicle`,
        });
      }
      fastag.tagId = tagId.trim();
    }

    if (vehicleId) fastag.vehicleId = vehicleId;
    if (provider) fastag.provider = provider;
    if (accountNumber !== undefined) fastag.accountNumber = accountNumber.trim();
    if (minBalanceThreshold !== undefined) fastag.minBalanceThreshold = Number(minBalanceThreshold);

    const prevBal = Number(fastag.currentBalance || 0);

    // Auto-calculate on Recharge
    if (rechargeAmount && Number(rechargeAmount) > 0) {
      const rech = Number(rechargeAmount);
      const newBal = prevBal + rech;
      fastag.currentBalance = newBal;
      fastag.lastRechargeAmount = rech;
      fastag.lastRechargeDate = new Date();
      if (!fastag.transactions) fastag.transactions = [];
      fastag.transactions.push({
        type: "recharge",
        amount: rech,
        balanceBefore: prevBal,
        balanceAfter: newBal,
        reference: req.body.reference || "MANUAL_RECHARGE",
        remarks: req.body.rechargeRemarks || "FASTag Wallet Recharged",
        date: new Date(),
      });
      if (fastag.status === "low_balance" && newBal >= fastag.minBalanceThreshold) {
        fastag.status = "active";
      }
    } else if (deductAmount && Number(deductAmount) > 0) {
      // Auto-calculate on Toll Deduction
      const ded = Number(deductAmount);
      const newBal = Math.max(0, prevBal - ded);
      fastag.currentBalance = newBal;
      fastag.totalTollDeducted = (fastag.totalTollDeducted || 0) + ded;
      fastag.monthlyTollExpense = (fastag.monthlyTollExpense || 0) + ded;
      if (!fastag.transactions) fastag.transactions = [];
      fastag.transactions.push({
        type: "toll_deduction",
        amount: ded,
        balanceBefore: prevBal,
        balanceAfter: newBal,
        tollPlaza: req.body.tollPlaza || "",
        reference: req.body.reference || "TOLL_PAYMENT",
        remarks: req.body.tollRemarks || "Toll fee deduction",
        date: new Date(),
      });
      if (fastag.status === "active" && newBal < fastag.minBalanceThreshold) {
        fastag.status = "low_balance";
      }
    } else if (currentBalance !== undefined) {
      // Explicit balance adjustment
      const newBal = Number(currentBalance);
      if (newBal !== prevBal) {
        if (!fastag.transactions) fastag.transactions = [];
        fastag.transactions.push({
          type: "adjustment",
          amount: Math.abs(newBal - prevBal),
          balanceBefore: prevBal,
          balanceAfter: newBal,
          remarks: "Manual balance adjustment in register",
          date: new Date(),
        });
      }
      fastag.currentBalance = newBal;
      if (fastag.currentBalance < fastag.minBalanceThreshold && fastag.status === "active") {
        fastag.status = "low_balance";
      } else if (fastag.currentBalance >= fastag.minBalanceThreshold && fastag.status === "low_balance") {
        fastag.status = "active";
      }
    }

    if (status) fastag.status = status;
    if (lastRechargeDate !== undefined && !rechargeAmount) fastag.lastRechargeDate = lastRechargeDate;
    if (lastRechargeAmount !== undefined && !rechargeAmount) fastag.lastRechargeAmount = Number(lastRechargeAmount);
    if (monthlyTollExpense !== undefined && !deductAmount) fastag.monthlyTollExpense = Number(monthlyTollExpense);
    if (remarks !== undefined) fastag.remarks = remarks.trim();

    await fastag.save();

    const populated = await Fastag.findById(fastag._id)
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("enteredBy", "name email");

    return res.status(200).json({
      success: true,
      message: "FASTag record updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Update fastag error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update FASTag record",
      error: error.message,
    });
  }
};

// ======================================================
// RECHARGE FASTAG DIRECT ACTION
// ======================================================
const rechargeFastag = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { amount, paymentMode, reference, remarks } = req.body;

    const rechAmount = Number(amount);
    if (!rechAmount || rechAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid recharge amount is required",
      });
    }

    const fastag = await Fastag.findOne({ _id: id, companyId });
    if (!fastag) {
      return res.status(404).json({
        success: false,
        message: "FASTag record not found",
      });
    }

    const prevBal = Number(fastag.currentBalance || 0);
    const newBal = prevBal + rechAmount;

    fastag.currentBalance = newBal;
    fastag.lastRechargeAmount = rechAmount;
    fastag.lastRechargeDate = new Date();
    if (fastag.status === "low_balance" && newBal >= fastag.minBalanceThreshold) {
      fastag.status = "active";
    }

    if (!fastag.transactions) fastag.transactions = [];
    fastag.transactions.push({
      type: "recharge",
      amount: rechAmount,
      balanceBefore: prevBal,
      balanceAfter: newBal,
      reference: reference || "",
      paymentMode: paymentMode || "upi",
      remarks: remarks || `Recharged ₹${rechAmount.toLocaleString("en-IN")}`,
      date: new Date(),
    });

    await fastag.save();

    const populated = await Fastag.findById(fastag._id)
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("enteredBy", "name email");

    return res.status(200).json({
      success: true,
      message: `FASTag recharged with ₹${rechAmount.toLocaleString("en-IN")}. New balance is ₹${newBal.toLocaleString("en-IN")}.`,
      data: populated,
    });
  } catch (error) {
    console.error("Recharge fastag error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to recharge FASTag",
      error: error.message,
    });
  }
};

// ======================================================
// DEDUCT TOLL DIRECT ACTION
// ======================================================
const deductToll = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { amount, tollPlaza, reference, remarks } = req.body;

    const tollAmount = Number(amount);
    if (!tollAmount || tollAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid toll amount is required",
      });
    }

    const fastag = await Fastag.findOne({ _id: id, companyId });
    if (!fastag) {
      return res.status(404).json({
        success: false,
        message: "FASTag record not found",
      });
    }

    const prevBal = Number(fastag.currentBalance || 0);
    const newBal = Math.max(0, prevBal - tollAmount);

    fastag.currentBalance = newBal;
    fastag.totalTollDeducted = (fastag.totalTollDeducted || 0) + tollAmount;
    fastag.monthlyTollExpense = (fastag.monthlyTollExpense || 0) + tollAmount;

    if (newBal < fastag.minBalanceThreshold && fastag.status === "active") {
      fastag.status = "low_balance";
    }

    if (!fastag.transactions) fastag.transactions = [];
    fastag.transactions.push({
      type: "toll_deduction",
      amount: tollAmount,
      balanceBefore: prevBal,
      balanceAfter: newBal,
      tollPlaza: tollPlaza || "",
      reference: reference || "",
      remarks: remarks || `Toll deducted at ${tollPlaza || "Highway Plaza"}`,
      date: new Date(),
    });

    await fastag.save();

    const populated = await Fastag.findById(fastag._id)
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("enteredBy", "name email");

    return res.status(200).json({
      success: true,
      message: `Toll of ₹${tollAmount.toLocaleString("en-IN")} deducted. Remaining balance: ₹${newBal.toLocaleString("en-IN")}.`,
      data: populated,
    });
  } catch (error) {
    console.error("Deduct toll error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to deduct toll",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE FASTAG
// ======================================================
const deleteFastag = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const fastag = await Fastag.findOneAndDelete({ _id: id, companyId });
    if (!fastag) {
      return res.status(404).json({
        success: false,
        message: "FASTag record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FASTag deleted successfully",
      data: { id },
    });
  } catch (error) {
    console.error("Delete fastag error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete FASTag",
      error: error.message,
    });
  }
};

module.exports = {
  createFastag,
  getFastags,
  getFastagById,
  updateFastag,
  rechargeFastag,
  deductToll,
  deleteFastag,
};
