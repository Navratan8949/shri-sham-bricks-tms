"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  Search,
  Download,
  Trash2,
  Pencil,
  X,
  ClipboardList,
  Calendar,
  Truck,
  User,
  MapPin,
  Package,
  IndianRupee,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import api from "@/src/services/api";
import { formatINR, dateInput, localDateString } from "@/src/lib/simpleFormat";
import { toast } from "sonner";
import Pagination from "./Pagination";
import SearchableDropdown from "./SearchableDropdown";
import TableSkeletonRows from "./TableSkeletonRows";

const blank = {
  orderDate: dateInput(),
  customerId: "",
  materialId: "",
  quantity: "",
  rate: "",
  gstRate: 5,
  loadingSite: "Quarry / Kiln Yard",
  unloadingSite: "",
  vehicleId: "",
  driverId: "",
  advanceReceived: 0,
  paymentMode: "cash",
  paymentReference: "",
  remarks: "",
};

export default function SimpleOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Quick Payment collection state
  const [payOrder, setPayOrder] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const openQuickPay = (o) => {
    setPayOrder(o);
    setPayAmount(String(Math.round(o.balanceDue || 0)));
    setPayMode(o.paymentMode || "cash");
    setPayRef("");
  };

  const submitQuickPayment = async () => {
    if (!payOrder || !Number(payAmount) || Number(payAmount) <= 0) return;
    const amt = Math.round(Number(payAmount));
    const due = Math.round(Number(payOrder.balanceDue || 0));
    if (amt > due) {
      return toast.error(
        `भुगतान राशि कुल बकाये (${formatINR(due)}) से अधिक नहीं हो सकती`,
      );
    }
    setPayLoading(true);
    try {
      const newTotalReceived =
        Math.round(Number(payOrder.advanceReceived || 0)) + amt;
      await api.put(`/supply-orders/${payOrder._id}`, {
        advanceReceived: newTotalReceived,
        paymentMode: payMode,
        paymentReference: payRef,
      });
      toast.success("Payment recorded successfully!");
      setPayOrder(null);
      setPayAmount("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not record payment");
    } finally {
      setPayLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [o, c, m, v, d] = await Promise.all([
        api.get("/supply-orders"),
        api.get("/customers"),
        api.get("/materials"),
        api.get("/vehicles"),
        api.get("/drivers"),
      ]);
      setOrders(o.data?.data || []);
      setCustomers(c.data?.data || []);
      setMaterials(m.data?.data || []);
      setVehicles(
        (v.data?.data || []).filter(
          (x) => x.ownerType !== "market" && x.ownership !== "market",
        ),
      );
      setDrivers(d.data?.data || []);
    } catch (e) {
      toast.error(
        e.response?.data?.message || "Could not load supply register",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Sync search input and filters from URL parameters (?search=..., ?party=..., ?payment=...)
  useEffect(() => {
    const handleUrlSearch = () => {
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        const q = sp.get("search") || sp.get("party") || sp.get("customer");
        if (q !== null && q !== undefined) {
          setSearch(q);
        }
        const pay = sp.get("payment");
        if (pay) {
          setPaymentFilter(pay);
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
  }, []);

  const selectedMaterial = materials.find((x) => x._id === form.materialId);
  const taxable = Math.round(
    Number(form.quantity || 0) * Number(form.rate || 0),
  );
  const gst = Math.round((taxable * Number(form.gstRate || 0)) / 100);
  const total = taxable + gst;
  const balance = Math.max(
    0,
    total - Math.round(Number(form.advanceReceived || 0)),
  );

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const day = localDateString(o.orderDate);
      const matchesSearch =
        `${o.customerId?.name || ""} ${o.materialId?.name || ""} ${o.vehicleId?.vehicleNumber || ""} ${o.unloadingSite || ""} ${o.loadingSite || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesFrom = !fromDate || day >= fromDate;
      const matchesTo = !toDate || day <= toDate;
      const matchesPay =
        paymentFilter === "all" || o.paymentStatus === paymentFilter;
      return matchesSearch && matchesFrom && matchesTo && matchesPay;
    });
  }, [orders, search, fromDate, toDate, paymentFilter]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate, paymentFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Aggregate stats
  const totalTaxable = useMemo(
    () => filtered.reduce((s, o) => s + Number(o.taxableAmount || 0), 0),
    [filtered],
  );
  const totalGST = useMemo(
    () => filtered.reduce((s, o) => s + Number(o.gstAmount || 0), 0),
    [filtered],
  );
  const totalGrand = useMemo(
    () => filtered.reduce((s, o) => s + Number(o.grandTotal || 0), 0),
    [filtered],
  );
  const totalBalanceDue = useMemo(
    () => filtered.reduce((s, o) => s + Number(o.balanceDue || 0), 0),
    [filtered],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setShow(true);
  };

  const openEdit = (o) => {
    setEditing(o);
    setForm({
      orderDate: o.orderDate?.slice(0, 10) || dateInput(),
      customerId: o.customerId?._id || "",
      materialId: o.materialId?._id || "",
      quantity: o.quantity,
      rate: Math.round(o.rate),
      gstRate: o.gstRate,
      loadingSite: o.loadingSite,
      unloadingSite: o.unloadingSite,
      vehicleId: o.vehicleId?._id || "",
      driverId: o.driverId?._id || "",
      advanceReceived: Math.round(o.advanceReceived || 0),
      paymentMode: o.paymentMode || "cash",
      paymentReference: o.paymentReference || "",
      remarks: o.remarks || "",
    });
    setShow(true);
  };

  const change = (k, v) => {
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === "vehicleId") {
        const found = vehicles.find((x) => x._id === v);
        next.driverId = found?.driverId?._id || found?.driverId || "";
      }
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (
      !form.customerId ||
      !form.materialId ||
      !form.vehicleId ||
      !form.unloadingSite.trim()
    ) {
      return toast.error(
        "Customer, material, own vehicle, and unloading site are required",
      );
    }
    if (Number(form.advanceReceived || 0) > total) {
      return toast.error(
        `प्राप्त राशि कुल बिल (${formatINR(total)}) से अधिक नहीं हो सकती`,
      );
    }
    try {
      const payload = { ...form, unit: selectedMaterial?.unit || "Ton" };
      if (editing) {
        await api.put(`/supply-orders/${editing._id}`, payload);
      } else {
        await api.post("/supply-orders", payload);
      }
      toast.success(
        editing
          ? "Customer order updated successfully"
          : "Customer order created successfully",
      );
      setShow(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save order");
    }
  };

  const remove = async (o) => {
    if (!confirm("Are you sure you want to delete this customer order?"))
      return;
    try {
      await api.delete(`/supply-orders/${o._id}`);
      toast.success("Customer order deleted");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete order");
    }
  };

  const exportExcel = () => {
    const modeLabel = (m) => {
      if (m === "online") return "Online / UPI";
      if (m === "bank") return "Bank Transfer";
      if (m === "cheque") return "Cheque";
      return "Cash";
    };
    const rows = filtered.map((o) => ({
      Date: new Date(o.orderDate).toLocaleDateString("en-IN"),
      Customer: o.customerId?.name,
      Material: o.materialId?.name,
      Quantity: o.quantity,
      Unit: o.unit,
      "Rate (₹)": Math.round(o.rate || 0),
      "Taxable (₹)": Math.round(o.taxableAmount || 0),
      "GST %": `${o.gstRate}%`,
      "GST Amount (₹)": Math.round(o.gstAmount || 0),
      "Grand Total (₹)": Math.round(o.grandTotal || 0),
      "Loading Site": o.loadingSite,
      "Unloading Site": o.unloadingSite,
      Vehicle: o.vehicleId?.vehicleNumber,
      Driver: o.driverId?.name || "—",
      "Advance (₹)": Math.round(o.advanceReceived || 0),
      "Balance Due (₹)": Math.round(o.balanceDue || 0),
      "Payment Status": o.paymentStatus?.toUpperCase(),
      "Payment Method":
        Number(o.advanceReceived || 0) > 0 ? modeLabel(o.paymentMode) : "—",
      "Payment Reference": o.paymentReference || "—",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows),
      "Customer Orders",
    );
    XLSX.writeFile(
      wb,
      `Shri-Shyam-Customer-Orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & SUMMARY STRIP */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-orange-800">
              <ClipboardList size={13} className="text-orange-600" />
              Customer Orders &amp; Delivery Register
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Customer Orders (ग्राहक आर्डर)
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500 font-medium">
            Direct material loading, site unloading, auto GST calculation &amp;
            vehicle assignment
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-50 transition shadow-2xs active:scale-95"
          >
            <Download size={16} />
            <span>Export Excel</span>
          </button>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition active:scale-95"
          >
            <Plus size={16} />
            <span>+ New Customer Order</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Total Orders
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-stone-900">
            {filtered.length}
          </p>
          <span className="text-xs text-stone-400">Recorded Dispatches</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Taxable Sales
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-amber-700">
            {formatINR(totalTaxable)}
          </p>
          <span className="text-xs text-stone-400">Excluding GST</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            GST Collected
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-indigo-700">
            {formatINR(totalGST)}
          </p>
          <span className="text-xs text-stone-400">5% / 12% Goods Tax</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Balance Due
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-rose-600">
            {formatINR(totalBalanceDue)}
          </p>
          <span className="text-xs text-stone-400">Pending from Clients</span>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-100/70 p-2.5 rounded-2xl border border-stone-200">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            placeholder="Search party, material, vehicle, site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Status Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 outline-none shadow-2xs"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid (चुका दिया)</option>
            <option value="partial">Partial (आंशिक)</option>
            <option value="pending">Pending (बाकी)</option>
          </select>

          {/* Date range inputs */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs shadow-2xs">
            <Calendar size={13} className="text-stone-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent font-semibold text-stone-800 outline-none text-xs"
            />
            <span className="text-stone-300 font-bold">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent font-semibold text-stone-800 outline-none text-xs"
            />
          </div>

          <button
            onClick={load}
            title="Refresh"
            className="grid h-8 w-8 place-items-center rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-orange-600 shadow-2xs transition"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin text-orange-600" : ""}
            />
          </button>
        </div>
      </div>

      {/* Scroll Hint Banner */}
      <div className="flex items-center justify-between px-2 text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-stone-500">
          <span className="text-orange-600 font-bold text-sm">↔</span>
          <span>
            पूरी जानकारी देखने के लिए टेबल को स्क्रॉल करें (Horizontal Scroll)
          </span>
        </span>
        <span className="text-[11px] font-medium text-stone-400 hidden sm:inline">
          ⚡ Actions (Collect / Edit / Delete) दाईं ओर हमेशा दिखेंगे (Sticky)
        </span>
      </div>

      {/* 4. ORDERS DATA TABLE */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="table-scroll-container overflow-x-auto">
          <table className="w-full min-w-[1550px] text-left text-sm border-collapse">
            <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">
                  Date &amp; Party
                </th>
                <th className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">
                  Material &amp; Quantity
                </th>
                <th className="px-4 py-3.5 min-w-[140px] whitespace-nowrap">
                  Rate &amp; Taxable
                </th>
                <th className="px-4 py-3.5 min-w-[110px] whitespace-nowrap">
                  GST
                </th>
                <th className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">
                  Grand Total
                </th>
                <th className="px-4 py-3.5 min-w-[280px]">
                  Loading ➔ Unloading Site
                </th>
                <th className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">
                  Vehicle / Driver
                </th>
                <th className="px-4 py-3.5 min-w-[190px] whitespace-nowrap">
                  Payment
                </th>
                <th className="px-5 py-3.5 min-w-[150px] text-right whitespace-nowrap sticky right-0 bg-stone-50 border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <TableSkeletonRows
                  cols={9}
                  rows={6}
                  message="ग्राहक आर्डर्स लोड हो रहे हैं... (Loading customer orders...)"
                />
              ) : (
                paginatedOrders.map((o) => {
                  const isPaid = o.paymentStatus === "paid";
                  const isPartial = o.paymentStatus === "partial";
                  return (
                    <tr
                      key={o._id}
                      className="hover:bg-orange-50/30 transition group"
                    >
                      {/* Date & Customer */}
                      <td className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">
                        <p className="font-black text-stone-900 text-sm">
                          {o.customerId?.name || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                          <span>
                            {new Date(o.orderDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {o.customerId?.phone && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-stone-500 font-mono font-bold">
                                {o.customerId.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Material & Qty */}
                      <td className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200/70 px-2.5 py-1 text-xs font-bold text-orange-900">
                          <Package
                            size={12}
                            className="text-orange-600 shrink-0"
                          />
                          {o.materialId?.name || "Material"}
                        </span>
                        <p className="mt-1 text-xs font-black text-stone-900">
                          {Number(o.quantity).toLocaleString("en-IN")} {o.unit}
                        </p>
                      </td>

                      {/* Rate & Taxable */}
                      <td className="px-4 py-3.5 min-w-[140px] whitespace-nowrap">
                        <p className="font-bold text-stone-900">
                          {formatINR(o.taxableAmount)}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          @ ₹{Number(o.rate).toLocaleString("en-IN")} / {o.unit}
                        </p>
                      </td>

                      {/* GST */}
                      <td className="px-4 py-3.5 min-w-[110px] whitespace-nowrap">
                        <span className="inline-block rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-black text-indigo-700">
                          {o.gstRate}% GST
                        </span>
                        <p className="text-xs font-bold text-indigo-900 mt-1">
                          {formatINR(o.gstAmount)}
                        </p>
                      </td>

                      {/* Grand Total */}
                      <td className="px-4 py-3.5 min-w-[130px] whitespace-nowrap font-black text-stone-900 text-sm">
                        {formatINR(o.grandTotal)}
                      </td>

                      {/* Loading & Unloading */}
                      <td className="px-4 py-3.5 min-w-[280px]">
                        <div className="flex items-start gap-1.5 text-xs text-stone-800">
                          <MapPin
                            size={13}
                            className="text-orange-500 shrink-0 mt-0.5"
                          />
                          <span className="font-medium leading-snug">
                            {o.unloadingSite || "Site not specified"}
                          </span>
                        </div>
                        {o.loadingSite && (
                          <p className="text-[11px] text-stone-500 mt-1 pl-4 leading-tight">
                            <span className="text-stone-400 font-semibold">
                              From:
                            </span>{" "}
                            {o.loadingSite}
                          </p>
                        )}
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Truck
                            size={13}
                            className="text-stone-500 shrink-0"
                          />
                          <span className="font-bold text-stone-900 text-xs font-mono">
                            {o.vehicleId?.vehicleNumber || "—"}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                          {o.driverId?.name || "No Driver"}
                        </p>
                      </td>

                      {/* Payment Status & Method */}
                      <td className="px-4 py-3.5 min-w-[190px] whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                isPaid
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isPartial
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isPaid && <CheckCircle2 size={10} />}
                              {isPartial && <Clock size={10} />}
                              {!isPaid && !isPartial && (
                                <AlertCircle size={10} />
                              )}
                              {o.paymentStatus}
                            </span>
                            {Number(o.advanceReceived || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 border border-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                                {o.paymentMode === "online"
                                  ? "📱 UPI"
                                  : o.paymentMode === "bank"
                                    ? "🏦 Bank"
                                    : o.paymentMode === "cheque"
                                      ? "📝 Cheque"
                                      : "💵 Cash"}
                              </span>
                            )}
                          </div>
                          {o.paymentReference && (
                            <span
                              className="text-[10px] text-stone-500 font-mono truncate max-w-[160px]"
                              title={o.paymentReference}
                            >
                              Ref: {o.paymentReference}
                            </span>
                          )}
                          {Number(o.balanceDue) > 0 ? (
                            <button
                              type="button"
                              onClick={() => openQuickPay(o)}
                              title="Click to record payment (भुगतान दर्ज करें)"
                              className="text-[11px] text-rose-600 font-bold hover:underline hover:text-rose-700 block text-left"
                            >
                              Due: {formatINR(o.balanceDue)}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">
                              Fully Settled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions - Sticky Right Column */}
                      <td className="px-5 py-3.5 min-w-[150px] text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-[#fff9f4] backdrop-blur-xs border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 transition">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => openQuickPay(o)}
                              title="Collect Payment (भुगतान दर्ज करें)"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-100 shadow-2xs transition"
                            >
                              <IndianRupee size={12} />
                              <span>Collect</span>
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(o)}
                            title="Edit Customer Order"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => remove(o)}
                            title="Delete"
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
                  <td colSpan="9" className="py-14 text-center">
                    <ClipboardList
                      size={36}
                      className="mx-auto text-stone-300 mb-2"
                    />
                    <p className="font-bold text-stone-700 text-sm">
                      No Customer Orders Found
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Click "+ New Customer Order" to record your first client
                      material order.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* 5. CUSTOMER ORDER CREATE / EDIT MODAL */}
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <form
            onSubmit={save}
            className="max-h-[94vh] w-full max-w-3xl overflow-y-auto overflow-x-hidden min-w-0 rounded-3xl bg-white p-4 sm:p-7 shadow-2xl border border-stone-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                  Direct Material Dispatch Book
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
                  {editing
                    ? "Edit Customer Order (ग्राहक आर्डर बदलें)"
                    : "New Customer Order (नया ग्राहक आर्डर)"}
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

            {/* Form Fields Structured Grid */}
            <div className="grid gap-3.5 sm:grid-cols-2 min-w-0">
              {/* Order Date */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Order Date (तारीख) *
                </label>
                <input
                  required
                  type="date"
                  value={form.orderDate}
                  onChange={(e) => change("orderDate", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Customer */}
              <SearchableDropdown
                label="Customer / Party (ग्राहक) *"
                required
                value={form.customerId}
                onChange={(val, c) => {
                  setForm((p) => ({
                    ...p,
                    customerId: val,
                    unloadingSite:
                      c?.siteAddress || c?.address || p.unloadingSite,
                  }));
                }}
                options={customers.filter((c) => c.status !== "inactive")}
                placeholder="-- Select Customer (ग्राहक चुनें) --"
                searchPlaceholder="Search by name, phone, site, city..."
                getOptionLabel={(c) => c?.name}
                getOptionSublabel={(c) =>
                  [c?.phone, c?.siteAddress || c?.address]
                    .filter(Boolean)
                    .join(" • ")
                }
                getOptionValue={(c) => c?._id}
                searchFields={(c) => [
                  c?.name,
                  c?.phone,
                  c?.siteAddress,
                  c?.address,
                ]}
                icon={User}
              />

              {/* Material */}
              <SearchableDropdown
                label="Material (सामग्री / माल) *"
                required
                value={form.materialId}
                onChange={(val, m) => {
                  setForm((p) => ({
                    ...p,
                    materialId: val,
                    rate: m?.defaultRate ? Math.round(m.defaultRate) : 0,
                    gstRate: m?.gstRate ?? 5,
                  }));
                }}
                options={materials.filter((m) => m.status !== "inactive")}
                placeholder="-- Select Material (माल चुनें) --"
                searchPlaceholder="Search material by name..."
                getOptionLabel={(m) => m?.name}
                getOptionSublabel={(m) =>
                  `${m?.unit || "Unit"} • Rate: ₹ ${m?.defaultRate || 0} • GST: ${m?.gstRate ?? 5}%`
                }
                getOptionValue={(m) => m?._id}
                searchFields={(m) => [m?.name, m?.unit]}
                icon={Package}
              />

              {/* Quantity */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Quantity ({selectedMaterial?.unit || "Ton / Pcs"}) *
                </label>
                <input
                  required
                  min="0.001"
                  step="0.001"
                  type="number"
                  placeholder="e.g. 35 Ton, 6000 Pcs"
                  value={form.quantity}
                  onChange={(e) => change("quantity", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Rate / Unit (₹ प्रति यूनिट) *
                </label>
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  placeholder="0"
                  value={form.rate}
                  onChange={(e) => change("rate", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* GST Rate */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  GST Rate (% दर)
                </label>
                <select
                  value={form.gstRate}
                  onChange={(e) => change("gstRate", Number(e.target.value))}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>
                    5% (Standard for Aggregates / Bricks)
                  </option>
                  <option value={12}>12% (Bricks with ITC)</option>
                  <option value={18}>18%</option>
                </select>
              </div>

              {/* Loading Site */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Loading Site (माल कहाँ से लोड हुआ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quarry / Plant / Kiln Yard"
                  value={form.loadingSite}
                  onChange={(e) => change("loadingSite", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Unloading Site */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Unloading Site (माल कहाँ खाली होगा) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Tonk Road Site / Client Location"
                  value={form.unloadingSite}
                  onChange={(e) => change("unloadingSite", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Own Vehicle */}
              <SearchableDropdown
                label="Own Vehicle (अपनी गाड़ी) *"
                required
                value={form.vehicleId}
                onChange={(val) => change("vehicleId", val)}
                options={vehicles.filter((v) => v.status === "active")}
                placeholder="-- Select Own Truck (गाड़ी नंबर चुनें) --"
                searchPlaceholder="Search truck number (e.g. 2693, RJ14)..."
                getOptionLabel={(v) => v?.vehicleNumber}
                getOptionSublabel={(v) =>
                  [
                    v?.vehicleType,
                    v?.driverId?.name ? `Driver: ${v.driverId.name}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")
                }
                getOptionValue={(v) => v?._id}
                searchFields={(v) => [
                  v?.vehicleNumber,
                  v?.vehicleType,
                  v?.driverId?.name,
                  v?.driverId?.phone,
                ]}
                icon={Truck}
              />

              {/* Driver */}
              <SearchableDropdown
                label="Driver (ड्राइवर)"
                value={form.driverId}
                onChange={(val) => change("driverId", val)}
                options={drivers.filter((d) => d.status === "active")}
                placeholder="-- Vehicle Default Driver (ड्राइवर चुनें) --"
                searchPlaceholder="Search driver by name or phone..."
                getOptionLabel={(d) => d?.name}
                getOptionSublabel={(d) => d?.phone}
                getOptionValue={(d) => d?._id}
                searchFields={(d) => [d?.name, d?.phone]}
                icon={User}
                allowClear
              />

              {/* Advance Received */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase text-stone-700">
                    Received Payment (प्राप्त राशि ₹)
                  </label>
                  {total > 0 && (
                    <button
                      type="button"
                      onClick={() => change("advanceReceived", total)}
                      className="text-[10px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-lg transition"
                    >
                      ✓ Settle Full Bill ({formatINR(total)})
                    </button>
                  )}
                </div>
                <input
                  min="0"
                  max={total > 0 ? total : undefined}
                  step="1"
                  type="number"
                  placeholder="0"
                  value={form.advanceReceived}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                    const num = Number(cleanVal);
                    if (total > 0 && num > total) {
                      change("advanceReceived", total);
                      toast.warning(
                        `प्राप्त राशि कुल बिल (${formatINR(total)}) से अधिक नहीं हो सकती`,
                      );
                    } else {
                      change("advanceReceived", cleanVal);
                    }
                  }}
                  className={`w-full rounded-xl border ${
                    total > 0 && Number(form.advanceReceived || 0) > total
                      ? "border-red-500 bg-red-50 text-red-900"
                      : "border-stone-200 bg-stone-50 text-stone-900"
                  } px-3.5 py-2.5 text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-orange-500 shadow-2xs`}
                />
                {total > 0 && Number(form.advanceReceived || 0) > total && (
                  <p className="text-[11px] font-bold text-red-600 mt-1">
                    * प्राप्त राशि कुल बिल ({formatINR(total)}) से अधिक नहीं हो
                    सकती!
                  </p>
                )}
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Payment Method (भुगतान माध्यम)
                </label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => change("paymentMode", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                >
                  <option value="cash">💵 Cash (नकद)</option>
                  <option value="online">
                    📱 Online / UPI (PhonePe, GPay, Paytm)
                  </option>
                  <option value="bank">🏦 Bank Transfer (NEFT / RTGS)</option>
                  <option value="cheque">📝 Cheque (चेक)</option>
                </select>
              </div>

              {/* Payment Reference */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Payment Reference / UTR (ट्रांजेक्शन / चेक नंबर)
                </label>
                <input
                  type="text"
                  placeholder={
                    form.paymentMode === "online"
                      ? "e.g. UPI Ref / UTR No."
                      : form.paymentMode === "bank"
                        ? "e.g. NEFT / RTGS Ref No."
                        : form.paymentMode === "cheque"
                          ? "e.g. Cheque No. & Bank Name"
                          : "Optional (e.g. Cash handed at site)"
                  }
                  value={form.paymentReference}
                  onChange={(e) => change("paymentReference", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Remarks / Notes (टिप्पणी)
                </label>
                <input
                  type="text"
                  placeholder="Any special dispatch notes..."
                  value={form.remarks}
                  onChange={(e) => change("remarks", e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    Taxable Amount
                  </span>
                  <span className="text-sm sm:text-base font-black text-stone-900">
                    {formatINR(taxable)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    GST ({form.gstRate}%)
                  </span>
                  <span className="text-sm sm:text-base font-black text-indigo-900">
                    {formatINR(gst)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block">
                    Grand Total
                  </span>
                  <span className="text-sm sm:text-base font-black text-orange-900">
                    {formatINR(total)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                    Balance Due (डिलीवरी बाद बकाया)
                  </span>
                  <span className="text-sm sm:text-base font-black text-rose-700">
                    {formatINR(balance)}
                  </span>
                </div>
              </div>
            </div>

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
                disabled={
                  total > 0 && Number(form.advanceReceived || 0) > total
                }
                className="rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editing
                  ? "Update Customer Order"
                  : "Save Customer Order (आर्डर सेव करें)"}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* 6. QUICK PAYMENT SETTLEMENT MODAL */}
      {payOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-stone-100">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                  Payment Collection (भुगतान रसीद)
                </span>
                <h3 className="text-lg font-black text-stone-900 tracking-tight mt-0.5">
                  {payOrder.customerId?.name || "Customer"}
                </h3>
                <p className="text-xs text-stone-500 font-medium font-mono">
                  {payOrder.soNumber}
                </p>
              </div>
              <button
                onClick={() => setPayOrder(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-center mb-4">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase block">
                  Grand Total
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900">
                  {formatINR(payOrder.grandTotal)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                  Received
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-700">
                  {formatINR(payOrder.advanceReceived)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase block">
                  Balance Due
                </span>
                <span className="text-xs sm:text-sm font-black text-rose-700">
                  {formatINR(payOrder.balanceDue)}
                </span>
              </div>
            </div>

            {/* Payment input & Mode fields */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Payment Received Now (अभी प्राप्त राशि ₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={Math.round(payOrder.balanceDue)}
                  step="1"
                  placeholder="0"
                  value={payAmount}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                    const maxDue = Math.round(Number(payOrder.balanceDue || 0));
                    if (Number(cleanVal) > maxDue) {
                      setPayAmount(String(maxDue));
                      toast.warning(
                        `अधिकतम बकाया राशि ₹ ${maxDue.toLocaleString("en-IN")} ही भरी जा सकती है`,
                      );
                    } else {
                      setPayAmount(cleanVal);
                    }
                  }}
                  className={`w-full rounded-xl border ${
                    Number(payAmount) > Number(payOrder.balanceDue)
                      ? "border-red-500 bg-red-50"
                      : "border-stone-200 bg-stone-50"
                  } px-3.5 py-2.5 text-base font-black text-stone-900 outline-none focus:bg-white focus:border-emerald-500 shadow-2xs`}
                />
                {Number(payAmount) > Number(payOrder.balanceDue) && (
                  <p className="text-[11px] font-bold text-red-600 mt-1">
                    * प्राप्त राशि कुल बकाये ({formatINR(payOrder.balanceDue)})
                    से अधिक नहीं हो सकती!
                  </p>
                )}
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Payment Method (भुगतान माध्यम) *
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-emerald-500 shadow-2xs"
                >
                  <option value="cash">💵 Cash (नकद)</option>
                  <option value="online">
                    📱 Online / UPI (PhonePe, GPay, Paytm)
                  </option>
                  <option value="bank">
                    🏦 Bank Transfer (NEFT / RTGS / IMPS)
                  </option>
                  <option value="cheque">📝 Cheque (चेक)</option>
                </select>
              </div>

              {/* Payment Reference */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Reference / UTR / Cheque No. (ट्रांजेक्शन / चेक नंबर)
                </label>
                <input
                  type="text"
                  placeholder={
                    payMode === "online"
                      ? "e.g. UPI Ref / UTR No. 402918237..."
                      : payMode === "bank"
                        ? "e.g. Bank Ref / IMPS / NEFT No."
                        : payMode === "cheque"
                          ? "e.g. Cheque No. & Bank Name"
                          : "Optional (e.g. Cash handed at site / Mohan driver)"
                  }
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setPayAmount(String(Math.round(payOrder.balanceDue)))
                }
                className="w-full text-center rounded-xl bg-emerald-50 border border-emerald-200 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100 transition"
              >
                ✓ Settle Full Balance (पूरा {formatINR(payOrder.balanceDue)}{" "}
                मिला)
              </button>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setPayOrder(null)}
                className="flex-1 rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  payLoading ||
                  !Number(payAmount) ||
                  Number(payAmount) <= 0 ||
                  Number(payAmount) > Number(payOrder.balanceDue)
                }
                onClick={submitQuickPayment}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50"
              >
                {payLoading ? "Saving..." : "Save Payment (जमा करें)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
