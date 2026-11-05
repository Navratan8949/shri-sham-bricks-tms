"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  TrendingUp,
  Truck,
  User,
  Phone,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  FileText,
  Eye,
  Info,
  CreditCard,
  MapPin
} from "lucide-react";
import api from "@/src/services/api";
import { formatINR } from "@/src/lib/simpleFormat";
import { toast } from "sonner";
import Pagination from "./Pagination";
import SearchableDropdown from "./SearchableDropdown";
import TableSkeletonRows from "./TableSkeletonRows";

const formatDateForInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
};

const formatDateDisplay = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
};

const getVehicleCompliance = (v) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const docList = [
    { key: "rc", label: "RC (आरसी)", no: v.rcNumber || "—", date: v.rcExpiryDate },
    { key: "insurance", label: "Insurance (बीमा)", no: v.insurancePolicyNumber || v.insuranceCompany || "—", date: v.insuranceExpiryDate },
    { key: "fitness", label: "Fitness (फिटनेस)", no: v.fitnessNumber || "—", date: v.fitnessExpiryDate },
    { key: "permit", label: "Permit (परमिट)", no: v.permitNumber || "—", date: v.permitExpiryDate },
    { key: "puc", label: "PUC (प्रदूषण)", no: v.pucNumber || "—", date: v.pucExpiryDate },
    { key: "roadTax", label: "Road Tax (टैक्स)", no: "Tax Paid Upto", date: v.roadTaxExpiryDate }
  ];

  const filledDocs = docList.filter((d) => Boolean(d.date));

  if (!filledDocs.length) {
    return {
      status: "not_set",
      badge: "No Papers Set",
      badgeClass: "bg-stone-100 text-stone-500 border-stone-200",
      expired: [],
      expiringSoon: [],
      valid: [],
      allDocs: docList
    };
  }

  const expired = [];
  const expiringSoon = [];
  const valid = [];

  filledDocs.forEach((d) => {
    const exp = new Date(d.date);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expired.push({ ...d, diffDays: Math.abs(diffDays) });
    } else if (diffDays <= 30) {
      expiringSoon.push({ ...d, diffDays });
    } else {
      valid.push({ ...d, diffDays });
    }
  });

  if (expired.length > 0) {
    return {
      status: "expired",
      badge: `${expired[0].label.split(" ")[0]} Expired!`,
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300 font-black",
      expired,
      expiringSoon,
      valid,
      allDocs: docList
    };
  }

  if (expiringSoon.length > 0) {
    const earliest = [...expiringSoon].sort((a, b) => a.diffDays - b.diffDays)[0];
    return {
      status: "expiring_soon",
      badge: `${earliest.label.split(" ")[0]} in ${earliest.diffDays}d`,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
      expired,
      expiringSoon,
      valid,
      allDocs: docList
    };
  }

  return {
    status: "valid",
    badge: `All Valid (${valid.length}/6)`,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold",
    expired,
    expiringSoon,
    valid,
    allDocs: docList
  };
};

const getDriverCompliance = (d) => {
  if (!d?.licenseNumber && !d?.licenseExpiryDate) {
    return {
      status: "not_set",
      badge: "No DL Added",
      badgeClass: "bg-stone-100 text-stone-500 border-stone-200"
    };
  }
  if (!d?.licenseExpiryDate) {
    return {
      status: "valid",
      badge: d.licenseNumber || "DL Added",
      badgeClass: "bg-stone-100 text-stone-800 border-stone-300 font-mono"
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(d.licenseExpiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "expired",
      badge: `DL Expired (${Math.abs(diffDays)}d ago)`,
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300 font-black"
    };
  }
  if (diffDays <= 30) {
    return {
      status: "expiring_soon",
      badge: `DL in ${diffDays}d`,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold"
    };
  }
  return {
    status: "valid",
    badge: `DL Valid (${formatDateDisplay(d.licenseExpiryDate)})`,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
  };
};

export default function SimpleDirectoryPage({ kind }) {
  const vehicle = kind === "vehicles";
  const endpoint = vehicle ? "/vehicles" : "/drivers";
  const title = vehicle ? "Own Fleet Vehicles (अपनी गाड़ियाँ)" : "Drivers (ड्राइवर सूची)";

  const [rows, setRows] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [viewVehicle, setViewVehicle] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const blankVehicle = {
    vehicleNumber: "",
    vehicleType: "Tipper",
    driverId: "",
    make: "Tata Motors",
    model: "",
    payloadCapacity: 25,
    status: "active",
    chassisNumber: "",
    engineNumber: "",
    rcNumber: "",
    rcExpiryDate: "",
    insuranceCompany: "",
    insurancePolicyNumber: "",
    insuranceExpiryDate: "",
    fitnessNumber: "",
    fitnessExpiryDate: "",
    permitNumber: "",
    permitExpiryDate: "",
    pucNumber: "",
    pucExpiryDate: "",
    roadTaxExpiryDate: ""
  };

  const blankDriver = {
    name: "",
    phone: "",
    alternatePhone: "",
    assignedVehicleId: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    aadhaarNumber: "",
    address: "",
    dateOfJoining: "",
    monthlySalary: 15000,
    dailyAllowance: 250,
    status: "active"
  };

  const load = async () => {
    setLoading(true);
    try {
      const [r, v, d] = await Promise.all([
        api.get(endpoint),
        api.get("/vehicles"),
        api.get("/drivers")
      ]);
      setRows(
        (r.data?.data || []).filter(
          (x) => !vehicle || (x.ownerType !== "market" && x.ownership !== "market")
        )
      );
      setVehicles(
        (v.data?.data || []).filter(
          (x) => x.ownerType !== "market" && x.ownership !== "market"
        )
      );
      setDrivers(d.data?.data || []);
    } catch (e) {
      toast.error(`Could not load ${vehicle ? "vehicles" : "drivers"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [kind]);

  // Sync search input from URL parameters (?search=..., ?vehicle=..., ?driver=...)
  useEffect(() => {
    const handleUrlSearch = () => {
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        const q = sp.get("search") || sp.get("vehicle") || sp.get("driver");
        if (q !== null && q !== undefined) {
          setSearch(q);
        }
      }
    };
    handleUrlSearch();
    window.addEventListener("popstate", handleUrlSearch);
    window.addEventListener("searchchange", handleUrlSearch);
    return () => {
      window.removeEventListener("popstate", handleUrlSearch);
      window.removeEventListener("searchchange", handleUrlSearch);
    };
  }, [kind]);

  const open = (row) => {
    setEdit(row || null);
    if (row) {
      if (vehicle) {
        setForm({
          vehicleNumber: row.vehicleNumber || "",
          vehicleType: row.vehicleType || "Tipper",
          driverId: row.driverId?._id || row.driverId || "",
          make: row.make || "Tata Motors",
          model: row.model || "",
          payloadCapacity: row.payloadCapacity ?? 25,
          status: row.status || "active",
          chassisNumber: row.chassisNumber || "",
          engineNumber: row.engineNumber || "",
          rcNumber: row.rcNumber || "",
          rcExpiryDate: formatDateForInput(row.rcExpiryDate),
          insuranceCompany: row.insuranceCompany || "",
          insurancePolicyNumber: row.insurancePolicyNumber || "",
          insuranceExpiryDate: formatDateForInput(row.insuranceExpiryDate),
          fitnessNumber: row.fitnessNumber || "",
          fitnessExpiryDate: formatDateForInput(row.fitnessExpiryDate),
          permitNumber: row.permitNumber || "",
          permitExpiryDate: formatDateForInput(row.permitExpiryDate),
          pucNumber: row.pucNumber || "",
          pucExpiryDate: formatDateForInput(row.pucExpiryDate),
          roadTaxExpiryDate: formatDateForInput(row.roadTaxExpiryDate)
        });
      } else {
        setForm({
          name: row.name || "",
          phone: row.phone || "",
          alternatePhone: row.alternatePhone || "",
          assignedVehicleId: row.assignedVehicleId?._id || row.assignedVehicleId || "",
          licenseNumber: row.licenseNumber || "",
          licenseExpiryDate: formatDateForInput(row.licenseExpiryDate),
          aadhaarNumber: row.aadhaarNumber || "",
          address: row.address || "",
          dateOfJoining: formatDateForInput(row.dateOfJoining),
          monthlySalary: row.monthlySalary || 0,
          dailyAllowance: row.dailyAllowance || 0,
          status: row.status || "active"
        });
      }
    } else {
      setForm(vehicle ? blankVehicle : blankDriver);
    }
    setShow(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = vehicle
        ? {
            ...form,
            vehicleNumber: (form.vehicleNumber || "").trim().toUpperCase(),
            payloadCapacity: form.payloadCapacity ? Number(form.payloadCapacity) : 20,
            rcExpiryDate: form.rcExpiryDate || null,
            insuranceExpiryDate: form.insuranceExpiryDate || null,
            fitnessExpiryDate: form.fitnessExpiryDate || null,
            permitExpiryDate: form.permitExpiryDate || null,
            pucExpiryDate: form.pucExpiryDate || null,
            roadTaxExpiryDate: form.roadTaxExpiryDate || null,
            ownerType: "own",
            ownership: "own"
          }
        : {
            ...form,
            name: (form.name || "").trim(),
            phone: (form.phone || "").trim(),
            alternatePhone: (form.alternatePhone || "").trim(),
            assignedVehicleId: form.assignedVehicleId || null,
            licenseNumber: (form.licenseNumber || "").trim().toUpperCase() || undefined,
            licenseExpiryDate: form.licenseExpiryDate || null,
            aadhaarNumber: (form.aadhaarNumber || "").trim(),
            address: (form.address || "").trim(),
            dateOfJoining: form.dateOfJoining || null,
            monthlySalary: Math.round(Number(form.monthlySalary || 0)),
            dailyAllowance: Math.round(Number(form.dailyAllowance || 0)),
            status: form.status || "active"
          };

      if (edit) await api.put(`${endpoint}/${edit._id}`, payload);
      else await api.post(endpoint, payload);

      toast.success(`${vehicle ? "Vehicle" : "Driver"} saved successfully`);
      setShow(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save record");
    }
  };

  const remove = async (row) => {
    if (!confirm(`Are you sure you want to delete this ${vehicle ? "vehicle" : "driver"}?`))
      return;
    try {
      await api.delete(`${endpoint}/${row._id}`);
      toast.success("Record deleted");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete");
    }
  };

  const toggleStatus = async (row) => {
    try {
      await api.put(`${endpoint}/${row._id}`, {
        status: row.status === "active" ? "inactive" : "active"
      });
      toast.success("Status updated");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not update status");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (vehicle) {
        return (
          !q ||
          r.vehicleNumber?.toLowerCase().includes(q) ||
          r.vehicleType?.toLowerCase().includes(q) ||
          r.make?.toLowerCase().includes(q) ||
          r.model?.toLowerCase().includes(q) ||
          r.driverId?.name?.toLowerCase().includes(q)
        );
      }
      return (
        !q ||
        r.name?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.alternatePhone?.includes(q) ||
        r.licenseNumber?.toLowerCase().includes(q) ||
        r.assignedVehicleId?.vehicleNumber?.toLowerCase().includes(q)
      );
    });
  }, [rows, search, vehicle]);

  // Reset page when search or kind changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, kind]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Fleet & Driver compliance stats for top bar
  const complianceStats = useMemo(() => {
    let allValid = 0;
    let expiringSoon = 0;
    let expired = 0;
    let notSet = 0;

    rows.forEach((r) => {
      const c = vehicle ? getVehicleCompliance(r) : getDriverCompliance(r);
      if (c.status === "expired") expired++;
      else if (c.status === "expiring_soon") expiringSoon++;
      else if (c.status === "valid") allValid++;
      else notSet++;
    });

    return { allValid, expiringSoon, expired, notSet };
  }, [rows, vehicle]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-orange-800">
              {vehicle ? (
                <Truck size={13} className="text-orange-600" />
              ) : (
                <User size={13} className="text-orange-600" />
              )}
              {vehicle ? "100% Own Fleet Vehicles & Documents" : "Fleet Drivers & License Compliance"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500 font-medium">
            {vehicle
              ? "Track own tippers & trucks, assigned drivers, and RTO document expiries (RC, Insurance, Fitness, Permit, PUC)"
              : "Driver directory, phone numbers, DL license expiries, assigned vehicles, and salary/allowance details"}
          </p>
        </div>

        <button
          onClick={() => open(null)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition active:scale-95 self-start lg:self-auto"
        >
          <Plus size={16} />
          <span>Add New {vehicle ? "Vehicle (गाड़ी)" : "Driver (ड्राइवर)"}</span>
        </button>
      </div>

      {/* 2. STATS & COMPLIANCE OVERVIEW STRIP */}
      {vehicle && complianceStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Total Own Fleet
            </span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-stone-900">
              {rows.length} Trucks
            </p>
            <span className="text-xs text-stone-400">
              Active: {rows.filter((r) => r.status === "active").length}
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              All Papers Valid
            </span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-emerald-800">
              {complianceStats.allValid} Vehicles
            </p>
            <span className="text-xs text-emerald-700">All 6 documents valid</span>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <AlertTriangle size={13} className="text-amber-600" />
              Expiring Soon (30d)
            </span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-amber-800">
              {complianceStats.expiringSoon} Vehicles
            </p>
            <span className="text-xs text-amber-700">Due for renewal</span>
          </div>

          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
              <XCircle size={13} className="text-rose-600" />
              Expired Papers
            </span>
            <p className="mt-1 text-xl sm:text-2xl font-black text-rose-800">
              {complianceStats.expired} Vehicles
            </p>
            <span className="text-xs text-rose-700">Immediate action needed</span>
          </div>
        </div>
      ) : null}

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-100/70 p-2.5 rounded-2xl border border-stone-200">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-white border border-stone-200 px-3 py-1.5 text-xs font-black text-stone-900 shadow-2xs">
            Total {vehicle ? "Fleet:" : "Drivers:"} <b>{rows.length}</b>
          </span>
          <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-black text-emerald-800 shadow-2xs">
            Active: <b>{rows.filter((r) => r.status === "active").length}</b>
          </span>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder={`Search ${vehicle ? "truck number, make, model..." : "driver name, mobile, DL..."}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
          />
        </div>
      </div>

      {/* COMPLIANCE & EXPIRY ALERT STRIP */}
      {complianceStats && (complianceStats.expired > 0 || complianceStats.expiringSoon > 0) && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-4 border text-xs shadow-2xs ${
            complianceStats.expired > 0
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              size={18}
              className={complianceStats.expired > 0 ? "text-red-600 shrink-0" : "text-amber-600 shrink-0"}
            />
            <div>
              <p className="font-black text-sm">
                {vehicle ? (
                  complianceStats.expired > 0
                    ? `🚨 अलर्ट: ${complianceStats.expired} गाड़ी के RTO कागजात समाप्त (Expired) हो चुके हैं!`
                    : `⚠️ सूचना: ${complianceStats.expiringSoon} गाड़ी के RTO कागजात अगले 30 दिनों में समाप्त होने वाले हैं।`
                ) : (
                  complianceStats.expired > 0
                    ? `🚨 अलर्ट: ${complianceStats.expired} ड्राइवर का ड्राइविंग लाइसेंस समाप्त (Expired) है!`
                    : `⚠️ सूचना: ${complianceStats.expiringSoon} ड्राइवर का ड्राइविंग लाइसेंस 30 दिनों में समाप्त होने वाला है।`
                )}
              </p>
              <p className="text-[11px] opacity-85 mt-0.5">
                समय पर रिन्यूअल करवाएं ताकि पुलिस व RTO चेकिंग में भारी चालान या गाड़ी सीज होने से बचा जा सके।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-[11px] bg-white/80 border border-stone-200 px-2.5 py-1 rounded-lg">
              {vehicle ? "RTO Alerts" : "DL Alerts"} Active
            </span>
          </div>
        </div>
      )}

      {/* 4. DATA TABLE */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="table-scroll-container overflow-x-auto">
          {vehicle ? (
            /* Vehicles Table with RTO Documents & Expiry Column */
            <table className="w-full min-w-[1400px] text-left text-sm border-collapse">
              <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">Vehicle / Truck</th>
                  <th className="px-4 py-3.5 min-w-[150px] whitespace-nowrap">Type &amp; Capacity</th>
                  <th className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">Assigned Driver</th>
                  <th className="px-4 py-3.5 min-w-[280px] whitespace-nowrap">RTO Papers &amp; Expiry (दस्तावेज़)</th>
                  <th className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 min-w-[150px] whitespace-nowrap">P&amp;L Performance</th>
                  <th className="px-5 py-3.5 min-w-[140px] text-right whitespace-nowrap sticky right-0 bg-stone-50 border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <TableSkeletonRows
                    cols={7}
                    rows={6}
                    message="गाड़ियाँ व आरटीओ कागजात लोड हो रहे हैं... (Loading fleet vehicles...)"
                  />
                ) : (
                  paginatedRows.map((r) => {
                  const comp = getVehicleCompliance(r);
                  return (
                    <tr key={r._id} className="hover:bg-orange-50/30 transition group">
                      {/* Vehicle Number & Make */}
                      <td className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-stone-900 text-white font-black shrink-0">
                            <Truck size={16} />
                          </div>
                          <div>
                            <p className="font-black text-stone-900 tracking-tight font-mono text-sm">
                              {r.vehicleNumber}
                            </p>
                            <p className="text-[11px] font-bold text-stone-500 mt-0.5">
                              {r.make || "Tata Motors"} {r.model ? `• ${r.model}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Capacity */}
                      <td className="px-4 py-3.5 min-w-[150px] whitespace-nowrap">
                        <span className="inline-block rounded-lg bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-bold text-stone-700">
                          {r.vehicleType || "Tipper"}
                        </span>
                        <p className="text-[11px] text-stone-500 mt-1 font-semibold">
                          Cap: {r.payloadCapacity || 25} Ton
                        </p>
                      </td>

                      {/* Driver */}
                      <td className="px-4 py-3.5 min-w-[170px] whitespace-nowrap text-stone-700 font-medium">
                        {r.driverId?.name || (
                          <span className="text-stone-400 italic">Not Assigned</span>
                        )}
                        {r.driverId?.phone && (
                          <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                            {r.driverId.phone}
                          </p>
                        )}
                      </td>

                      {/* RTO Papers & Compliance */}
                      <td className="px-4 py-3.5 min-w-[280px] whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            type="button"
                            onClick={() => setViewVehicle(r)}
                            title="Click to view all RTO document details"
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] border hover:opacity-80 transition cursor-pointer font-bold ${comp.badgeClass}`}
                          >
                            {comp.status === "valid" && <ShieldCheck size={12} />}
                            {comp.status === "expiring_soon" && <AlertTriangle size={12} />}
                            {comp.status === "expired" && <XCircle size={12} />}
                            {comp.status === "not_set" && <Info size={12} />}
                            <span>{comp.badge}</span>
                          </button>

                          {/* Mini Document tags overview */}
                          <div className="flex items-center gap-1 flex-wrap text-[10px] text-stone-500 font-medium mt-0.5">
                            <span
                              title={`RC Expiry: ${formatDateDisplay(r.rcExpiryDate)}`}
                              className={
                                r.rcExpiryDate && new Date(r.rcExpiryDate) < new Date()
                                  ? "text-red-600 font-bold"
                                  : ""
                              }
                            >
                              RC: {r.rcExpiryDate ? formatDateDisplay(r.rcExpiryDate).slice(3) : "—"}
                            </span>
                            <span>•</span>
                            <span
                              title={`Insurance: ${formatDateDisplay(r.insuranceExpiryDate)}`}
                              className={
                                r.insuranceExpiryDate && new Date(r.insuranceExpiryDate) < new Date()
                                  ? "text-red-600 font-bold"
                                  : ""
                              }
                            >
                              Ins: {r.insuranceExpiryDate ? formatDateDisplay(r.insuranceExpiryDate).slice(3) : "—"}
                            </span>
                            <span>•</span>
                            <span
                              title={`Fitness: ${formatDateDisplay(r.fitnessExpiryDate)}`}
                              className={
                                r.fitnessExpiryDate && new Date(r.fitnessExpiryDate) < new Date()
                                  ? "text-red-600 font-bold"
                                  : ""
                              }
                            >
                              Fit: {r.fitnessExpiryDate ? formatDateDisplay(r.fitnessExpiryDate).slice(3) : "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(r)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black capitalize transition ${
                            r.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200"
                          }`}
                        >
                          {r.status === "active" ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {r.status}
                        </button>
                      </td>

                      {/* P&L Analysis */}
                      <td className="px-4 py-3.5 min-w-[150px] whitespace-nowrap">
                        <Link
                          href={`/dashboard?vehicle=${encodeURIComponent(r.vehicleNumber)}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                        >
                          <TrendingUp size={13} />
                          <span>View P&amp;L Card</span>
                        </Link>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 min-w-[140px] text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-[#fff9f4] backdrop-blur-xs border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 transition">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewVehicle(r)}
                            title="View Vehicle Documents & Papers"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => open(r)}
                            title="Edit Vehicle & Papers"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => remove(r)}
                            title="Delete Vehicle"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:border-red-300 hover:text-red-600 shadow-2xs transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loading && !filtered.length && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-stone-500">
                      No vehicles found. Click "+ Add New Vehicle" to add your first tipper/truck.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Drivers Table with License & Expiry Column */
            <table className="w-full min-w-[1350px] text-left text-sm border-collapse">
              <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">Driver Name</th>
                  <th className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">Mobile Number</th>
                  <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Assigned Vehicle</th>
                  <th className="px-4 py-3.5 min-w-[240px] whitespace-nowrap">Driving License &amp; Validity</th>
                  <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Salary &amp; Bhatta</th>
                  <th className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">Status</th>
                  <th className="px-5 py-3.5 min-w-[140px] text-right whitespace-nowrap sticky right-0 bg-stone-50 border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <TableSkeletonRows
                    cols={7}
                    rows={6}
                    message="ड्राइवर सूची लोड हो रही है... (Loading drivers...)"
                  />
                ) : (
                  paginatedRows.map((r) => {
                  const dlComp = getDriverCompliance(r);
                  return (
                    <tr key={r._id} className="hover:bg-orange-50/30 transition group">
                      {/* Driver Name & Joining */}
                      <td className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-orange-800 font-black text-xs shrink-0">
                            {r.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-black text-stone-900 block text-sm">{r.name}</span>
                            {r.address && (
                              <p className="text-[11px] text-stone-500 truncate max-w-[200px]" title={r.address}>
                                {r.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mobile Number & Alternate Phone */}
                      <td className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">
                        <p className="font-mono text-xs font-bold text-stone-800">
                          {r.phone ? (
                            <a href={`tel:${r.phone}`} className="hover:text-orange-600 hover:underline">
                              {r.phone}
                            </a>
                          ) : (
                            "—"
                          )}
                        </p>
                        {r.alternatePhone && (
                          <p className="text-[11px] text-stone-500 font-mono mt-0.5" title="Alternate Phone">
                            Alt: {r.alternatePhone}
                          </p>
                        )}
                      </td>

                      {/* Assigned Vehicle */}
                      <td className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">
                        {r.assignedVehicleId?.vehicleNumber ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 border border-stone-200 px-2.5 py-1 text-xs font-bold text-stone-800 font-mono">
                            <Truck size={12} className="text-stone-500" />
                            {r.assignedVehicleId.vehicleNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Not Assigned</span>
                        )}
                      </td>

                      {/* Driving License & Expiry */}
                      <td className="px-4 py-3.5 min-w-[240px] whitespace-nowrap">
                        {r.licenseNumber ? (
                          <div>
                            <span className="font-mono font-bold text-xs text-stone-900 block">
                              {r.licenseNumber}
                            </span>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] border mt-1 font-bold ${dlComp.badgeClass}`}
                            >
                              {dlComp.badge}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 italic">No DL Added</span>
                        )}
                      </td>

                      {/* Salary & Bhatta */}
                      <td className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">
                        <p className="font-bold text-stone-900 text-xs">
                          {formatINR(r.monthlySalary)} <span className="text-[10px] text-stone-400 font-normal">/ mo</span>
                        </p>
                        <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                          {formatINR(r.dailyAllowance)} <span className="text-[10px] text-emerald-600 font-normal">/ day</span>
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(r)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black capitalize transition ${
                            r.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200"
                          }`}
                        >
                          {r.status === "active" ? (
                            <CheckCircle2 size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {r.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 min-w-[140px] text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-[#fff9f4] backdrop-blur-xs border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 transition">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => open(r)}
                            title="Edit Driver"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => remove(r)}
                            title="Delete Driver"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:border-red-300 hover:text-red-600 shadow-2xs transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loading && !filtered.length && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-stone-500">
                      No drivers found. Click "+ Add New Driver" to add your first driver.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50]}
        />
      </div>

      {/* 5. ADD / EDIT MODAL */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <form
            onSubmit={save}
            className={`w-full ${vehicle ? "max-w-3xl" : "max-w-2xl"} max-h-[92vh] overflow-y-auto overflow-x-hidden min-w-0 rounded-3xl bg-white p-4 sm:p-7 shadow-2xl border border-stone-100`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                  {vehicle ? "Fleet & RTO Papers" : "Driver Profile & Compliance"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
                  {edit ? "Edit" : "Add"} {vehicle ? "Vehicle & Documents (गाड़ी व कागजात)" : "Driver (ड्राइवर विवरण)"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            {vehicle ? (
              <div className="space-y-6">
                {/* 1. Basic Vehicle Info */}
                <div>
                  <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-stone-100">
                    <Truck size={14} className="text-orange-500" />
                    <span>Truck Profile &amp; Driver (गाड़ी व ड्राइवर)</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Vehicle Registration Number */}
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Vehicle Number (गाड़ी नंबर) *
                      </label>
                      <input
                        required
                        placeholder="e.g. RJ14 GA 1234"
                        value={form.vehicleNumber || ""}
                        onChange={(e) =>
                          setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs font-mono"
                      />
                    </div>

                    {/* Vehicle Type */}
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Vehicle Type (प्रकार) *
                      </label>
                      <select
                        value={form.vehicleType || "Tipper"}
                        onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      >
                        {["Tipper", "Dumper", "Truck", "Lorry", "Trolley"].map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payload Capacity */}
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Payload Capacity (क्षमता Ton)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g. 25"
                        value={form.payloadCapacity ?? 25}
                        onChange={(e) =>
                          setForm({ ...form, payloadCapacity: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    {/* Default Assigned Driver */}
                    <div className="sm:col-span-2">
                      <SearchableDropdown
                        label="Default Assigned Driver (ड्राइवर)"
                        value={form.driverId || ""}
                        onChange={(val) => setForm((p) => ({ ...p, driverId: val }))}
                        options={drivers}
                        placeholder="-- Not Assigned / Select Driver --"
                        searchPlaceholder="Search driver by name or phone..."
                        getOptionLabel={(d) => d?.name}
                        getOptionSublabel={(d) => d?.phone}
                        getOptionValue={(d) => d?._id}
                        searchFields={(d) => [d?.name, d?.phone]}
                        icon={User}
                        allowClear
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Status (स्थिति)
                      </label>
                      <select
                        value={form.status || "active"}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      >
                        <option value="active">Active (चालू)</option>
                        <option value="inactive">Inactive (बंद)</option>
                      </select>
                    </div>

                    {/* Make / Manufacturer */}
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Make / Brand (निर्माता)
                      </label>
                      <input
                        placeholder="e.g. Tata Motors, Ashok Leyland"
                        value={form.make || ""}
                        onChange={(e) => setForm({ ...form, make: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    {/* Model */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Model / Variant (मॉडल)
                      </label>
                      <input
                        placeholder="e.g. Signa 2823.TK, LPK 2518"
                        value={form.model || ""}
                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. RTO Documents & Validity Dates */}
                <div className="rounded-2xl border border-orange-200/80 bg-orange-50/20 p-4 sm:p-5">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-orange-100">
                    <ShieldCheck size={18} className="text-orange-600" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase text-stone-900 tracking-wider">
                        RTO Documents &amp; Expiry Dates (दस्तावेज़ व एक्सपायरी)
                      </h3>
                      <p className="text-[11px] text-stone-500 font-medium">
                        वैधता तारीख दर्ज करें ताकि समय से पहले रिन्युअल का अलर्ट मिल सके
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* 1. RC */}
                    <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs">
                      <span className="block text-xs font-black text-stone-900 mb-2">
                        📄 1. Registration Certificate (RC)
                      </span>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            RC Number (आरसी नंबर)
                          </label>
                          <input
                            placeholder="e.g. RJ14GA9589"
                            value={form.rcNumber || ""}
                            onChange={(e) => setForm({ ...form, rcNumber: e.target.value.toUpperCase() })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            RC Expiry Date (आरसी एक्सपायरी)
                          </label>
                          <input
                            type="date"
                            value={form.rcExpiryDate || ""}
                            onChange={(e) => setForm({ ...form, rcExpiryDate: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Insurance */}
                    <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs">
                      <span className="block text-xs font-black text-stone-900 mb-2">
                        🛡️ 2. Vehicle Insurance (गाड़ी का बीमा)
                      </span>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                              Company (बीमा कंपनी)
                            </label>
                            <input
                              placeholder="e.g. Tata AIG"
                              value={form.insuranceCompany || ""}
                              onChange={(e) => setForm({ ...form, insuranceCompany: e.target.value })}
                              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                              Policy No. (पॉलिसी)
                            </label>
                            <input
                              placeholder="e.g. TAG-84920"
                              value={form.insurancePolicyNumber || ""}
                              onChange={(e) => setForm({ ...form, insurancePolicyNumber: e.target.value.toUpperCase() })}
                              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            Insurance Expiry Date (बीमा एक्सपायरी)
                          </label>
                          <input
                            type="date"
                            value={form.insuranceExpiryDate || ""}
                            onChange={(e) => setForm({ ...form, insuranceExpiryDate: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Fitness Certificate */}
                    <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs">
                      <span className="block text-xs font-black text-stone-900 mb-2">
                        🔧 3. Fitness Certificate (फिटनेस)
                      </span>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            Fitness No. (फिटनेस नंबर)
                          </label>
                          <input
                            placeholder="e.g. FIT-RJ14-9589"
                            value={form.fitnessNumber || ""}
                            onChange={(e) => setForm({ ...form, fitnessNumber: e.target.value.toUpperCase() })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            Fitness Expiry Date (फिटनेस एक्सपायरी)
                          </label>
                          <input
                            type="date"
                            value={form.fitnessExpiryDate || ""}
                            onChange={(e) => setForm({ ...form, fitnessExpiryDate: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Permit */}
                    <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs">
                      <span className="block text-xs font-black text-stone-900 mb-2">
                        📜 4. National / State Permit (परमिट)
                      </span>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            Permit No. (परमिट नंबर)
                          </label>
                          <input
                            placeholder="e.g. RAJ-PER-9589"
                            value={form.permitNumber || ""}
                            onChange={(e) => setForm({ ...form, permitNumber: e.target.value.toUpperCase() })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            Permit Expiry Date (परमिट एक्सपायरी)
                          </label>
                          <input
                            type="date"
                            value={form.permitExpiryDate || ""}
                            onChange={(e) => setForm({ ...form, permitExpiryDate: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 5. PUC */}
                    <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs">
                      <span className="block text-xs font-black text-stone-900 mb-2">
                        💨 5. PUC / Pollution (प्रदूषण प्रमाण पत्र)
                      </span>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            PUC No. (प्रदूषण नंबर)
                          </label>
                          <input
                            placeholder="e.g. PUC-95892"
                            value={form.pucNumber || ""}
                            onChange={(e) => setForm({ ...form, pucNumber: e.target.value.toUpperCase() })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            PUC Expiry Date (प्रदूषण एक्सपायरी)
                          </label>
                          <input
                            type="date"
                            value={form.pucExpiryDate || ""}
                            onChange={(e) => setForm({ ...form, pucExpiryDate: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 6. Road Tax */}
                    <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 shadow-2xs">
                      <span className="block text-xs font-black text-stone-900 mb-2">
                        🛣️ 6. Road Tax / Token Tax (रोड टैक्स)
                      </span>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-stone-500 mb-0.5">
                            Tax Paid Upto / Expiry (टैक्स वैधता तारीख)
                          </label>
                          <input
                            type="date"
                            value={form.roadTaxExpiryDate || ""}
                            onChange={(e) => setForm({ ...form, roadTaxExpiryDate: e.target.value })}
                            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">
                          Annual/Quarterly MV Tax expiry as per RTO slip
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Chassis & Engine Numbers (Optional) */}
                <div>
                  <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider mb-2 flex items-center gap-1.5 pb-2 border-b border-stone-100">
                    <FileText size={14} className="text-stone-400" />
                    <span>Chassis &amp; Engine Numbers (चेचिस व इंजन नंबर - Optional)</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">
                        Chassis Number (चेचिस नंबर)
                      </label>
                      <input
                        placeholder="e.g. MAT492019..."
                        value={form.chassisNumber || ""}
                        onChange={(e) =>
                          setForm({ ...form, chassisNumber: e.target.value.toUpperCase() })
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 font-mono shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">
                        Engine Number (इंजन नंबर)
                      </label>
                      <input
                        placeholder="e.g. 4SPTC84..."
                        value={form.engineNumber || ""}
                        onChange={(e) =>
                          setForm({ ...form, engineNumber: e.target.value.toUpperCase() })
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 font-mono shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Driver Form - Full Comprehensive Fields */
              <div className="space-y-5">
                {/* 1. Basic Driver Info */}
                <div>
                  <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-stone-100">
                    <User size={14} className="text-orange-500" />
                    <span>Driver Profile &amp; Contact (ड्राइवर प्रोफाइल)</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Driver Full Name (ड्राइवर का नाम) *
                      </label>
                      <input
                        required
                        placeholder="e.g. Mukesh Kumar"
                        value={form.name || ""}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Primary Mobile Number (मोबाइल नंबर) *
                      </label>
                      <input
                        required
                        placeholder="10-digit mobile"
                        value={form.phone || ""}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Alternate / Family Mobile (वैकल्पिक नंबर)
                      </label>
                      <input
                        placeholder="Family or secondary phone"
                        value={form.alternatePhone || ""}
                        onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <SearchableDropdown
                      label="Assigned Vehicle (गाड़ी)"
                      value={form.assignedVehicleId || ""}
                      onChange={(val) => setForm((p) => ({ ...p, assignedVehicleId: val }))}
                      options={vehicles}
                      placeholder="-- Not Assigned / Select Truck --"
                      searchPlaceholder="Search truck number (e.g. 2693, RJ14)..."
                      getOptionLabel={(v) => v?.vehicleNumber}
                      getOptionSublabel={(v) => v?.vehicleType}
                      getOptionValue={(v) => v?._id}
                      searchFields={(v) => [v?.vehicleNumber, v?.vehicleType]}
                      icon={Truck}
                      allowClear
                    />
                  </div>
                </div>

                {/* 2. License & ID Compliance */}
                <div className="rounded-2xl border border-orange-200/80 bg-orange-50/20 p-4">
                  <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-orange-100">
                    <ShieldCheck size={14} className="text-orange-600" />
                    <span>Driving License &amp; ID Proof (लाइसेंस व पहचान)</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Driving License No. (लाइसेंस नंबर)
                      </label>
                      <input
                        placeholder="e.g. RJ14 20180012345"
                        value={form.licenseNumber || ""}
                        onChange={(e) =>
                          setForm({ ...form, licenseNumber: e.target.value.toUpperCase() })
                        }
                        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:border-orange-500 font-mono shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        License Expiry Date (लाइसेंस एक्सपायरी)
                      </label>
                      <input
                        type="date"
                        value={form.licenseExpiryDate || ""}
                        onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Aadhaar Number (आधार कार्ड नंबर)
                      </label>
                      <input
                        placeholder="12-digit Aadhaar"
                        value={form.aadhaarNumber || ""}
                        onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Date of Joining (ज्वाइनिंग तारीख)
                      </label>
                      <input
                        type="date"
                        value={form.dateOfJoining || ""}
                        onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Salary & Address */}
                <div>
                  <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-stone-100">
                    <CreditCard size={14} className="text-stone-400" />
                    <span>Salary, Allowance &amp; Address (वेतन व पता)</span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Monthly Salary (मासिक वेतन ₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={form.monthlySalary ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, monthlySalary: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Daily Bhatta (दैनिक भत्ता ₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={form.dailyAllowance ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, dailyAllowance: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Status (स्थिति)
                      </label>
                      <select
                        value={form.status || "active"}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      >
                        <option value="active">Active (चालू)</option>
                        <option value="inactive">Inactive (बंद)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                        Home / Village Address (स्थायी या स्थानीय पता)
                      </label>
                      <input
                        placeholder="e.g. Village Chaksu, Sanganer, Jaipur"
                        value={form.address || ""}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition active:scale-95"
              >
                Save Record (सेव करें)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. VIEW VEHICLE PAPERS POPUP MODAL */}
      {viewVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0 rounded-3xl bg-white p-4 sm:p-7 shadow-2xl border border-stone-100">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-900 text-white font-black shrink-0">
                  <Truck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-mono tracking-tight">
                      {viewVehicle.vehicleNumber}
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 uppercase">
                      {viewVehicle.vehicleType}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 font-medium">
                    {viewVehicle.make || "Tata Motors"} {viewVehicle.model ? `• ${viewVehicle.model}` : ""}{" "}
                    {viewVehicle.payloadCapacity ? `• ${viewVehicle.payloadCapacity} Ton Capacity` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewVehicle(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Document Cards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-stone-700 tracking-wider">
                  RTO Documents &amp; Validity Status (कागजात विवरण)
                </span>
                <span className="text-[11px] font-bold text-stone-500">
                  Driver: {viewVehicle.driverId?.name || "Not Assigned"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {getVehicleCompliance(viewVehicle).allDocs.map((doc) => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const exp = doc.date ? new Date(doc.date) : null;
                  let statusText = "Not Provided (विवरण दर्ज नहीं)";
                  let badgeColor = "bg-stone-100 text-stone-600 border-stone-200";

                  if (exp) {
                    exp.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                      statusText = `Expired ${Math.abs(diffDays)} days ago!`;
                      badgeColor = "bg-rose-100 text-rose-800 border-rose-300 font-black";
                    } else if (diffDays <= 30) {
                      statusText = `Expiring soon in ${diffDays} days!`;
                      badgeColor = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                    } else {
                      statusText = `Valid (${diffDays} days remaining)`;
                      badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
                    }
                  }

                  return (
                    <div
                      key={doc.key}
                      className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4 shadow-2xs hover:bg-white transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-stone-900">{doc.label}</span>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] border ${badgeColor}`}
                        >
                          {statusText}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold uppercase block">
                            Document / Policy No.
                          </span>
                          <span className="font-mono font-bold text-stone-800 truncate block">
                            {doc.no || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 font-bold uppercase block">
                            Expiry Date
                          </span>
                          <span className="font-bold text-stone-900 flex items-center gap-1">
                            <Calendar size={12} className="text-orange-500 shrink-0" />
                            {formatDateDisplay(doc.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chassis & Engine */}
              {(viewVehicle.chassisNumber || viewVehicle.engineNumber) && (
                <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3.5 text-xs grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">
                      Chassis Number
                    </span>
                    <span className="font-mono font-bold text-stone-800">
                      {viewVehicle.chassisNumber || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">
                      Engine Number
                    </span>
                    <span className="font-mono font-bold text-stone-800">
                      {viewVehicle.engineNumber || "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setViewVehicle(null)}
                className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewVehicle;
                  setViewVehicle(null);
                  open(target);
                }}
                className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition inline-flex items-center gap-1.5"
              >
                <Pencil size={13} />
                <span>Edit Vehicle &amp; Papers</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
