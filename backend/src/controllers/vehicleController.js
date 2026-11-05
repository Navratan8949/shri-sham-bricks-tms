const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Vendor = require("../models/Vendor");
const { saveUploadedFile, deleteUploadedFile } = require("../utils/upload");

// CREATE
const createVehicle = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is required",
      });
    }

    const {
      vehicleNumber,
      vehicleType,
      make,
      model,
      yearOfManufacture,
      fuelType,
      payloadCapacity,
      chassisNumber,
      engineNumber,
      currentOdometer,
      driverId,
      ownerType,
      ownerName,
      ownerPhone,
      rcNumber,
      rcExpiryDate,
      fitnessNumber,
      fitnessExpiryDate,
      insuranceCompany,
      insurancePolicyNumber,
      insuranceExpiryDate,
      permitNumber,
      permitExpiryDate,
      pucNumber,
      pucExpiryDate,
      roadTaxExpiryDate,
      status,
    } = req.body;

    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number and vehicle type are required",
      });
    }

    const normalizedVehicleNumber = vehicleNumber.trim().toUpperCase();

    // Check duplicate vehicle
    const existingVehicle = await Vehicle.findOne({
      companyId,
      vehicleNumber: normalizedVehicleNumber,
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle with this number already exists",
      });
    }

    // Validate driver
    if (driverId) {
      const driver = await Driver.findOne({
        _id: driverId,
        companyId,
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found in your company",
        });
      }
    }

    let rcDocumentUrl = req.body.rcDocument || "";
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.fieldname === "rcDocument") {
          rcDocumentUrl = await saveUploadedFile(file, "vehicles");
        }
      }
    } else if (req.files && typeof req.files === "object") {
      if (req.files.rcDocument?.[0]) {
        rcDocumentUrl = await saveUploadedFile(req.files.rcDocument[0], "vehicles");
      }
    } else if (req.file) {
      rcDocumentUrl = await saveUploadedFile(req.file, "vehicles");
    }

    const isMarket = false;
    let finalVendorId = isMarket ? (req.body.vendorId || null) : null;
    const finalVendorName = isMarket ? (req.body.vendorName || ownerName || "").trim() : "";
    const finalOwnerPhone = isMarket ? (ownerPhone || req.body.phone || "").trim() : "";

    if (isMarket && finalVendorName) {
      let vendor = null;
      if (finalVendorId) {
        vendor = await Vendor.findOne({ _id: finalVendorId, companyId });
      }
      if (!vendor) {
        vendor = await Vendor.findOne({
          companyId,
          vendorName: new RegExp(`^${finalVendorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        });
      }
      if (!vendor) {
        vendor = await Vendor.create({
          companyId,
          vendorName: finalVendorName,
          phone: finalOwnerPhone,
          vendorType: "Transporter",
          status: "Active",
        });
      }
      finalVendorId = vendor._id;
    }

    const vehicle = await Vehicle.create({
      companyId,
      vehicleNumber: normalizedVehicleNumber,
      vehicleType,
      vehicleName: req.body.vehicleName || make || "",
      make: make ? make.trim() : (req.body.vehicleName || "Tata Motors"),
      model: model ? model.trim() : "",
      yearOfManufacture: yearOfManufacture ? Number(yearOfManufacture) : new Date().getFullYear(),
      fuelType: fuelType || "Diesel",
      payloadCapacity: payloadCapacity !== undefined && payloadCapacity !== "" ? Number(payloadCapacity) : 20,
      chassisNumber: chassisNumber ? chassisNumber.trim().toUpperCase() : "",
      engineNumber: engineNumber ? engineNumber.trim().toUpperCase() : "",
      currentOdometer: currentOdometer !== undefined && currentOdometer !== "" ? Number(currentOdometer) : 0,
      driverId: driverId || null,
      vendorId: finalVendorId,
      ownerType: isMarket ? "market" : "own",
      ownership: isMarket ? "market" : "own",
      ownerName: isMarket ? (finalVendorName || "Market Vendor") : (ownerName || "Shri Shyam Bricks"),
      vendorName: isMarket ? finalVendorName : "",
      ownerPhone: isMarket ? finalOwnerPhone : "",
      rcNumber: rcNumber ? rcNumber.trim().toUpperCase() : "",
      rcExpiryDate: rcExpiryDate || null,
      fitnessNumber: fitnessNumber ? fitnessNumber.trim().toUpperCase() : "",
      fitnessExpiryDate: fitnessExpiryDate || null,
      insuranceCompany: insuranceCompany ? insuranceCompany.trim() : "",
      insurancePolicyNumber: insurancePolicyNumber ? insurancePolicyNumber.trim().toUpperCase() : "",
      insuranceExpiryDate: insuranceExpiryDate || null,
      permitNumber: permitNumber ? permitNumber.trim().toUpperCase() : "",
      permitExpiryDate: permitExpiryDate || null,
      pucNumber: pucNumber ? pucNumber.trim().toUpperCase() : "",
      pucExpiryDate: pucExpiryDate || null,
      roadTaxExpiryDate: roadTaxExpiryDate || null,
      rcDocument: rcDocumentUrl,
      notes: req.body.notes || "",
      status:
        status && status.trim() && !status.toLowerCase().startsWith("select")
          ? status.trim().toLowerCase()
          : "active",
    });

    if (vehicle.driverId) {
      await Driver.updateOne(
        { _id: vehicle.driverId, companyId },
        { $set: { assignedVehicleId: vehicle._id } }
      ).catch(() => {});
    }

    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("driverId", "name phone licenseNumber status")
      .populate("vendorId", "vendorName vendorCode phone city state");

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: populatedVehicle,
    });
  } catch (error) {
    console.error("Create vehicle error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
      error: error.message,
    });
  }
};

// GET ALL
const getVehicles = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is required",
      });
    }

    const vehicles = await Vehicle.find({
      companyId,
      ownerType: { $ne: "market" },
      ownership: { $ne: "market" },
    })
      .populate("driverId", "name phone licenseNumber status")
      .populate("vendorId", "vendorName vendorCode phone city state")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    console.error("Get vehicles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error.message,
    });
  }
};

// GET ONE
const getVehicleById = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      companyId,
    })
      .populate("driverId", "name phone licenseNumber status")
      .populate("vendorId", "vendorName vendorCode phone city state");

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Get vehicle error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
      error: error.message,
    });
  }
};

// UPDATE
const updateVehicle = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const {
      vehicleNumber,
      vehicleType,
      make,
      model,
      yearOfManufacture,
      fuelType,
      payloadCapacity,
      chassisNumber,
      engineNumber,
      currentOdometer,
      driverId,
      ownerType,
      ownerName,
      ownerPhone,
      rcNumber,
      rcExpiryDate,
      fitnessNumber,
      fitnessExpiryDate,
      insuranceCompany,
      insurancePolicyNumber,
      insuranceExpiryDate,
      permitNumber,
      permitExpiryDate,
      pucNumber,
      pucExpiryDate,
      roadTaxExpiryDate,
      status,
    } = req.body;

    // Vehicle number duplicate check
    if (
      vehicleNumber &&
      vehicleNumber.trim().toUpperCase() !== vehicle.vehicleNumber
    ) {
      const duplicate = await Vehicle.findOne({
        companyId,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another vehicle with this number already exists",
        });
      }

      vehicle.vehicleNumber = vehicleNumber.trim().toUpperCase();
    }

    const previousDriverId = vehicle.driverId;

    // Validate driver
    if (driverId !== undefined && driverId !== null) {
      const driver = await Driver.findOne({
        _id: driverId,
        companyId,
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found in your company",
        });
      }

      vehicle.driverId = driverId;
    }

    if (driverId === null) {
      vehicle.driverId = null;
    }

    if (vehicleType !== undefined) {
      vehicle.vehicleType = vehicleType;
    }

    if (make !== undefined) vehicle.make = make ? make.trim() : "Tata Motors";
    if (model !== undefined) vehicle.model = model ? model.trim() : "";
    if (yearOfManufacture !== undefined && yearOfManufacture !== "") {
      vehicle.yearOfManufacture = Number(yearOfManufacture);
    }
    if (fuelType !== undefined) vehicle.fuelType = fuelType;
    if (payloadCapacity !== undefined && payloadCapacity !== "") {
      vehicle.payloadCapacity = Number(payloadCapacity);
    }
    if (chassisNumber !== undefined) {
      vehicle.chassisNumber = chassisNumber ? chassisNumber.trim().toUpperCase() : "";
    }
    if (engineNumber !== undefined) {
      vehicle.engineNumber = engineNumber ? engineNumber.trim().toUpperCase() : "";
    }
    if (currentOdometer !== undefined && currentOdometer !== "") {
      vehicle.currentOdometer = Number(currentOdometer);
    }

    // This application is restricted to company-owned fleet vehicles only.
    vehicle.ownerType = "own";
    vehicle.ownership = "own";
    vehicle.vendorId = null;
    vehicle.vendorName = "";
    if (ownerName !== undefined) vehicle.ownerName = ownerName;

    if (ownerPhone !== undefined) {
      vehicle.ownerPhone = ownerPhone;
    } else if (req.body.phone !== undefined) {
      vehicle.ownerPhone = req.body.phone;
    }

    if (rcNumber !== undefined) vehicle.rcNumber = rcNumber ? rcNumber.trim().toUpperCase() : "";
    if (rcExpiryDate !== undefined) vehicle.rcExpiryDate = rcExpiryDate || null;
    if (fitnessNumber !== undefined) vehicle.fitnessNumber = fitnessNumber ? fitnessNumber.trim().toUpperCase() : "";
    if (fitnessExpiryDate !== undefined) vehicle.fitnessExpiryDate = fitnessExpiryDate || null;
    if (insuranceCompany !== undefined) vehicle.insuranceCompany = insuranceCompany ? insuranceCompany.trim() : "";
    if (insurancePolicyNumber !== undefined) vehicle.insurancePolicyNumber = insurancePolicyNumber ? insurancePolicyNumber.trim().toUpperCase() : "";
    if (insuranceExpiryDate !== undefined) vehicle.insuranceExpiryDate = insuranceExpiryDate || null;
    if (permitNumber !== undefined) vehicle.permitNumber = permitNumber ? permitNumber.trim().toUpperCase() : "";
    if (permitExpiryDate !== undefined) vehicle.permitExpiryDate = permitExpiryDate || null;
    if (pucNumber !== undefined) vehicle.pucNumber = pucNumber ? pucNumber.trim().toUpperCase() : "";
    if (pucExpiryDate !== undefined) vehicle.pucExpiryDate = pucExpiryDate || null;
    if (roadTaxExpiryDate !== undefined) vehicle.roadTaxExpiryDate = roadTaxExpiryDate || null;
    if (req.body.vehicleName !== undefined) vehicle.vehicleName = req.body.vehicleName;
    if (req.body.rcDocument !== undefined && typeof req.body.rcDocument === "string") {
      vehicle.rcDocument = req.body.rcDocument;
    }
    const previousRcDoc = vehicle.rcDocument;
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.fieldname === "rcDocument") {
          vehicle.rcDocument = await saveUploadedFile(file, "vehicles");
          if (previousRcDoc && previousRcDoc !== vehicle.rcDocument) await deleteUploadedFile(previousRcDoc);
        }
      }
    } else if (req.files && typeof req.files === "object") {
      if (req.files.rcDocument?.[0]) {
        vehicle.rcDocument = await saveUploadedFile(req.files.rcDocument[0], "vehicles");
        if (previousRcDoc && previousRcDoc !== vehicle.rcDocument) await deleteUploadedFile(previousRcDoc);
      }
    } else if (req.file) {
      vehicle.rcDocument = await saveUploadedFile(req.file, "vehicles");
      if (previousRcDoc && previousRcDoc !== vehicle.rcDocument) await deleteUploadedFile(previousRcDoc);
    }

    if (req.body.notes !== undefined) vehicle.notes = req.body.notes;

    if (status !== undefined) {
      vehicle.status =
        status && status.trim() && !status.toLowerCase().startsWith("select")
          ? status.trim().toLowerCase()
          : vehicle.status || "active";
    }

    await vehicle.save();

    if (previousDriverId && String(previousDriverId) !== String(vehicle.driverId)) {
      await Driver.updateOne(
        { _id: previousDriverId, companyId },
        { $set: { assignedVehicleId: null } }
      ).catch(() => {});
    }
    if (vehicle.driverId && String(previousDriverId) !== String(vehicle.driverId)) {
      await Driver.updateOne(
        { _id: vehicle.driverId, companyId },
        { $set: { assignedVehicleId: vehicle._id } }
      ).catch(() => {});
    }

    const updatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("driverId", "name phone licenseNumber status")
      .populate("vendorId", "vendorName vendorCode phone city state");

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: updatedVehicle,
    });
  } catch (error) {
    console.error("Update vehicle error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
      error: error.message,
    });
  }
};

// DELETE
const deleteVehicle = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    const SupplyOrder = require("../models/SupplyOrder");
    const VehicleExpense = require("../models/VehicleExpense");
    const [orderCount, expenseCount] = await Promise.all([
      SupplyOrder.countDocuments({ companyId, vehicleId: vehicle._id }),
      VehicleExpense.countDocuments({ companyId, vehicleId: vehicle._id }),
    ]);

    if (orderCount > 0 || expenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vehicle "${vehicle.vehicleNumber}". Linked to ${orderCount} supply orders and ${expenseCount} expenses. Please set status to "inactive" instead to preserve financial records.`,
        canDeactivate: true,
      });
    }

    await Vehicle.deleteOne({ _id: vehicle._id, companyId });

    const Driver = require("../models/Driver");
    await Driver.updateMany(
      { companyId, assignedVehicleId: vehicle._id },
      { $set: { assignedVehicleId: null } }
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
      error: error.message,
    });
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
