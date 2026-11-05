"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  X,
  Check,
  Truck,
  Phone,
  User,
  Building2,
  MapPin,
  Loader2,
} from "lucide-react";
import api from "@/src/services/api";
import { toast } from "sonner";
import { getStoredUser } from "@/src/lib/auth";

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
  label = "",
  required = false,
  disabled = false,
  canAdd = true,
  entityType = "", // "party" | "vehicle" | "driver" | "vendor" | "city" | ""
  entityLabel = "", // e.g. "Party", "Vehicle", "Driver"
  onAddNew = null, // custom callback if parent wants to handle
  className = "",
  helperText = "",
  vehicleTab = "", // "all" | "market" | "company" | ""
}) {
  const allowQuickAdd = !disabled && Boolean(entityType || onAddNew) && canAdd;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [localOptions, setLocalOptions] = useState(options);
  const [extraVehicles, setExtraVehicles] = useState([]);
  const [extraDrivers, setExtraDrivers] = useState([]);
  const [extraVendors, setExtraVendors] = useState([]);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-fetch related vehicles / drivers / vendors for inline dropdowns
  useEffect(() => {
    if (!quickAddOpen) return;
    if (entityType === "driver" && extraVehicles.length === 0) {
      Promise.all([
        api.get("/vehicles").catch(() => ({ data: [] })),
        api.get("/drivers").catch(() => ({ data: [] })),
      ]).then(([vRes, dRes]) => {
        const vList = Array.isArray(vRes.data?.data) ? vRes.data.data : Array.isArray(vRes.data) ? vRes.data : [];
        const dList = Array.isArray(dRes.data?.data) ? dRes.data.data : Array.isArray(dRes.data) ? dRes.data : [];
        const assignedVIds = new Set();
        dList.forEach((d) => {
          const vId = d.assignedVehicleId?._id || d.assignedVehicleId;
          if (vId) assignedVIds.add(String(vId));
        });
        vList.forEach((v) => {
          if (v.driverId) assignedVIds.add(String(v._id || v.id));
        });
        const unassigned = vList.filter((v) => !assignedVIds.has(String(v._id || v.id)));
        setExtraVehicles(unassigned);
      }).catch(() => {});
    }
    if (entityType === "vehicle" && extraDrivers.length === 0) {
      api
        .get("/drivers")
        .then((res) => {
          const list = res.data?.data || res.data || [];
          setExtraDrivers(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }
    if (entityType === "vehicle" && extraVendors.length === 0) {
      api
        .get("/vendors")
        .then((res) => {
          const list = res.data?.data || res.data || [];
          setExtraVendors(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }
  }, [quickAddOpen, entityType, extraVehicles.length, extraDrivers.length, extraVendors.length]);

  // Sync incoming options
  useEffect(() => {
    setLocalOptions(options || []);
  }, [options]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Focus search input when open
  useEffect(() => {
    if (open) {
      if (searchInputRef.current) {
        searchInputRef.current.focus({ preventScroll: true });
      }
      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setSearch("");
    }
  }, [open]);

  // Normalize options to { value, label, subtext, raw }
  const normalizedOptions = localOptions.map((opt) => {
    if (typeof opt === "string" || typeof opt === "number") {
      return { value: String(opt), label: String(opt), subtext: "", raw: {} };
    }
    const val = opt.value ?? opt._id ?? opt.id;
    let lbl = opt.label;
    let sub = opt.subtext || "";

    const raw = opt.raw || opt;
    const isVeh = Boolean(raw.vehicleNumber);

    if (isVeh) {
      if (!lbl) {
        lbl = `${raw.vehicleNumber}${raw.vehicleType ? ` (${raw.vehicleType})` : ""}`;
      }
      const isMkt =
        raw.ownership === "market" ||
        raw.ownerType === "market";
      const bName = raw.ownerName || raw.vendorName;
      const assignedDriverName =
        typeof raw.driverId === "object" ? raw.driverId?.name : raw.driverName;
      sub = isMkt
        ? `Market Lorry${bName ? ` • Vendor: ${bName}` : ""}${raw.ownerPhone ? ` (${raw.ownerPhone})` : ""}${assignedDriverName ? ` • Driver: ${assignedDriverName}` : ""}`
        : `Company Fleet (Own)${assignedDriverName ? ` • Driver: ${assignedDriverName}` : ""}`;
    } else if (!lbl) {
      if (opt.phone && opt.name && (opt.licenseNumber || entityType === "driver")) {
        // DRIVER STRICT RULE: Display Mobile Number prominently!
        lbl = `${opt.phone} • ${opt.name}`;
        sub = opt.licenseNumber ? `DL: ${opt.licenseNumber}` : "";
      } else if (opt.name) {
        lbl = opt.customerCode ? `${opt.name} (${opt.customerCode})` : opt.name;
        sub = [
          opt.city ? `📍 ${opt.city}` : "",
          opt.phone ? `Ph: ${opt.phone}` : "",
          opt.gstNumber ? `GST: ${opt.gstNumber}` : "",
        ]
          .filter(Boolean)
          .join(" • ");
      } else if (opt.cityName) {
        lbl = opt.cityName;
        sub = opt.state ? `State: ${opt.state}` : "";
      } else if (opt.vendorName) {
        lbl = opt.vendorName;
        sub = opt.phone ? `Ph: ${opt.phone} (Vendor)` : "Market Vendor";
      } else if (opt.bookingNumber) {
        lbl = opt.bookingNumber;
        sub = opt.billingPartyId?.name ? `Party: ${opt.billingPartyId.name}` : "";
      } else {
        lbl = String(val || "—");
      }
    }

    return {
      value: String(val ?? ""),
      label: String(lbl),
      subtext: String(sub),
      raw,
    };
  });

  const isVehicleType =
    entityType === "vehicle" ||
    normalizedOptions.some((o) => Boolean(o.raw?.vehicleNumber));

  const isLorryContext = Boolean(
    (label && /lorry/i.test(label)) ||
    (placeholder && /lorry/i.test(placeholder)) ||
    (entityLabel && /lorry/i.test(entityLabel))
  );

  const [vehicleFilterTab, setVehicleFilterTab] = useState(
    vehicleTab || (isLorryContext ? "market" : "all")
  );

  useEffect(() => {
    if (vehicleTab) {
      setVehicleFilterTab(vehicleTab);
    } else if (isLorryContext) {
      setVehicleFilterTab("market");
    }
  }, [vehicleTab, isLorryContext]);

  const marketVehiclesCount = useMemo(() => {
    if (!isVehicleType) return 0;
    return normalizedOptions.filter((opt) => {
      const raw = opt.raw || {};
      if (raw.ownership === "own" || raw.ownerType === "own") return false;
      return raw.ownership === "market" || raw.ownerType === "market" || Boolean(raw.vendorName);
    }).length;
  }, [normalizedOptions, isVehicleType]);

  const companyVehiclesCount = useMemo(() => {
    if (!isVehicleType) return 0;
    return normalizedOptions.filter((opt) => {
      const raw = opt.raw || {};
      if (raw.ownership === "own" || raw.ownerType === "own") return true;
      return !(raw.ownership === "market" || raw.ownerType === "market" || Boolean(raw.vendorName));
    }).length;
  }, [normalizedOptions, isVehicleType]);

  const vehicleFiltered = normalizedOptions.filter((opt) => {
    if (!isVehicleType) return true;
    if (vehicleFilterTab === "all") return true;
    const raw = opt.raw || {};
    const isMkt =
      (raw.ownership !== "own" && raw.ownerType !== "own") &&
      (raw.ownership === "market" || raw.ownerType === "market" || Boolean(raw.vendorName));

    if (vehicleFilterTab === "market") return isMkt;
    if (vehicleFilterTab === "company") return !isMkt;
    return true;
  });

  // Filter options based on multi-field search query
  const filtered = vehicleFiltered.filter((opt) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const raw = opt.raw || {};
    const searchable = [
      opt.label,
      opt.subtext,
      opt.value,
      raw.name,
      raw.phone,
      raw.alternatePhone,
      raw.alternateMobile,
      raw.vehicleNumber,
      raw.vehicleType,
      raw.ownership,
      raw.ownerType,
      raw.ownerName,
      raw.ownerPhone,
      raw.vendorName,
      raw.licenseNumber,
      raw.aadhaarNumber,
      raw.dutyStatus,
      raw.assignedVehicleId?.vehicleNumber,
      raw.assignedVehicleId?.make,
      raw.assignedVehicleId?.model,
      raw.city,
      raw.state,
      raw.gstNumber,
      raw.vendorName,
      raw.vendorType,
      raw.bookingNumber,
      raw.memoNumber,
      raw.truckNumber,
      raw.driverPhone,
      raw.driverName,
      raw.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });

  const selectedOption = normalizedOptions.find(
    (o) =>
      String(o.value) === String(value) ||
      (entityType === "vendor" &&
        (String(o.label) === String(value) ||
          String(o.raw?.vendorName) === String(value))),
  );

  const cleanEntityType =
    entityType === "vehicle"
      ? "Vehicle"
      : entityType === "driver"
        ? "Driver"
        : entityType === "party"
          ? "Party"
          : entityType === "vendor"
            ? "Vendor"
            : entityType === "city"
              ? "City / Hub"
              : (entityLabel?.split("(")[0]?.split("-")[0]?.trim() || "Item");

  const displayEntityType = cleanEntityType;

  // Full Master Form States
  const [quickForm, setQuickForm] = useState({});

  const handleOpenQuickAdd = (e) => {
    e?.stopPropagation();
    if (onAddNew) {
      onAddNew(search);
      setOpen(false);
      return;
    }
    // Initialize full comprehensive form defaults
    if (entityType === "driver") {
      const isDigits = /^\d+$/.test(search.trim());
      setQuickForm({
        name: isDigits ? "" : search.trim(),
        phone: isDigits ? search.trim() : "",
        alternatePhone: "",
        assignedVehicleId: "",
        address: "",
        licenseNumber: "",
        licenseExpiryDate: "",
        aadhaarNumber: "",
        monthlySalary: 10000,
        dutyStatus: "On Duty",
        dateOfJoining: new Date().toISOString().split("T")[0],
        emergencyContactName: "",
        emergencyContact: "",
        status: "Active",
        notes: "",
      });
    } else if (entityType === "vehicle") {
      const isMarketContext = Boolean(
        (label && /lorry/i.test(label)) ||
        (placeholder && /lorry/i.test(placeholder)) ||
        (entityLabel && /lorry/i.test(entityLabel))
      );
      setQuickForm({
        vehicleNumber: search.trim().toUpperCase(),
        vehicleName: "",
        vehicleType: "Container",
        make: "Tata Motors",
        model: "",
        yearOfManufacture: new Date().getFullYear(),
        payloadCapacity: 20,
        fuelType: "Diesel",
        driverId: "",
        currentOdometer: "",
        ownership: isMarketContext ? "market" : "company",
        ownerName: "",
        ownerPhone: "",
        chassisNumber: "",
        engineNumber: "",
        rcExpiryDate: "",
        rcDocument: "",
        insuranceExpiryDate: "",
        fitnessExpiryDate: "",
        permitExpiryDate: "",
        pucExpiryDate: "",
        status: "Active",
        notes: "",
      });
    } else if (entityType === "party") {
      setQuickForm({
        name: search.trim(),
        contactPerson: "",
        phone: "",
        alternatePhone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        gstNumber: "",
        panNumber: "",
        creditDays: 30,
        notes: "",
      });
    } else if (entityType === "vendor") {
      setQuickForm({
        vendorCode: "",
        vendorName: search.trim(),
        contactPerson: "",
        phone: "",
        alternatePhone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        gstNumber: "",
        panNumber: "",
        status: "Active",
        remarks: "",
      });
    } else if (entityType === "city") {
      setQuickForm({
        name: search.trim(),
        state: "",
        pincode: "",
        hubType: "Warehouse Hub",
      });
    } else {
      setQuickForm({ name: search.trim() });
    }
    setQuickAddOpen(true);
    setOpen(false);
  };

  const handleSaveQuickAdd = async (e) => {
    e.preventDefault();
    setQuickAddLoading(true);
    try {
      let createdItem = null;
      let newOpt = null;

      if (entityType === "driver") {
        if (!quickForm.phone || quickForm.phone.trim().length < 10) {
          toast.error("Please enter a valid 10-digit driver mobile number");
          setQuickAddLoading(false);
          return;
        }
        if (!quickForm.name?.trim()) {
          toast.error("Driver full name is required");
          setQuickAddLoading(false);
          return;
        }
        const res = await api.post("/drivers", {
          name: quickForm.name.trim(),
          phone: quickForm.phone.trim(),
          alternatePhone: quickForm.alternatePhone?.trim() || "",
          assignedVehicleId: quickForm.assignedVehicleId || null,
          address: quickForm.address?.trim() || "",
          licenseNumber: quickForm.licenseNumber?.trim().toUpperCase() || "",
          licenseExpiryDate: quickForm.licenseExpiryDate || null,
          aadhaarNumber: quickForm.aadhaarNumber?.trim() || "",
          monthlySalary: quickForm.monthlySalary !== undefined && quickForm.monthlySalary !== "" ? Number(quickForm.monthlySalary) : 10000,
          dutyStatus: quickForm.dutyStatus || "On Duty",
          dateOfJoining: quickForm.dateOfJoining || new Date(),
          emergencyContactName: quickForm.emergencyContactName?.trim() || "",
          emergencyContact: quickForm.emergencyContact?.trim() || "",
          status: quickForm.status?.toLowerCase() || "active",
          notes: quickForm.notes?.trim() || "",
        });
        createdItem = res.data?.data || res.data;
        newOpt = {
          value: createdItem._id,
          label: `${createdItem.phone} • ${createdItem.name}`,
          subtext: createdItem.licenseNumber ? `Lic: ${createdItem.licenseNumber}` : "",
          raw: createdItem,
        };
      } else if (entityType === "vehicle") {
        if (!quickForm.vehicleNumber?.trim()) {
          toast.error("Vehicle / Truck number is required");
          setQuickAddLoading(false);
          return;
        }
        const res = await api.post("/vehicles", {
          vehicleNumber: quickForm.vehicleNumber.trim().toUpperCase(),
          vehicleName: quickForm.vehicleName?.trim() || quickForm.make || "Tata Container",
          make: quickForm.make?.trim() || "Tata Motors",
          model: quickForm.model?.trim() || "",
          yearOfManufacture: quickForm.yearOfManufacture ? Number(quickForm.yearOfManufacture) : undefined,
          vehicleType: quickForm.vehicleType || "Container",
          fuelType: quickForm.fuelType || "Diesel",
          payloadCapacity: quickForm.payloadCapacity ? Number(quickForm.payloadCapacity) : 20,
          driverId: quickForm.driverId || null,
          currentOdometer: quickForm.currentOdometer ? Number(quickForm.currentOdometer) : 0,
          ownership: quickForm.ownership === "market" ? "market" : "own",
          ownerType: quickForm.ownership === "market" ? "market" : "own",
          vendorId: quickForm.ownership === "market" ? (quickForm.vendorId || null) : null,
          ownerName: quickForm.ownership === "market" ? (quickForm.ownerName?.trim() || quickForm.vendorName?.trim() || "Market Vendor") : "Shri Shyam Bricks",
          vendorName: quickForm.ownership === "market" ? (quickForm.vendorName?.trim() || quickForm.ownerName?.trim() || "Market Vendor") : "",
          ownerPhone: quickForm.ownership === "market" ? (quickForm.ownerPhone?.trim() || "") : "",
          chassisNumber: quickForm.chassisNumber?.trim().toUpperCase() || "",
          engineNumber: quickForm.engineNumber?.trim().toUpperCase() || "",
          rcNumber: quickForm.rcNumber?.trim().toUpperCase() || quickForm.vehicleNumber?.trim().toUpperCase(),
          rcExpiryDate: quickForm.rcExpiryDate || null,
          rcDocument: quickForm.rcDocument || "",
          insuranceCompany: quickForm.insuranceCompany?.trim() || "",
          insurancePolicyNumber: quickForm.insurancePolicyNumber?.trim().toUpperCase() || "",
          insuranceExpiryDate: quickForm.insuranceExpiryDate || null,
          fitnessNumber: quickForm.fitnessNumber?.trim().toUpperCase() || "",
          fitnessExpiryDate: quickForm.fitnessExpiryDate || null,
          permitNumber: quickForm.permitNumber?.trim().toUpperCase() || "",
          permitExpiryDate: quickForm.permitExpiryDate || null,
          pucNumber: quickForm.pucNumber?.trim().toUpperCase() || "",
          pucExpiryDate: quickForm.pucExpiryDate || null,
          roadTaxExpiryDate: quickForm.roadTaxExpiryDate || null,
          status: quickForm.status?.toLowerCase() || "active",
          notes: quickForm.notes?.trim() || "",
        });
        createdItem = res.data?.data || res.data;
        newOpt = {
          value: createdItem._id,
          label: createdItem.vehicleNumber,
          subtext: `${createdItem.vehicleType || "Container"} • ${createdItem.vehicleName || ""}`,
          raw: createdItem,
        };
      } else if (entityType === "party") {
        if (!quickForm.name?.trim()) {
          toast.error("Party / Customer name is required");
          setQuickAddLoading(false);
          return;
        }
        const partyName = quickForm.name.trim();
        try {
          const res = await api.post("/customers", {
            name: partyName,
            contactPerson: quickForm.contactPerson || "",
            phone: quickForm.phone || "",
            alternatePhone: quickForm.alternatePhone || "",
            email: quickForm.email || "",
            address: quickForm.address || "",
            city: quickForm.city || "",
            state: quickForm.state || "",
            pincode: quickForm.pincode || "",
            gstNumber: quickForm.gstNumber || "",
            panNumber: quickForm.panNumber || "",
            creditDays: quickForm.creditDays || 30,
            notes: quickForm.notes || "",
          });
          createdItem = res.data?.data || res.data;
        } catch (apiErr) {
          console.warn("API customer save warning:", apiErr);
          createdItem = {
            name: partyName,
            ...quickForm,
          };
        }
        newOpt = {
          value: createdItem?._id || partyName,
          label: partyName,
          subtext: quickForm.city ? `(${quickForm.city})` : (quickForm.phone ? `(${quickForm.phone})` : ""),
          raw: createdItem || { name: partyName, ...quickForm },
        };
      } else if (entityType === "vendor") {
        if (!quickForm.vendorName?.trim()) {
          toast.error("Vendor name is required");
          setQuickAddLoading(false);
          return;
        }
        const res = await api.post("/vendors", {
          vendorCode: quickForm.vendorCode?.trim() || "",
          vendorName: quickForm.vendorName.trim(),
          vendorType: "transporter",
          contactPerson: quickForm.contactPerson?.trim() || "",
          phone: quickForm.phone?.trim() || "",
          alternatePhone: quickForm.alternatePhone?.trim() || "",
          email: quickForm.email?.trim() || "",
          address: quickForm.address?.trim() || "",
          city: quickForm.city?.trim() || "",
          state: quickForm.state?.trim() || "",
          gstNumber: quickForm.gstNumber?.trim().toUpperCase() || "",
          panNumber: quickForm.panNumber?.trim().toUpperCase() || "",
          status: quickForm.status?.toLowerCase() || "active",
          remarks: quickForm.remarks?.trim() || "",
        });
        createdItem = res.data?.data || res.data;
        newOpt = {
          value: createdItem.vendorName || createdItem._id,
          label: createdItem.vendorName,
          subtext: createdItem.phone ? `Ph: ${createdItem.phone}` : "Market Vendor",
          raw: createdItem,
        };
      } else if (entityType === "city") {
        if (!quickForm.name?.trim()) {
          toast.error("City name is required");
          setQuickAddLoading(false);
          return;
        }
        const cityName = quickForm.name.trim();
        newOpt = {
          value: cityName,
          label: cityName,
          subtext: [quickForm.hubType, quickForm.state].filter(Boolean).join(" • "),
          raw: { name: cityName, ...quickForm },
        };
      } else {
        toast.error("Unknown entity type");
        setQuickAddLoading(false);
        return;
      }

      if (newOpt && newOpt.value) {
        const itemToStore = createdItem || newOpt.raw;
        setLocalOptions((prev) => [itemToStore, ...prev]);
        onChange(newOpt.value, itemToStore);
        toast.success(`${displayEntityType} added and selected!`);
      }
      setQuickAddOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to add item");
    } finally {
      setQuickAddLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label Row with Inline + Add Trigger */}
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {allowQuickAdd && (
            <button
              type="button"
              onClick={handleOpenQuickAdd}
              className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 hover:text-amber-800 transition cursor-pointer hover:underline"
              title={`Quickly add new ${displayEntityType}`}
            >
              <Plus className="h-3 w-3 stroke-[3]" />
              <span>Add {displayEntityType}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Select Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition outline-none cursor-pointer ${
          open
            ? "border-amber-500 ring-4 ring-amber-500/10"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "text-slate-900"}`}
      >
        <div className="flex-1 truncate pr-2">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {entityType === "vehicle" && (
                <Truck
                  className={`h-3.5 w-3.5 shrink-0 ${
                    selectedOption.raw?.ownerType === "market" ||
                    selectedOption.raw?.ownership === "market" ||
                    Boolean(selectedOption.raw?.ownerName && selectedOption.raw?.ownerName !== "SELF" && selectedOption.raw?.ownerType !== "own")
                      ? "text-purple-600"
                      : "text-slate-400"
                  }`}
                />
              )}
              {entityType === "driver" && (
                <div className="w-5 h-5 rounded-full bg-[#8b2626] text-white font-black text-[10px] flex items-center justify-center shrink-0 uppercase">
                  {(selectedOption.raw?.name || selectedOption.label || "D").charAt(0)}
                </div>
              )}
              {entityType === "party" && <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
              {entityType === "city" && <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.raw?.name && selectedOption.raw?.phone
                  ? `${selectedOption.raw.name} (${selectedOption.raw.phone})`
                  : selectedOption.label}
              </span>
              {entityType === "vehicle" &&
                (selectedOption.raw?.ownerType === "market" ||
                  selectedOption.raw?.ownership === "market" ||
                  Boolean(selectedOption.raw?.ownerName && selectedOption.raw?.ownerName !== "SELF" && selectedOption.raw?.ownerType !== "own")) && (
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-black text-purple-900 border border-purple-200 shrink-0">
                    Vendor: {selectedOption.raw?.ownerName || selectedOption.raw?.vendorName || "Market"}
                  </span>
                )}
              {selectedOption.subtext && entityType !== "vehicle" && (
                <span className="text-xs font-normal text-slate-400 truncate">
                  {selectedOption.subtext}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("", null);
              }}
              title="Clear selection"
              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180 text-amber-600" : ""
            }`}
          />
        </div>
      </button>

      {helperText && (
        <p className="mt-1 text-[11px] font-medium text-slate-500">{helperText}</p>
      )}

      {/* Dropdown Floating Menu */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 p-2 backdrop-blur-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                autoFocus
                autoComplete="off"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  entityType === "driver"
                    ? "Search driver by name or mobile number..."
                    : `Search ${displayEntityType}...`
                }
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-sm sm:text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Inline Add Quick Button inside search bar */}
            {allowQuickAdd && (
              <button
                type="button"
                onClick={handleOpenQuickAdd}
                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/70 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>+ Add New {displayEntityType}</span>
              </button>
            )}
          </div>

          {/* Vehicle Category Filter Tabs */}
          {isVehicleType && (
            <div className="flex items-center gap-1 p-1.5 bg-slate-100/90 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setVehicleFilterTab("market")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  vehicleFilterTab === "market"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                <span>🚚 Vendor / Market</span>
                <span
                  className={`rounded-full px-1.5 text-[9px] ${
                    vehicleFilterTab === "market"
                      ? "bg-purple-800 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {marketVehiclesCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilterTab("all")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  vehicleFilterTab === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>All Trucks</span>
                <span
                  className={`rounded-full px-1.5 text-[9px] ${
                    vehicleFilterTab === "all"
                      ? "bg-slate-700 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {normalizedOptions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilterTab("company")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  vehicleFilterTab === "company"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <span>🏢 Company</span>
                <span
                  className={`rounded-full px-1.5 text-[9px] ${
                    vehicleFilterTab === "company"
                      ? "bg-emerald-800 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {companyVehiclesCount}
                </span>
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto p-1 text-sm divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs font-semibold text-slate-500">
                  {isVehicleType && vehicleFilterTab === "market"
                    ? "No Market / Vendor Lorries found"
                    : isVehicleType && vehicleFilterTab === "company"
                      ? "No Company Fleet Lorries found"
                      : `No matching ${displayEntityType.toLowerCase()} found`}
                </p>
                {isVehicleType && vehicleFilterTab === "market" && normalizedOptions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setVehicleFilterTab("all")}
                    className="mt-1.5 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    View All Trucks ({normalizedOptions.length})
                  </button>
                )}
                {allowQuickAdd && search.trim() && (
                  <button
                    type="button"
                    onClick={handleOpenQuickAdd}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition cursor-pointer"
                  >
                    <Plus className="h-3 w-3 stroke-[3]" />
                    Add &quot;{search.trim()}&quot; Now
                  </button>
                )}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const raw = opt.raw || {};
                const isDriver =
                  entityType === "driver" ||
                  (raw.phone && raw.name && (raw.licenseNumber !== undefined || raw.monthlySalary !== undefined));
                const isVehicle =
                  entityType === "vehicle" || Boolean(raw.vehicleNumber);
                const isParty =
                  entityType === "party" ||
                  (raw.name && (raw.gstNumber !== undefined || raw.creditPeriodDays !== undefined));
                const isVendor =
                  entityType === "vendor" || Boolean(raw.vendorName);
                const isCity =
                  entityType === "city" || Boolean(raw.cityName);

                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value, opt.raw || opt);
                      setOpen(false);
                    }}
                    className={`flex items-center justify-between rounded-xl p-2.5 cursor-pointer transition ${
                      isSelected
                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-950 font-bold"
                        : "text-slate-800 hover:bg-slate-100/80 border border-transparent"
                    }`}
                  >
                    {isDriver ? (
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                            {(raw.name || opt.label || "D").charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-950 tracking-tight">
                                {raw.name || opt.label}
                              </span>
                              {raw.phone && (
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                                  <Phone className="h-3 w-3 text-amber-600" />
                                  {raw.phone}
                                </span>
                              )}
                              {(raw.dutyStatus || raw.status) && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                  {raw.dutyStatus || raw.status}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                              {raw.licenseNumber ? (
                                <span>DL: <strong className="text-slate-800 font-mono">{raw.licenseNumber}</strong></span>
                              ) : null}
                              {(raw.assignedVehicleId?.vehicleNumber || raw.vehicleNumber) && (
                                <span className="text-slate-950 font-bold">
                                  🚛 {raw.assignedVehicleId?.vehicleNumber || raw.vehicleNumber}
                                </span>
                              )}
                              {raw.monthlySalary && (
                                <span className="text-slate-600">
                                  Salary: ₹{Number(raw.monthlySalary).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : isVehicle ? (
                      (() => {
                        const isMkt =
                          raw.ownership === "market" ||
                          raw.ownerType === "market";
                        const vendorDisplay = raw.ownerName || raw.vendorName;
                        const assignedDriverName =
                          typeof raw.driverId === "object"
                            ? raw.driverId?.name
                            : raw.driverName;

                        return (
                          <div className="min-w-0 flex-1 pr-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <Truck className={`h-4 w-4 shrink-0 ${isMkt ? "text-purple-600" : "text-emerald-600"}`} />
                                <span className="font-mono font-black text-sm text-slate-950 tracking-wider truncate">
                                  {raw.vehicleNumber || opt.label}
                                </span>
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 shrink-0">
                                  {raw.vehicleType || "Truck"}
                                </span>
                                {assignedDriverName && (
                                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                                    <User className="h-3 w-3 text-amber-600" />
                                    <span>Driver: {assignedDriverName}</span>
                                  </span>
                                )}
                              </div>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-black border shrink-0 ${
                                  isMkt
                                    ? "bg-purple-100 text-purple-900 border-purple-300"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                {isMkt ? `🚚 Market${vendorDisplay ? ` (${vendorDisplay})` : ""}` : "🏢 Company Fleet"}
                              </span>
                            </div>
                          </div>
                        );
                      })()
                    ) : isParty ? (
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="font-bold text-xs text-slate-950">
                            {raw.name || opt.label}
                          </span>
                          {raw.city && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                              📍 {raw.city}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                          {raw.phone && <span>Ph: <strong className="text-slate-800">{raw.phone}</strong></span>}
                          {raw.gstNumber && <span>GST: <strong className="text-slate-800 font-mono">{raw.gstNumber}</strong></span>}
                        </div>
                      </div>
                    ) : isVendor ? (
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          <span className="font-bold text-xs text-slate-950">
                            {raw.vendorName || opt.label}
                          </span>
                          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-black text-purple-900 border border-purple-200">
                            Market Vendor
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                          {raw.phone && <span>Phone: <strong className="text-slate-800">{raw.phone}</strong></span>}
                          {raw.city && <span>City: 📍 {raw.city}</span>}
                        </div>
                      </div>
                    ) : isCity ? (
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-xs text-slate-950">
                            {raw.name || raw.cityName || opt.label}
                          </span>
                          {raw.state && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              ({raw.state})
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate text-xs font-semibold text-slate-900">
                          {opt.label}
                        </p>
                        {opt.subtext && (
                          <p className="truncate text-[11px] text-slate-500">
                            {opt.subtext}
                          </p>
                        )}
                      </div>
                    )}

                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-amber-600 stroke-[3]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FULL MASTER ADD MODAL */}
      {quickAddOpen && allowQuickAdd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div
            className={`w-full ${
              entityType === "city" ? "max-w-xl max-h-[90vh]" : "max-w-3xl max-h-[90vh]"
            } flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 overflow-hidden`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {entityType === "vehicle" && "Add New Vehicle / Truck"}
                    {entityType === "driver" && "Add New Driver"}
                    {entityType === "vendor" && "Add New Vendor"}
                    {entityType === "party" && "Add New Party / Customer"}
                    {entityType === "city" && "Add New City / Hub"}
                    {!["vehicle", "driver", "vendor", "party", "city"].includes(entityType) && `Add New ${displayEntityType}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Will be saved and auto-selected immediately
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* DRIVER FIELDS (FULL FORM) */}
              {entityType === "driver" && (
                <div className="space-y-5">
                  {/* Section 1: Identity & Contact */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Driver Identity &amp; Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Mobile Number <span className="text-red-500">* (Primary Identity)</span>
                        </label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-amber-600" />
                          <input
                            type="tel"
                            required
                            placeholder="10 digit mobile"
                            value={quickForm.phone || ""}
                            onChange={(e) =>
                              setQuickForm({ ...quickForm, phone: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Driver Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={quickForm.name || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, name: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Alternate Mobile
                        </label>
                        <input
                          type="tel"
                          placeholder="Alternate phone number"
                          value={quickForm.alternatePhone || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, alternatePhone: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Assigned Vehicle
                        </label>
                        <select
                          value={quickForm.assignedVehicleId || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, assignedVehicleId: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 cursor-pointer"
                        >
                          <option value="">-- No Vehicle Assigned --</option>
                          {extraVehicles.map((v) => (
                            <option key={v._id || v.id} value={v._id || v.id}>
                              {v.vehicleNumber} {v.make ? `(${v.make})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Aadhaar Number
                        </label>
                        <input
                          type="text"
                          placeholder="12-digit Aadhaar number"
                          value={quickForm.aadhaarNumber || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, aadhaarNumber: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Current Address
                        </label>
                        <input
                          type="text"
                          placeholder="Village / City, District, State..."
                          value={quickForm.address || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, address: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: License & Employment */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-600 mb-3">
                      License &amp; Employment
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Driving License Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GJ06 20210001234"
                          value={quickForm.licenseNumber || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              licenseNumber: e.target.value.toUpperCase(),
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          License Expiry Date
                        </label>
                        <input
                          type="date"
                          value={quickForm.licenseExpiryDate || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, licenseExpiryDate: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Duty Status
                        </label>
                        <select
                          value={quickForm.dutyStatus || "On Duty"}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, dutyStatus: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        >
                          <option value="On Duty">On Duty</option>
                          <option value="Off Duty">Off Duty</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Resigned">Resigned</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Monthly Salary (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="10000"
                          value={quickForm.monthlySalary || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, monthlySalary: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Joining Date
                        </label>
                        <input
                          type="date"
                          value={quickForm.dateOfJoining || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, dateOfJoining: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Driver Status
                        </label>
                        <select
                          value={quickForm.status || "Active"}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, status: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Emergency & Notes */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-600 mb-3">
                      Emergency Contact &amp; Notes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Emergency Contact Person
                        </label>
                        <input
                          type="text"
                          placeholder="Father / Brother / Wife"
                          value={quickForm.emergencyContactName || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, emergencyContactName: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Emergency Mobile Number
                        </label>
                        <input
                          type="tel"
                          placeholder="Emergency phone"
                          value={quickForm.emergencyContact || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, emergencyContact: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Notes / Remarks
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Any remarks, previous experience, etc..."
                          value={quickForm.notes || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, notes: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VEHICLE FIELDS */}
              {entityType === "vehicle" && (
                <div className="space-y-4">
                  {/* Step 1: Ownership Toggle at TOP */}
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2">
                      Select Vehicle Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuickForm({ ...quickForm, ownership: "company" })
                        }
                        className={`rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer text-center ${
                          quickForm.ownership === "company"
                            ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        🏢 Company Fleet (Own / Self)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setQuickForm({ ...quickForm, ownership: "market" })
                        }
                        className={`rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer text-center ${
                          quickForm.ownership === "market"
                            ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        🚚 Market Lorry (Vendor / Hired)
                      </button>
                    </div>
                  </div>

                  {/* Core Vehicle Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Vehicle / Truck Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1">
                        <Truck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. MH46CL 5135 / MH04KY 8233"
                          value={quickForm.vehicleNumber || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              vehicleNumber: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-bold tracking-wider text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Vehicle Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={quickForm.vehicleType || "Container"}
                        onChange={(e) =>
                          setQuickForm({
                            ...quickForm,
                            vehicleType: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                      >
                        <option value="Container">Container</option>
                        <option value="Trailer">Trailer</option>
                        <option value="Truck">Truck</option>
                        <option value="Tanker">Tanker</option>
                        <option value="Open Body">Open Body</option>
                        <option value="Other Commercial">Other Commercial</option>
                      </select>
                    </div>
                  </div>

                  {/* If Market Lorry: Vendor Name & Mobile */}
                  {quickForm.ownership === "market" ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Vendor / Transporter Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Syndiket Trp / Tarun Logistics / Suresh Jat"
                            value={quickForm.vendorName || quickForm.ownerName || ""}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                vendorName: e.target.value,
                                ownerName: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Vendor / Owner Mobile
                          </label>
                          <input
                            type="tel"
                            placeholder="10 digit mobile"
                            value={quickForm.ownerPhone || ""}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                ownerPhone: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Market Lorry (Third-Party Hired)</div>
                          <div className="text-[11px] text-emerald-700 mt-0.5">
                            No odometer, RC, chassis or insurance paperwork required for third-party market vehicles. Saves immediately in 1-click.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* If Company Fleet: Show full specifications */
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-600 mb-1 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5" />
                        Company Fleet Specifications
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Vehicle Name / Model
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Tata 407 / Prima 5530"
                            value={quickForm.vehicleName || ""}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                vehicleName: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Make / Manufacturer
                          </label>
                          <select
                            value={quickForm.make || "Tata Motors"}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                make: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
                          >
                            <option value="Tata Motors">Tata Motors</option>
                            <option value="Ashok Leyland">Ashok Leyland</option>
                            <option value="BharatBenz">BharatBenz</option>
                            <option value="Eicher">Eicher</option>
                            <option value="Mahindra">Mahindra</option>
                            <option value="Volvo">Volvo</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Model / Year
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 2024"
                            value={quickForm.model || ""}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                model: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Capacity (Tons)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 20"
                            value={quickForm.payloadCapacity || ""}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                payloadCapacity: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Fuel Type
                          </label>
                          <select
                            value={quickForm.fuelType || "Diesel"}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                fuelType: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
                          >
                            <option value="Diesel">Diesel</option>
                            <option value="CNG">CNG</option>
                            <option value="Petrol">Petrol</option>
                            <option value="Electric">Electric</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Assigned Driver
                          </label>
                          <select
                            value={quickForm.driverId || ""}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                driverId: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="">-- No Driver Assigned --</option>
                            {extraDrivers.map((d) => (
                              <option key={d._id || d.id} value={d._id || d.id}>
                                {d.name} {d.phone ? `(${d.phone})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Current Odometer (KM)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 45000"
                            value={quickForm.currentOdometer || ""}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                currentOdometer: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Current Status
                          </label>
                          <select
                            value={quickForm.status || "Active"}
                            onChange={(e) =>
                              setQuickForm({
                                ...quickForm,
                                status: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
                          >
                            <option value="Active">Active</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 3: Chassis & Engine */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className={`text-[11px] font-black uppercase tracking-wider mb-3 ${quickForm.ownership === "market" ? "text-purple-700" : "text-amber-600"}`}>
                      {quickForm.ownership === "market" ? "🚚 Market Lorry Chassis & Engine" : "Chassis & Engine"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Chassis Number
                        </label>
                        <input
                          type="text"
                          placeholder="VIN / Chassis No"
                          value={quickForm.chassisNumber || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              chassisNumber: e.target.value.toUpperCase(),
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold tracking-wider text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Engine Number
                        </label>
                        <input
                          type="text"
                          placeholder="Engine No"
                          value={quickForm.engineNumber || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              engineNumber: e.target.value.toUpperCase(),
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold tracking-wider text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Compliance & Document Details */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className={`text-[11px] font-black uppercase tracking-wider mb-3 ${quickForm.ownership === "market" ? "text-purple-700" : "text-amber-600"}`}>
                      Compliance & Document Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          RC Expiry Date
                        </label>
                        <input
                          type="date"
                          value={quickForm.rcExpiryDate || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              rcExpiryDate: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Insurance Expiry
                        </label>
                        <input
                          type="date"
                          value={quickForm.insuranceExpiryDate || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              insuranceExpiryDate: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Permit Expiry
                        </label>
                        <input
                          type="date"
                          value={quickForm.permitExpiryDate || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              permitExpiryDate: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Fitness Expiry
                        </label>
                        <input
                          type="date"
                          value={quickForm.fitnessExpiryDate || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              fitnessExpiryDate: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          PUC Expiry
                        </label>
                        <input
                          type="date"
                          value={quickForm.pucExpiryDate || ""}
                          onChange={(e) =>
                            setQuickForm({
                              ...quickForm,
                              pucExpiryDate: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          RC Book Scan / Copy
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append("file", file);
                            try {
                              const res = await api.post("/upload", fd);
                              const url = res.data?.url || res.data?.fileUrl;
                              if (url) {
                                setQuickForm((prev) => ({ ...prev, rcDocument: url }));
                                toast.success("RC copy uploaded!");
                              }
                            } catch {
                              toast.error("Failed to upload RC file");
                            }
                          }}
                          className="mt-1 w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                        />
                        {quickForm.rcDocument && (
                          <span className="text-[11px] font-bold text-emerald-600 mt-1 block">
                            ✓ RC file attached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

              {/* Section 5: Notes */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any additional notes about this vehicle..."
                      value={quickForm.notes || ""}
                      onChange={(e) =>
                        setQuickForm({
                          ...quickForm,
                          notes: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                    />
                  </div>
                </div>
              )}

              {/* PARTY / CUSTOMER FIELDS (FULL FORM) */}
              {entityType === "party" && (
                <div className="space-y-5">
                  {/* Section 1: Basic & Contact */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      Party / Company Name &amp; Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Party / Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rajputana Builders / Sharma Construction"
                          value={quickForm.name || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, name: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Sharma"
                          value={quickForm.contactPerson || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, contactPerson: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Phone / Mobile <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="10 digit phone"
                          value={quickForm.phone || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, phone: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Alternate Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="Alternate contact phone"
                          value={quickForm.alternatePhone || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, alternatePhone: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="party@example.com"
                          value={quickForm.email || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, email: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          City / Hub
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Jaipur"
                          value={quickForm.city || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, city: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Address & Tax */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-600 mb-3">
                      Address &amp; Tax Numbers
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Full Address
                        </label>
                        <input
                          type="text"
                          placeholder="Office / Godown Address"
                          value={quickForm.address || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, address: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Tamil Nadu"
                          value={quickForm.state || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, state: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Pincode
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 600066"
                          value={quickForm.pincode || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, pincode: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          GST Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 33AABCB1234F1Z5"
                          value={quickForm.gstNumber || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, gstNumber: e.target.value.toUpperCase() })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          PAN Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ABCDE1234F"
                          value={quickForm.panNumber || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, panNumber: e.target.value.toUpperCase() })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Credit Days
                        </label>
                        <input
                          type="number"
                          placeholder="30"
                          value={quickForm.creditDays || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, creditDays: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Notes / Terms
                        </label>
                        <input
                          type="text"
                          placeholder="Payment cycle, instructions, etc..."
                          value={quickForm.notes || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, notes: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VENDOR FIELDS (FULL FORM) */}
              {entityType === "vendor" && (
                <div className="space-y-5">
                  {/* Section 1: Vendor Details */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      Vendor Identity &amp; Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Vendor / Firm Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Syndiket Trp / Tarun Logistics / Anshu Cargo"
                          value={quickForm.vendorName || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, vendorName: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Bhai / Manager"
                          value={quickForm.contactPerson || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, contactPerson: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="10 digit mobile"
                          value={quickForm.phone || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, phone: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Alternate Mobile / Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="Alternate phone number"
                          value={quickForm.alternatePhone || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, alternatePhone: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="vendor@example.com"
                          value={quickForm.email || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, email: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          City / Base Location
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Jaipur / Tonk / Sikar / Ajmer"
                          value={quickForm.city || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, city: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Address & Location */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-600 mb-3">
                      Address &amp; Location
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Office / Yard Address
                        </label>
                        <input
                          type="text"
                          placeholder="Office / Yard Address"
                          value={quickForm.address || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, address: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Tamil Nadu / Maharashtra"
                          value={quickForm.state || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, state: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          Remarks / Notes
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Vendor notes, payment terms, or remarks..."
                          value={quickForm.remarks || ""}
                          onChange={(e) =>
                            setQuickForm({ ...quickForm, remarks: e.target.value })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CITY / LOCATION FIELDS */}
              {entityType === "city" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      City / Location / Depot Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jaipur Kiln Hub / Sanganer / Tonk Road / Ajmer"
                      value={quickForm.name || ""}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, name: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tamil Nadu / Maharashtra"
                        value={quickForm.state || ""}
                        onChange={(e) =>
                          setQuickForm({ ...quickForm, state: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Pincode / Zip
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 600001"
                        value={quickForm.pincode || ""}
                        onChange={(e) =>
                          setQuickForm({ ...quickForm, pincode: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Hub Category / Type
                      </label>
                      <select
                        value={quickForm.hubType || "Warehouse Hub"}
                        onChange={(e) =>
                          setQuickForm({ ...quickForm, hubType: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Port Terminal">Port Terminal</option>
                        <option value="ICD / Dry Port">ICD / Container Freight Station</option>
                        <option value="Warehouse Hub">Warehouse / Yard Hub</option>
                        <option value="Delivery Destination">Delivery City / Hub</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 shrink-0 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickAdd}
                  disabled={quickAddLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-sm shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50 transition cursor-pointer"
                >
                  {quickAddLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save &amp; Select {displayEntityType}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
