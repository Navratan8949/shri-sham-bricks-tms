"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "@/src/services/api";
import {
  IndianRupee,
  Package,
  ReceiptText,
  Fuel,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Truck,
  Plus,
  Calendar,
  Layers,
  Wrench,
  CircleDot,
  User,
  ExternalLink,
  X,
  CreditCard,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Send,
  ChevronRight,
  ShieldAlert,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { formatINR, localDateString } from "@/src/lib/simpleFormat";
import Pagination from "./Pagination";
import TableSkeletonRows from "./TableSkeletonRows";

const today = () => localDateString();
const monthStart = () => {
  const d = new Date();
  d.setDate(1);
  return localDateString(d);
};

export default function SimpleDashboard() {
  const [range, setRange] = useState("month");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [alertSummary, setAlertSummary] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, alertRes] = await Promise.allSettled([
        api.get("/simple-dashboard", { params: { fromDate: from, toDate: to } }),
        api.get("/alerts")
      ]);
      if (dashRes.status === "fulfilled") setData(dashRes.value.data?.data || null);
      if (alertRes.status === "fulfilled") setAlertSummary(alertRes.value.data?.data || null);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const sendDashboardAlertEmail = async () => {
    if (alertSummary?.smtpStatus && !alertSummary.smtpStatus.isConfigured) {
      toast.error(
        "Gmail SMTP is not configured yet. Please configure your Gmail ID in Settings & SMTP (/settings)."
      );
      return;
    }

    try {
      setEmailSending(true);
      const res = await api.post("/alerts/send-email", {
        recipientEmail: alertSummary?.smtpStatus?.smtpUser || "",
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Fleet audit email sent to Gmail!");
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message || "Could not send email. Please configure Gmail in Settings & SMTP (/settings)."
      );
    } finally {
      setEmailSending(false);
    }
  };

  useEffect(() => {
    load();
  }, [from, to]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const v = new URLSearchParams(window.location.search).get("vehicle");
      if (v) setVehicleSearch(v);
    }
  }, []);

  const setPreset = (v) => {
    const d = new Date();
    let start = new Date();
    if (v === "today") start = d;
    if (v === "week") {
      start.setDate(d.getDate() - 6);
    }
    if (v === "month") {
      start = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    setRange(v);
    setFrom(localDateString(start));
    setTo(today());
  };

  const k = data?.kpis || {};
  const catTotals = data?.categoryTotals || {};
  const totalExp = Number(k.totalExpenses || 0);
  const salesVal = Number(k.sales || 0);
  const profitVal = Number(k.netProfit || 0);
  const profitMargin = salesVal > 0 ? ((profitVal / salesVal) * 100).toFixed(1) : 0;

  // Filter vehicles by search
  const filteredVehicles = useMemo(() => {
    if (!data?.vehicles) return [];
    if (!vehicleSearch.trim()) return data.vehicles;
    const q = vehicleSearch.toLowerCase();
    return data.vehicles.filter(
      (v) =>
        v.vehicleNumber?.toLowerCase().includes(q) ||
        v.driverName?.toLowerCase().includes(q)
    );
  }, [data?.vehicles, vehicleSearch]);

  // Reset page on search or date range change
  useEffect(() => {
    setCurrentPage(1);
  }, [vehicleSearch, from, to]);

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage, pageSize]);

  const getPercent = (amount) => {
    if (!totalExp || totalExp <= 0) return 0;
    return Math.min(100, Math.round((Number(amount || 0) / totalExp) * 100));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & QUICK ACTION BAR */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-orange-800">
              <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
              Building Material &amp; Own Fleet Desk
            </span>
            <span className="text-xs text-stone-400 font-medium hidden sm:inline">•</span>
            <span className="text-xs font-semibold text-stone-500">
              Shri Shyam Bricks &amp; Building Materials
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Dashboard &amp; Profit / Loss
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500 font-medium">
            Real-time material supply revenue, tipper operating costs &amp; vehicle net profit
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition active:scale-95"
          >
            <Plus size={16} />
            <span>New Customer Order</span>
          </Link>

          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 transition active:scale-95"
          >
            <Fuel size={16} className="text-amber-600" />
            <span>Log Vehicle Kharcha</span>
          </Link>
        </div>
      </div>

      {/* 2. DATE FILTER & PRESET CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-100/70 p-2 sm:p-2.5 rounded-2xl border border-stone-200">
        {/* Preset Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
          {[
            ["today", "Today"],
            ["week", "This Week"],
            ["month", "This Month"],
            ["custom", "Custom"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPreset(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                range === key
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs shadow-2xs">
            <Calendar size={14} className="text-stone-400" />
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setRange("custom");
                setFrom(e.target.value);
              }}
              className="bg-transparent font-semibold text-stone-800 outline-none"
            />
            <span className="text-stone-300 font-bold">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setRange("custom");
                setTo(e.target.value);
              }}
              className="bg-transparent font-semibold text-stone-800 outline-none"
            />
          </div>

          <button
            onClick={load}
            title="Refresh Data"
            className="grid h-8 w-8 place-items-center rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-orange-600 hover:border-orange-200 transition shadow-2xs active:rotate-180 duration-300"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-orange-600" : ""} />
          </button>
        </div>
      </div>

      {/* FLEET COMPLIANCE ALERT BANNER (Matches Reference Image) */}
      {alertSummary && (alertSummary.criticalCount > 0 || alertSummary.warningCount > 0) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-[#fffbeb] p-3.5 sm:px-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white shrink-0 shadow-sm">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                  M.V. ACT RTO ALERT
                </span>
                <span className="text-xs font-black text-stone-900">
                  {(alertSummary.vehicleAlerts?.length || 0) + (alertSummary.driverAlerts?.length || 0)} Commercial Vehicle Document(s) &amp; Licenses Expiring / Expired!
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 font-medium">
                Statutory RC, Fitness, Permit, PUC or Insurance renewal required to prevent highway impounding &amp; penalties.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 justify-end w-full md:w-auto">
            <button
              type="button"
              onClick={sendDashboardAlertEmail}
              disabled={emailSending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {emailSending ? <RefreshCw size={13} className="animate-spin text-white" /> : <Mail size={13} />}
              <span>Send Alert Digest to Gmail</span>
            </button>
            <Link
              href="/vehicles"
              className="text-xs font-bold text-stone-700 hover:text-orange-600 hover:underline flex items-center gap-0.5"
            >
              <span>View Vehicles &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. CORE FINANCIAL KPIS (4 MAIN CARDS) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Taxable Sales */}
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Total Sales (Taxable)
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <IndianRupee size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {loading ? "..." : formatINR(salesVal)}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Gross Billed: <b>{formatINR(k.grossBilled || 0)}</b></span>
            <span className="text-amber-700 font-semibold">{k.totalDeliveries || 0} Deliveries</span>
          </div>
        </div>

        {/* Card 2: GST Collected */}
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              GST Collected
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ReceiptText size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            {loading ? "..." : formatINR(k.gst || 0)}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 pt-2.5">
            <span>GST Slab: <b>5% / 12% Goods</b></span>
            <span className="text-indigo-600 font-semibold">Government Tax</span>
          </div>
        </div>

        {/* Card 3: Vehicle Expenses */}
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Vehicle Expenses (गाड़ी खर्चा)
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <Fuel size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
            {loading ? "..." : formatINR(totalExp)}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 pt-2.5">
            <span>Diesel: <b>{formatINR(catTotals.fuel || 0)}</b></span>
            <span className="text-rose-600 font-semibold">{data?.vehicles?.length || 0} Trucks</span>
          </div>
        </div>

        {/* Card 4: Net Business Profit */}
        <div
          className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm hover:shadow-md transition ${
            profitVal >= 0
              ? "bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-200"
              : "bg-gradient-to-br from-red-50/80 via-white to-red-50/30 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Net Business Profit (शुद्ध लाभ)
            </span>
            <div
              className={`grid h-10 w-10 place-items-center rounded-2xl border ${
                profitVal >= 0
                  ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20"
                  : "bg-red-500 text-white border-red-400 shadow-md shadow-red-500/20"
              }`}
            >
              {profitVal >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <p
            className={`mt-3 text-2xl sm:text-3xl font-black tracking-tight ${
              profitVal >= 0 ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {loading ? "..." : formatINR(profitVal)}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs border-t border-stone-200/60 pt-2.5">
            <span className="font-semibold text-stone-600">
              Margin: <b className={profitVal >= 0 ? "text-emerald-700" : "text-red-600"}>{profitMargin}%</b>
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                profitVal >= 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {profitVal >= 0 ? "Profit" : "Loss"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. MATERIAL DISPATCH VOLUME STRIP */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-orange-600" />
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">
              Dispatched Materials Summary (कुल सप्लाई वॉल्यूम)
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-semibold">
            {Object.keys(k.volume || {}).length} Material Categories
          </span>
        </div>

        {Object.keys(k.volume || {}).length === 0 ? (
          <p className="text-xs text-stone-400 py-3">No material dispatches recorded in this date range.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(k.volume || {}).map(([name, qty]) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-2xl bg-stone-50 border border-stone-200/90 px-3.5 py-2 hover:border-orange-300 transition"
              >
                <CircleDot size={12} className="text-orange-500 shrink-0" />
                <span className="text-xs font-semibold text-stone-700">{name}:</span>
                <span className="text-xs font-black text-stone-900 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                  {Number(qty).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. EXPENSE BREAKDOWN CARDS (5 CATEGORIES) */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Fuel size={18} className="text-rose-600" />
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">
              Expense Category Breakdown (खर्चे का विभाजन)
            </h3>
          </div>
          <span className="text-xs font-bold text-stone-500">
            Total Logged: <b className="text-stone-900">{formatINR(totalExp)}</b>
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Diesel */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5">
            <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
              <span>⛽ Diesel / Fuel</span>
              <span>{getPercent(catTotals.fuel)}%</span>
            </div>
            <p className="mt-2 text-lg font-black text-stone-900">
              {formatINR(catTotals.fuel || 0)}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-amber-200/60 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${getPercent(catTotals.fuel)}%` }}
              />
            </div>
          </div>

          {/* Driver Bhatta */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
              <span>👤 Driver Bhatta</span>
              <span>{getPercent(catTotals.driver_kharcha)}%</span>
            </div>
            <p className="mt-2 text-lg font-black text-stone-900">
              {formatINR(catTotals.driver_kharcha || 0)}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-200/60 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${getPercent(catTotals.driver_kharcha)}%` }}
              />
            </div>
          </div>

          {/* Maintenance */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3.5">
            <div className="flex items-center justify-between text-xs text-blue-800 font-bold">
              <span>🔧 Maintenance</span>
              <span>{getPercent(catTotals.maintenance)}%</span>
            </div>
            <p className="mt-2 text-lg font-black text-stone-900">
              {formatINR(catTotals.maintenance || 0)}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-blue-200/60 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${getPercent(catTotals.maintenance)}%` }}
              />
            </div>
          </div>

          {/* Tyres */}
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-3.5">
            <div className="flex items-center justify-between text-xs text-purple-800 font-bold">
              <span>🛞 Tyres</span>
              <span>{getPercent(catTotals.tyre)}%</span>
            </div>
            <p className="mt-2 text-lg font-black text-stone-900">
              {formatINR(catTotals.tyre || 0)}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-purple-200/60 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${getPercent(catTotals.tyre)}%` }}
              />
            </div>
          </div>

          {/* Fastag / Other */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
            <div className="flex items-center justify-between text-xs text-stone-700 font-bold">
              <span>🏷️ Fastag &amp; Other</span>
              <span>{getPercent((catTotals.fastag || 0) + (catTotals.other || 0))}%</span>
            </div>
            <p className="mt-2 text-lg font-black text-stone-900">
              {formatINR((catTotals.fastag || 0) + (catTotals.other || 0))}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-stone-600 rounded-full"
                style={{ width: `${getPercent((catTotals.fastag || 0) + (catTotals.other || 0))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. VEHICLE-WISE P&L PERFORMANCE TABLE */}
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-stone-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Truck size={20} className="text-orange-600" />
              <h2 className="text-base font-black text-stone-900 uppercase tracking-wide">
                Vehicle-wise P&amp;L (हर गाड़ी का नफा-नुकसान)
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Net Profit = Supply Revenue (Taxable) − Total Vehicle Expenses
            </p>
          </div>

          {/* Search by truck number */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search truck number or driver..."
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs text-stone-900 outline-none focus:border-orange-500 w-64 shadow-2xs"
            />
            <span className="rounded-xl bg-orange-100 border border-orange-200 px-2.5 py-1 text-xs font-black text-orange-800">
              {filteredVehicles.length} Trucks
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-scroll-container overflow-x-auto">
          <table className="w-full min-w-[1300px] text-left text-sm border-collapse">
            <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5 min-w-[200px] whitespace-nowrap">Vehicle / Driver</th>
                <th className="px-4 py-3.5 min-w-[100px] text-center whitespace-nowrap">Deliveries</th>
                <th className="px-4 py-3.5 min-w-[140px] whitespace-nowrap">Revenue (Taxable)</th>
                <th className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">Fuel (Diesel)</th>
                <th className="px-4 py-3.5 min-w-[150px] whitespace-nowrap">Maintenance + Tyre</th>
                <th className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">Driver Bhatta</th>
                <th className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">Fastag &amp; Other</th>
                <th className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">Total Expenses</th>
                <th className="px-4 py-3.5 min-w-[140px] whitespace-nowrap">Net Profit</th>
                <th className="px-2 py-2.5 sm:px-5 sm:py-3.5 min-w-[75px] sm:min-w-[120px] text-right whitespace-nowrap sticky right-0 bg-stone-50 border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 text-[10px] sm:text-[11px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <TableSkeletonRows
                  cols={10}
                  rows={5}
                  message="फ्लीट P&L और गाड़ी मुनाफा डेटा लोड हो रहा है... (Calculating fleet P&L data...)"
                />
              ) : (
                paginatedVehicles.map((v) => {
                const isProfit = Number(v.netProfit || 0) >= 0;
                return (
                  <tr
                    key={v._id}
                    className="hover:bg-orange-50/40 transition group"
                  >
                    {/* Vehicle & Driver */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-900 text-white font-black text-xs shadow-xs">
                          <Truck size={16} />
                        </div>
                        <div>
                          <p className="font-black text-stone-900 tracking-tight text-sm">
                            {v.vehicleNumber}
                          </p>
                          <p className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                            <User size={12} className="text-stone-400" />
                            {v.driverName || "No Driver Assigned"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Deliveries Count */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-black text-stone-700">
                        {v.deliveries}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="px-4 py-3.5 font-bold text-stone-900">
                      {formatINR(v.revenue)}
                    </td>

                    {/* Fuel */}
                    <td className="px-4 py-3.5 text-stone-700 font-medium">
                      {formatINR(v.fuel)}
                    </td>

                    {/* Maintenance + Tyre */}
                    <td className="px-4 py-3.5 text-stone-700 font-medium">
                      {formatINR(Number(v.maintenance || 0) + Number(v.tyre || 0))}
                    </td>

                    {/* Driver Bhatta */}
                    <td className="px-4 py-3.5 text-stone-700 font-medium">
                      {formatINR(v.driverKharcha)}
                    </td>

                    {/* Fastag & Other */}
                    <td className="px-4 py-3.5 text-stone-500 font-medium">
                      {formatINR(Number(v.fastag || 0) + Number(v.other || 0))}
                    </td>

                    {/* Total Expenses */}
                    <td className="px-4 py-3.5 font-bold text-rose-600">
                      {formatINR(v.totalExpenses)}
                    </td>

                    {/* Net Profit */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black ${
                          isProfit
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {isProfit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {formatINR(v.netProfit)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-2 py-2.5 sm:px-5 sm:py-3.5 min-w-[75px] sm:min-w-[120px] text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-[#fff9f4] backdrop-blur-xs border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 transition">
                      <button
                        onClick={() => setSelectedVehicle(v)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-bold text-stone-700 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition"
                      >
                        <span>Details</span>
                        <ExternalLink size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}

            {!loading && !filteredVehicles.length && (
                <tr>
                  <td colSpan="10" className="px-5 py-14 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Truck size={36} className="mx-auto text-stone-300" />
                      <p className="font-bold text-stone-700 text-sm">No Vehicle Data Found</p>
                      <p className="text-xs text-stone-400">
                        No orders or expenses have been recorded for this date range.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vehicle P&L Pagination */}
        <Pagination
          totalItems={filteredVehicles.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
      </section>

      {/* 7. VEHICLE P&L DETAIL MODAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col min-w-0 rounded-3xl bg-white shadow-2xl border border-stone-100 overflow-hidden">
            {/* Modal Header - Fixed Top */}
            <div className="flex items-start justify-between border-b border-stone-100 px-5 sm:px-6 py-4.5 bg-white shrink-0">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-orange-600">
                  <Truck size={14} /> Individual Vehicle P&amp;L
                </span>
                <h2 className="mt-1 text-2xl font-black text-stone-900 tracking-tight">
                  {selectedVehicle.vehicleNumber}
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Driver: <b className="text-stone-800">{selectedVehicle.driverName || "Not Assigned"}</b>
                </p>
              </div>

              <button
                onClick={() => setSelectedVehicle(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body - Dedicated Scrollable Content with Clean Branded Scrollbar */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 px-5 sm:px-6 py-5 custom-scrollbar space-y-4">
              {/* Profit Banner */}
              <div
                className={`rounded-2xl p-4 border ${
                  Number(selectedVehicle.netProfit || 0) >= 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider">
                  Net Profit from this Vehicle
                </p>
                <p className="text-3xl font-black mt-1">
                  {formatINR(selectedVehicle.netProfit)}
                </p>
                <p className="text-xs mt-1 opacity-80">
                  Formula: Taxable Supply Revenue − (Fuel + Bhatta + Maintenance + Tyres + Fastag + Other)
                </p>
              </div>

              {/* Financial Details Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Deliveries (फेरे)</span>
                  <p className="text-base font-black text-stone-900 mt-1">{selectedVehicle.deliveries}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Revenue (Taxable)</span>
                  <p className="text-base font-black text-stone-900 mt-1">{formatINR(selectedVehicle.revenue)}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">GST on Deliveries</span>
                  <p className="text-base font-black text-indigo-700 mt-1">{formatINR(selectedVehicle.gst)}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Diesel / Fuel</span>
                  <p className="text-base font-black text-amber-700 mt-1">{formatINR(selectedVehicle.fuel)}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Driver Bhatta</span>
                  <p className="text-base font-black text-stone-800 mt-1">{formatINR(selectedVehicle.driverKharcha)}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Maintenance</span>
                  <p className="text-base font-black text-stone-800 mt-1">{formatINR(selectedVehicle.maintenance)}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Tyres</span>
                  <p className="text-base font-black text-stone-800 mt-1">{formatINR(selectedVehicle.tyre)}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Fastag / Toll</span>
                  <p className="text-base font-black text-stone-800 mt-1">{formatINR(selectedVehicle.fastag || 0)}</p>
                </div>

                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase">Other Expenses</span>
                  <p className="text-base font-black text-stone-800 mt-1">{formatINR(selectedVehicle.other)}</p>
                </div>

                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3">
                  <span className="text-[11px] font-bold text-rose-800 uppercase">Total Expenses</span>
                  <p className="text-base font-black text-rose-700 mt-1">{formatINR(selectedVehicle.totalExpenses)}</p>
                </div>
              </div>

              {/* Material Volume Dispatched by this vehicle */}
              <div className="rounded-2xl bg-stone-50 border border-stone-200 p-3.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase block mb-1.5">
                  Materials Delivered by this Truck:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(selectedVehicle.volume || {}).length === 0 ? (
                    <span className="text-xs text-stone-400">No dispatches logged</span>
                  ) : (
                    Object.entries(selectedVehicle.volume || {}).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 rounded-lg bg-white border border-stone-200 px-2 py-1 text-xs font-semibold text-stone-800"
                      >
                        {k}: <b>{Number(v).toLocaleString("en-IN")}</b>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions - Sticky Bottom Toolbar */}
            <div className="flex items-center justify-end border-t border-stone-100 bg-stone-50/90 backdrop-blur-xs px-5 sm:px-6 py-3.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="rounded-xl bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 transition shadow-2xs"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
