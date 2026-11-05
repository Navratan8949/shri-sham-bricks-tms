"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  RefreshCcw,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Truck,
  Fuel,
  Wrench,
  CircleDot,
  Landmark,
  ReceiptIndianRupee,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import api from "@/src/services/api";
import { getStoredUser, useActiveCompany } from "@/src/lib/auth";
import { exportToExcelProfessional } from "@/src/lib/excelExport";
import { toast } from "sonner";

export default function ProfitLossPage() {
  const user = getStoredUser();
  const activeCompany = useActiveCompany();

  // Date filters: Default to first & last day of current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(lastDayOfMonth);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("fleet"); // "fleet" | "vehicles"
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState("all");
  const [reportData, setReportData] = useState({
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      profitMargin: 0,
      status: "profit",
    },
    months: [],
    vehicleBreakdown: [],
  });
  const [expandedMonth, setExpandedMonth] = useState(null);

  const fetchProfitLoss = async (start = fromDate, end = toDate) => {
    setLoading(true);
    try {
      const params = {};
      if (start) params.fromDate = start;
      if (end) params.toDate = end;

      // Try dedicated endpoint with fallback
      const res = await api
        .get("/accounts/profit-loss", { params })
        .catch(() => api.get("/accounts/profit", { params }));

      if (res?.data?.success) {
        setReportData({
          summary: res.data.summary || {
            totalIncome: 0,
            totalExpense: 0,
            netProfit: 0,
            profitMargin: 0,
            status: "profit",
          },
          months: res.data.months || [],
          vehicleBreakdown: res.data.vehicleBreakdown || [],
        });
        if (res.data.months?.length > 0 && !expandedMonth) {
          setExpandedMonth(res.data.months[0].monthKey);
        }
      }
    } catch (err) {
      console.error("Fetch Profit & Loss error:", err);
      toast.error("Failed to load Profit & Loss report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, []);

  const handleFilter = (e) => {
    e?.preventDefault();
    fetchProfitLoss(fromDate, toDate);
  };

  // Quick Preset Filters
  const applyPreset = (preset) => {
    const now = new Date();
    let start = "";
    let end = "";

    if (preset === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    } else if (preset === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
    } else if (preset === "last_3_months") {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split("T")[0];
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    } else if (preset === "current_fy") {
      // Indian Financial Year: April 1 to March 31
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
      start = `${fyStartYear}-04-01`;
      end = `${fyStartYear + 1}-03-31`;
    } else if (preset === "all") {
      start = "";
      end = "";
    }

    setFromDate(start);
    setToDate(end);
    fetchProfitLoss(start, end);
  };

  // Export to Professional Excel
  const handleExportExcel = () => {
    if (activeTab === "vehicles") {
      const columns = [
        { key: "vehicleNumber", label: "Vehicle Number" },
        { key: "vehicleType", label: "Vehicle Type" },
        { key: "ownerType", label: "Ownership (Own/Market)" },
        { key: "totalTrips", label: "Total Trips Completed", type: "number" },
        { key: "grossRevenue", label: "Gross Freight Revenue (₹)", type: "number" },
        { key: "fuelCost", label: "Diesel / Fuel Cost (₹)", type: "number" },
        { key: "driverExpenses", label: "Driver Bata & Road Expenses (₹)", type: "number" },
        { key: "maintenanceCost", label: "Maintenance & Service (₹)", type: "number" },
        { key: "tyreCost", label: "Tyres Cost (₹)", type: "number" },
        { key: "vendorBillCost", label: "Market Vendor Bills (₹)", type: "number" },
        { key: "totalCost", label: "Total Operating Cost (₹)", type: "number" },
        { key: "netProfit", label: "Net Profit / Loss (₹)", type: "number" },
        { key: "profitMargin", label: "Profit Margin (%)", type: "number" },
      ];

      exportToExcelProfessional({
        title: "Per-Vehicle Profit & Loss Statement (प्रति गाड़ी लाभ व हानि)",
        subtitle: `${activeCompany?.name || "Shri Shyam Bricks"} • Individual Vehicle Fleet Financials`,
        filename: `${activeCompany?.code || "SSBC"}_Vehicle_Wise_Profit_Loss`,
        sheetName: "VEHICLE P&L",
        columns,
        rows: reportData.vehicleBreakdown || [],
      });
      return;
    }

    const columns = [
      { key: "month", label: "Month" },
      { key: "income", label: "Income (₹)", type: "number" },
      { key: "expense", label: "Expense (₹)", type: "number" },
      { key: "profit", label: "Net Profit / Loss (₹)", type: "number" },
      { key: "fuel", label: "Diesel / Fuel Expense (₹)", type: "number" },
      { key: "driverBata", label: "Driver Allowance & Expenses (₹)", type: "number" },
      { key: "maintenance", label: "Workshop Maintenance (₹)", type: "number" },
      { key: "tyres", label: "Tyre Expenses (₹)", type: "number" },
      { key: "marketLorry", label: "Market Lorry Hires (₹)", type: "number" },
      { key: "loanEmi", label: "Vehicle Loan EMIs (₹)", type: "number" },
    ];

    const dataRows = reportData.months.map((m) => ({
      month: m.month,
      income: Number(m.income || 0),
      expense: Number(m.expense || 0),
      profit: Number(m.profit || 0),
      fuel: Number(m.expenseBreakdown?.diesel || 0),
      driverBata: Number(m.expenseBreakdown?.driverExpenses || 0),
      maintenance: Number(m.expenseBreakdown?.maintenance || 0),
      tyres: Number(m.expenseBreakdown?.tyres || 0),
      marketLorry: Number(m.expenseBreakdown?.marketLorry || 0),
      loanEmi: Number(m.expenseBreakdown?.loanEmi || 0),
    }));

    exportToExcelProfessional({
      title: "Profit & Loss Statement (P&L Report)",
      subtitle: `${activeCompany?.name || "Shri Shyam Bricks"} • Consolidated Operating Financials`,
      filename: `${activeCompany?.code || "TMS"}_Profit_And_Loss_Statement`,
      sheetName: "PROFIT & LOSS",
      columns,
      rows: dataRows,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const isNetPositive = reportData.summary.netProfit >= 0;

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-amber-600 transition">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900">Profit & Loss Report</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2.5">
            Profit & Loss Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consolidated business statement · Shipper freight billing vs fleet operating expenses & net margins.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer"
            title="Download Excel Spreadsheet"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-950 transition cursor-pointer"
            title="Print P&L Statement"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            Print Statement
          </button>
          <button
            onClick={() => fetchProfitLoss()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            title="Refresh Financial Data"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Primary Tab Switcher: Fleet Consolidated vs Every Vehicle P&L */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("fleet")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === "fleet"
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Total Vehicles Fleet P&L (कुल फ्लीट लाभ व हानि)</span>
          <span className="rounded-full bg-slate-700 text-white px-2 py-0.5 text-[10px]">
            {reportData.months.length} Months
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vehicles")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
            activeTab === "vehicles"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Truck className="h-4 w-4 stroke-[2.5]" />
          <span>Every Vehicle P&L (प्रति गाड़ी लाभ व हानि)</span>
          <span className="rounded-full bg-amber-200 text-amber-950 px-2 py-0.5 text-[10px] font-black">
            {reportData.vehicleBreakdown?.length || 0} Trucks
          </span>
        </button>
      </div>

      {/* 2. Main Profit & Loss Summary Card (Strictly Matching User's Screenshot Structure) */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Card Header & Live KPI Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 px-6 py-5 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === "fleet" ? "Fleet Profit & Loss Summary" : "Vehicle Fleet Profit & Loss"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === "fleet"
                ? "Net consolidated balance across all active transport dispatches, fuel, and fleet expenses."
                : "Individual truck profitability breakdown · Freight revenue vs Diesel, Driver, Repairs & Tyres."}
            </p>
          </div>

          {/* Top Right Badges (Strictly matching Image 2 with vibrant professional styling) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Income Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm shadow-emerald-600/20">
              <ArrowUpRight className="h-4 w-4 stroke-[3]" />
              <span>Income: ₹{Number(reportData.summary.totalIncome || 0).toLocaleString("en-IN")}</span>
            </div>

            {/* Expense Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-sm shadow-rose-600/20">
              <ArrowDownRight className="h-4 w-4 stroke-[3]" />
              <span>Expense: ₹{Number(reportData.summary.totalExpense || 0).toLocaleString("en-IN")}</span>
            </div>

            {/* Net Profit / Loss Badge */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white shadow-sm ${
                isNetPositive
                  ? "bg-slate-950 shadow-slate-950/20"
                  : "bg-red-700 shadow-red-700/20"
              }`}
            >
              <TrendingUp className="h-4 w-4 stroke-[3]" />
              <span>
                {isNetPositive ? "Net Profit:" : "Net Loss:"} ₹
                {Number(reportData.summary.netProfit || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="border-b border-slate-100 p-6 bg-white print:hidden">
          <form onSubmit={handleFilter} className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition"
                  />
                </div>
              </div>
            </div>

            {/* Submit & Filter CTA */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-sm font-black text-slate-950 shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4 stroke-[3]" />}
                Filter
              </button>

              <button
                type="button"
                onClick={() => applyPreset("this_month")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </form>

          {/* Quick Filter Presets */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Quick Filter:
            </span>
            <button
              type="button"
              onClick={() => applyPreset("this_month")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset("last_month")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition cursor-pointer"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset("last_3_months")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition cursor-pointer"
            >
              Last 3 Months
            </button>
            <button
              type="button"
              onClick={() => applyPreset("current_fy")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition cursor-pointer"
            >
              Financial Year (2026-27)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("all")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition cursor-pointer"
            >
              All Records
            </button>
          </div>
        </div>

        {/* 3. Monthly Financial Table (Fleet Consolidated) OR Vehicle-wise P&L Table */}
        {activeTab === "fleet" ? (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
                <p className="text-xs font-bold">Calculating fleet revenue and expenses...</p>
              </div>
            ) : reportData.months.length === 0 ? (
              <div className="py-20 text-center">
                <ReceiptIndianRupee className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-900">No records found for selected period</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try selecting a wider date range or click "All Records" above.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50/70 text-stone-900 border-b-2 border-orange-200/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700">
                      MONTH
                    </th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700">
                      INCOME (₹)
                    </th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700">
                      EXPENSE (₹)
                    </th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700">
                      PROFIT (₹)
                    </th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-700 text-right print:hidden">
                      BREAKDOWN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-sm">
                  {reportData.months.map((m, idx) => {
                    const isPositive = m.profit >= 0;
                    const isExpanded = expandedMonth === m.monthKey;

                    return (
                      <tr key={m.monthKey} className={`${idx % 2 === 0 ? "bg-white hover:bg-[#f8f8f8]" : "bg-amber-50/80 hover:bg-amber-100/70"} group transition-colors`}>
                        {/* Month Column */}
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>{m.month}</span>
                          </div>
                        </td>

                        {/* Income Column */}
                        <td className="px-6 py-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                          ₹{Number(m.income || 0).toLocaleString("en-IN")}
                        </td>

                        {/* Expense Column */}
                        <td className="px-6 py-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                          ₹{Number(m.expense || 0).toLocaleString("en-IN")}
                        </td>

                        {/* Profit Column */}
                        <td className="px-6 py-4 font-mono font-black whitespace-nowrap">
                          <span className={isPositive ? "text-emerald-700" : "text-slate-900 font-black"}>
                            {isPositive ? "" : "-"}₹{Math.abs(Number(m.profit || 0)).toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                              isPositive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isPositive ? "Profit" : "Loss"}
                          </span>
                        </td>

                        {/* Expand / Details Toggle */}
                        <td className="px-6 py-4 text-right whitespace-nowrap print:hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedMonth(isExpanded ? null : m.monthKey)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-amber-800 transition cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide Details" : "View Breakdown"}</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Vehicle-Wise Profit & Loss Table */
          <div className="p-6 space-y-6">
            {/* Filter by Vehicle Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Filter by Vehicle (गाड़ी अनुसार मुनाफा)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select a truck to isolate its revenue, fuel, and maintenance balance.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedVehicleFilter}
                  onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">🚚 All Vehicles Fleet ({reportData.vehicleBreakdown?.length || 0})</option>
                  {(reportData.vehicleBreakdown || []).map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.vehicleNumber} ({v.ownerType === "market" ? "Vendor Truck" : "Own Fleet"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If a vehicle is selected, show its isolated summary KPI cards */}
            {selectedVehicleFilter !== "all" && (() => {
              const selVeh = (reportData.vehicleBreakdown || []).find(
                (v) => String(v.vehicleId) === String(selectedVehicleFilter)
              );
              if (!selVeh) return null;
              const isVehProf = selVeh.netProfit >= 0;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 border border-amber-200 animate-in fade-in">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Selected Vehicle</span>
                    <span className="text-lg font-black text-slate-900 block font-mono mt-0.5">{selVeh.vehicleNumber}</span>
                    <span className="text-xs text-amber-700 font-bold">{selVeh.totalTrips} Trips • {selVeh.ownerType === "market" ? "Vendor Lorry" : "Company Fleet"}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Gross Freight Revenue</span>
                    <span className="text-lg font-black text-emerald-600 block font-mono mt-0.5">₹{Number(selVeh.grossRevenue || 0).toLocaleString("en-IN")}</span>
                    <span className="text-xs text-slate-500">From Invoices & Direct Trips</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">Total Vehicle Cost</span>
                    <span className="text-lg font-black text-rose-600 block font-mono mt-0.5">₹{Number(selVeh.totalCost || 0).toLocaleString("en-IN")}</span>
                    <span className="text-xs text-slate-500">Diesel: ₹{Number(selVeh.fuelCost || 0).toLocaleString("en-IN")} • Driver: ₹{Number(selVeh.driverExpenses || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className={`p-4 rounded-xl border shadow-xs ${isVehProf ? "bg-emerald-50 border-emerald-300" : "bg-rose-50 border-rose-300"}`}>
                    <span className="text-[10px] font-black uppercase text-slate-700 block">Vehicle Net Profit / Loss</span>
                    <span className={`text-lg font-black block font-mono mt-0.5 ${isVehProf ? "text-emerald-800" : "text-rose-800"}`}>
                      {isVehProf ? "+" : "-"}₹{Math.abs(Number(selVeh.netProfit || 0)).toLocaleString("en-IN")}
                    </span>
                    <span className={`text-xs font-black ${isVehProf ? "text-emerald-700" : "text-rose-700"}`}>
                      Margin: {selVeh.profitMargin}%
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Vehicle Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gradient-to-r from-stone-100 via-orange-50/40 to-stone-100 text-stone-900 border-b border-stone-200 text-[10px] font-black uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Vehicle Number</th>
                    <th className="px-4 py-3">Ownership</th>
                    <th className="px-4 py-3 text-center">Trips</th>
                    <th className="px-4 py-3 text-right">Revenue (₹)</th>
                    <th className="px-4 py-3 text-right">Diesel (₹)</th>
                    <th className="px-4 py-3 text-right">Driver (₹)</th>
                    <th className="px-4 py-3 text-right">Maint. (₹)</th>
                    <th className="px-4 py-3 text-right">Tyres (₹)</th>
                    <th className="px-4 py-3 text-right">Total Cost (₹)</th>
                    <th className="px-4 py-3 text-right">Net P&amp;L (₹)</th>
                    <th className="px-4 py-3 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                        <span>Calculating vehicle P&amp;L...</span>
                      </td>
                    </tr>
                  ) : (reportData.vehicleBreakdown || []).length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Truck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-700">No vehicle data available</p>
                        <p className="text-xs text-slate-400 mt-0.5">Trips and vehicle expenses will appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    (reportData.vehicleBreakdown || [])
                      .filter((v) => selectedVehicleFilter === "all" || String(v.vehicleId) === String(selectedVehicleFilter))
                      .map((veh, idx) => {
                        const isProf = veh.netProfit >= 0;
                        return (
                          <tr key={veh.vehicleId || idx} className={`${idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100/60"} transition-colors`}>
                            {/* Vehicle Number */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-mono font-black text-slate-950 block">
                                {veh.vehicleNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {veh.vehicleType || "Truck"}
                              </span>
                            </td>

                            {/* Ownership */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                  veh.ownerType === "market"
                                    ? "bg-purple-100 text-purple-900 border-purple-200"
                                    : "bg-emerald-100 text-emerald-900 border-emerald-200"
                                }`}
                              >
                                {veh.ownerType === "market" ? "🚚 Vendor" : "🏢 Company Own"}
                              </span>
                            </td>

                            {/* Trips */}
                            <td className="px-4 py-3 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                              {veh.totalTrips || 0}
                            </td>

                            {/* Revenue */}
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                              ₹{Number(veh.grossRevenue || 0).toLocaleString("en-IN")}
                            </td>

                            {/* Diesel */}
                            <td className="px-4 py-3 text-right font-mono text-rose-700 whitespace-nowrap">
                              ₹{Number(veh.fuelCost || 0).toLocaleString("en-IN")}
                            </td>

                            {/* Driver */}
                            <td className="px-4 py-3 text-right font-mono text-purple-700 whitespace-nowrap">
                              ₹{Number(veh.driverExpenses || 0).toLocaleString("en-IN")}
                            </td>

                            {/* Maintenance */}
                            <td className="px-4 py-3 text-right font-mono text-blue-700 whitespace-nowrap">
                              ₹{Number(veh.maintenanceCost || 0).toLocaleString("en-IN")}
                            </td>

                            {/* Tyres */}
                            <td className="px-4 py-3 text-right font-mono text-slate-700 whitespace-nowrap">
                              ₹{Number(veh.tyreCost || 0).toLocaleString("en-IN")}
                            </td>

                            {/* Total Cost */}
                            <td className="px-4 py-3 text-right font-mono font-bold text-rose-900 whitespace-nowrap bg-rose-50/30">
                              ₹{Number(veh.totalCost || 0).toLocaleString("en-IN")}
                            </td>

                            {/* Net P&L */}
                            <td className="px-4 py-3 text-right font-mono font-black whitespace-nowrap">
                              <span className={isProf ? "text-emerald-700" : "text-rose-700"}>
                                {isProf ? "+" : "-"}₹{Math.abs(Number(veh.netProfit || 0)).toLocaleString("en-IN")}
                              </span>
                            </td>

                            {/* Margin */}
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isProf ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {veh.profitMargin}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table Bottom Tally Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-amber-300 bg-amber-50/70 px-6 py-4 text-slate-700">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">
              Total Financial Tally ({activeTab === "fleet" ? `${reportData.months.length} Months` : `${reportData.vehicleBreakdown?.length || 0} Vehicles`} Calculated)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs font-bold">
            <div>
              <span className="text-slate-600 mr-1.5 font-semibold">Total Income:</span>
              <span className="text-emerald-800 font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                ₹{Number(reportData.summary.totalIncome || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-slate-600 mr-1.5 font-semibold">Total Expense:</span>
              <span className="text-rose-800 font-black bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shadow-2xs">
                ₹{Number(reportData.summary.totalExpense || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-slate-600 mr-1.5 font-semibold">Net P&L:</span>
              <span
                className={`font-black px-2 py-0.5 rounded border shadow-2xs ${
                  isNetPositive
                    ? "text-emerald-900 bg-emerald-100 border-emerald-300"
                    : "text-rose-900 bg-rose-100 border-rose-300"
                }`}
              >
                {isNetPositive ? "" : "-"}₹
                {Math.abs(Number(reportData.summary.netProfit || 0)).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Detailed Financial Breakdown (Category Drilldown for Selected Month) */}
      {expandedMonth && (() => {
        const currentMonthData = reportData.months.find((m) => m.monthKey === expandedMonth);
        if (!currentMonthData) return null;

        const inc = currentMonthData.incomeBreakdown || {};
        const exp = currentMonthData.expenseBreakdown || {};

        return (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                  Financial Drilldown
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {currentMonthData.month} · Income & Expense Ledger
                </h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800 border border-emerald-200">
                  Income: ₹{Number(currentMonthData.income || 0).toLocaleString("en-IN")}
                </span>
                <span className="rounded-lg bg-rose-50 px-2.5 py-1 font-bold text-rose-800 border border-rose-200">
                  Expense: ₹{Number(currentMonthData.expense || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column: Revenue & Incomes */}
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <ArrowUpRight className="h-4 w-4 text-emerald-700" />
                    Revenue & Income
                  </span>
                  <span className="font-mono font-black text-emerald-800 text-sm">
                    ₹{Number(currentMonthData.income || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-emerald-100">
                    <div>
                      <p className="font-bold text-slate-800">Party Invoices (Freight Billed)</p>
                      <p className="text-[11px] text-slate-400">Party account invoices generated</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">
                      ₹{Number(inc.customerInvoices || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-emerald-100">
                    <div>
                      <p className="font-bold text-slate-800">Direct Trip Freight</p>
                      <p className="text-[11px] text-slate-400">Dispatches without invoice</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">
                      ₹{Number(inc.directTrips || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Fleet Operating Expenses */}
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-rose-200 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <ArrowDownRight className="h-4 w-4 text-rose-700" />
                    Operating Expenses
                  </span>
                  <span className="font-mono font-black text-rose-800 text-sm">
                    ₹{Number(currentMonthData.expense || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="font-bold text-slate-800">Diesel & Fuel</p>
                        <p className="text-[10px] text-slate-400">Petrol pumps & slip bills</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-700">
                      ₹{Number(exp.diesel || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <ReceiptIndianRupee className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="font-bold text-slate-800">Driver Allowance & Road Expenses</p>
                        <p className="text-[10px] text-slate-400">Toll, food, border & police</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-700">
                      ₹{Number(exp.driverExpenses || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-bold text-slate-800">Vehicle Maintenance & Repairs</p>
                        <p className="text-[10px] text-slate-400">Garage service & spare parts</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-700">
                      ₹{Number(exp.maintenance || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <CircleDot className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="font-bold text-slate-800">Tyre Management</p>
                        <p className="text-[10px] text-slate-400">New tyres & retreading</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-700">
                      ₹{Number(exp.tyres || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="font-bold text-slate-800">Market Lorry Hires (Vendor Bills)</p>
                        <p className="text-[10px] text-slate-400">Market lorry / vendor hire payments</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-700">
                      ₹{Number(exp.marketLorry || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="font-bold text-slate-800">Vehicle Loan EMIs</p>
                        <p className="text-[10px] text-slate-400">Monthly bank installment</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-700">
                      ₹{Number(exp.loanEmi || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
