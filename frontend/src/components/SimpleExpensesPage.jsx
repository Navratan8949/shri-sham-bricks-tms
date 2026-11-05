"use client";

import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Plus,
  Pencil,
  Download,
  Trash2,
  X,
  Fuel,
  Truck,
  User,
  Calendar,
  Search,
  RefreshCw,
  Wrench,
  CreditCard,
  FileText
} from "lucide-react";
import api from "@/src/services/api";
import { formatINR, dateInput, localDateString } from "@/src/lib/simpleFormat";
import { toast } from "sonner";
import Pagination from "./Pagination";
import SearchableDropdown from "./SearchableDropdown";
import TableSkeletonRows from "./TableSkeletonRows";

const blank = {
  expenseDate: dateInput(),
  vehicleId: "",
  driverId: "",
  category: "fuel",
  amount: "",
  litres: 0,
  paidVia: "cash",
  slipNumber: "",
  notes: ""
};

const cats = [
  ["fuel", "⛽ Diesel / Fuel", "bg-amber-50 text-amber-800 border-amber-200"],
  ["driver_kharcha", "👤 Driver Bhatta", "bg-emerald-50 text-emerald-800 border-emerald-200"],
  ["maintenance", "🔧 Maintenance & Repairs", "bg-blue-50 text-blue-800 border-blue-200"],
  ["tyre", "🛞 Tyres", "bg-purple-50 text-purple-800 border-purple-200"],
  ["fastag", "🏷️ Fastag / Toll", "bg-cyan-50 text-cyan-800 border-cyan-200"],
  ["other", "📋 Other Expenses", "bg-stone-50 text-stone-800 border-stone-200"]
];

export default function SimpleExpensesPage() {
  const [rows, setRows] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const [e, v, d] = await Promise.all([
        api.get("/vehicle-expenses"),
        api.get("/vehicles"),
        api.get("/drivers")
      ]);
      setRows(e.data?.data || []);
      setVehicles((v.data?.data || []).filter((x) => x.ownerType !== "market" && x.ownership !== "market"));
      setDrivers(d.data?.data || []);
    } catch (e) {
      toast.error("Could not load vehicle expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const day = localDateString(r.expenseDate);
      const matchesVehicle = filterVehicle === "all" || r.vehicleId?._id === filterVehicle;
      const matchesCat = filterCat === "all" || r.category === filterCat;
      const matchesFrom = !fromDate || day >= fromDate;
      const matchesTo = !toDate || day <= toDate;
      const matchesSearch = `${r.vehicleId?.vehicleNumber || ""} ${r.driverId?.name || ""} ${r.slipNumber || ""} ${r.notes || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesVehicle && matchesCat && matchesFrom && matchesTo && matchesSearch;
    });
  }, [rows, filterVehicle, filterCat, fromDate, toDate, search]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterVehicle, filterCat, fromDate, toDate, search]);

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Aggregate stats
  const totalAmount = useMemo(() => filtered.reduce((s, r) => s + Number(r.amount || 0), 0), [filtered]);
  const fuelTotal = useMemo(
    () => filtered.filter((r) => r.category === "fuel").reduce((s, r) => s + Number(r.amount || 0), 0),
    [filtered]
  );
  const fuelLitres = useMemo(
    () => filtered.filter((r) => r.category === "fuel").reduce((s, r) => s + Number(r.litres || 0), 0),
    [filtered]
  );
  const bhattaTotal = useMemo(
    () => filtered.filter((r) => r.category === "driver_kharcha").reduce((s, r) => s + Number(r.amount || 0), 0),
    [filtered]
  );
  const maintTotal = useMemo(
    () => filtered.filter((r) => r.category === "maintenance" || r.category === "tyre").reduce((s, r) => s + Number(r.amount || 0), 0),
    [filtered]
  );

  const selectedVehicle = vehicles.find((v) => v._id === form.vehicleId);

  const openNew = () => {
    setEditing(null);
    setForm(blank);
    setShow(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      expenseDate: dateInput(r.expenseDate),
      vehicleId: r.vehicleId?._id || r.vehicleId || "",
      driverId: r.driverId?._id || r.driverId || "",
      category: r.category || "fuel",
      amount: r.amount || "",
      litres: r.litres || 0,
      paidVia: r.paidVia || "cash",
      slipNumber: r.slipNumber || "",
      notes: r.notes || ""
    });
    setShow(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.vehicleId || !form.amount || Number(form.amount) <= 0) {
      return toast.error("Valid vehicle and amount are required");
    }
    try {
      const payload = {
        ...form,
        driverId: form.driverId || selectedVehicle?.driverId?._id || selectedVehicle?.driverId || null
      };
      if (editing) {
        await api.put(`/vehicle-expenses/${editing._id}`, payload);
        toast.success("Vehicle expense updated successfully");
      } else {
        await api.post("/vehicle-expenses", payload);
        toast.success("Vehicle expense logged successfully");
      }
      setShow(false);
      setEditing(null);
      setForm(blank);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save expense");
    }
  };

  const remove = async (r) => {
    if (!confirm("Delete this expense record?")) return;
    try {
      await api.delete(`/vehicle-expenses/${r._id}`);
      load();
      toast.success("Expense deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete expense");
    }
  };

  const exportExcel = () => {
    const rowsExport = filtered.map((r) => ({
      Date: new Date(r.expenseDate).toLocaleDateString("en-IN"),
      Vehicle: r.vehicleId?.vehicleNumber,
      Driver: r.driverId?.name || "—",
      Category: cats.find((c) => c[0] === r.category)?.[1] || r.category,
      "Amount (₹)": r.amount,
      Litres: r.litres || "—",
      "Payment Mode": r.paidVia?.toUpperCase(),
      "Slip Number": r.slipNumber || "—",
      Notes: r.notes || "—"
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsExport), "Vehicle Expenses");
    XLSX.writeFile(wb, `Vehicle-Expenses-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 border border-rose-200 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-rose-800">
              <Fuel size={13} className="text-rose-600" />
              Own Fleet Operating Costs
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Vehicle Expenses (गाड़ी खर्चा)
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500 font-medium">
            Diesel, driver daily allowance, maintenance, tyre replacement and Fastag log
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
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition active:scale-95"
          >
            <Plus size={16} />
            <span>+ Log Vehicle Expense</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Logged</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-rose-600">{formatINR(totalAmount)}</p>
          <span className="text-xs text-stone-400">{filtered.length} Expense Records</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Diesel / Fuel</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-amber-700">{formatINR(fuelTotal)}</p>
          <span className="text-xs text-stone-400 font-medium">{fuelLitres > 0 ? `${fuelLitres.toLocaleString("en-IN")} Litres` : "Logged Fuel"}</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Driver Bhatta</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-emerald-700">{formatINR(bhattaTotal)}</p>
          <span className="text-xs text-stone-400">Daily Allowance</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Service &amp; Tyres</span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-blue-700">{formatINR(maintTotal)}</p>
          <span className="text-xs text-stone-400">Repairs &amp; Tyres</span>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-100/70 p-2.5 rounded-2xl border border-stone-200">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search vehicle, driver, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Vehicle Filter */}
          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 outline-none shadow-2xs"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.vehicleNumber}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 outline-none shadow-2xs"
          >
            <option value="all">All Categories</option>
            {cats.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
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
            <RefreshCw size={14} className={loading ? "animate-spin text-orange-600" : ""} />
          </button>
        </div>
      </div>

      {/* 4. EXPENSES DATA TABLE */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="table-scroll-container overflow-x-auto">
          <table className="w-full min-w-[1350px] text-left text-sm border-collapse">
            <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5 min-w-[130px] whitespace-nowrap">Date</th>
                <th className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">Vehicle</th>
                <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Driver</th>
                <th className="px-4 py-3.5 min-w-[180px] whitespace-nowrap">Category</th>
                <th className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">Amount (₹)</th>
                <th className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">Fuel / Litres</th>
                <th className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">Payment</th>
                <th className="px-4 py-3.5 min-w-[200px]">Slip / Notes</th>
                <th className="px-5 py-3.5 min-w-[120px] text-right whitespace-nowrap sticky right-0 bg-stone-50 border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <TableSkeletonRows
                  cols={9}
                  rows={6}
                  message="गाड़ी खर्चे लोड हो रहे हैं... (Loading vehicle expenses...)"
                />
              ) : (
                paginatedExpenses.map((r) => {
                const catItem = cats.find((c) => c[0] === r.category) || ["other", r.category, "bg-stone-50 text-stone-800 border-stone-200"];
                return (
                  <tr key={r._id} className="hover:bg-orange-50/30 transition group">
                    {/* Date */}
                    <td className="px-5 py-3.5 min-w-[130px] whitespace-nowrap font-medium text-stone-900">
                      {new Date(r.expenseDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>

                    {/* Vehicle */}
                    <td className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Truck size={14} className="text-stone-400 shrink-0" />
                        <span className="font-bold text-stone-900 font-mono">
                          {r.vehicleId?.vehicleNumber || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Driver */}
                    <td className="px-4 py-3.5 min-w-[160px] whitespace-nowrap text-stone-600 font-medium">
                      {r.driverId?.name || "—"}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 min-w-[180px] whitespace-nowrap">
                      <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${catItem[2]}`}>
                        {catItem[1]}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 min-w-[130px] whitespace-nowrap font-black text-rose-600 text-base">
                      {formatINR(r.amount)}
                    </td>

                    {/* Litres */}
                    <td className="px-4 py-3.5 min-w-[120px] whitespace-nowrap text-stone-600 font-semibold">
                      {r.litres > 0 ? `${r.litres} L` : "—"}
                    </td>

                    {/* Paid Via */}
                    <td className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">
                      <span className="inline-block rounded-md bg-stone-100 border border-stone-200 px-2 py-0.5 text-[11px] font-bold text-stone-700 capitalize">
                        {r.paidVia}
                      </span>
                    </td>

                    {/* Slip / Notes */}
                    <td className="px-4 py-3.5 min-w-[200px]">
                      {r.slipNumber && (
                        <p className="text-[11px] font-mono text-stone-700 font-bold">
                          Slip: {r.slipNumber}
                        </p>
                      )}
                      {r.notes ? (
                        <p className="text-xs text-stone-600 mt-0.5 leading-snug" title={r.notes}>
                          {r.notes}
                        </p>
                      ) : (
                        !r.slipNumber && <span className="text-stone-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 min-w-[120px] text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-[#fff9f4] backdrop-blur-xs border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 transition">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(r)}
                          title="Edit expense"
                          className="grid h-7 w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => remove(r)}
                          title="Delete expense"
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
                    <Fuel size={36} className="mx-auto text-stone-300 mb-2" />
                    <p className="font-bold text-stone-700 text-sm">No Vehicle Expenses Logged</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Click "+ Log Vehicle Expense" to add diesel, driver bhatta, maintenance, or tyre costs.
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

      {/* 5. LOG EXPENSE MODAL */}
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <form
            onSubmit={save}
            className="w-full max-w-xl min-w-0 rounded-3xl bg-white p-4 sm:p-7 shadow-2xl border border-stone-100 max-h-[92vh] overflow-y-auto overflow-x-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
                  Fleet Operating Ledger
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
                  {editing ? "Edit Vehicle Expense (खर्चा संशोधन)" : "Log Vehicle Expense (गाड़ी खर्चा)"}
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

            {/* Form Fields Grid */}
            <div className="grid gap-3.5 sm:grid-cols-2 min-w-0">
              {/* Date */}
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Expense Date (तारीख) *
                </label>
                <input
                  required
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Vehicle */}
              <div className="min-w-0">
                <SearchableDropdown
                  label="Vehicle (गाड़ी) *"
                  required
                  value={form.vehicleId}
                  onChange={(val) => {
                    const found = vehicles.find((v) => v._id === val);
                    setForm((p) => ({
                      ...p,
                      vehicleId: val,
                      driverId: found?.driverId?._id || found?.driverId || p.driverId
                    }));
                  }}
                  options={vehicles}
                  placeholder="-- Select Own Truck (गाड़ी नंबर चुनें) --"
                  searchPlaceholder="Search truck number (e.g. 2693, RJ14)..."
                  getOptionLabel={(v) => v?.vehicleNumber}
                  getOptionSublabel={(v) => [v?.vehicleType, v?.driverId?.name ? `Driver: ${v.driverId.name}` : null].filter(Boolean).join(" • ")}
                  getOptionValue={(v) => v?._id}
                  searchFields={(v) => [v?.vehicleNumber, v?.vehicleType, v?.driverId?.name, v?.driverId?.phone]}
                  icon={Truck}
                />
              </div>

              {/* Category */}
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Expense Category (खर्चे का प्रकार) *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                >
                  {cats.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Amount (रुपये ₹) *
                </label>
                <input
                  required
                  min="1"
                  step="1"
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9]/g, "") })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Conditional Diesel Litres */}
              {form.category === "fuel" && (
                <div className="min-w-0">
                  <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                    Diesel Litres (लीटर)
                  </label>
                  <input
                    min="0"
                    step="0.01"
                    type="number"
                    placeholder="e.g. 50"
                    value={form.litres}
                    onChange={(e) => setForm({ ...form, litres: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                  />
                </div>
              )}

              {/* Driver */}
              <div className="min-w-0">
                <SearchableDropdown
                  label="Driver (ड्राइवर)"
                  value={form.driverId}
                  onChange={(val) => setForm((p) => ({ ...p, driverId: val }))}
                  options={drivers}
                  placeholder="-- Vehicle Default Driver (ड्राइवर चुनें) --"
                  searchPlaceholder="Search driver by name or phone..."
                  getOptionLabel={(d) => d?.name}
                  getOptionSublabel={(d) => d?.phone}
                  getOptionValue={(d) => d?._id}
                  searchFields={(d) => [d?.name, d?.phone]}
                  icon={User}
                  allowClear
                />
              </div>

              {/* Paid Via */}
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Paid Via (भुगतान माध्यम)
                </label>
                <select
                  value={form.paidVia}
                  onChange={(e) => setForm({ ...form, paidVia: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                >
                  <option value="cash">Cash (नकद)</option>
                  <option value="online">Online / UPI</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cheque">Cheque (चेक)</option>
                </select>
              </div>

              {/* Slip Number */}
              <div className="min-w-0">
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Bill / Slip Number (पर्ची नंबर)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SLP-8472"
                  value={form.slipNumber}
                  onChange={(e) => setForm({ ...form, slipNumber: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Notes */}
              <div className="sm:col-span-2 min-w-0">
                <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                  Description / Remarks (विवरण)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pump name, workshop name, part replacement notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                />
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
                className="rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition active:scale-95"
              >
                {editing ? "Update Expense (खर्चा अपडेट करें)" : "Save Expense (खर्चा सेव करें)"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
