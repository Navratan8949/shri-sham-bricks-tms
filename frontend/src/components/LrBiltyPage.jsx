"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Printer,
  FileSpreadsheet,
  Download,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Building2,
  RefreshCcw,
  X,
  Package,
  Layers,
  IndianRupee,
  ChevronRight,
  Send,
  User,
  ShieldCheck,
  Check,
  Eye,
  MessageCircle,
  ExternalLink,
  Navigation,
  FileCheck,
} from "lucide-react";
import api from "@/src/services/api";
import { useActiveCompany, getStoredUser } from "@/src/lib/auth";
import { exportToExcelProfessional } from "@/src/lib/excelExport";
import SearchableSelect from "@/src/components/SearchableSelect";
import BiltyPrintModal from "@/src/components/BiltyPrintModal";
import WhatsAppShareModal from "@/src/components/WhatsAppShareModal";
import { toast } from "sonner";

export default function LrBiltyPage() {
  const activeCompany = useActiveCompany();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = getStoredUser();

  // Data States
  const [lrList, setLrList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [parties, setParties] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState(() => searchParams?.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [freightByFilter, setFreightByFilter] = useState("");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLR, setEditingLR] = useState(null);
  const [viewingLR, setViewingLR] = useState(null);
  const [printLR, setPrintLR] = useState(null);
  const [whatsAppLR, setWhatsAppLR] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    lrNumber: "",
    lrDate: new Date().toISOString().split("T")[0],
    center: "PLANT",
    freightBy: "TBB", // TBB, PAID, TO_PAY
    partyId: "",
    partyName: "",
    consignorName: "SHRI SHYAM BRICKS",
    consignorAddress: "Jaipur Highway Plant, Rajasthan",
    consigneeName: "",
    consigneeAddress: "",
    fromCity: "Jaipur",
    toCity: "",
    vehicleId: "",
    vehicleNumber: "",
    driverId: "",
    driverName: "",
    driverPhone: "",
    article: "Red Bricks (1st Class)",
    quantity: 4000,
    unit: "Pcs",
    loadingWeight: 14, // Tons / MT
    rate: 6.5,
    freightAmount: 26000,
    advanceAmount: 5000,
    balanceAmount: 21000,
    tripId: "",
    containerNumber: "",
    containerSize: "20_ft",
    status: "dispatched",
    remarks: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // Load All Master Data & Bilties
  const loadData = async () => {
    setLoading(true);
    try {
      const [lrRes, vRes, dRes, pRes, tRes] = await Promise.all([
        api.get("/lr-bilties"),
        api.get("/vehicles"),
        api.get("/drivers"),
        api.get("/customers"),
        api.get("/trips"),
      ]);

      const bilties = lrRes.data?.data || lrRes.data || [];
      setLrList(Array.isArray(bilties) ? bilties : []);

      const vehList = vRes.data?.data || vRes.data || [];
      setVehicles(Array.isArray(vehList) ? vehList : []);

      const drvList = dRes.data?.data || dRes.data || [];
      setDrivers(Array.isArray(drvList) ? drvList : []);

      const prtList = pRes.data?.data || pRes.data || [];
      setParties(Array.isArray(prtList) ? prtList : []);

      const trpList = tRes.data?.data || tRes.data || [];
      setTrips(Array.isArray(trpList) ? trpList : []);
    } catch (err) {
      console.error("Failed to load LR Bilties data:", err);
      toast.error("Failed to load LR Bilty records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL pre-fill from Trips Page ("Create LR / Bilty")
  useEffect(() => {
    if (searchParams?.get("autoOpenAdd") === "true") {
      const tripId = searchParams.get("tripId") || "";
      const vehicleId = searchParams.get("vehicleId") || "";
      const vehicleNumber = searchParams.get("vehicleNumber") || "";
      const driverId = searchParams.get("driverId") || "";
      const driverName = searchParams.get("driverName") || "";
      const driverPhone = searchParams.get("driverPhone") || "";
      const partyName = searchParams.get("partyName") || "";
      const partyId = searchParams.get("partyId") || "";
      const fromCity = searchParams.get("fromCity") || activeCompany?.city || "Jaipur";
      const toCity = searchParams.get("toCity") || "";
      const quantity = Number(searchParams.get("quantity")) || 4000;
      const unit = searchParams.get("unit") || "Pcs";
      const freightAmount = Number(searchParams.get("freightAmount")) || 0;
      const advanceAmount = Number(searchParams.get("advanceAmount")) || 0;
      const lrDate = searchParams.get("lrDate") || new Date().toISOString().split("T")[0];

      // Auto-fetch next sequence
      api
        .get("/sequences/next?type=lr-bilties")
        .then((res) => {
          const autoNum = res.data?.data?.number || "";
          setFormData((prev) => ({
            ...prev,
            lrNumber: autoNum,
            tripId,
            vehicleId,
            vehicleNumber,
            driverId,
            driverName,
            driverPhone,
            partyName,
            partyId,
            consigneeName: partyName,
            consigneeAddress: toCity ? `${toCity} Site Address` : "",
            fromCity,
            toCity,
            quantity,
            unit,
            freightAmount,
            advanceAmount,
            balanceAmount: Math.max(0, freightAmount - advanceAmount),
            lrDate,
            status: "dispatched",
            remarks: tripId ? `Generated from Trip Dispatch #${searchParams.get("tripNumber") || ""}` : "",
          }));
          setIsFormOpen(true);
        })
        .catch(() => {
          setIsFormOpen(true);
        });
    }
  }, [searchParams, activeCompany]);

  // Options for Dropdowns
  const vehicleOptions = useMemo(() => {
    return vehicles.map((v) => ({
      value: v._id,
      label: v.vehicleNumber || "Vehicle",
      subtext: `${v.ownerType === "market" || v.ownership === "market" ? "Market Lorry" : "Company Fleet"} • ${v.vehicleType || "Truck"}`,
      vehicleNumber: v.vehicleNumber,
      ownerType: v.ownerType,
    }));
  }, [vehicles]);

  const driverOptions = useMemo(() => {
    return drivers.map((d) => ({
      value: d._id,
      label: d.name || "Driver",
      subtext: `Mob: ${d.phone || "—"} • Lic: ${d.licenseNumber || "—"}`,
      name: d.name,
      phone: d.phone,
      licenseNumber: d.licenseNumber,
    }));
  }, [drivers]);

  const partyOptions = useMemo(() => {
    return parties.map((p) => ({
      value: p._id,
      label: p.name || "Party",
      subtext: `${p.city || p.address || "Jaipur"} • Mob: ${p.phone || "—"}`,
      name: p.name,
      address: p.address || p.city || "",
      phone: p.phone,
    }));
  }, [parties]);

  const tripOptions = useMemo(() => {
    return trips.map((t) => ({
      value: t._id,
      label: `${t.tripNumber || "Trip"} • ${t.truckNumber || t.vehicleId?.vehicleNumber || "Truck"} (${t.partyName || t.customerName || "Party"})`,
      subtext: `📍 Route: ${t.fromCity || "Jaipur"} ➔ ${t.toCity || "Site"} • Freight: ₹${t.rate || 0} • Adv: ₹${t.advanceAmount || 0}`,
      raw: t,
    }));
  }, [trips]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalBilties = lrList.length;
    const dispatched = lrList.filter((l) => l.status === "dispatched").length;
    const inTransit = lrList.filter((l) => l.status === "in_transit").length;
    const delivered = lrList.filter((l) => l.status === "delivered").length;
    const cancelled = lrList.filter((l) => l.status === "cancelled").length;

    const totalQty = lrList.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
    const totalFreight = lrList.reduce((acc, l) => acc + (Number(l.freightAmount || l.rate) || 0), 0);
    const totalAdvance = lrList.reduce((acc, l) => acc + (Number(l.advanceAmount) || 0), 0);
    const totalBalance = Math.max(0, totalFreight - totalAdvance);

    return {
      totalBilties,
      dispatched,
      inTransit,
      delivered,
      cancelled,
      totalQty,
      totalFreight,
      totalAdvance,
      totalBalance,
    };
  }, [lrList]);

  // Filtered List
  const filteredBilties = useMemo(() => {
    return lrList.filter((lr) => {
      // Status Filter
      if (statusFilter && lr.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Freight By Filter
      if (freightByFilter && lr.freightBy?.toLowerCase() !== freightByFilter.toLowerCase()) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const lrNo = (lr.lrNumber || "").toLowerCase();
        const vNum = (lr.vehicleId?.vehicleNumber || lr.vehicleNumber || "").toLowerCase();
        const dName = (lr.driverId?.name || lr.driverName || "").toLowerCase();
        const pName = (lr.partyName || lr.consignorName || lr.consigneeName || "").toLowerCase();
        const from = (lr.fromCity || "").toLowerCase();
        const to = (lr.toCity || "").toLowerCase();

        return (
          lrNo.includes(q) ||
          vNum.includes(q) ||
          dName.includes(q) ||
          pName.includes(q) ||
          from.includes(q) ||
          to.includes(q)
        );
      }
      return true;
    });
  }, [lrList, statusFilter, freightByFilter, search]);

  // Open Create Form
  const handleOpenCreate = async () => {
    setEditingLR(null);
    let nextNum = "";
    try {
      const res = await api.get("/sequences/next?type=lr-bilties");
      nextNum = res.data?.data?.number || "";
    } catch {
      nextNum = "";
    }

    setFormData({
      ...initialForm,
      lrNumber: nextNum,
      consignorName: (activeCompany?.name || "SHRI SHYAM BRICKS").replace(/\s+co\.?$/i, ""),
      consignorAddress: activeCompany?.address || (activeCompany?.city ? `${activeCompany.city} Plant Depot` : "Jaipur Plant"),
      fromCity: activeCompany?.city || "Jaipur",
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (lr) => {
    setEditingLR(lr);
    setFormData({
      lrNumber: lr.lrNumber || "",
      lrDate: lr.lrDate ? new Date(lr.lrDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      center: lr.center || "PLANT",
      freightBy: lr.freightBy || "TBB",
      partyId: lr.partyId?._id || lr.partyId || "",
      partyName: lr.partyName || "",
      consignorName: (lr.consignorName || activeCompany?.name || "SHRI SHYAM BRICKS").replace(/\s+co\.?$/i, ""),
      consignorAddress: lr.consignorAddress || activeCompany?.address || "Jaipur Plant",
      consigneeName: lr.consigneeName || lr.partyName || "",
      consigneeAddress: lr.consigneeAddress || "",
      fromCity: lr.fromCity || activeCompany?.city || "Jaipur",
      toCity: lr.toCity || "",
      vehicleId: lr.vehicleId?._id || lr.vehicleId || "",
      vehicleNumber: lr.vehicleId?.vehicleNumber || lr.vehicleNumber || "",
      driverId: lr.driverId?._id || lr.driverId || "",
      driverName: lr.driverId?.name || lr.driverName || "",
      driverPhone: lr.driverId?.phone || lr.driverPhone || "",
      article: lr.article || "Red Bricks (1st Class)",
      quantity: Number(lr.quantity) || 4000,
      unit: lr.unit || "Pcs",
      loadingWeight: Number(lr.loadingWeight) || 14,
      rate: Number(lr.rate) || 6.5,
      freightAmount: Number(lr.freightAmount) || 0,
      advanceAmount: Number(lr.advanceAmount) || 0,
      balanceAmount: Number(lr.balanceAmount) || Math.max(0, (Number(lr.freightAmount) || 0) - (Number(lr.advanceAmount) || 0)),
      tripId: lr.tripId?._id || lr.tripId || "",
      containerNumber: lr.containerNumber || "",
      containerSize: lr.containerSize || "20_ft",
      status: lr.status || "dispatched",
      remarks: lr.remarks || "",
    });
    setIsFormOpen(true);
  };

  // Submit Create / Edit
  const handleSubmitForm = async (e, openPrint = false) => {
    e?.preventDefault();
    setSaving(true);
    try {
      let savedData = null;
      if (editingLR) {
        const res = await api.put(`/lr-bilties/${editingLR._id}`, formData);
        savedData = res.data?.data || { ...editingLR, ...formData };
        toast.success(`LR #${formData.lrNumber || ""} updated successfully!`);
      } else {
        const res = await api.post("/lr-bilties", formData);
        savedData = res.data?.data;
        toast.success(`LR #${savedData?.lrNumber || formData.lrNumber} generated successfully!`);
      }

      setIsFormOpen(false);
      setEditingLR(null);
      await loadData();

      if (openPrint && savedData) {
        setPrintLR(savedData);
      }
    } catch (err) {
      console.error("Save LR Bilty error:", err);
      toast.error(err.response?.data?.message || "Failed to save LR/Bilty");
    } finally {
      setSaving(false);
    }
  };

  // Delete LR
  const handleDelete = async (lr) => {
    if (!window.confirm(`Are you sure you want to delete LR #${lr.lrNumber || ""}? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/lr-bilties/${lr._id}`);
      if (res.data?.success) {
        toast.success(`LR #${lr.lrNumber} deleted successfully`);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete LR Bilty");
    }
  };

  // WhatsApp Message Composer
  const handleOpenWhatsApp = (lr) => {
    const vNum = lr.vehicleId?.vehicleNumber || lr.vehicleNumber || "—";
    const dName = lr.driverId?.name || lr.driverName || "Driver";
    const dPhone = lr.driverId?.phone || lr.driverPhone || "";
    const pName = lr.consigneeName || lr.partyName || "Customer";
    const pPhone = lr.partyId?.phone || lr.partyPhone || "";
    const qty = Number(lr.quantity || 0).toLocaleString("en-IN");
    const mat = lr.article || "Bricks";
    const fr = Number(lr.freightAmount || 0).toLocaleString("en-IN");
    const adv = Number(lr.advanceAmount || 0).toLocaleString("en-IN");
    const bal = Number(lr.balanceAmount || 0).toLocaleString("en-IN");
    const lrDate = lr.lrDate ? new Date(lr.lrDate).toLocaleDateString("en-IN") : "Today";

    const msg =
      `*SHRI SHYAM BRICKS — OFFICIAL LORRY RECEIPT (BILTY)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *LR Number:* ${lr.lrNumber || "—"}\n` +
      `📅 *Date:* ${lrDate}\n` +
      `🚛 *Truck No:* ${vNum}\n` +
      `👤 *Driver:* ${dName} (${dPhone})\n` +
      `🏢 *Consignee:* ${pName}\n` +
      `📍 *Route:* ${lr.fromCity || "Jaipur"} ➔ ${lr.toCity || "Site"}\n` +
      `🧱 *Goods & Qty:* ${qty} ${lr.unit || "Pcs"} ${mat}\n` +
      `💰 *Total Freight:* ₹${fr}\n` +
      `💵 *Advance Received:* ₹${adv}\n` +
      `💳 *Balance Payable:* ₹${bal}\n` +
      `📌 *Freight By:* ${lr.freightBy || "TBB"}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Status:* ${lr.status?.toUpperCase() || "DISPATCHED"}\n` +
      `_Safe transit and timely delivery guaranteed. Thank you for your business!_`;

    setWhatsAppLR({
      phone: pPhone || dPhone,
      message: msg,
      title: `Share LR #${lr.lrNumber} via WhatsApp`,
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const columns = [
      { key: "lrNumber", label: "LR / Bilty No" },
      { key: "lrDate", label: "Date", type: "date" },
      { key: "vehicleNumber", label: "Truck No" },
      { key: "driverName", label: "Driver Name" },
      { key: "driverPhone", label: "Driver Mobile" },
      { key: "consignorName", label: "Consignor (Sender)" },
      { key: "consigneeName", label: "Consignee (Party / Site)" },
      { key: "fromCity", label: "From City" },
      { key: "toCity", label: "To City / Destination" },
      { key: "article", label: "Material / Bricks" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "unit", label: "Unit" },
      { key: "freightAmount", label: "Freight Amount (₹)", type: "number" },
      { key: "advanceAmount", label: "Advance (₹)", type: "number" },
      { key: "balanceAmount", label: "Balance (₹)", type: "number" },
      { key: "freightBy", label: "Freight Mode" },
      { key: "status", label: "Delivery Status" },
      { key: "remarks", label: "Remarks" },
    ];

    const dataRows = filteredBilties.map((l) => ({
      lrNumber: l.lrNumber || "—",
      lrDate: l.lrDate ? new Date(l.lrDate).toISOString().split("T")[0] : "—",
      vehicleNumber: l.vehicleId?.vehicleNumber || l.vehicleNumber || "—",
      driverName: l.driverId?.name || l.driverName || "—",
      driverPhone: l.driverId?.phone || l.driverPhone || "—",
      consignorName: (l.consignorName || "Shri Shyam Bricks").replace(/\s+co\.?$/i, ""),
      consigneeName: l.consigneeName || l.partyName || "—",
      fromCity: l.fromCity || "Jaipur",
      toCity: l.toCity || "—",
      article: l.article || "Red Bricks",
      quantity: Number(l.quantity) || 0,
      unit: l.unit || "Pcs",
      freightAmount: Number(l.freightAmount) || 0,
      advanceAmount: Number(l.advanceAmount) || 0,
      balanceAmount: Number(l.balanceAmount) || 0,
      freightBy: l.freightBy || "TBB",
      status: (l.status || "Dispatched").toUpperCase(),
      remarks: l.remarks || "—",
    }));

    exportToExcelProfessional({
      title: "Consignment Register & LR / Bilty Records",
      subtitle: `${(activeCompany?.name || "Shri Shyam Bricks").replace(/\s+co\.?$/i, "")} • Central Logistics Dispatch Desk`,
      filename: `${activeCompany?.code || "SSBC"}_LR_Bilty_Register`,
      sheetName: "LR BILTY REGISTER",
      columns,
      rows: dataRows,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-orange-100 text-orange-700">
              <FileText className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
              Kiln Logistics • Consignment Note &amp; Bilty Desk
            </p>
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2.5">
            <span>LR / Bilty Register</span>
            <span className="rounded-full bg-orange-100 text-orange-900 border border-orange-300 px-2.5 py-0.5 text-xs font-black">
              कंसाइनमेंट बिल्टी
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Official Motor Transport Goods Receipts • Site Delivery Consignment Notes &amp; Driver Challans ·{" "}
            {activeCompany?.city ? `${activeCompany.city} Kiln Hub` : "Jaipur Kiln Hub"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
            title="Refresh Records"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-orange-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95 cursor-pointer"
            title="Export Clean Excel Report"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-orange-600/30 transition-all hover:from-orange-500 hover:to-amber-500 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ Create LR / Bilty</span>
          </button>
        </div>
      </div>

      {/* Logistics KPI Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Bilties</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-50 text-orange-600">
              <FileText className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
          </div>
          <p className="mt-1 font-mono text-2xl font-black text-slate-900">{stats.totalBilties}</p>
          <span className="text-[10px] font-medium text-slate-400">Official consignment records</span>
        </div>

        <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Dispatched</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-purple-100 text-purple-700">
              <Navigation className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-1 font-mono text-2xl font-black text-purple-900">{stats.dispatched}</p>
          <span className="text-[10px] font-medium text-purple-700">Loaded &amp; Dispatched</span>
        </div>

        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">In Transit</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 text-blue-700">
              <Truck className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
          </div>
          <p className="mt-1 font-mono text-2xl font-black text-blue-900">{stats.inTransit}</p>
          <span className="text-[10px] font-medium text-blue-700">Highway Movement</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Delivered</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
          </div>
          <p className="mt-1 font-mono text-2xl font-black text-emerald-900">{stats.delivered}</p>
          <span className="text-[10px] font-medium text-emerald-700">Unloaded at site</span>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Bricks Carried</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-700">
              <Layers className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
          </div>
          <p className="mt-1 font-mono text-2xl font-black text-amber-950">{stats.totalQty.toLocaleString("en-IN")}</p>
          <span className="text-[10px] font-medium text-amber-700">Total Pcs Loaded</span>
        </div>

        <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50/60 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-800">Total Freight</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-200/80 text-orange-900">
              <IndianRupee className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
          </div>
          <p className="mt-1 font-mono text-xl font-black text-orange-950">₹{stats.totalFreight.toLocaleString("en-IN")}</p>
          <span className="text-[10px] font-bold text-orange-700">
            Adv: ₹{stats.totalAdvance.toLocaleString("en-IN")} • Bal: ₹{stats.totalBalance.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            {[
              { id: "", label: "All Bilties", count: stats.totalBilties },
              { id: "dispatched", label: "Dispatched", count: stats.dispatched },
              { id: "in_transit", label: "In Transit", count: stats.inTransit },
              { id: "delivered", label: "Delivered", count: stats.delivered },
              { id: "cancelled", label: "Cancelled", count: stats.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-orange-900 shadow-2xs border border-orange-200 font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-black ${
                    statusFilter === tab.id ? "bg-orange-600 text-white" : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Freight Mode Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Freight By:</span>
            <select
              value={freightByFilter}
              onChange={(e) => setFreightByFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
            >
              <option value="">All Modes</option>
              <option value="TBB">T.B.B. (To Be Billed)</option>
              <option value="PAID">PAID</option>
              <option value="TO_PAY">TO PAY</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by LR No, Truck No, Driver Name, Customer Party, Delivery Site, or Route..."
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 py-2.5 pl-10 pr-24 text-sm font-medium outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-200/70 rounded-md px-2 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main LR Bilty Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50/70 text-[11px] font-black uppercase tracking-wider text-slate-700">
                <th className="px-3.5 py-3.5 text-center w-10">#</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">LR No &amp; Date</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">Truck &amp; Driver</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">Consignor (Party)</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">Consignee &amp; Delivery Site</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap">Route (From ➔ To)</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap text-right">Goods &amp; Qty</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap text-right">Freight Charges</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap text-center">Status</th>
                <th className="px-3.5 py-3.5 whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
                    <p className="mt-3 text-xs font-bold text-slate-500">Loading LR / Bilty Register...</p>
                  </td>
                </tr>
              ) : filteredBilties.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-slate-500">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 stroke-[1.5]" />
                    <p className="mt-3 text-base font-bold text-slate-800">No LR / Bilty Records Found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {search || statusFilter
                        ? "Try clearing your filters or search keywords to view records."
                        : "Generate your first official consignment note (LR Bilty) against vehicle dispatch."}
                    </p>
                    {!search && !statusFilter && (
                      <button
                        onClick={handleOpenCreate}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:bg-amber-400 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create First LR / Bilty</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredBilties.map((lr, idx) => {
                  const vNum = lr.vehicleId?.vehicleNumber || lr.vehicleNumber || "—";
                  const isMarket = lr.vehicleId?.ownerType === "market" || lr.vehicleId?.ownership === "market";
                  const dName = lr.driverId?.name || lr.driverName || "—";
                  const dPhone = lr.driverId?.phone || lr.driverPhone || "";
                  const pName = lr.consigneeName || lr.partyName || lr.consignorName || "—";
                  const site = lr.consigneeAddress || lr.toCity || "—";
                  const qty = Number(lr.quantity || 0);
                  const fr = Number(lr.freightAmount || lr.rate || 0);
                  const adv = Number(lr.advanceAmount || 0);
                  const bal = Math.max(0, fr - adv);
                  const st = (lr.status || "dispatched").toLowerCase();

                  return (
                    <tr
                      key={lr._id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      {/* Index */}
                      <td className="px-3.5 py-3 text-center text-slate-400 font-mono text-[11px] font-bold">
                        {idx + 1}
                      </td>

                      {/* LR Number & Date */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-900 bg-orange-100/70 border border-orange-300/80 px-2 py-0.5 rounded-md">
                            {lr.lrNumber || "LR-PENDING"}
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            {lr.center || "PLANT"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>
                            {lr.lrDate ? new Date(lr.lrDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Truck & Driver */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-950 uppercase">
                            {vNum}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase ${
                              isMarket
                                ? "bg-purple-100 text-purple-900 border border-purple-200"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            }`}
                          >
                            {isMarket ? "Market" : "Fleet"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                          <span className="font-semibold">{dName}</span>
                          {dPhone && (
                            <a
                              href={`tel:${dPhone}`}
                              className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline font-mono"
                            >
                              <Phone className="h-2.5 w-2.5" />
                              <span>{dPhone.slice(-10)}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Consignor (Party) */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <p className="font-bold text-slate-800 max-w-[150px] truncate" title={lr.consignorName || activeCompany?.name}>
                          {lr.consignorName || activeCompany?.name || "Shri Shyam Bricks"}
                        </p>
                        <p className="text-[10px] text-slate-400 max-w-[150px] truncate">
                          {lr.consignorAddress || "Plant Depot"}
                        </p>
                      </td>

                      {/* Consignee & Site */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <p className="font-black text-slate-900 max-w-[160px] truncate" title={pName}>
                          {pName}
                        </p>
                        <p className="text-[10px] text-slate-500 max-w-[160px] truncate flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                          <span>{site}</span>
                        </p>
                      </td>

                      {/* Route */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                          <span>{lr.fromCity || "Jaipur"}</span>
                          <span className="text-orange-500 font-black">➔</span>
                          <span>{lr.toCity || "Site"}</span>
                        </div>
                        {lr.tripNumber && (
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                            Trip #{lr.tripNumber}
                          </span>
                        )}
                      </td>

                      {/* Goods & Qty */}
                      <td className="px-3.5 py-3 whitespace-nowrap text-right">
                        <p className="font-mono text-sm font-black text-slate-900">
                          {qty.toLocaleString("en-IN")}{" "}
                          <span className="text-[10px] font-sans font-bold text-slate-500">{lr.unit || "Pcs"}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[120px]">
                          {lr.article || "Bricks"}
                        </p>
                      </td>

                      {/* Freight Charges */}
                      <td className="px-3.5 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-mono text-xs font-black text-slate-950">
                            ₹{fr.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`rounded px-1 text-[9px] font-black uppercase ${
                              lr.freightBy === "PAID"
                                ? "bg-emerald-100 text-emerald-900"
                                : lr.freightBy === "TO_PAY"
                                ? "bg-rose-100 text-rose-900"
                                : "bg-blue-100 text-blue-900"
                            }`}
                          >
                            {lr.freightBy || "TBB"}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Adv: ₹{adv.toLocaleString("en-IN")} • <span className="font-bold text-rose-600">Bal: ₹{bal.toLocaleString("en-IN")}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            st === "delivered"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : st === "in_transit"
                              ? "bg-blue-100 text-blue-900 border border-blue-300"
                              : st === "cancelled"
                              ? "bg-rose-100 text-rose-900 border border-rose-300"
                              : "bg-amber-100 text-amber-950 border border-amber-300"
                          }`}
                        >
                          {st === "delivered"
                            ? "Delivered"
                            : st === "in_transit"
                            ? "In Transit"
                            : st === "cancelled"
                            ? "Cancelled"
                            : "Dispatched"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1-CLICK PRINT / PDF BUTTON */}
                          <button
                            onClick={() => setPrintLR(lr)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2.5 py-1 text-xs shadow-xs border border-amber-500 transition active:scale-95 cursor-pointer"
                            title="Print Official Lorry Receipt / Bilty (Consignee, Consignor, Driver copy)"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-950" />
                            <span>Print</span>
                          </button>

                          {/* WhatsApp Share */}
                          <button
                            onClick={() => handleOpenWhatsApp(lr)}
                            className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 p-1.5 transition active:scale-95 cursor-pointer"
                            title="Share Bilty details directly on WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-700" />
                          </button>

                          {/* View */}
                          <button
                            onClick={() => setViewingLR(lr)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition cursor-pointer"
                            title="View Full Bilty Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit */}
                          {st !== "cancelled" && (
                            <button
                              onClick={() => handleOpenEdit(lr)}
                              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                              title="Edit Bilty Record"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(lr)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Bilty"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl my-8 max-h-[92vh] flex flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {editingLR ? `Edit LR / Bilty #${editingLR.lrNumber}` : "Generate New LR / Bilty (कंसाइनमेंट बिल्टी)"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official Goods Transport Consignment Receipt &amp; Driver Delivery Note
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSubmitForm(e, false)} className="flex-1 overflow-y-auto py-4 space-y-5 text-xs font-semibold">
              {/* SECTION 1: LR Number & Date */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3.5">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>1. LR Document Details</span>
                </p>

                {tripOptions.length > 0 && (
                  <div>
                    <SearchableSelect
                      label="Link Live Trip Dispatch (Optional — 1-Click Auto-Fill)"
                      placeholder="Select a trip to automatically populate truck, driver, party, route, and freight..."
                      value={formData.tripId || ""}
                      options={tripOptions}
                      onChange={(val, raw) => {
                        if (!raw) return;
                        setFormData((prev) => ({
                          ...prev,
                          tripId: val,
                          vehicleId: raw.vehicleId?._id || raw.vehicleId || prev.vehicleId,
                          vehicleNumber: raw.truckNumber || raw.vehicleId?.vehicleNumber || prev.vehicleNumber,
                          driverId: raw.driverId?._id || raw.driverId || prev.driverId,
                          driverName: raw.driverName || raw.driverId?.name || prev.driverName,
                          driverPhone: raw.driverPhone || raw.driverId?.phone || prev.driverPhone,
                          partyName: raw.partyName || raw.customerName || prev.partyName,
                          partyId: raw.customerId || raw.partyId || prev.partyId,
                          consigneeName: raw.partyName || raw.customerName || prev.consigneeName,
                          consigneeAddress: raw.toCity ? `${raw.toCity} Delivery Site` : prev.consigneeAddress,
                          fromCity: raw.fromCity || prev.fromCity,
                          toCity: raw.toCity || prev.toCity,
                          rate: Number(raw.rate) || prev.rate,
                          freightAmount: Number(raw.rate) || prev.freightAmount,
                          advanceAmount: Number(raw.advanceAmount) || prev.advanceAmount,
                          balanceAmount: Math.max(0, (Number(raw.rate) || 0) - (Number(raw.advanceAmount) || 0)),
                          status: "dispatched",
                          remarks: `Created for Trip #${raw.tripNumber || ""}`,
                        }));
                        toast.success(`Trip #${raw.tripNumber || ""} details auto-filled!`);
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      LR / Bilty No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lrNumber}
                      onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g. LR-2026-001"
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-black text-slate-900 outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Issue Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.lrDate}
                      onChange={(e) => setFormData({ ...formData, lrDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Loading Center
                    </label>
                    <select
                      value={formData.center}
                      onChange={(e) => setFormData({ ...formData, center: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="PLANT">PLANT (Kiln Yard)</option>
                      <option value="GODOWN">GODOWN</option>
                      <option value="MARKET">MARKET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Freight Mode
                    </label>
                    <select
                      value={formData.freightBy}
                      onChange={(e) => setFormData({ ...formData, freightBy: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-black text-slate-900 outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="TBB">T.B.B. (To Be Billed)</option>
                      <option value="PAID">PAID</option>
                      <option value="TO_PAY">TO PAY</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Vehicle & Driver */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-700 mb-3 flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  <span>2. Vehicle &amp; Driver Details</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <SearchableSelect
                      label="Assigned Truck / Vehicle"
                      required
                      entityType="vehicle"
                      entityLabel="Truck"
                      placeholder="Select truck..."
                      value={formData.vehicleId || formData.vehicleNumber}
                      options={vehicleOptions}
                      onChange={(val, raw) => {
                        const nextForm = {
                          ...formData,
                          vehicleId: val,
                          vehicleNumber: raw?.vehicleNumber || formData.vehicleNumber,
                        };

                        // Auto-link assigned driver if not already selected
                        const assignedDriver = drivers.find(
                          (d) =>
                            String(d.assignedVehicleId?._id || d.assignedVehicleId || "") === String(val) ||
                            String(raw?.driverId?._id || raw?.driverId || "") === String(d._id)
                        );
                        if (assignedDriver && !formData.driverId) {
                          nextForm.driverId = assignedDriver._id;
                          nextForm.driverName = assignedDriver.name || "";
                          nextForm.driverPhone = assignedDriver.phone || "";
                        }

                        setFormData(nextForm);
                      }}
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label="Driver Name"
                      entityType="driver"
                      entityLabel="Driver"
                      placeholder="Select driver..."
                      value={formData.driverId || formData.driverName}
                      options={driverOptions}
                      onChange={(val, raw) => {
                        const nextForm = {
                          ...formData,
                          driverId: val,
                          driverName: raw?.name || formData.driverName,
                          driverPhone: raw?.phone || formData.driverPhone,
                        };

                        // Auto-link assigned truck if not selected
                        const assignedVehId = raw?.assignedVehicleId?._id || raw?.assignedVehicleId;
                        if (assignedVehId && !formData.vehicleId) {
                          const veh = vehicles.find((v) => String(v._id) === String(assignedVehId));
                          if (veh) {
                            nextForm.vehicleId = veh._id;
                            nextForm.vehicleNumber = veh.vehicleNumber || "";
                          }
                        }

                        setFormData(nextForm);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Driver Mobile No
                    </label>
                    <input
                      type="tel"
                      value={formData.driverPhone}
                      onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                      placeholder="10 digit mobile"
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Consignor & Consignee */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-700 mb-3 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>3. Consignor (Sender) &amp; Consignee (Receiver / Site)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Consignor */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                        Consignor Name (Sender / Plant)
                      </label>
                      <input
                        type="text"
                        value={formData.consignorName}
                        onChange={(e) => setFormData({ ...formData, consignorName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-800 outline-none focus:border-amber-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                        Consignor Plant Address
                      </label>
                      <input
                        type="text"
                        value={formData.consignorAddress}
                        onChange={(e) => setFormData({ ...formData, consignorAddress: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 outline-none focus:border-amber-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Consignee */}
                  <div className="space-y-2">
                    <div>
                      <SearchableSelect
                        label="Consignee (Customer / Builder / Receiver)"
                        required
                        entityType="party"
                        entityLabel="Customer / Party"
                        placeholder="Select customer or party..."
                        value={formData.partyId || formData.partyName || formData.consigneeName}
                        options={partyOptions}
                        onChange={(val, raw) => {
                          setFormData((prev) => ({
                            ...prev,
                            partyId: val,
                            partyName: raw?.name || prev.partyName,
                            consigneeName: raw?.name || prev.consigneeName,
                            consigneeAddress: raw?.address || prev.consigneeAddress,
                            toCity: prev.toCity || raw?.city || "",
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                        Consignee Delivery Site Address
                      </label>
                      <input
                        type="text"
                        value={formData.consigneeAddress}
                        onChange={(e) => setFormData({ ...formData, consigneeAddress: e.target.value })}
                        placeholder="Construction site location / plot no."
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 outline-none focus:border-amber-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Route & Material */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-700 mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>4. Transit Route &amp; Cargo Specifications</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      From Station / City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fromCity}
                      onChange={(e) => setFormData({ ...formData, fromCity: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      To Station / Destination <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.toCity}
                      onChange={(e) => setFormData({ ...formData, toCity: e.target.value })}
                      placeholder="e.g. Sikar Road, Jaipur"
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Article / Description
                    </label>
                    <input
                      type="text"
                      value={formData.article}
                      onChange={(e) => setFormData({ ...formData, article: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Quantity (Bricks) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-black text-slate-900 outline-none focus:border-amber-500 bg-white"
                      />
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="rounded-xl border border-slate-200 bg-white p-2.5 font-bold text-xs"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="MT">MT</option>
                        <option value="Trip">Trip</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Commercial & Freight */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-700 mb-3 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5" />
                  <span>5. Freight &amp; Commercial Billing</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Agreed Freight Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.freightAmount}
                      onChange={(e) => {
                        const fr = Number(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          freightAmount: fr,
                          balanceAmount: Math.max(0, fr - Number(formData.advanceAmount || 0)),
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-black text-slate-900 outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Trip Advance Received (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.advanceAmount}
                      onChange={(e) => {
                        const adv = Number(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          advanceAmount: adv,
                          balanceAmount: Math.max(0, Number(formData.freightAmount || 0) - adv),
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900 outline-none focus:border-amber-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Balance Payable (₹)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formData.balanceAmount}
                      className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-black text-rose-600 bg-slate-100/70"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Consignment Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="dispatched">Dispatched (On Highway)</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered (Unloaded at site)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Remarks / Delivery Instructions
                  </label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="e.g. Unloading hamali party account"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 outline-none focus:border-amber-500 bg-white"
                  />
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex shrink-0 items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={(e) => handleSubmitForm(e, true)}
                    className="rounded-xl border border-amber-500 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 font-black text-amber-950 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Save &amp; Print Bilty</span>
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-2.5 font-black text-white shadow-md shadow-orange-600/20 hover:from-orange-500 hover:to-amber-500 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>{saving ? "Saving..." : editingLR ? "Update LR Bilty" : "Generate LR Bilty"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingLR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-orange-800 font-black">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Consignment Note • LR #{viewingLR.lrNumber || "—"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Issue Date: {viewingLR.lrDate ? new Date(viewingLR.lrDate).toLocaleDateString("en-IN") : "—"} • Center: {viewingLR.center || "PLANT"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingLR(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Truck No</span>
                <span className="font-mono text-sm font-black text-slate-900">
                  {viewingLR.vehicleId?.vehicleNumber || viewingLR.vehicleNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Driver</span>
                <span className="font-bold text-slate-800">
                  {viewingLR.driverId?.name || viewingLR.driverName || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Driver Mobile</span>
                <span className="font-mono font-bold text-slate-800">
                  {viewingLR.driverId?.phone || viewingLR.driverPhone || "—"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Consignor</span>
                <span className="font-bold text-slate-800">{viewingLR.consignorName || "Shri Shyam Bricks"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Consignee</span>
                <span className="font-bold text-slate-800">{viewingLR.consigneeName || viewingLR.partyName || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivery Site</span>
                <span className="text-slate-700 truncate block">{viewingLR.consigneeAddress || viewingLR.toCity || "—"}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">From City</span>
                <span className="font-bold text-slate-800">{viewingLR.fromCity || "Jaipur"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">To City</span>
                <span className="font-bold text-slate-800">{viewingLR.toCity || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Quantity</span>
                <span className="font-mono font-black text-slate-900">
                  {Number(viewingLR.quantity || 0).toLocaleString("en-IN")} {viewingLR.unit || "Pcs"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Freight Amount</span>
                <span className="font-mono font-black text-slate-900">
                  ₹{Number(viewingLR.freightAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Advance</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{Number(viewingLR.advanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Balance Due</span>
                <span className="font-mono font-black text-rose-600">
                  ₹{Number(viewingLR.balanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Status: <strong className="uppercase text-slate-700">{viewingLR.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewingLR(null);
                    handleOpenWhatsApp(viewingLR);
                  }}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    const target = viewingLR;
                    setViewingLR(null);
                    setPrintLR(target);
                  }}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 border border-amber-500 px-4 py-2 text-xs font-black text-slate-950 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Official Bilty Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT BILTY MODAL */}
      {printLR && (
        <BiltyPrintModal
          lrId={printLR._id}
          biltyData={printLR}
          onClose={() => setPrintLR(null)}
        />
      )}

      {/* WHATSAPP MODAL */}
      {whatsAppLR && (
        <WhatsAppShareModal
          isOpen={Boolean(whatsAppLR)}
          onClose={() => setWhatsAppLR(null)}
          title={whatsAppLR.title}
          defaultPhone={whatsAppLR.phone}
          defaultMessage={whatsAppLR.message}
        />
      )}
    </div>
  );
}

