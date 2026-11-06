"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Package,
  Phone,
  MapPin,
  Receipt,
  Search,
  CheckCircle2,
  Layers,
  CircleDot
} from "lucide-react";
import api from "@/src/services/api";
import { formatINR } from "@/src/lib/simpleFormat";
import { toast } from "sonner";
import Pagination from "./Pagination";
import TableSkeletonRows from "./TableSkeletonRows";

export default function SimpleMastersPage() {
  const [tab, setTab] = useState("customers");
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(10);
  const [materialPage, setMaterialPage] = useState(1);
  const [materialPageSize, setMaterialPageSize] = useState(10);

  const customerBlank = {
    name: "",
    phone: "",
    siteAddress: "",
    gstin: "",
    openingBalance: 0,
    status: "active"
  };

  const materialBlank = {
    name: "",
    unit: "Ton",
    defaultRate: 0,
    gstRate: 5,
    status: "active"
  };

  const load = async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([api.get("/customers"), api.get("/materials")]);
      setCustomers(c.data?.data || []);
      setMaterials(m.data?.data || []);
    } catch (e) {
      toast.error("Could not load master records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = (row) => {
    setEdit(row || null);
    if (tab === "customers") {
      setForm(
        row
          ? {
              name: row.name,
              phone: row.phone,
              siteAddress: row.siteAddress || row.address || "",
              gstin: row.gstin || row.gstNumber || "",
              openingBalance: row.openingBalance || 0,
              status: row.status || "active"
            }
          : customerBlank
      );
    } else {
      setForm(
        row
          ? {
              name: row.name,
              unit: row.unit,
              defaultRate: row.defaultRate,
              gstRate: row.gstRate,
              status: row.status
            }
          : materialBlank
      );
    }
    setShow(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (tab === "customers") {
        const body = { ...form, address: form.siteAddress, gstNumber: form.gstin };
        if (edit) await api.put(`/customers/${edit._id}`, body);
        else await api.post("/customers", body);
      } else {
        if (edit) await api.put(`/materials/${edit._id}`, form);
        else await api.post("/materials", form);
      }
      toast.success(edit ? "Record updated successfully" : "Record created successfully");
      setShow(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save record");
    }
  };

  const remove = async (row) => {
    if (!confirm(`Are you sure you want to delete this ${tab === "customers" ? "customer" : "material"}?`))
      return;
    try {
      if (tab === "materials") await api.put(`/materials/${row._id}`, { status: "inactive" });
      else await api.delete(`/customers/${row._id}`);
      toast.success("Record deleted");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not remove record");
    }
  };

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.status !== "inactive" &&
        (!q ||
          c.name?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.siteAddress?.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const filteredMaterials = useMemo(() => {
    const q = search.toLowerCase();
    return materials.filter(
      (m) =>
        m.status !== "inactive" &&
        (!q || m.name?.toLowerCase().includes(q) || m.unit?.toLowerCase().includes(q))
    );
  }, [materials, search]);

  // Reset page when search or tab changes
  useEffect(() => {
    setCustomerPage(1);
    setMaterialPage(1);
  }, [search, tab]);

  // Paginated slices
  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * customerPageSize;
    return filteredCustomers.slice(start, start + customerPageSize);
  }, [filteredCustomers, customerPage, customerPageSize]);

  const paginatedMaterials = useMemo(() => {
    const start = (materialPage - 1) * materialPageSize;
    return filteredMaterials.slice(start, start + materialPageSize);
  }, [filteredMaterials, materialPage, materialPageSize]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-orange-800">
              <Layers size={13} className="text-orange-600" />
              Central Master Registry
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Customers &amp; Materials (ग्राहक और माल)
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-stone-500 font-medium">
            Manage your client directory, delivery sites, and building material selling rates
          </p>
        </div>

        <button
          onClick={() => open(null)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition active:scale-95 self-start lg:self-auto"
        >
          <Plus size={16} />
          <span>Add New {tab === "customers" ? "Customer (ग्राहक)" : "Material (सामग्री)"}</span>
        </button>
      </div>

      {/* 2. TAB TOGGLE & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-100/70 p-2.5 rounded-2xl border border-stone-200">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-2xs">
          <button
            onClick={() => {
              setTab("customers");
              setSearch("");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition ${
              tab === "customers"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            }`}
          >
            <Users size={14} />
            <span>Customers (ग्राहक)</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                tab === "customers" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              {customers.filter((c) => c.status !== "inactive").length}
            </span>
          </button>

          <button
            onClick={() => {
              setTab("materials");
              setSearch("");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition ${
              tab === "materials"
                ? "bg-orange-600 text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            }`}
          >
            <Package size={14} />
            <span>Materials (सामग्री / ईंट)</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                tab === "materials" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              {materials.filter((m) => m.status !== "inactive").length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder={`Search ${tab === "customers" ? "customer name, phone, site..." : "material name..."}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 3. DATA TABLES */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="table-scroll-container overflow-x-auto">
          {tab === "customers" ? (
            /* Customers Table */
            <table className="w-full min-w-[1200px] text-left text-sm border-collapse">
              <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">Customer Name</th>
                  <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Phone Number</th>
                  <th className="px-4 py-3.5 min-w-[280px]">Default Delivery Site</th>
                  <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">GSTIN</th>
                  <th className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">Opening Balance (पिछला बकाया)</th>
                  <th className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">Status</th>
                  <th className="px-2 py-2.5 sm:px-5 sm:py-3.5 min-w-[65px] sm:min-w-[120px] text-right whitespace-nowrap sticky right-0 bg-stone-50 border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 text-[10px] sm:text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <TableSkeletonRows
                    cols={7}
                    rows={6}
                    message="ग्राहक सूची लोड हो रही है... (Loading customers...)"
                  />
                ) : (
                  paginatedCustomers.map((c) => (
                  <tr key={c._id} className="hover:bg-orange-50/30 transition group">
                    <td className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-100 text-orange-800 font-black text-xs shrink-0">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-black text-stone-900 text-sm">{c.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 min-w-[160px] whitespace-nowrap text-stone-700 font-mono text-xs font-bold">
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="hover:text-orange-600 hover:underline">
                          {c.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3.5 min-w-[280px]">
                      <div className="flex items-start gap-1.5 text-xs text-stone-700">
                        <MapPin size={12} className="text-orange-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{c.siteAddress || c.address || "—"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">
                      {c.gstin || c.gstNumber ? (
                        <span className="rounded-md bg-stone-100 border border-stone-200 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-800">
                          {c.gstin || c.gstNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">Unregistered</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 min-w-[170px] whitespace-nowrap font-bold text-stone-900">
                      {formatINR(c.openingBalance)}
                    </td>

                    <td className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    </td>

                    <td className="px-2 py-2.5 sm:px-5 sm:py-3.5 min-w-[65px] sm:min-w-[120px] text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-[#fff9f4] backdrop-blur-xs border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 transition">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          onClick={() => open(c)}
                          title="Edit Customer"
                          className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => remove(c)}
                          title="Delete Customer"
                          className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:border-red-300 hover:text-red-600 shadow-2xs transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && !filteredCustomers.length && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-stone-500">
                      No customers found. Click "+ Add New Customer" to register your first party.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Materials Table */
            <table className="w-full min-w-[950px] text-left text-sm border-collapse">
              <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">Material Name</th>
                  <th className="px-4 py-3.5 min-w-[140px] whitespace-nowrap">Default Unit</th>
                  <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Default Selling Rate</th>
                  <th className="px-4 py-3.5 min-w-[140px] whitespace-nowrap">GST Rate Slab</th>
                  <th className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">Status</th>
                  <th className="px-2 py-2.5 sm:px-5 sm:py-3.5 min-w-[65px] sm:min-w-[120px] text-right whitespace-nowrap sticky right-0 bg-stone-50 border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 text-[10px] sm:text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <TableSkeletonRows
                    cols={6}
                    rows={6}
                    message="मटेरियल / माल सूची लोड हो रही है... (Loading materials...)"
                  />
                ) : (
                  paginatedMaterials.map((m) => (
                  <tr key={m._id} className="hover:bg-orange-50/30 transition group">
                    <td className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-800 font-black shrink-0">
                          <Package size={15} />
                        </div>
                        <span className="font-black text-stone-900 text-sm">{m.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 min-w-[140px] whitespace-nowrap">
                      <span className="rounded-lg bg-stone-100 border border-stone-200 px-2 py-0.5 text-xs font-bold text-stone-800">
                        {m.unit}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 min-w-[160px] whitespace-nowrap font-black text-stone-900 text-base">
                      {formatINR(m.defaultRate)}
                    </td>

                    <td className="px-4 py-3.5 min-w-[140px] whitespace-nowrap">
                      <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-black text-indigo-700">
                        {m.gstRate}% GST
                      </span>
                    </td>

                    <td className="px-4 py-3.5 min-w-[120px] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    </td>

                    <td className="px-2 py-2.5 sm:px-5 sm:py-3.5 min-w-[65px] sm:min-w-[120px] text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-[#fff9f4] backdrop-blur-xs border-l border-stone-200/80 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] z-10 transition">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          onClick={() => open(m)}
                          title="Edit Material"
                          className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => remove(m)}
                          title="Delete Material"
                          className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:border-red-300 hover:text-red-600 shadow-2xs transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && !filteredMaterials.length && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-stone-500">
                      No materials found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {tab === "customers" ? (
          <Pagination
            totalItems={filteredCustomers.length}
            currentPage={customerPage}
            pageSize={customerPageSize}
            onPageChange={setCustomerPage}
            onPageSizeChange={(sz) => {
              setCustomerPageSize(sz);
              setCustomerPage(1);
            }}
          />
        ) : (
          <Pagination
            totalItems={filteredMaterials.length}
            currentPage={materialPage}
            pageSize={materialPageSize}
            onPageChange={setMaterialPage}
            onPageSizeChange={(sz) => {
              setMaterialPageSize(sz);
              setMaterialPage(1);
            }}
          />
        )}
      </div>

      {/* 4. MODAL FORM */}
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <form
            onSubmit={save}
            className="w-full max-w-lg min-w-0 max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-100 overflow-hidden"
          >
            {/* Modal Header - Fixed Top */}
            <div className="flex items-center justify-between border-b border-stone-100 px-5 sm:px-7 py-4.5 bg-white shrink-0">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">
                  Master Configuration
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
                  {edit ? "Edit" : "Add New"} {tab === "customers" ? "Customer (ग्राहक)" : "Material (सामग्री)"}
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

            {/* Form Fields - Dedicated Scrollable Body with Clean Branded Scrollbar */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 px-5 sm:px-7 py-5 custom-scrollbar">
              <div className="grid gap-4 sm:grid-cols-2">
              {tab === "customers" ? (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Customer / Firm Name (ग्राहक का नाम) *
                    </label>
                    <input
                      required
                      placeholder="e.g. Manglam Builders Pvt Ltd / Rajesh Sharma"
                      value={form.name || ""}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Phone Number (मोबाइल नंबर) *
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
                      GSTIN (जीएसटी नंबर - Optional)
                    </label>
                    <input
                      placeholder="e.g. 08AABCS1234A1Z1"
                      value={form.gstin || ""}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Default Site Delivery Address (साइट का पता)
                    </label>
                    <input
                      placeholder="e.g. Tonk Road Site, Near Ring Road, Jaipur"
                      value={form.siteAddress || ""}
                      onChange={(e) => setForm({ ...form, siteAddress: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Opening Balance (पिछला बकाया ₹ - पुराना हिसाब)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0 (पुराना उधार न हो तो 0 रहने दें)"
                      value={form.openingBalance || ""}
                      onChange={(e) => setForm({ ...form, openingBalance: e.target.value.replace(/[^0-9]/g, "") })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    />
                    <p className="mt-1 text-[11px] text-stone-500">
                      *सॉफ्टवेयर शुरू होने से पहले का कोई पुराना बकाया हो तो ही भरें, अन्यथा 0 रहने दें। नए माल का हिसाब डिलीवरी के बाद ग्राहक आर्डर से बनेगा।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Status
                    </label>
                    <select
                      value={form.status || "active"}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Material Name (मटेरियल का नाम) *
                    </label>
                    <input
                      required
                      placeholder="e.g. Rodi 10mm / Bricks / M-Sand"
                      value={form.name || ""}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Unit (माप इकाई) *
                    </label>
                    <select
                      value={form.unit || "Ton"}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    >
                      {["Ton", "CFT", "Pcs", "Trolley", "Brass"].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Default Selling Rate (₹ प्रति इकाई)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={form.defaultRate || ""}
                      onChange={(e) => setForm({ ...form, defaultRate: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      GST Rate Slab (% दर)
                    </label>
                    <select
                      value={form.gstRate ?? 5}
                      onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    >
                      <option value={0}>0% (Tax Exempt)</option>
                      <option value={5}>5% (Standard)</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-stone-700 mb-1">
                      Status
                    </label>
                    <select
                      value={form.status || "active"}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:border-orange-500 shadow-2xs"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

            {/* Modal Actions - Sticky Bottom Toolbar */}
            <div className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/90 backdrop-blur-xs px-5 sm:px-7 py-3.5 shrink-0">
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
    </div>
  );
}
