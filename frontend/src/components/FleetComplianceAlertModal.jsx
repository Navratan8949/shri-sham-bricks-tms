"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  X,
  Calendar,
  Truck,
  ExternalLink,
  FileCheck2,
  Clock,
  Sparkles,
} from "lucide-react";
import api from "@/src/services/api";
import { getStoredUser } from "@/src/lib/auth";

/**
 * Format document type to formal Indian Commercial Fleet terminology
 */
function getDocTypeName(type) {
  if (!type) return "Vehicle Compliance Document";
  const map = {
    insurance: "Commercial Vehicle Insurance Policy",
    fitness: "RTO Fitness Certificate (Form 38)",
    permit: "National / State Goods Permit",
    national_permit: "All India National Goods Permit (Form 48)",
    puc: "Pollution Under Control (PUC)",
    road_tax: "Commercial MV Road Tax Token",
    rc: "Registration Certificate (RC Book)",
    tax: "Commercial Road Tax",
  };
  return map[type.toLowerCase()] || type.toUpperCase().replace(/_/g, " ");
}

/**
 * Format date in Indian Transport Standard: DD Mon YYYY
 */
function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FleetComplianceAlertModal({
  isOpen,
  onClose,
  alerts = [],
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [internalAlerts, setInternalAlerts] = useState(alerts);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setInternalAlerts(alerts);
    } else if (isOpen) {
      api
        .get("/dashboard/alerts")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setInternalAlerts(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [alerts, isOpen]);

  const user = getStoredUser();
  if (!mounted || !isOpen || user?.role !== "super_admin") return null;

  // Filter only document compliance alerts (expired or expiring)
  const docAlerts = internalAlerts.filter(
    (a) =>
      a.category === "document" ||
      a.documentType ||
      a.vehicleNumber ||
      a.title?.toLowerCase().includes("document"),
  );

  const displayList = docAlerts.length > 0 ? docAlerts : internalAlerts;
  const expiredCount = displayList.filter(
    (a) =>
      (a.daysRemaining !== undefined && a.daysRemaining <= 0) ||
      a.type === "danger",
  ).length;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem("ssbc_compliance_alert_dismissed", "true");
    } catch {}
    onClose?.();
  };

  const handleGoToDocuments = () => {
    try {
      sessionStorage.setItem("ssbc_compliance_alert_dismissed", "true");
    } catch {}
    onClose?.();
    router.push("/vehicle-documents");
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div className="relative w-full max-w-2xl my-auto flex flex-col max-h-[88vh] rounded-3xl border border-[#E8DFD8] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Executive Kiln Transport Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#1C0D08] via-[#2A160E] to-[#1C0D08] px-5 py-4 text-white sm:px-6 border-b border-[#3E271D]">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#B83A1B]/20 blur-2xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#B83A1B] to-[#D35400] text-white shadow-md shadow-orange-950/60 ring-1 ring-orange-400/30">
                <ShieldAlert className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-200 border border-orange-400/30">
                    Fleet Compliance Advisory
                  </span>
                  <span className="text-[11px] font-bold text-amber-300">
                    • Tonk Road Kiln Hub
                  </span>
                </div>
                <h3 className="mt-0.5 text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Vehicle Document &amp; RTO Expiry Tracker
                </h3>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="rounded-full p-2 text-stone-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              aria-label="Close alert"
            >
              <X className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Clean Status Sub-Header Bar */}
        <div className="shrink-0 bg-[#FFF9F5] border-b border-[#F0E4DC] px-5 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            {expiredCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-900 border border-red-300 px-3 py-1 text-xs font-black">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                🚨 {expiredCount} Document(s) Expired
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 text-xs font-black">
                <Clock className="h-3.5 w-3.5 text-amber-700" />
                ⚠️ {displayList.length} Renewal(s) Approaching
              </span>
            )}
            <span className="text-xs text-stone-600 hidden md:inline">
              Keep RC, Insurance &amp; Fitness renewed before site dispatches.
            </span>
          </div>

          <span className="text-[11px] font-mono font-bold text-stone-500">
            Total Monitored: {displayList.length} Units
          </span>
        </div>

        {/* List of Affected Commercial Vehicles (flex-1 overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 [scrollbar-width:thin] bg-stone-50/40">
          {displayList.map((alert, idx) => {
            const isExpired =
              (alert.daysRemaining !== undefined && alert.daysRemaining <= 0) ||
              alert.type === "danger";
            const daysLeft = alert.daysRemaining;

            return (
              <div
                key={alert.id || idx}
                className="rounded-2xl border border-stone-200/90 bg-white p-4 transition-all hover:border-orange-300 hover:shadow-md"
              >
                {/* Top Row: Indian Number Plate + Ownership + Expiry Badge */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Authentic Indian Yellow Number Plate */}
                    <div className="shrink-0 flex items-center overflow-hidden rounded-md border border-stone-700 bg-[#FEDD00] font-mono font-black text-stone-950 shadow-2xs">
                      <div className="bg-blue-700 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase tracking-tighter">
                        IND
                      </div>
                      <div className="px-2 py-0.5 text-xs font-black tracking-wider uppercase">
                        {alert.vehicleNumber || "COMMERCIAL TRUCK"}
                      </div>
                    </div>

                    {alert.ownerType === "market" || alert.vendorName ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 text-orange-900 border border-orange-200 px-2 py-0.5 text-[10px] font-black">
                        <Truck className="h-3 w-3 text-orange-700" />
                        Market Lorry {alert.vendorName ? `• ${alert.vendorName}` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 text-[10px] font-black">
                        🏢 Kiln Fleet
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  {isExpired ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-red-800">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                      Immediate Action (Expired)
                    </span>
                  ) : daysLeft !== undefined ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                        daysLeft <= 7
                          ? "bg-rose-50 border border-rose-300 text-rose-800"
                          : "bg-amber-50 border border-amber-300 text-amber-900"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      Due in {daysLeft} Day{daysLeft !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-900">
                      ⚠️ Expiring Soon
                    </span>
                  )}
                </div>

                {/* Middle Row: Document Details & Expiry Info */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-[#B83A1B]" />
                      <span>{getDocTypeName(alert.documentType)}</span>
                      {alert.documentNumber && (
                        <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.2 rounded-md">
                          #{alert.documentNumber}
                        </span>
                      )}
                    </h4>

                    <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        Expiry Date:{" "}
                        <strong className="text-stone-900 font-mono">
                          {formatDate(alert.date)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Desk Link */}
                  <button
                    onClick={handleGoToDocuments}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white hover:border-orange-400 hover:bg-orange-50 hover:text-orange-900 px-3 py-1.5 text-xs font-black text-stone-700 transition cursor-pointer shadow-2xs self-start sm:self-center"
                  >
                    <span>Update in Desk</span>
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Action Footer */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 bg-white px-5 py-3.5 sm:px-6">
          <div className="text-[11px] text-stone-500 text-center sm:text-left">
            <span className="font-bold text-stone-800">Note:</span> Renewed records will automatically update across live dispatch desks.
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2.5">
            <button
              onClick={handleDismiss}
              className="flex-1 sm:flex-none rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-black text-stone-700 hover:bg-stone-50 transition cursor-pointer whitespace-nowrap"
            >
              Acknowledge &amp; Close
            </button>

            <button
              onClick={handleGoToDocuments}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B83A1B] to-[#D35400] px-4 py-2 text-xs font-black text-white shadow-xs hover:from-[#9E2A0E] hover:to-[#B83A1B] transition cursor-pointer whitespace-nowrap"
            >
              <span>Renew Documents Desk</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
