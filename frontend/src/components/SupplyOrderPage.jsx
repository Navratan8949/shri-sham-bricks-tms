"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
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
} from "lucide-react";
import api from "@/src/services/api";
import { useActiveCompany, getStoredUser } from "@/src/lib/auth";
import { exportToExcelProfessional } from "@/src/lib/excelExport";
import SearchableSelect from "@/src/components/SearchableSelect";
import { toast } from "sonner";

export default function SupplyOrderPage() {
  const router = useRouter();
  const activeCompany = useActiveCompany();
  const user = getStoredUser();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Options for modal
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);

  const customerOptions = useMemo(() => {
    return (customers || []).map((c) => ({
      value: c._id || c.name,
      label: c.name,
      subtext: [
        c.city ? `📍 ${c.city}` : "",
        c.phone ? `Ph: ${c.phone}` : "",
        c.gstNumber ? `GST: ${c.gstNumber}` : "",
      ]
        .filter(Boolean)
        .join(" • "),
      raw: c,
    }));
  }, [customers]);

  // Only Free / Available Vehicles (not on active trips or under maintenance)
  const freeVehicles = useMemo(() => {
    const liveTrips = (trips || []).filter(
      (t) =>
        t.status === "dispatched" ||
        t.status === "in_transit" ||
        t.status === "planned" ||
        t.status === "delivered"
    );
    const busyVehicleIds = new Set(
      liveTrips.map((t) => String(t.vehicleId?._id || t.vehicleId)).filter(Boolean)
    );
    const busyVehicleNumbers = new Set(
      liveTrips.map((t) => (t.vehicleId?.vehicleNumber || t.truckNumber || "").trim().toUpperCase()).filter(Boolean)
    );

    return (vehicles || [])
      .filter((v) => {
        if (v.status === "under_maintenance" || v.status === "maintenance" || v.status === "inactive") return false;
        const vId = String(v._id || v.id || "");
        const vNum = (v.vehicleNumber || "").trim().toUpperCase();
        if (busyVehicleIds.has(vId) || busyVehicleNumbers.has(vNum)) return false;
        return true;
      })
      .map((v) => ({
        ...v,
        value: v._id || v.vehicleNumber,
        label: `${v.vehicleNumber} (${v.vehicleType || "Truck"})`,
        subtext: `🟢 Free / Available • ${v.ownerType === "market" ? `Market (${v.ownerName || "Vendor"})` : "Company Fleet"}`,
        raw: v,
      }));
  }, [vehicles, trips]);

  // Only Free / Available Drivers (not on active trips or on leave)
  const freeDrivers = useMemo(() => {
    const liveTrips = (trips || []).filter(
      (t) =>
        t.status === "dispatched" ||
        t.status === "in_transit" ||
        t.status === "planned" ||
        t.status === "delivered"
    );
    const busyDriverIds = new Set(
      liveTrips.map((t) => String(t.driverId?._id || t.driverId)).filter(Boolean)
    );

    return (drivers || [])
      .filter((d) => {
        if (d.status === "inactive" || d.status === "on_leave") return false;
        const dId = String(d._id || d.id || "");
        if (busyDriverIds.has(dId)) return false;
        return true;
      })
      .map((d) => ({
        ...d,
        value: d._id || d.name,
        label: d.phone ? `${d.phone} • ${d.name}` : d.name,
        subtext: `🟢 Free / Available • License: ${d.licenseNumber || "Verified"}`,
        raw: d,
      }));
  }, [drivers, trips]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const printRef = useRef(null);

  // Form State
  const initialForm = {
    soNumber: "",
    soDate: new Date().toISOString().split("T")[0],
    partyId: "",
    partyName: "",
    partyPhone: "",
    deliverySite: "",
    destinationCity: "",
    siteContactPerson: "",
    siteContactPhone: "",
    freightType: "FOR",
    advancePaymentMode: "cash",
    productId: "",
    productName: "Red Clay Bricks (1st Class - लाल ईंट)",
    quantity: 10000,
    unit: "Pieces",
    rate: 7.5,
    advanceReceived: 0,
    expectedDeliveryDate: "",
    vehicleId: "",
    truckNumber: "",
    driverId: "",
    driverName: "",
    driverPhone: "",
    remarks: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // Quick Dispatch Form State
  const [dispatchForm, setDispatchForm] = useState({
    dispatchQuantity: 2500,
    vehicleId: "",
    truckNumber: "",
    driverId: "",
    driverName: "",
    driverPhone: "",
    freightRate: 4500,
    advanceAmount: 1500,
    startingOdometer: 0,
    remarks: "",
  });
  const [dispatching, setDispatching] = useState(false);

  // Load Data
  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/supply-orders");
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error("Load supply orders error:", err);
      toast.error("Failed to load supply orders");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [cRes, pRes, vRes, dRes, trRes] = await Promise.all([
        api.get("/customers").catch(() => ({ data: { data: [] } })),
        api.get("/products").catch(() => ({ data: { data: [] } })),
        api.get("/vehicles").catch(() => ({ data: { data: [] } })),
        api.get("/drivers").catch(() => ({ data: { data: [] } })),
        api.get("/trips").catch(() => ({ data: { data: [] } })),
      ]);
      setCustomers(cRes.data?.data || []);
      setProducts(pRes.data?.data || []);
      setVehicles(vRes.data?.data || []);
      setDrivers(dRes.data?.data || []);
      setTrips(trRes.data?.data || []);
    } catch (err) {
      console.error("Load options error:", err);
    }
  };

  useEffect(() => {
    loadOrders();
    loadOptions();
  }, []);

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.soNumber?.toLowerCase().includes(q) ||
        o.partyName?.toLowerCase().includes(q) ||
        o.partyPhone?.toLowerCase().includes(q) ||
        o.deliverySite?.toLowerCase().includes(q) ||
        o.productName?.toLowerCase().includes(q) ||
        o.truckNumber?.toLowerCase().includes(q) ||
        o.driverName?.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, paymentFilter, search]);

  // Statistics
  const stats = useMemo(() => {
    let totalBricks = 0;
    let dispatchedBricks = 0;
    let pendingBricks = 0;
    let totalValue = 0;
    let advanceTotal = 0;
    let pendingOrdersCount = 0;

    orders.forEach((o) => {
      const q = Number(o.quantity) || 0;
      const d = Number(o.dispatchedQuantity) || 0;
      const p = Math.max(0, q - d);
      totalBricks += q;
      dispatchedBricks += d;
      pendingBricks += p;
      totalValue += Number(o.totalAmount) || 0;
      advanceTotal += Number(o.advanceReceived) || 0;
      if (o.status === "pending" || o.status === "partially_dispatched") {
        pendingOrdersCount++;
      }
    });

    return {
      totalOrders: orders.length,
      pendingOrdersCount,
      totalBricks,
      dispatchedBricks,
      pendingBricks,
      totalValue,
      advanceTotal,
      balanceTotal: Math.max(0, totalValue - advanceTotal),
    };
  }, [orders]);

  // Handle Open Create Modal
  const handleOpenCreate = () => {
    setEditingOrder(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      soNumber: order.soNumber || "",
      soDate: order.soDate ? new Date(order.soDate).toISOString().split("T")[0] : "",
      partyId: order.partyId?._id || order.partyId || "",
      partyName: order.partyName || "",
      partyPhone: order.partyPhone || "",
      deliverySite: order.deliverySite || "",
      destinationCity: order.destinationCity || "",
      siteContactPerson: order.siteContactPerson || "",
      siteContactPhone: order.siteContactPhone || "",
      freightType: order.freightType || "FOR",
      advancePaymentMode: order.advancePaymentMode || "cash",
      productId: order.productId?._id || order.productId || "",
      productName: order.productName || "",
      quantity: order.quantity || 1000,
      unit: order.unit || "Pieces",
      rate: order.rate || 7.5,
      advanceReceived: order.advanceReceived || 0,
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split("T")[0] : "",
      vehicleId: order.vehicleId?._id || order.vehicleId || "",
      truckNumber: order.truckNumber || "",
      driverId: order.driverId?._id || order.driverId || "",
      driverName: order.driverName || "",
      driverPhone: order.driverPhone || "",
      remarks: order.remarks || "",
    });
    setIsFormOpen(true);
  };

  // Submit Create / Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.partyName?.trim()) {
      toast.error("Customer / Party Name is required");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error("Valid order quantity is required");
      return;
    }

    try {
      if (editingOrder) {
        const res = await api.put(`/supply-orders/${editingOrder._id}`, formData);
        if (res.data?.success) {
          toast.success(`Supply Order #${res.data.data.soNumber} updated!`);
          setIsFormOpen(false);
          loadOrders();
        }
      } else {
        const res = await api.post("/supply-orders", formData);
        if (res.data?.success) {
          toast.success(`Supply Order #${res.data.data.soNumber} created!`);
          setIsFormOpen(false);
          loadOrders();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save Supply Order");
    }
  };

  // Open Full Create Trip Dispatch Form prefilled with this Supply Order
  const handleOpenDispatch = (order) => {
    const pend = Number(order.pendingQuantity) || Number(order.quantity) || 3000;
    const isExKiln = order.freightType === "EX_KILN";
    const munshiNote = order.siteContactPhone
      ? ` • Site Munshi: ${order.siteContactPerson || "Incharge"} (${order.siteContactPhone})`
      : "";
    const today = new Date().toISOString().split("T")[0];

    const query = new URLSearchParams({
      autoOpenAdd: "true",
      fromSupplyOrder: "true",
      supplyOrderId: String(order._id),
      supplyOrderNumber: String(order.soNumber || ""),
      partyName: order.partyName || "",
      partyId: String(order.partyId?._id || order.partyId || ""),
      fromCity: order.originHub || "Shri Shyam Kiln, Tonk Road",
      toCity: order.deliverySite || order.destinationCity || "",
      rate: String(isExKiln ? 0 : 4500),
      advanceAmount: String(isExKiln ? 0 : 1500),
      balanceAmount: String(isExKiln ? 0 : 3000),
      weight: String(pend),
      containerSize: `${pend.toLocaleString("en-IN")} Pcs ${order.productName || "Bricks"}`,
      remarks: `Dispatch for Supply Order #${order.soNumber} • ${order.productName || "Red Clay Bricks"} (${pend.toLocaleString("en-IN")} Pcs remaining)${munshiNote}`,
      dispatchDate: today,
    });

    if (order.vehicleId) {
      query.set("vehicleId", String(order.vehicleId?._id || order.vehicleId));
    }
    if (order.truckNumber) {
      query.set("truckNumber", String(order.truckNumber));
    }
    if (order.driverId) {
      query.set("driverId", String(order.driverId?._id || order.driverId));
    }
    if (order.driverName) {
      query.set("driverName", String(order.driverName));
    }
    if (order.driverPhone) {
      query.set("driverPhone", String(order.driverPhone));
    }

    router.push(`/trips?${query.toString()}`);
  };

  // Submit Quick Dispatch (legacy fallback)
  const handleDispatchTrip = async (e) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;
    if (!dispatchForm.dispatchQuantity || Number(dispatchForm.dispatchQuantity) <= 0) {
      toast.error("Valid dispatch quantity is required");
      return;
    }

    setDispatching(true);
    try {
      const res = await api.post(`/supply-orders/${dispatchModalOrder._id}/dispatch-trip`, dispatchForm);
      if (res.data?.success) {
        toast.success(res.data.message || "Trip dispatched successfully!");
        setDispatchModalOrder(null);
        loadOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch trip");
    } finally {
      setDispatching(false);
    }
  };

  // Delete Order
  const handleDelete = async (order) => {
    if (!window.confirm(`Are you sure you want to delete Supply Order #${order.soNumber}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/supply-orders/${order._id}`);
      if (res.data?.success) {
        toast.success(`Supply Order #${order.soNumber} deleted`);
        loadOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete order");
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!filteredOrders.length) {
      toast.error("No supply orders to export");
      return;
    }

    const columns = [
      { key: "soNumber", label: "Supply Order #" },
      { key: "soDate", label: "Order Date", type: "date" },
      { key: "partyName", label: "Customer / Party Name" },
      { key: "partyPhone", label: "Customer Mobile" },
      { key: "productName", label: "Brick Product" },
      { key: "quantity", label: "Ordered Quantity", type: "number" },
      { key: "dispatchedQuantity", label: "Dispatched Quantity", type: "number" },
      { key: "pendingQuantity", label: "Pending Quantity", type: "number" },
      { key: "unit", label: "Unit" },
      { key: "rate", label: "Rate (₹)", type: "number" },
      { key: "totalAmount", label: "Total Amount (₹)", type: "number" },
      { key: "advanceReceived", label: "Advance Received (₹)", type: "number" },
      { key: "advancePaymentMode", label: "Advance Mode" },
      { key: "balanceAmount", label: "Balance Due (₹)", type: "number" },
      { key: "freightType", label: "Freight Terms (FOR/Ex-Kiln)" },
      { key: "deliverySite", label: "Delivery Site" },
      { key: "destinationCity", label: "Destination City" },
      { key: "siteContactPerson", label: "Site Munshi Name" },
      { key: "siteContactPhone", label: "Site Munshi Phone" },
      { key: "status", label: "Order Status" },
      { key: "paymentStatus", label: "Payment Status" },
      { key: "truckNumber", label: "Assigned Truck" },
      { key: "driverName", label: "Driver Name" },
    ];

    exportToExcelProfessional({
      filename: `Supply_Orders_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Supply Orders",
      reportTitle: "SHRI SHYAM BRICKS - SUPPLY ORDER REGISTER",
      columns,
      data: filteredOrders,
    });
    toast.success("Supply Orders exported to Excel!");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black shadow-md shadow-orange-600/30">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                Supply Order Register
                <span className="rounded-full bg-orange-100 text-orange-900 border border-orange-300 px-2 py-0.5 text-xs font-black">
                  सप्लाई ऑर्डर
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Customer Brick Demand • Site Fulfillment • Tipper &amp; Lorry Dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            title="Refresh order register"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-orange-600/30 hover:from-orange-500 hover:to-amber-500 active:scale-95 transition cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ New Supply Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Orders</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.totalOrders}</p>
          <span className="text-[10px] text-slate-400 font-medium">Registered in book</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Active Demand</p>
          <p className="mt-1 text-2xl font-black text-amber-900">{stats.pendingOrdersCount}</p>
          <span className="text-[10px] text-amber-700 font-medium">In-progress orders</span>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-800">Total Ordered</p>
          <p className="mt-1 text-2xl font-black text-orange-950 font-mono">
            {stats.totalBricks.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-orange-700 font-medium">Bricks demanded (Pcs)</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Dispatched</p>
          <p className="mt-1 text-2xl font-black text-emerald-900 font-mono">
            {stats.dispatchedBricks.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">
            {stats.totalBricks > 0 ? `${((stats.dispatchedBricks / stats.totalBricks) * 100).toFixed(0)}% fulfilled` : "0%"}
          </span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Pending Delivery</p>
          <p className="mt-1 text-2xl font-black text-rose-900 font-mono">
            {stats.pendingBricks.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-rose-700 font-medium">Remaining to load</span>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3.5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Advance Received</p>
          <p className="mt-1 text-xl font-black text-purple-900 font-mono">
            ₹{stats.advanceTotal.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-purple-700 font-medium">
            Bal: ₹{stats.balanceTotal.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Mobile, Site, Product, Truck..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-1.5 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "pending" ? "bg-amber-500 text-slate-950 shadow-2xs font-black" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("partially_dispatched")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "partially_dispatched" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "completed" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-amber-500"
          >
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50/70 text-stone-900 border-b-2 border-orange-200/80 text-[10px] font-black uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Order # &amp; Date</th>
                <th className="px-4 py-3">Customer / Party</th>
                <th className="px-4 py-3">Brick Product</th>
                <th className="px-4 py-3 text-center">Fulfillment Progress</th>
                <th className="px-4 py-3 text-right">Rate &amp; Amount (₹)</th>
                <th className="px-4 py-3">Delivery Site</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCcw className="mx-auto h-6 w-6 animate-spin text-amber-500 mb-2" />
                    <span>Loading supply orders...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <ClipboardList className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No supply orders found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create a new supply order when a party orders bricks for their site.
                    </p>
                    <button
                      onClick={handleOpenCreate}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-orange-600/30 hover:from-orange-500 hover:to-amber-500"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Create First Order</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const qty = Number(order.quantity) || 0;
                  const disp = Number(order.dispatchedQuantity) || 0;
                  const pend = Math.max(0, qty - disp);
                  const percent = qty > 0 ? Math.min(100, Math.round((disp / qty) * 100)) : 0;

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order No & Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-black text-slate-950 block">
                          {order.soNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {order.soDate ? new Date(order.soDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </td>

                      {/* Customer / Party */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{order.partyName}</div>
                        {order.partyPhone && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{order.partyPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Brick Product */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-amber-950 flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[180px]">{order.productName || "Red Clay Bricks"}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {order.unit || "Pieces"}
                        </div>
                      </td>

                      {/* Fulfillment Progress */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="w-36 mx-auto">
                          <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                            <span className="text-emerald-700">{disp.toLocaleString("en-IN")} disp</span>
                            <span className="text-slate-400 font-medium">of {qty.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                percent === 100 ? "bg-emerald-500" : percent > 0 ? "bg-blue-500" : "bg-slate-200"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-right text-rose-600 font-bold mt-0.5">
                            {pend > 0 ? `${pend.toLocaleString("en-IN")} remaining` : "Fully Dispatched ✓"}
                          </div>
                        </div>
                      </td>

                      {/* Rate & Total Amount */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-mono font-black text-slate-900">
                          ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          @ ₹{order.rate} / {order.unit || "pc"}
                        </div>
                        {order.advanceReceived > 0 && (
                          <div className="text-[10px] text-emerald-700 font-bold font-mono">
                            Adv: ₹{Number(order.advanceReceived).toLocaleString("en-IN")}{" "}
                            <span className="text-[9px] uppercase font-semibold text-emerald-600">
                              ({order.advancePaymentMode || "cash"})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Delivery Site */}
                      <td className="px-4 py-3 max-w-[210px]">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="truncate text-slate-800 font-medium" title={order.deliverySite}>
                            {order.deliverySite || "Kiln Yard / Site"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap ml-4 mt-0.5">
                          {order.destinationCity && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              📍 {order.destinationCity}
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-black uppercase px-1 py-0.2 rounded border ${
                              order.freightType === "EX_KILN"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {order.freightType === "EX_KILN" ? "Ex-Kiln (Gate)" : "FOR (Site)"}
                          </span>
                        </div>
                        {order.siteContactPhone && (
                          <div className="text-[10px] text-slate-600 font-semibold truncate ml-4 mt-0.5" title={`Site: ${order.siteContactPerson} (${order.siteContactPhone})`}>
                            👷 {order.siteContactPerson || "Munshi"}: <span className="font-mono text-slate-800">{order.siteContactPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status Badges */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            order.status === "completed"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : order.status === "partially_dispatched"
                              ? "bg-blue-100 text-blue-900 border-blue-300"
                              : order.status === "cancelled"
                              ? "bg-slate-100 text-slate-600 border-slate-300 line-through"
                              : "bg-amber-100 text-amber-900 border-amber-300"
                          }`}
                        >
                          {order.status === "completed"
                            ? "Completed"
                            : order.status === "partially_dispatched"
                            ? "Partial"
                            : order.status === "cancelled"
                            ? "Cancelled"
                            : "Pending"}
                        </span>
                        <span
                          className={`block text-[9px] font-bold mt-1 ${
                            order.paymentStatus === "paid"
                              ? "text-emerald-700"
                              : order.paymentStatus === "partial"
                              ? "text-blue-700"
                              : "text-amber-700"
                          }`}
                        >
                          {order.paymentStatus === "paid"
                            ? "Paid"
                            : order.paymentStatus === "partial"
                            ? "Partial Paid"
                            : "Unpaid"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1-Click Dispatch Trip Button */}
                          {order.status !== "completed" &&
                            order.status !== "cancelled" &&
                            (order.pendingQuantity === undefined ||
                              Number(order.pendingQuantity) > 0) && (
                              <button
                                onClick={() => handleOpenDispatch(order)}
                                className="rounded-lg p-1.5 bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition cursor-pointer flex items-center gap-1 px-2 shadow-2xs"
                                title="1-Click: Dispatch truck trip against this order"
                              >
                                <Truck className="h-3 w-3 stroke-[2.5]" />
                                <span>Dispatch</span>
                              </button>
                            )}

                          {/* Print Order Slip */}
                          <button
                            onClick={() => setPrintOrder(order)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                            title="Print Supply Order Voucher"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit */}
                          {order.status !== "cancelled" && (
                            <button
                              onClick={() => handleOpenEdit(order)}
                              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                              title="Edit Supply Order"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {(order.status === "pending" ||
                            order.status === "cancelled" ||
                            (!order.dispatchedQuantity ||
                              Number(order.dispatchedQuantity) === 0)) &&
                            order.status !== "completed" && (
                              <button
                                onClick={() => handleDelete(order)}
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
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

      {/* CREATE / EDIT SUPPLY ORDER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-slate-950 font-black">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {editingOrder ? `Edit Supply Order #${editingOrder.soNumber}` : "Create New Supply Order (सप्लाई ऑर्डर)"}
                  </h2>
                  <p className="text-xs text-slate-500">Record customer brick demand &amp; delivery site</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-5 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Order Date */}
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Order Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.soDate}
                    onChange={(e) => setFormData({ ...formData, soDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>

                {/* Expected Delivery Date */}
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Expected Delivery Date / Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-amber-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Customer / Party */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SearchableSelect
                    label="Customer / Party Name"
                    required
                    entityType="party"
                    entityLabel="Party"
                    placeholder="Select customer or + Add New Party..."
                    value={formData.partyId || formData.partyName || ""}
                    options={customerOptions}
                    helperText={
                      customerOptions.length > 0
                        ? `${customerOptions.length} registered parties • Click '+ Add Party' if new`
                        : "Click '+ Add Party' to register new customer"
                    }
                    onChange={(val, raw) => {
                      if (raw) {
                        setFormData((prev) => ({
                          ...prev,
                          partyId: raw._id || val,
                          partyName: raw.name || val,
                          partyPhone: raw.phone || prev.partyPhone,
                          destinationCity: prev.destinationCity || raw.city || "",
                          deliverySite: prev.deliverySite || raw.address || "",
                        }));
                        // Also sync to customers list if not already present
                        setCustomers((prev) => {
                          if (raw._id && !prev.some((c) => c._id === raw._id)) {
                            return [...prev, raw];
                          }
                          return prev;
                        });
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          partyId: val,
                          partyName: val,
                        }));
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Customer Mobile / Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="10 digit mobile"
                    value={formData.partyPhone}
                    onChange={(e) => setFormData({ ...formData, partyPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Auto-filled from Party Master or customize for this order
                  </p>
                </div>
              </div>

              {/* Delivery Site & City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Delivery Site Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Site location, Landmark, Plot number..."
                    value={formData.deliverySite}
                    onChange={(e) => setFormData({ ...formData, deliverySite: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-amber-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Destination City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gurgaon / Delhi"
                    value={formData.destinationCity}
                    onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-amber-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Site Supervisor / Munshi Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Site Supervisor / Munshi Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Contractor / Munshi"
                    value={formData.siteContactPerson}
                    onChange={(e) => setFormData({ ...formData, siteContactPerson: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Site receiver / contractor who manages unloading
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                    Site Munshi Mobile / Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.siteContactPhone}
                    onChange={(e) => setFormData({ ...formData, siteContactPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-amber-500 text-slate-800 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Driver calls this number upon arrival at destination
                  </p>
                </div>
              </div>

              {/* Brick Product & Pricing */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-amber-600" />
                  Brick Product &amp; Pricing Terms
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Product / Brick Variety <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.productName}
                      onChange={(e) => {
                        const selName = e.target.value;
                        const match = products.find((p) => p.name === selName);
                        setFormData({
                          ...formData,
                          productName: selName,
                          rate: match?.standardRate || formData.rate,
                          unit: match?.unit || formData.unit,
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-amber-500 text-slate-900 font-bold"
                    >
                      {products.length > 0 ? (
                        products.map((p) => (
                          <option key={p._id || p.name} value={p.name}>
                            {p.name} (Rate: ₹{p.standardRate})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Red Clay Bricks (1st Class - लाल ईंट)">Red Clay Bricks (1st Class - लाल ईंट)</option>
                          <option value="Red Clay Bricks (2nd Class - लाल ईंट)">Red Clay Bricks (2nd Class - लाल ईंट)</option>
                          <option value="Fly Ash Bricks (फ्लाई ऐश ईंट)">Fly Ash Bricks (फ्लाई ऐश ईंट)</option>
                          <option value="AAC Lightweight Blocks (एएसी ब्लॉक)">AAC Lightweight Blocks (एएसी ब्लॉक)</option>
                          <option value="Fire Clay Bricks (अग्निरोधक भट्ठी ईंट)">Fire Clay Bricks (अग्निरोधक भट्ठी ईंट)</option>
                          <option value="Interlocking Paver Blocks (पेवर ब्लॉक)">Interlocking Paver Blocks (पेवर ब्लॉक)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                        Ordered Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-amber-500 font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-amber-500 text-slate-800"
                      >
                        <option value="Pieces">Pieces (नग)</option>
                        <option value="Thousand">Thousand (हजार)</option>
                        <option value="MT">MT (टन)</option>
                        <option value="Truckload">Truckload (गाड़ी)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Rate per {formData.unit} (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-amber-500 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Total Order Value (₹)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`₹${(Number(formData.quantity || 0) * Number(formData.rate || 0)).toLocaleString("en-IN")}`}
                      className="w-full rounded-xl border border-amber-300 bg-amber-100/60 p-2.5 font-mono font-black text-amber-950"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Advance Received (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.advanceReceived}
                      onChange={(e) => setFormData({ ...formData, advanceReceived: Number(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-amber-500 font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>

                {/* Freight & Payment Terms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Delivery &amp; Freight Terms (भाड़े की शर्त)
                    </label>
                    <select
                      value={formData.freightType}
                      onChange={(e) => setFormData({ ...formData, freightType: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-amber-500 text-slate-900 font-bold"
                    >
                      <option value="FOR">FOR — Site Delivered (भाड़ा सहित - Kiln delivers)</option>
                      <option value="EX_KILN">Ex-Kiln — भट्ठा गेट (भाड़ा पार्टी का / Freight Extra)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                      Advance Payment Mode (बयाना माध्यम)
                    </label>
                    <select
                      value={formData.advancePaymentMode}
                      onChange={(e) => setFormData({ ...formData, advancePaymentMode: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-amber-500 text-slate-900 font-bold"
                    >
                      <option value="cash">Cash (नकद गल्ला)</option>
                      <option value="upi">UPI / QR (PhonePe / GPay / Paytm)</option>
                      <option value="bank">Bank Transfer (NEFT / RTGS)</option>
                      <option value="cheque">Cheque (चेक)</option>
                      <option value="none">No Advance (उधार)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Remarks / Special Site Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Unload near gate no. 2, call contractor before arrival..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-amber-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-black text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400"
                >
                  {editingOrder ? "Update Supply Order" : "Save Supply Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT FORMAL SUPPLY ORDER VOUCHER SLIP */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 print:hidden">
              <h3 className="text-sm font-black text-slate-900">Printable Supply Order Voucher</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 shadow-xs hover:bg-amber-400"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setPrintOrder(null)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div ref={printRef} className="border-2 border-slate-900 rounded-2xl p-6 text-slate-900 bg-white">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                  {(activeCompany?.name || "SHRI SHYAM BRICKS").replace(/\s+co\.?$/i, "")}
                </h1>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  Manufacturers of High Quality Red Clay Bricks, Fly Ash Bricks &amp; Building Materials
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {activeCompany?.address ? `${activeCompany.address}, ` : ""}
                  {activeCompany?.city || "Alwar / Bhiwadi / Gurgaon"} • Contact: {activeCompany?.phone || "+91 98840 08698"}
                </p>
                <div className="mt-2 inline-block rounded-md bg-slate-900 text-white px-3 py-1 text-xs font-black uppercase tracking-wider">
                  OFFICIAL SUPPLY ORDER VOUCHER (सप्लाई ऑर्डर चालान)
                </div>
              </div>

              {/* Order Info Bar */}
              <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block font-bold text-[10px] uppercase">Supply Order #</span>
                  <span className="font-mono font-black text-sm text-slate-950">{printOrder.soNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block font-bold text-[10px] uppercase">Order Date</span>
                  <span className="font-bold text-slate-950">
                    {printOrder.soDate ? new Date(printOrder.soDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                  </span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="py-3 border-b border-slate-200 text-xs grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 block font-bold text-[10px] uppercase">Customer / Billing Party</span>
                  <p className="font-black text-sm text-slate-950 mt-0.5">{printOrder.partyName}</p>
                  {printOrder.partyPhone && (
                    <p className="text-slate-600 font-mono mt-0.5">Ph: {printOrder.partyPhone}</p>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block font-bold text-[10px] uppercase">Delivery Site &amp; Terms</span>
                  <p className="font-bold text-slate-900 mt-0.5">{printOrder.deliverySite || "Factory Godown / Site"}</p>
                  {printOrder.destinationCity && (
                    <p className="text-slate-500 font-medium mt-0.5">📍 City: {printOrder.destinationCity}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                    <span className="font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                      Terms: {printOrder.freightType === "EX_KILN" ? "Ex-Kiln (Freight Extra / Customer Truck)" : "FOR (Site Delivered - Freight Included)"}
                    </span>
                    {printOrder.siteContactPhone && (
                      <span className="font-bold text-slate-700">
                        👷 Munshi: {printOrder.siteContactPerson || "Incharge"} ({printOrder.siteContactPhone})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="py-4">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Item Description</th>
                      <th className="p-2 text-center border-r border-slate-300">Ordered Qty</th>
                      <th className="p-2 text-center border-r border-slate-300">Unit</th>
                      <th className="p-2 text-right border-r border-slate-300">Rate (₹)</th>
                      <th className="p-2 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 font-medium">
                      <td className="p-2 border-r border-slate-300 font-bold">{printOrder.productName || "Red Clay Bricks (1st Class)"}</td>
                      <td className="p-2 text-center border-r border-slate-300 font-mono font-bold">{printOrder.quantity?.toLocaleString("en-IN")}</td>
                      <td className="p-2 text-center border-r border-slate-300">{printOrder.unit || "Pieces"}</td>
                      <td className="p-2 text-right border-r border-slate-300 font-mono">₹{printOrder.rate}</td>
                      <td className="p-2 text-right font-mono font-black">₹{Number(printOrder.totalAmount || 0).toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <div className="w-72 space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Order Amount:</span>
                    <span className="font-mono font-bold text-slate-950">₹{Number(printOrder.totalAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Advance Received ({printOrder.advancePaymentMode?.toUpperCase() || "CASH"}):</span>
                    <span className="font-mono font-bold">₹{Number(printOrder.advanceReceived || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 border-t border-slate-900 pt-1 font-black text-sm">
                    <span>Balance Payable:</span>
                    <span className="font-mono text-rose-700">₹{Number(printOrder.balanceAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-12 pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                    Customer Acceptance / Receiver Sign
                  </div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-1 font-black text-slate-950">
                    For SHRI SHYAM BRICKS (Authorized Sign)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

