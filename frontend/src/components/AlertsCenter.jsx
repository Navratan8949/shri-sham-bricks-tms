"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/src/services/api";
import { formatINR } from "@/src/lib/simpleFormat";
import { toast } from "sonner";
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Mail,
  Settings,
  RefreshCw,
  CheckCircle2,
  Truck,
  User,
  IndianRupee,
  ChevronRight,
  ArrowRight,
  Phone,
  X,
  CreditCard,
} from "lucide-react";

export default function AlertsCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'vehicles' | 'drivers' | 'dues'
  const containerRef = useRef(null);

  const [alerts, setAlerts] = useState({
    criticalCount: 0,
    warningCount: 0,
    vehicleAlerts: [],
    driverAlerts: [],
    customerDues: [],
    totalDueAmount: 0,
    totalUnpaidOrders: 0,
    smtpStatus: {
      isConfigured: false,
      smtpHost: "smtp.gmail.com",
      smtpUser: "",
      smtpFromEmail: "",
    },
  });

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/alerts");
      if (res.data?.success && res.data?.data) {
        setAlerts(res.data.data);
      }
    } catch (e) {
      console.warn("Could not load alerts:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // Total actionable alerts count (Vehicles + Drivers + Customer Dues)
  const vehicleCount = alerts.vehicleAlerts?.length || 0;
  const driverCount = alerts.driverAlerts?.length || 0;
  const dueCount = alerts.customerDues?.length || 0;
  const totalAlertCount = vehicleCount + driverCount + dueCount;

  // Seamless navigation handler that closes dropdown and triggers local page search
  const navigateTo = (url) => {
    setOpen(false);
    router.push(url);
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.dispatchEvent(new Event("searchchange"));
      }, 50);
    }
  };

  // Dispatch full alert digest to Gmail
  const sendAlertDigestEmail = async () => {
    if (!alerts.smtpStatus?.isConfigured) {
      toast.error(
        "Gmail SMTP is not configured yet. Please configure your Gmail ID in Settings (/settings)."
      );
      return;
    }

    try {
      setSendingEmail(true);
      const res = await api.post("/alerts/send-email", {
        recipientEmail: alerts.smtpStatus?.smtpUser,
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Complete fleet & dues digest sent to your Gmail!");
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message || "Failed to send alert email. Check Settings (/settings)."
      );
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* 1. BELL BUTTON IN HEADER */}
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          loadAlerts();
        }}
        title="Fleet Compliance & Payment Dues Alerts"
        className={`relative grid h-10 w-10 place-items-center rounded-xl border transition shadow-2xs cursor-pointer ${
          open
            ? "border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-200"
            : totalAlertCount > 0
            ? "border-stone-200 bg-white text-stone-700 hover:border-orange-300 hover:text-orange-600"
            : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700"
        }`}
      >
        <Bell size={18} />

        {/* Circular Red Notification Badge with Total Count */}
        {totalAlertCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[9px] font-black text-white shadow-xs animate-pulse">
            {totalAlertCount}
          </span>
        )}
      </button>

      {/* Mobile Click-catcher Backdrop (Transparent, doesn't darken the screen) */}
      {open && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 2. COMPACT NOTIFICATION DROPDOWN */}
      {open && (
        <div className="fixed right-2.5 top-[68px] sm:absolute sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-20px)] max-w-[350px] sm:w-[380px] max-h-[440px] flex flex-col rounded-2xl bg-white shadow-xl border border-stone-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-3.5 py-2.5 bg-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert size={15} className="text-orange-600 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-stone-900 truncate">
                ALERTS &amp; NOTIFICATIONS
              </span>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-800 shrink-0">
                {totalAlertCount}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={loadAlerts}
                title="Refresh alerts"
                className="grid h-7 w-7 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              >
                <RefreshCw size={12} className={loading ? "animate-spin text-orange-600" : ""} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="grid h-7 w-7 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Compact Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-stone-100 bg-[#faf8f5] p-1.5 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-lg py-1 px-2.5 text-[11px] font-bold transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-stone-900 shadow-2xs border border-stone-200"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              All ({totalAlertCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("vehicles")}
              className={`rounded-lg py-1 px-2.5 text-[11px] font-bold transition cursor-pointer ${
                activeTab === "vehicles"
                  ? "bg-white text-stone-900 shadow-2xs border border-stone-200"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              🚛 Trucks ({vehicleCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("drivers")}
              className={`rounded-lg py-1 px-2.5 text-[11px] font-bold transition cursor-pointer ${
                activeTab === "drivers"
                  ? "bg-white text-stone-900 shadow-2xs border border-stone-200"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              🪪 Drivers ({driverCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dues")}
              className={`rounded-lg py-1 px-2.5 text-[11px] font-bold transition cursor-pointer ${
                activeTab === "dues"
                  ? "bg-white text-stone-900 shadow-2xs border border-stone-200"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              💰 Dues ({dueCount})
            </button>
          </div>

          {/* Compact Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-stone-50/30">
            {totalAlertCount === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1.5" />
                <p className="font-black text-stone-800 text-xs">All Clear!</p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  कोई भी कागजात या चालान पेंडिंग नहीं है।
                </p>
              </div>
            ) : null}

            {/* 1. VEHICLE RTO DOCUMENTS */}
            {(activeTab === "all" || activeTab === "vehicles") &&
              alerts.vehicleAlerts?.map((v) => (
                <button
                  key={`v-${v.vehicleId}-${v.docKey}`}
                  type="button"
                  onClick={() => navigateTo(`/vehicles?search=${encodeURIComponent(v.vehicleNumber)}`)}
                  className="w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border border-stone-200/70 bg-white hover:bg-amber-50/60 hover:border-amber-300 transition shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-lg shrink-0 ${
                        v.status === "expired" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <Truck size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-black text-xs text-stone-900 group-hover:text-amber-950">
                          {v.vehicleNumber}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-stone-500 truncate">
                          · {v.docName}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 truncate mt-0.5">
                        {v.status === "expired"
                          ? `Expired ${v.daysExpired}d ago`
                          : `Expires in ${v.daysRemaining} days`}
                        {v.driverName ? ` • ${v.driverName}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 border ${
                      v.status === "expired"
                        ? "bg-rose-100 text-rose-700 border-rose-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    {v.status === "expired" ? "Expired" : `${v.daysRemaining}d`}
                  </span>
                </button>
              ))}

            {/* 2. DRIVER LICENSE ALERTS */}
            {(activeTab === "all" || activeTab === "drivers") &&
              alerts.driverAlerts?.map((d) => (
                <button
                  key={d.driverId}
                  type="button"
                  onClick={() => navigateTo(`/drivers?search=${encodeURIComponent(d.driverName)}`)}
                  className="w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border border-stone-200/70 bg-white hover:bg-amber-50/60 hover:border-amber-300 transition shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-lg shrink-0 ${
                        d.status === "expired" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <User size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-black text-xs text-stone-900 group-hover:text-amber-950">
                          {d.driverName}
                        </span>
                        <span className="text-[10px] font-bold text-stone-500">· DL Expiry</span>
                      </div>
                      <p className="text-[10px] text-stone-500 truncate mt-0.5">
                        {d.status === "expired"
                          ? `DL Expired ${d.daysExpired}d ago`
                          : `DL Expires in ${d.daysRemaining} days`}
                        {d.assignedVehicle ? ` • ${d.assignedVehicle}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 border ${
                      d.status === "expired"
                        ? "bg-rose-100 text-rose-700 border-rose-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    {d.status === "expired" ? "Expired" : `${d.daysRemaining}d`}
                  </span>
                </button>
              ))}

            {/* 3. CUSTOMER OUTSTANDING DUES */}
            {(activeTab === "all" || activeTab === "dues") &&
              alerts.customerDues?.map((c) => (
                <button
                  key={c.customerId}
                  type="button"
                  onClick={() => navigateTo(`/orders?search=${encodeURIComponent(c.customerName)}`)}
                  className="w-full text-left flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border border-stone-200/70 bg-white hover:bg-rose-50/60 hover:border-rose-300 transition shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-100 text-rose-700 shrink-0">
                      <IndianRupee size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-xs text-stone-900 truncate group-hover:text-rose-950">
                        {c.customerName}
                      </p>
                      <p className="text-[10px] text-stone-500 truncate mt-0.5">
                        {c.orderCount} Pending Dispatch{c.orderCount > 1 ? "es" : ""}{" "}
                        {c.phone ? `• ${c.phone}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-rose-600 block leading-tight">
                      {formatINR(c.totalDue)}
                    </span>
                    <span className="text-[9px] font-bold text-stone-400 uppercase">Due</span>
                  </div>
                </button>
              ))}
          </div>

          {/* Compact Dropdown Footer */}
          <div className="shrink-0 border-t border-stone-100 p-2.5 bg-stone-50/60 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={sendingEmail}
              onClick={sendAlertDigestEmail}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white py-2 px-3 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {sendingEmail ? (
                <RefreshCw size={12} className="animate-spin text-white" />
              ) : (
                <Mail size={12} />
              )}
              <span>Email Alert Digest</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/settings")}
              title="SMTP Settings"
              className="grid h-8 w-8 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-orange-600 hover:border-orange-300 transition shadow-2xs cursor-pointer shrink-0"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
