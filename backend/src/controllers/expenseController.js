const Expense = require("../models/Expense");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const { getNextSequence } = require("../utils/sequenceService");

// =====================================================
// CREATE EXPENSE
// =====================================================

const createExpense = async (req, res) => {
  try {
    let {
      expenseNumber,
      expenseDate,
      driverId,
      vehicleId,
      tripId,
      category,
      description,
      amount,
      paymentMode,
      referenceNumber,
      vendorName,
      receiptNumber,
      attachment,
      remarks,
    } = req.body;

    const companyId = req.user.companyId;
    const enteredBy = req.user.userId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is required",
      });
    }

    // Auto-resolve relations if partially provided
    if (tripId && (!vehicleId || !driverId)) {
      const trip = await Trip.findOne({ _id: tripId, companyId });
      if (trip) {
        if (!vehicleId && trip.vehicleId) vehicleId = trip.vehicleId;
        if (!driverId && trip.driverId) driverId = trip.driverId;
      }
    }

    if (vehicleId && !driverId) {
      const veh = await Vehicle.findOne({ _id: vehicleId, companyId });
      if (veh && veh.driverId) {
        driverId = veh.driverId;
      }
    }

    if (driverId && !vehicleId) {
      const drv = await Driver.findOne({ _id: driverId, companyId });
      if (drv && drv.assignedVehicleId) {
        vehicleId = drv.assignedVehicleId;
      }
    }

    if (!expenseNumber || !expenseNumber.toString().trim()) {
      expenseNumber = await getNextSequence(companyId, "expenses");
    }

    if (
      !expenseDate ||
      !category ||
      amount === undefined ||
      !paymentMode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "expenseDate, category, amount and paymentMode are required",
      });
    }

    const expenseAmount = Number(amount);

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Expense amount must be greater than 0",
      });
    }

    // Duplicate expense number

    const existingExpense = await Expense.findOne({
      companyId,
      expenseNumber: expenseNumber.toUpperCase(),
    });

    if (existingExpense) {
      return res.status(409).json({
        success: false,
        message: "Expense number already exists",
      });
    }

    const expense = await Expense.create({
      companyId,
      expenseNumber,
      expenseDate,
      driverId: driverId || null,
      vehicleId: vehicleId || null,
      tripId: tripId || null,
      category,
      description: description || "",

      amount: expenseAmount,

      paymentMode,

      referenceNumber: referenceNumber || "",

      vendorName: vendorName || "",

      receiptNumber: receiptNumber || "",

      attachment: attachment || null,

      status:
        req.body.status && req.body.status.trim() && !req.body.status.toLowerCase().startsWith("select")
          ? req.body.status.trim().toLowerCase()
          : "active",

      expenseType: req.body.expenseType || (driverId ? "driver" : vehicleId ? "vehicle" : "general"),
      staffName: req.body.staffName || "",
      department: req.body.department || "",
      paidTo: req.body.paidTo || req.body.staffName || vendorName || "",
      remarks: remarks || "",
      enteredBy,
    });

    // Auto-deduct from vehicle FASTag balance if toll expense or paymentMode is fastag
    if ((category === "toll" || paymentMode === "fastag") && (vehicleId || driverId)) {
      try {
        const Fastag = require("../models/Fastag");
        const fastag = await Fastag.findOne({
          companyId,
          vehicleId: vehicleId || null,
          status: { $in: ["active", "low_balance"] },
        });

        if (fastag) {
          const prevBal = Number(fastag.currentBalance || 0);
          const newBal = Math.max(0, prevBal - expenseAmount);
          fastag.currentBalance = newBal;
          fastag.totalTollDeducted = (fastag.totalTollDeducted || 0) + expenseAmount;
          fastag.monthlyTollExpense = (fastag.monthlyTollExpense || 0) + expenseAmount;

          if (newBal < fastag.minBalanceThreshold && fastag.status === "active") {
            fastag.status = "low_balance";
          }

          if (!fastag.transactions) fastag.transactions = [];
          fastag.transactions.push({
            type: "toll_deduction",
            amount: expenseAmount,
            balanceBefore: prevBal,
            balanceAfter: newBal,
            reference: expenseNumber || referenceNumber || "",
            remarks: description ? `Toll: ${description}` : `Highway toll deduction for expense #${expenseNumber}`,
            date: expenseDate || new Date(),
          });

          await fastag.save();
        }
      } catch (fastagErr) {
        console.error("Fastag auto-deduct warning:", fastagErr);
      }
    }

    const populatedExpense = await Expense.findById(expense._id)
      .populate("driverId", "name phone dlNumber")
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("tripId", "tripNumber dispatchDate")
      .populate("enteredBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: populatedExpense,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL EXPENSES
// =====================================================

const getExpenses = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const { category, paymentMode, status, fromDate, toDate, expenseType } = req.query;

    const filter = {
      companyId,
    };

    if (expenseType) {
      filter.expenseType = expenseType;
    }

    if (category) {
      filter.category = category;
    }

    if (paymentMode) {
      filter.paymentMode = paymentMode;
    }

    if (status) {
      filter.status = status;
    }

    if (fromDate || toDate) {
      filter.expenseDate = {};

      if (fromDate) {
        filter.expenseDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        const endDate = new Date(toDate);

        endDate.setHours(23, 59, 59, 999);

        filter.expenseDate.$lte = endDate;
      }
    }

    const expenses = await Expense.find(filter)
      .populate("driverId", "name phone dlNumber")
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("tripId", "tripNumber dispatchDate")
      .populate("enteredBy", "name email")
      .sort({
        expenseDate: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

// =====================================================
// GET EXPENSE BY ID
// =====================================================

const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const companyId = req.user.companyId;

    const expense = await Expense.findOne({
      _id: id,
      companyId,
    })
      .populate("driverId", "name phone dlNumber")
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("tripId", "tripNumber dispatchDate")
      .populate("enteredBy", "name email");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Get expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch expense",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE EXPENSE
// =====================================================

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const companyId = req.user.companyId;

    const expense = await Expense.findOne({
      _id: id,
      companyId,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (expense.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled expense cannot be updated",
      });
    }

    let {
      expenseDate,
      driverId,
      vehicleId,
      tripId,
      category,
      description,
      amount,
      paymentMode,
      referenceNumber,
      vendorName,
      receiptNumber,
      attachment,
      remarks,
    } = req.body;

    let finalTripId = tripId !== undefined ? tripId : expense.tripId;
    let finalVehicleId = vehicleId !== undefined ? vehicleId : expense.vehicleId;
    let finalDriverId = driverId !== undefined ? driverId : expense.driverId;

    if (finalTripId && (!finalVehicleId || !finalDriverId)) {
      const trip = await Trip.findOne({ _id: finalTripId, companyId });
      if (trip) {
        if (!finalVehicleId && trip.vehicleId) finalVehicleId = trip.vehicleId;
        if (!finalDriverId && trip.driverId) finalDriverId = trip.driverId;
      }
    }

    if (finalVehicleId && !finalDriverId) {
      const veh = await Vehicle.findOne({ _id: finalVehicleId, companyId });
      if (veh && veh.driverId) finalDriverId = veh.driverId;
    }

    if (driverId !== undefined || (finalDriverId && !expense.driverId)) {
      expense.driverId = finalDriverId || null;
    }

    if (vehicleId !== undefined || (finalVehicleId && !expense.vehicleId)) {
      expense.vehicleId = finalVehicleId || null;
    }

    if (tripId !== undefined) {
      expense.tripId = tripId || null;
    }

    if (expenseDate !== undefined) {
      expense.expenseDate = expenseDate;
    }

    if (category !== undefined) {
      expense.category = category;
    }

    if (description !== undefined) {
      expense.description = description;
    }

    if (amount !== undefined) {
      const expenseAmount = Number(amount);

      if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Expense amount must be greater than 0",
        });
      }

      expense.amount = expenseAmount;
    }

    if (paymentMode !== undefined) {
      expense.paymentMode = paymentMode;
    }

    if (referenceNumber !== undefined) {
      expense.referenceNumber = referenceNumber;
    }

    if (vendorName !== undefined) {
      expense.vendorName = vendorName;
    }

    if (receiptNumber !== undefined) {
      expense.receiptNumber = receiptNumber;
    }

    if (attachment !== undefined) {
      expense.attachment = attachment;
    }

    if (remarks !== undefined) {
      expense.remarks = remarks;
    }

    if (req.body.expenseType !== undefined) expense.expenseType = req.body.expenseType;
    if (req.body.staffName !== undefined) expense.staffName = req.body.staffName;
    if (req.body.department !== undefined) expense.department = req.body.department;
    if (req.body.paidTo !== undefined) expense.paidTo = req.body.paidTo;

    await expense.save();

    const updatedExpense = await Expense.findById(expense._id)
      .populate("driverId", "name phone dlNumber")
      .populate("vehicleId", "vehicleNumber vehicleType ownerType")
      .populate("tripId", "tripNumber dispatchDate")
      .populate("enteredBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Update expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
      error: error.message,
    });
  }
};

// =====================================================
// CANCEL EXPENSE
// =====================================================

const cancelExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const companyId = req.user.companyId;

    const expense = await Expense.findOne({
      _id: id,
      companyId,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (expense.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Expense is already cancelled",
      });
    }

    expense.status = "cancelled";

    await expense.save();

    return res.status(200).json({
      success: true,
      message: "Expense cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel expense",
      error: error.message,
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  cancelExpense,
};
