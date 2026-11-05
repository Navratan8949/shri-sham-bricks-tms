"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/services/api";
import {
  ArrowRight,
  AlertTriangle,
  ClipboardList,
  FileCheck,
  Fuel,
  IndianRupee,
  RefreshCcw,
  Route,
  Truck,
  Wrench,
  UsersRound,
  Search,
  Phone,
  Printer,
  Navigation,
  MapPin,
  Play,
  PackageCheck,
  CheckCircle2,
  Activity,
  Radio,
  BookOpen,
  Receipt,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Gauge,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Zap,
  ArrowUpRight,
  WalletCards,
  BadgeIndianRupee,
  HandCoins,
  Calculator,
  Banknote,
  Landmark,
  Boxes,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { getDashboard } from "@/src/services/dashboard.service";
import { startTrip, deliverTrip } from "@/src/services/trip.service";
import {
  getActiveCompany,
  getStoredUser,
  setActiveCompany,
  useActiveCompany,
} from "@/src/lib/auth";
import { ROLES } from "@/src/lib/rbac";
import { Button, Badge } from "./ui";
import { toast } from "sonner";

const money = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0).toLocaleString("en-IN");

const CustomCurrencyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-white shadow-2xl backdrop-blur-md min-w-[180px]">
        <p className="font-extrabold text-slate-300 pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-amber-400" />
          <span>{label}</span>
        </p>
        <div className="mt-2 space-y-1.5">
          {payload.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 font-mono text-[11px]"
            >
              <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white">{money(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomCountTooltip = ({ active, payload, label, unit = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-white shadow-2xl backdrop-blur-md min-w-[170px]">
        <p className="font-extrabold text-slate-300 pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-orange-400" />
          <span>{label}</span>
        </p>
        <div className="mt-2 space-y-1.5">
          {payload.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 font-mono text-[11px]"
            >
              <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-white">
                {entry.value} {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function Stat({ icon: Icon, label, value, hint, href, color = "orange" }) {
  const colorMap = {
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span
          className={`grid h-11 w-11 place-items-center rounded-2xl border ${
            colorMap[color] || colorMap.slate
          } shadow-xs font-black`}
        >
          <Icon className="h-5 w-5" />
        </span>
        {href && (
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-600" />
        )}
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-slate-500 font-medium">{hint}</p>
      )}
    </>
  );

  return href ? (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      {content}
    </div>
  );
}

function SimpleDashboard({ role }) {
  const driver = role === ROLES.DRIVER;
  const activeCompany = useActiveCompany();
  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-stone-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-amber-400" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
            {driver
              ? "Driver Portal • Fleet Operations"
              : "Vendor & Transporter Portal"}
          </p>
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          {driver
            ? "Driver Dashboard & Active Trips"
            : "Vendor & Transporter Dashboard"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Access your assigned trips, highway routes, and live dispatch updates
          in real time.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {driver ? (
          <>
            <Link
              href="/trips"
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-orange-600">
                <Route className="h-6 w-6" />
              </div>
              <div>
                <b className="block text-base text-slate-900">
                  My Assigned Trips
                </b>
                <span className="text-xs text-slate-500">
                  Start trip dispatch and mark destination delivery
                </span>
              </div>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <UsersRound className="h-6 w-6" />
              </div>
              <div>
                <b className="block text-base text-slate-900">Driver Profile</b>
                <span className="text-xs text-slate-500">
                  Review license and personal contact details
                </span>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/vendor-bills"
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-orange-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <b className="block text-base text-slate-900">
                  Freight & Hire Bills
                </b>
                <span className="text-xs text-slate-500">
                  Review payable hire invoices
                </span>
              </div>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <UsersRound className="h-6 w-6" />
              </div>
              <div>
                <b className="block text-base text-slate-900">
                  Transporter Profile
                </b>
                <span className="text-xs text-slate-500">
                  Company registration & operational info
                </span>
              </div>
            </Link>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-xs font-semibold text-orange-950 flex items-center gap-3">
        <Radio className="h-5 w-5 text-orange-600 shrink-0 animate-pulse" />
        <span>
          <b>{activeCompany?.name || "Central Fleet Control Tower"}:</b> For
          emergency roadside assistance, breakdowns, or toll issues, contact
          Central Operations Desk
          {activeCompany?.phone ? (
            <>
              {" "}
              at <b>{activeCompany.phone}</b>
            </>
          ) : (
            ""
          )}
          .
        </span>
      </div>
    </div>
  );
}

function AccountantDashboard({ d, load, loading, activeCompany }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("memos"); // "memos" | "settlements" | "expenses"
  const [recentMemos, setRecentMemos] = useState([]);
  const [recentSettlements, setRecentSettlements] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // Load recent records for Advance, Settlements, and Expenses
  useEffect(() => {
    let cancel = false;
    const fetchAccountsData = async () => {
      setRecentLoading(true);
      try {
        const [memosRes, settRes, expRes] = await Promise.all([
          api
            .get("/advance-memos?limit=6")
            .catch(() => ({ data: { data: [] } })),
          api.get("/lr-bilties?limit=6").catch(() => ({ data: { data: [] } })),
          api.get("/expenses?limit=6").catch(() => ({ data: { data: [] } })),
        ]);
        if (!cancel) {
          setRecentMemos(memosRes.data?.data || []);
          setRecentSettlements(settRes.data?.data || []);
          setRecentExpenses(expRes.data?.data || []);
        }
      } catch (err) {
        console.error("Failed to load accounts data:", err);
      } finally {
        if (!cancel) setRecentLoading(false);
      }
    };
    fetchAccountsData();
    return () => {
      cancel = true;
    };
  }, [d]);

  // Financial figures from dashboard stats
  const expenses = d?.accounts?.expenses || {};
  const advances = d?.hr?.advances || {};
  const totalBurn = Number(expenses.total || 0);
  const fuelBurn = Number(expenses.fuel || d?.fleet?.fuel?.expense || 0);
  const maintBurn = Number(
    expenses.maintenance || d?.fleet?.maintenance?.expense || 0,
  );
  const tyresBurn = Number(
    expenses.tyres || d?.fleet?.tyres?.purchaseAmount || 0,
  );
  const generalBurn = Number(expenses.general || 0);

  // Advance Memo stats
  const advanceMemosCount = d?.advanceMemos?.total || recentMemos.length;
  const unsettledAdvanceMemos =
    d?.advanceMemos?.pending ||
    recentMemos.filter((m) => m.status !== "settled").length;
  const totalAdvanceDisbursed =
    recentMemos.reduce((acc, m) => acc + (Number(m.advance) || 0), 0) ||
    Number(advances.amount || 0);
  const totalMemoBalancePending = recentMemos.reduce(
    (acc, m) => acc + (Number(m.balance) || 0),
    0,
  );

  // Driver Trip Settlement stats
  const driverSettlementsCount =
    d?.driverSettlements?.total || recentSettlements.length;
  const pendingTripsToSettle = d?.driverSettlements?.pendingTrips || 0;

  // Trend data
  const trendData = useMemo(() => {
    if (Array.isArray(d?.trends) && d.trends.length > 0) {
      const hasData = d.trends.some(
        (t) => t.revenue > 0 || t.expenses > 0 || t.collections > 0,
      );
      if (hasData) {
        return d.trends.map((t) => ({
          name: t.period,
          Advances: t.collections || 0,
          Expenses: t.expenses || 0,
        }));
      }
    }
    return [];
  }, [d]);

  // Operational cost distribution
  const costDistributionData = useMemo(() => {
    const list = [
      { name: "Diesel & Fuel", value: fuelBurn, color: "#f59e0b" },
      {
        name: "Vehicle Repairs & Maintenance",
        value: maintBurn,
        color: "#3b82f6",
      },
      { name: "Tyre Replacements", value: tyresBurn, color: "#10b981" },
      {
        name: "Tolls & En Route Expenses",
        value: generalBurn,
        color: "#8b5cf6",
      },
    ].filter((x) => x.value > 0);

    return list.length
      ? list
      : [
          {
            name: "Fleet Operational Expenses",
            value: totalBurn || 1,
            color: "#f59e0b",
          },
        ];
  }, [fuelBurn, maintBurn, tyresBurn, generalBurn, totalBurn]);

  return (
    <div className="space-y-6 pb-12 w-full max-w-full overflow-x-hidden min-w-0">
      {/* 1. Accounts & Finance Header */}
      <section className="relative overflow-visible rounded-3xl bg-gradient-to-br from-[#121620] via-[#1a2232] to-[#1c1917] p-6 text-white shadow-2xl sm:p-8 border border-orange-500/30">
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute right-40 bottom-0 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-orange-300">
                <IndianRupee className="h-3.5 w-3.5 text-orange-400" />{" "}
                {(activeCompany?.name || "SHRI SHYAM BRICKS").replace(/\s+co\.?$/i, "").toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Live Accounts &amp; Ledger Desk
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Brick Sales &amp; Fleet Accounts Desk
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              Overview of customer freight receivables, advance disbursement,
              diesel vouchers, and operational expense registers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              onClick={load}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/20 font-bold text-xs cursor-pointer"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />{" "}
              Refresh Accounts Data
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Fast Accounts Launchpad: 3 Core Workflows */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Advance Memo Action Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-pink-200/90 bg-gradient-to-br from-pink-50/70 via-white to-pink-50/30 p-5 shadow-xs transition hover:shadow-md hover:border-pink-300">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-pink-600 text-white font-bold shadow-md shadow-pink-600/20">
              <FileText className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-pink-100 text-pink-700 text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider">
              1. Advance Desk
            </span>
          </div>
          <h2 className="mt-4 text-base font-black text-slate-900">
            Advance Memos (Advance)
          </h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Create pre-trip vouchers, disburse diesel &amp; cash advance to
            drivers, and generate printable memo slips.
          </p>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-pink-100">
            <button
              onClick={() => router.push("/advance-memos?autoOpenAdd=true")}
              className="flex-1 rounded-xl bg-pink-600 px-3 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-pink-700 transition cursor-pointer"
            >
              + New Advance Memo
            </button>
            <button
              onClick={() => router.push("/advance-memos")}
              className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-50 transition cursor-pointer"
            >
              View Memos ➔
            </button>
          </div>
        </div>

        {/* LR / Bilty Action Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50/70 via-white to-orange-50/30 p-5 shadow-xs transition hover:shadow-md hover:border-orange-300">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20">
              <FileText className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-orange-100 text-orange-700 text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider">
              2. LR / Bilty Desk
            </span>
          </div>
          <h2 className="mt-4 text-base font-black text-slate-900">
            LR &amp; Consignment Note
          </h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Generate printable transport bilty, party consignment notes, freight
            terms, and vehicle dispatch records.
          </p>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-orange-100">
            <button
              onClick={() => router.push("/lr-bilties?autoOpenAdd=true")}
              className="flex-1 rounded-xl bg-orange-600 px-3 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-orange-700 transition cursor-pointer"
            >
              + New LR / Bilty
            </button>
            <button
              onClick={() => router.push("/lr-bilties")}
              className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 transition cursor-pointer"
            >
              LR Register ➔
            </button>
          </div>
        </div>

        {/* Expense Dekhna Action Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-5 shadow-xs transition hover:shadow-md hover:border-amber-300">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Fuel className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider">
              3. Expense Desk
            </span>
          </div>
          <h2 className="mt-4 text-base font-black text-slate-900">
            Fleet &amp; Operational Expenses
          </h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Track diesel slips, fuel vouchers, highway tolls, and branch office operational expenses.
          </p>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-amber-100">
            <button
              onClick={() => router.push("/expenses?autoOpenAdd=true")}
              className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
            >
              + Record Expense
            </button>
            <button
              onClick={() => router.push("/expenses")}
              className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 transition cursor-pointer"
            >
              View Expenses ➔
            </button>
          </div>
        </div>
      </section>

      {/* 3. Core Accounting Metrics (6 Stat Cards) */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          icon={HandCoins}
          color="rose"
          label="Total Advance Disbursed"
          value={money(totalAdvanceDisbursed)}
          hint={`${advanceMemosCount} Total Advance Memos`}
          href="/advance-memos"
        />
        <Stat
          icon={FileText}
          color="orange"
          label="Open Advance Memos"
          value={`${unsettledAdvanceMemos} Open`}
          hint="Awaiting trip closure"
          href="/advance-memos"
        />
        <Stat
          icon={IndianRupee}
          color="amber"
          label="Pending Settlement Balance"
          value={money(totalMemoBalancePending)}
          hint="Balance freight to receive"
          href="/advance-memos"
        />
        <Stat
          icon={FileText}
          color="orange"
          label="LR / Bilties"
          value="Consignment Notes"
          hint="Printable dispatch bilties"
          href="/lr-bilties"
        />
        <Stat
          icon={Activity}
          color="rose"
          label="Total Operational Expenses"
          value={money(totalBurn)}
          hint="Diesel, repairs &amp; tolls"
          href="/expenses"
        />
        <Stat
          icon={Fuel}
          color="amber"
          label="Diesel &amp; Toll Expenses"
          value={money(fuelBurn + generalBurn)}
          hint={`${money(fuelBurn)} Diesel • ${money(generalBurn)} Toll`}
          href="/expenses"
        />
      </section>

      {/* 4. Visual Expense Telemetry & Cost Breakdown */}
      <section className="grid gap-5 lg:grid-cols-12">
        {/* Left: Operating Cost Breakdown Donut Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Operating Cost Distribution
              </p>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">
                Fleet Expenses by Category
              </h3>
            </div>
            <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
              {money(totalBurn)}
            </span>
          </div>

          <div className="h-64 w-full pt-2 flex items-center justify-center">
            {costDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {costDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [money(value), "Amount"]} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 font-medium">
                No fleet expenditure logged.
              </div>
            )}
          </div>
        </div>

        {/* Right: Cash Inflow vs Operating Burn Trend Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Cash Flow &amp; Burn Run-Rate
              </p>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">
                Monthly Inflows vs Operational Expenses
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-600" /> Inflows
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="h-2 w-2 rounded-full bg-rose-600" /> Burn
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="accInflow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="accBurn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomCurrencyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Advances"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#accInflow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    fill="url(#accBurn)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 font-medium">
                No telemetry recorded for this cycle.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Live Accounts Data Tables with Tab Switcher */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Live Accounts Ledgers &amp; Recent Records
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant view of Advance Vouchers, Driver Settlements, and
              Operational Expenses.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("memos")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "memos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Advance Memos ({recentMemos.length})
            </button>
            <button
              onClick={() => setActiveTab("settlements")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "settlements"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              LR / Bilties ({recentSettlements.length})
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "expenses"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Expenses ({recentExpenses.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Advance Memos */}
        {activeTab === "memos" && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600">
                Recent Advance Memo Vouchers
              </span>
              <Link
                href="/advance-memos"
                className="text-xs font-bold text-pink-700 hover:underline flex items-center gap-1"
              >
                Go to Advance Memo Register{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading advance memos...
              </div>
            ) : recentMemos.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No advance memos recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 text-[11px] font-black uppercase text-orange-950 border-b-2 border-orange-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Memo #</th>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Truck / Vehicle</th>
                      <th className="px-3.5 py-2.5">Driver</th>
                      <th className="px-3.5 py-2.5 text-right">Freight (₹)</th>
                      <th className="px-3.5 py-2.5 text-right text-emerald-700 font-bold">
                        Advance (₹)
                      </th>
                      <th className="px-3.5 py-2.5 text-right text-amber-700 font-bold">
                        Balance (₹)
                      </th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {recentMemos.map((m, idx) => (
                      <tr
                        key={m._id}
                        className={`${idx % 2 === 0 ? "bg-white hover:bg-[#f8f8f8]" : "bg-amber-50/80 hover:bg-amber-100/70"} transition-colors`}
                      >
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {m.memoNumber ? `#${m.memoNumber}` : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500">
                          {m.date
                            ? new Date(m.date).toLocaleDateString("en-IN")
                            : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                          {m.truckNumber ||
                            m.vehicleId?.vehicleNumber ||
                            "Company Truck"}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="font-semibold text-slate-900">
                            {m.driverName || "-"}
                          </span>
                          {m.driverPhone && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {m.driverPhone}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold">
                          ₹{Number(m.totalFreight || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-700">
                          ₹{Number(m.advance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-amber-700">
                          ₹{Number(m.balance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              m.status === "settled"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {m.status === "settled"
                              ? "Settled"
                              : "Open / Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: LR / Bilties */}
        {activeTab === "settlements" && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600">
                Recent LR / Bilty Consignment Notes
              </span>
              <Link
                href="/lr-bilties"
                className="text-xs font-bold text-orange-700 hover:underline flex items-center gap-1"
              >
                Go to LR Register <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading bilties...
              </div>
            ) : recentSettlements.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No LR / Bilties recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-orange-50/90 text-[11px] font-black uppercase text-slate-800 border-b border-orange-200/80">
                    <tr>
                      <th className="px-3.5 py-2.5">LR No</th>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Party (Consignor)</th>
                      <th className="px-3.5 py-2.5">Consignee (Receiver)</th>
                      <th className="px-3.5 py-2.5">Truck / Vehicle</th>
                      <th className="px-3.5 py-2.5 text-right">
                        Freight Rate (₹)
                      </th>
                      <th className="px-3.5 py-2.5 text-right">Advance (₹)</th>
                      <th className="px-3.5 py-2.5 text-right font-black">
                        Balance (₹)
                      </th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {recentSettlements.map((lr, idx) => {
                      return (
                        <tr
                          key={lr._id}
                          className={`${idx % 2 === 0 ? "bg-white hover:bg-[#f8f8f8]" : "bg-orange-50/30 hover:bg-orange-100/40"} transition-colors`}
                        >
                          <td className="px-3.5 py-2.5 font-mono font-black text-orange-700">
                            {lr.lrNumber || "-"}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500">
                            {lr.lrDate
                              ? new Date(lr.lrDate).toLocaleDateString("en-IN")
                              : "-"}
                          </td>
                          <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                            {lr.partyName || lr.partyId?.name || "-"}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-700">
                            {lr.consigneeName || "-"}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                            {lr.truckNumber ||
                              lr.vehicleId?.vehicleNumber ||
                              "-"}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                            ₹
                            {Number(lr.freightRate || 0).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-700">
                            ₹
                            {Number(lr.advanceAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-amber-700">
                            ₹
                            {Number(lr.balanceAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                lr.status === "delivered"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : lr.status === "dispatched"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {lr.status ? lr.status.toUpperCase() : "CREATED"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Expenses */}
        {activeTab === "expenses" && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600">
                Recent Fleet &amp; Operational Expenses
              </span>
              <Link
                href="/expenses"
                className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1"
              >
                Go to Expense Register <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading expenses...
              </div>
            ) : recentExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No expenses recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 text-[11px] font-black uppercase text-orange-950 border-b-2 border-orange-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Expense #</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5">Description</th>
                      <th className="px-3.5 py-2.5 text-right font-black">
                        Amount (₹)
                      </th>
                      <th className="px-3.5 py-2.5 text-center">Mode</th>
                      <th className="px-3.5 py-2.5">Vendor / Payee</th>
                      <th className="px-3.5 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {recentExpenses.map((exp, idx) => (
                      <tr
                        key={exp._id}
                        className={`${idx % 2 === 0 ? "bg-white hover:bg-[#f8f8f8]" : "bg-amber-50/80 hover:bg-amber-100/70"} transition-colors`}
                      >
                        <td className="px-3.5 py-2.5 text-slate-500">
                          {exp.expenseDate
                            ? new Date(exp.expenseDate).toLocaleDateString(
                                "en-IN",
                              )
                            : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {exp.expenseNumber || "-"}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="inline-block rounded-md bg-slate-100 text-slate-800 font-bold px-2 py-0.5 text-[10px] uppercase">
                            {String(exp.category || "General").replace(
                              "_",
                              " ",
                            )}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 max-w-xs truncate">
                          {exp.description || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-black text-rose-700">
                          ₹{Number(exp.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-2.5 text-center uppercase font-mono text-[10px] text-slate-500 font-bold">
                          {exp.paymentMode || "Cash"}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600">
                          {exp.vendorName || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              exp.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {exp.status || "active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const user = getStoredUser();
  const activeCompany = useActiveCompany();
  const role = user?.role || "super_admin";
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    trips: [],
    bilties: [],
    vehicles: [],
    advanceMemos: [],
    containers: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [liveSupplyOrders, setLiveSupplyOrders] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState("all"); // "all" | "commercial" | "operations"
  const searchRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Commercial revenue vs operational burn telemetry data (Real 6-Month backend trends)
  const financialTrendData = useMemo(() => {
    if (Array.isArray(d?.trends) && d.trends.length > 0) {
      const hasData = d.trends.some(
        (t) => t.revenue > 0 || t.expenses > 0 || t.collections > 0,
      );
      if (hasData) {
        return d.trends;
      }
    }
    return [];
  }, [d]);

  // Fleet deployment & yard status data
  const fleetUtilizationData = useMemo(() => {
    const total = Number(d?.fleet?.vehicles?.total || 0);
    const inTransit = Number(d?.operations?.trips?.inTransit || 0);
    const dispatched = Number(d?.operations?.trips?.dispatched || 0);
    const maint = Number(d?.fleet?.maintenance?.count || 0);
    const yardAvailable = Math.max(0, total - inTransit - dispatched - maint);

    if (total === 0 && inTransit === 0 && dispatched === 0 && maint === 0) {
      return [];
    }

    const items = [
      { name: "In Transit (Highway)", value: inTransit, color: "#059669" },
      { name: "Dispatched / Loading", value: dispatched, color: "#d97706" },
      {
        name: "Yard Ready (Free)",
        value:
          yardAvailable > 0
            ? yardAvailable
            : Math.max(0, total - inTransit - dispatched),
        color: "#b83a1b",
      },
      { name: "In Maintenance", value: maint, color: "#dc2626" },
    ];
    return items.filter((i) => i.value > 0);
  }, [d]);

  // Operational cost breakdown
  const expenseDistributionData = useMemo(() => {
    const fuel = Number(
      d?.accounts?.expenses?.fuel || d?.fleet?.fuel?.expense || 0,
    );
    const maint = Number(
      d?.accounts?.expenses?.maintenance || d?.fleet?.maintenance?.expense || 0,
    );
    const tyre = Number(
      d?.accounts?.expenses?.tyres || d?.fleet?.tyres?.purchaseAmount || 0,
    );
    const gen = Number(d?.accounts?.expenses?.general || 0);

    if (fuel === 0 && maint === 0 && tyre === 0 && gen === 0) {
      return [];
    }

    const items = [
      { name: "Diesel Fuel (डीजल)", value: fuel, color: "#b83a1b" },
      { name: "Vehicle Maintenance (मरम्मत)", value: maint, color: "#d97706" },
      { name: "Tyre Replacements (टायर)", value: tyre, color: "#2563eb" },
      { name: "Tolls & Trip Sundry (टोल खर्च)", value: gen, color: "#7c3aed" },
    ];
    return items.filter((i) => i.value > 0);
  }, [d]);

  // High volume highway transit corridors
  const corridorVolumeData = useMemo(() => {
    const trips = d?.activeTrips || [];
    const map = {};
    trips.forEach((t) => {
      if (t.from && t.to && t.from !== "N/A" && t.to !== "N/A") {
        const key = `${t.from} → ${t.to}`;
        if (!map[key]) map[key] = { route: key, trips: 0, tonnage: 0 };
        map[key].trips += 1;
        // Estimated bricks in thousands or weight in MT
        const wt = Number(t.weight || 0);
        map[key].tonnage += wt > 0 ? wt : 5; // default ~5,000 bricks equivalent
      }
    });

    return Object.values(map)
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5);
  }, [d]);

  // Consignment lifecycle dispatch funnel
  const consignmentStatusData = useMemo(() => {
    const t = d?.operations?.trips || {};
    const total = Number(t.total || 0);
    if (total === 0) {
      return [];
    }
    return [
      {
        stage: "Planned (नियोजित)",
        count: Number(t.planned || 0),
        fill: "#78716c",
      },
      {
        stage: "Dispatched (रवाना)",
        count: Number(t.dispatched || 0),
        fill: "#d97706",
      },
      {
        stage: "On Highway (मार्ग में)",
        count: Number(t.inTransit || 0),
        fill: "#059669",
      },
      {
        stage: "Delivered (पहुंच गई)",
        count: Number(t.delivered || 0),
        fill: "#b83a1b",
      },
      {
        stage: "Completed (बिल सेटल)",
        count: Number(t.completed || 0),
        fill: "#2563eb",
      },
    ];
  }, [d]);

  // Overall financial telemetry badges
  const totalBilled = Number(d?.accounts?.receivable?.invoiceAmount || 0);
  const totalBurn = Number(d?.accounts?.expenses?.total || 0);
  const totalCollected = Number(d?.accounts?.receivable?.received || 0);
  const netMarginVal = Math.max(0, totalBilled - totalBurn);
  const marginPct =
    totalBilled > 0 ? ((netMarginVal / totalBilled) * 100).toFixed(1) : "0.0";
  const collectionPct =
    totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : "0.0";

  // Close search dropdown on click outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  // Debounced live search across Fleet, Bilties, Trips & Bookings
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults({
        trips: [],
        bilties: [],
        vehicles: [],
        advanceMemos: [],
        containers: [],
      });
      setShowSearchDropdown(false);
      setSearchLoading(false);
      return;
    }

    // Set loading immediately to prevent flashing "no records found" before API returns
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/dashboard/search", { params: { q } });
        if (res.data?.success && res.data?.data) {
          setSearchResults(res.data.data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Live dashboard search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const load = async () => {
    let active = getActiveCompany();
    let storedId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("nrl_company")
        : null;

    if (!active && !storedId) {
      try {
        const compRes = await api.get("/companies");
        const list = compRes?.data?.data || [];
        if (list.length === 1) {
          setActiveCompany(list[0]);
          active = list[0];
          storedId = list[0]._id;
        } else if (list.length > 1) {
          router.replace("/select-company");
          return;
        }
      } catch {
        // Fallback or continue
      }
    }
    setLoading(true);
    try {
      const [r, alertsRes, soRes] = await Promise.all([
        getDashboard(),
        api.get("/dashboard/alerts").catch(() => ({ data: { data: [] } })),
        api.get("/supply-orders?limit=6").catch(() => ({ data: { data: [] } })),
      ]);
      setD(r?.data?.data ?? r?.data ?? null);
      if (soRes?.data?.data && Array.isArray(soRes.data.data)) {
        setLiveSupplyOrders(soRes.data.data);
      }
      if (alertsRes?.data?.data && Array.isArray(alertsRes.data.data)) {
        const alertList = alertsRes.data.data;
        setAlerts(alertList);

        // Auto-open compliance pop alert on screen for super_admin once per session
        const hasDocAlerts = alertList.some(
          (a) =>
            a.category === "document" ||
            a.documentType ||
            a.title?.toLowerCase().includes("document"),
        );
        if (hasDocAlerts) {
          try {
            const alreadyDismissed = sessionStorage.getItem(
              "ssbc_compliance_alert_dismissed",
            );
            if (!alreadyDismissed) {
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("ssbc-open-compliance-alert"),
                );
              }, 400);
            }
          } catch {}
        }
      }
      setError("");
    } catch (e) {
      if (
        e?.message?.includes("Company is required") ||
        e?.message?.includes("400") ||
        e?.message?.includes("Invalid companyId")
      ) {
        try {
          const compRes = await api.get("/companies");
          const list = compRes?.data?.data || [];
          if (list.length === 1) {
            setActiveCompany(list[0]);
            load();
            return;
          }
        } catch {}
        router.replace("/select-company");
        return;
      }
      setError(e?.message || "Dashboard could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role, activeCompany?._id]);

  const actOnTrip = async (fn, tripId, actionName) => {
    try {
      await fn(tripId, {});
      toast.success(`Trip status updated: ${actionName}`);
      load();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    }
  };

  if (loading && !d) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
          <p className="mt-4 text-sm font-bold text-slate-800">
            Initializing Executive Control Tower…
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Loading real-time transit, fleet, and commercial dispatch status
          </p>
        </div>
      </div>
    );
  }

  const trips = d?.operations?.trips || {};
  const activeTripsList = d?.activeTrips || [];
  const totalVehicles = d?.fleet?.vehicles?.total || 0;
  const inTransitTrips = trips.inTransit || 0;
  const dispatchedTrips = trips.dispatched || 0;
  const plannedTrips = trips.planned || 0;
  const availableVehicles = Math.max(
    0,
    totalVehicles - inTransitTrips - dispatchedTrips,
  );

  // Search filter across active & recent trips
  const filteredActiveTrips = activeTripsList.filter((t) => {
    if (!searchQuery) return true;
    const cleanQ = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanVehicle = String(t.vehicle || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const cleanTrip = String(t.tripNumber || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const q = searchQuery.toLowerCase();

    return (
      (cleanQ && cleanVehicle.includes(cleanQ)) ||
      (cleanQ && cleanTrip.includes(cleanQ)) ||
      t.vehicle?.toLowerCase().includes(q) ||
      t.tripNumber?.toLowerCase().includes(q) ||
      t.driver?.toLowerCase().includes(q) ||
      t.from?.toLowerCase().includes(q) ||
      t.to?.toLowerCase().includes(q) ||
      t.cargo?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q)
    );
  });

  const totalResultsCount =
    (searchResults.vehicles?.length || 0) +
    (searchResults.trips?.length || 0) +
    (searchResults.advanceMemos?.length || 0) +
    (searchResults.bilties?.length || 0) +
    (searchResults.containers?.length || 0);

  return (
    <div className="space-y-6 pb-12 w-full max-w-full overflow-x-hidden min-w-0">
      {/* 1. Brick Kiln & Fleet Master Command Hub */}
      <section className="relative overflow-visible rounded-3xl bg-gradient-to-br from-[#27140E] via-[#381B11] to-[#1C0D08] p-6 text-white shadow-xl sm:p-8 border border-[#5A2C1D]">
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-orange-600/15 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="absolute right-1/3 top-1/2 h-32 w-32 rounded-full bg-red-600/10 blur-2xl" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-300">
                <Flame className="h-3.5 w-3.5 text-orange-400" />{" "}
                {(activeCompany?.name || "SHRI SHYAM BRICKS").replace(/\s+co\.?$/i, "").toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Continuous Bulls Trench Kiln • 1050°C Fired
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-200">
                <MapPin className="h-3 w-3 text-amber-400" />
                Jaipur &amp; Tonk Kiln Hub
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>Kiln Operations &amp; Commercial Dispatch Hub</span>
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-300">
              Live tracking: Bulls trench kiln baking chambers, customer brick
              demand, tipper site dispatches, and LR consignment bilties.
            </p>

            {/* Embedded Kiln Capacity Counters */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.07] border border-white/10 px-3 py-1.5 backdrop-blur-xs">
                <Boxes className="h-4 w-4 text-amber-400" />
                <span>
                  <strong className="text-white font-black font-mono">
                    50,000+
                  </strong>{" "}
                  <span className="text-stone-300">Pcs/Day Kiln Firing</span>
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.07] border border-white/10 px-3 py-1.5 backdrop-blur-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>
                  <strong className="text-white font-black font-mono">
                    10.5+ MPa
                  </strong>{" "}
                  <span className="text-stone-300">IS:1077 Tested</span>
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.07] border border-white/10 px-3 py-1.5 backdrop-blur-xs">
                <Truck className="h-4 w-4 text-orange-400" />
                <span>
                  <strong className="text-white font-black font-mono">
                    25+
                  </strong>{" "}
                  <span className="text-stone-300">Tippers &amp; Lorries</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl border border-amber-500/30 bg-white/10 text-white backdrop-blur hover:bg-orange-600/30 font-bold text-xs px-4 py-2.5 transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />{" "}
              Refresh Kiln Pulse
            </button>
          </div>
        </div>

        {/* Live Search Bar for Trip / Vehicle with Instant Results Dropdown */}
        {true && (
          <div ref={searchRef} className="relative mt-6 max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim();
                if (!q) return;
                if (searchResults.vehicles?.length > 0) {
                  router.push(`/vehicles?search=${encodeURIComponent(q)}`);
                } else if (searchResults.advanceMemos?.length > 0) {
                  router.push(`/advance-memos?search=${encodeURIComponent(q)}`);
                } else if (searchResults.bilties?.length > 0) {
                  router.push(`/lr-bilties?search=${encodeURIComponent(q)}`);
                } else {
                  router.push(`/trips?search=${encodeURIComponent(q)}`);
                }
                setShowSearchDropdown(false);
              }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchDropdown(true);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim()) {
                    setShowSearchDropdown(true);
                    setSearchLoading(true);
                  } else {
                    setShowSearchDropdown(false);
                    setSearchLoading(false);
                  }
                }}
                placeholder="Search by Order No, Truck No (RJ-14...), Driver, Customer..."
                className="w-full rounded-2xl border-2 border-[#5A2C1D] bg-[#160B07]/90 py-3.5 pl-12 pr-24 text-sm font-semibold text-white placeholder:text-stone-400 outline-none focus:border-amber-400 focus:bg-[#1A0D08] focus:ring-4 focus:ring-amber-500/20 transition shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent mr-1" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchDropdown(false);
                      setSearchLoading(false);
                    }}
                    className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-slate-750 hover:text-white transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* Floating Live Search Dropdown */}
            {showSearchDropdown && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-700 bg-[#0d1627]/98 backdrop-blur-xl shadow-2xl p-4 text-white max-h-[460px] overflow-y-auto [scrollbar-width:thin]">
                <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${searchLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
                    />
                    <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                      {searchLoading
                        ? "Searching Fleet & Consignments…"
                        : `Live Search Results (${totalResultsCount} found)`}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {searchLoading
                      ? "Querying database..."
                      : "Click to open record"}
                  </span>
                </div>

                {searchLoading ? (
                  <div className="py-8 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2.5">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                    <p className="text-xs font-semibold text-slate-300">
                      Searching fleet, trips &amp; records for &quot;
                      {searchQuery}&quot;...
                    </p>
                  </div>
                ) : totalResultsCount === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <p>
                      No matching vehicles, trips, memos, or bilties found for
                      &quot;{searchQuery}&quot;.
                    </p>
                    <button
                      onClick={() => {
                        router.push(
                          `/trips?search=${encodeURIComponent(searchQuery)}`,
                        );
                        setShowSearchDropdown(false);
                      }}
                      className="mt-2 text-xs font-bold text-amber-400 hover:underline"
                    >
                      Search in Trips Register ➔
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Matching Vehicles */}
                    {searchResults.vehicles?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-amber-400" />{" "}
                          Commercial Vehicles ({searchResults.vehicles.length})
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {searchResults.vehicles.map((v) => (
                            <button
                              key={v._id}
                              type="button"
                              onClick={() => {
                                router.push(
                                  `/vehicles?search=${encodeURIComponent(v.vehicleNumber)}`,
                                );
                                setShowSearchDropdown(false);
                              }}
                              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-left hover:border-amber-400/60 hover:bg-slate-800 transition"
                            >
                              <div className="flex items-center gap-2">
                                <span className="rounded border border-amber-400 bg-amber-300 px-2 py-0.5 font-mono text-xs font-black text-slate-950">
                                  {v.vehicleNumber}
                                </span>
                                <span className="text-[11px] text-slate-300">
                                  {v.vehicleType}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {v.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Trips */}
                    {searchResults.trips?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Route className="h-3.5 w-3.5 text-orange-400" />{" "}
                          Highway Trips ({searchResults.trips.length})
                        </p>
                        <div className="grid gap-2">
                          {searchResults.trips.map((t) => (
                            <button
                              key={t._id}
                              type="button"
                              onClick={() => {
                                router.push(
                                  `/trips?search=${encodeURIComponent(t.tripNumber)}`,
                                );
                                setShowSearchDropdown(false);
                              }}
                              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-left hover:border-orange-400/60 hover:bg-slate-800 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-black text-amber-300">
                                  {t.tripNumber}
                                </span>
                                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-200">
                                  {t.vehicle}
                                </span>
                                {t.party && (
                                  <span className="text-xs text-slate-300">
                                    {t.party}
                                  </span>
                                )}
                                {(t.from || t.to) && (
                                  <span className="text-xs text-slate-400">
                                    ({t.from} ➔ {t.to})
                                  </span>
                                )}
                              </div>
                              <Badge value={t.status} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Advance Memos */}
                    {searchResults.advanceMemos?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-pink-400" />{" "}
                          Advance Memos ({searchResults.advanceMemos.length})
                        </p>
                        <div className="grid gap-2">
                          {searchResults.advanceMemos.map((m) => (
                            <button
                              key={m._id}
                              type="button"
                              onClick={() => {
                                router.push(
                                  `/advance-memos?search=${encodeURIComponent(m.memoNumber)}`,
                                );
                                setShowSearchDropdown(false);
                              }}
                              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-left hover:border-pink-400/60 hover:bg-slate-800 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-black text-pink-400">
                                  {m.memoNumber}
                                </span>
                                {m.truckNumber && (
                                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-200">
                                    {m.truckNumber}
                                  </span>
                                )}
                                {m.party && (
                                  <span className="text-xs text-slate-300">
                                    {m.party}
                                  </span>
                                )}
                                {(m.fromLocation || m.toLocation) && (
                                  <span className="text-xs text-slate-400">
                                    ({m.fromLocation} ➔ {m.toLocation})
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-pink-400">
                                View Memo ➔
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching LR Bilties */}
                    {searchResults.bilties?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Receipt className="h-3.5 w-3.5 text-amber-400" /> LR
                          Bilties ({searchResults.bilties.length})
                        </p>
                        <div className="grid gap-2">
                          {searchResults.bilties.map((b) => (
                            <button
                              key={b._id}
                              type="button"
                              onClick={() => {
                                router.push(
                                  `/lr-bilties?search=${encodeURIComponent(b.lrNumber)}`,
                                );
                                setShowSearchDropdown(false);
                              }}
                              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-left hover:border-amber-400/60 hover:bg-slate-800 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-black text-amber-300">
                                  {b.lrNumber}
                                </span>
                                {b.party && (
                                  <span className="text-xs text-slate-200">
                                    {b.party}
                                  </span>
                                )}
                                {(b.from || b.to) && (
                                  <span className="text-xs text-slate-400">
                                    ({b.from} ➔ {b.to})
                                  </span>
                                )}
                              </div>
                              <Badge value={b.status || "active"} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Containers */}
                    {searchResults.containers?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-cyan-400" />{" "}
                          Container Detentions (
                          {searchResults.containers.length})
                        </p>
                        <div className="grid gap-2">
                          {searchResults.containers.map((c) => (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => {
                                router.push(
                                  `/container-detentions?search=${encodeURIComponent(c.containerNumber)}`,
                                );
                                setShowSearchDropdown(false);
                              }}
                              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-left hover:border-cyan-400/60 hover:bg-slate-800 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-black text-cyan-400">
                                  {c.containerNumber}
                                </span>
                                {c.shippingLine && (
                                  <span className="text-xs text-slate-300">
                                    {c.shippingLine} (
                                    {c.containerSize || "20ft"})
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {c.emptyReturned
                                  ? "Returned"
                                  : "Active Detention"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      {/* RTO Statutory Transport Compliance Banner (if documents expiring/expired) */}
      {role === "super_admin" &&
        (Number(d?.fleet?.documents?.expiringWithin30Days || 0) > 0 ||
          alerts.some(
            (a) =>
              a.category === "document" ||
              a.documentType ||
              a.title?.toLowerCase().includes("document"),
          )) && (
          <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50/90 via-white to-amber-50/60 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#B83A1B] to-[#D35400] text-white font-black shadow-xs ring-2 ring-orange-200">
                <ShieldAlert className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#B83A1B] px-1.5 py-0.5 text-[9px] font-black uppercase text-white tracking-wide">
                    Fleet Compliance Notice
                  </span>
                  <p className="text-xs font-black text-stone-900">
                    {d?.fleet?.documents?.expiringWithin30Days ||
                      alerts.filter(
                        (a) => a.category === "document" || a.documentType,
                      ).length}{" "}
                    Commercial Vehicle Document(s) Expiring / Expired
                  </p>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Statutory Fitness, Permit or Insurance renewal required for uninterrupted highway tippers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("ssbc-open-compliance-alert"),
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B83A1B] to-[#D35400] px-3.5 py-1.5 text-xs font-black text-white hover:from-[#9E2A0E] hover:to-[#B83A1B] transition cursor-pointer shadow-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Review Alerts</span>
              </button>
              <Link
                href="/vehicle-documents"
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-orange-50 hover:text-orange-900 transition cursor-pointer"
              >
                <span>Document Desk</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}


      {/* 2. Kiln & Logistics Action Center (Distinctive Dual-Tone Cards) */}
      <section className="rounded-3xl border border-[#E8DFD8] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#B83A1B] to-[#D35400] text-white font-black shadow-xs">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-900">
                Kiln &amp; Fleet Action Center • त्वरित कार्य
              </h2>
              <p className="text-[11px] text-stone-400 font-medium">
                1-Click dispatch, supply orders, bilty generation &amp; driver
                settlements
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-black px-2.5 py-0.5">
            Kiln Operations Desk
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* Action 1: Book Brick Order */}
          <button
            onClick={() => router.push("/supply-orders")}
            className="group relative flex flex-col items-start gap-2 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-orange-400 hover:shadow-md cursor-pointer text-left"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#B83A1B] to-[#D35400] text-white shadow-sm font-black group-hover:scale-105 transition-transform">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <span className="font-black text-xs text-stone-900 block group-hover:text-orange-600 transition">
                + Supply Order
              </span>
              <span className="text-[10px] text-orange-800 font-bold block mt-0.5">
                नया ईंट आर्डर
              </span>
              <span className="text-[9px] text-stone-400 block">
                Customer Demand
              </span>
            </div>
          </button>

          {/* Action 2: Dispatch Tipper */}
          <button
            onClick={() => router.push("/trips?autoOpenAdd=true")}
            className="group relative flex flex-col items-start gap-2 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/40 p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-amber-400 hover:shadow-md cursor-pointer text-left"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 text-white shadow-sm font-black group-hover:scale-105 transition-transform">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <span className="font-black text-xs text-stone-900 block group-hover:text-amber-600 transition">
                + Dispatch Tipper
              </span>
              <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                गाड़ी रवाना करें
              </span>
              <span className="text-[9px] text-stone-400 block">
                Assign Tipper &amp; Driver
              </span>
            </div>
          </button>

          {/* Action 3: LR / Bilty */}
          <button
            onClick={() => router.push("/lr-bilties?autoOpenAdd=true")}
            className="group relative flex flex-col items-start gap-2 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/70 via-white to-orange-50/40 p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-red-400 hover:shadow-md cursor-pointer text-left"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-red-700 to-orange-600 text-white shadow-sm font-black group-hover:scale-105 transition-transform">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <span className="font-black text-xs text-stone-900 block group-hover:text-red-700 transition">
                + Print LR Bilty
              </span>
              <span className="text-[10px] text-red-800 font-bold block mt-0.5">
                बिल्टी व चालान
              </span>
              <span className="text-[9px] text-stone-400 block">
                3-Copy Delivery Slip
              </span>
            </div>
          </button>

          {/* Action 4: Customer Invoice */}
          <button
            onClick={() => router.push("/customer-invoices?autoOpenAdd=true")}
            className="group relative flex flex-col items-start gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-md cursor-pointer text-left"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm font-black group-hover:scale-105 transition-transform">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="font-black text-xs text-stone-900 block group-hover:text-emerald-700 transition">
                + Customer Bill
              </span>
              <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                पार्टी इनवॉइस
              </span>
              <span className="text-[9px] text-stone-400 block">
                Billing &amp; Ledger
              </span>
            </div>
          </button>

          {/* Action 5: Diesel & Fuel Slip */}
          <button
            onClick={() => router.push("/fuels?autoOpenAdd=true")}
            className="group relative flex flex-col items-start gap-2 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md cursor-pointer text-left"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm font-black group-hover:scale-105 transition-transform">
              <Fuel className="h-4 w-4" />
            </div>
            <div>
              <span className="font-black text-xs text-stone-900 block group-hover:text-blue-700 transition">
                + Fuel Slip
              </span>
              <span className="text-[10px] text-blue-800 font-bold block mt-0.5">
                डीजल पर्ची दर्ज
              </span>
              <span className="text-[9px] text-stone-400 block">
                Pump Slip &amp; KM
              </span>
            </div>
          </button>

          {/* Action 6: Driver Cash Advance */}
          <button
            onClick={() => router.push("/advance-memos?autoOpenAdd=true")}
            className="group relative flex flex-col items-start gap-2 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-violet-50/40 p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-purple-400 hover:shadow-md cursor-pointer text-left"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-sm font-black group-hover:scale-105 transition-transform">
              <Banknote className="h-4 w-4" />
            </div>
            <div>
              <span className="font-black text-xs text-stone-900 block group-hover:text-purple-700 transition">
                + Cash Advance
              </span>
              <span className="text-[10px] text-purple-800 font-bold block mt-0.5">
                ड्राइवर पेशगी
              </span>
              <span className="text-[9px] text-stone-400 block">
                Trip Advance Memo
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. Real-time Kiln & Fleet Status Pulse */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: On Highway */}
        <div className="rounded-2xl border border-emerald-200/90 bg-white p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
              <Truck className="h-5 w-5" />
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Highway
            </span>
          </div>
          <p className="text-2xl font-black text-stone-950 font-mono">
            {num(inTransitTrips)}
          </p>
          <p className="text-[11px] font-bold text-stone-800 mt-0.5">
            Tippers on Highway
          </p>
          <p className="text-[10px] text-stone-400 truncate">
            En-route to customer sites
          </p>
        </div>

        {/* Card 2: Dispatched / Loading */}
        <div className="rounded-2xl border border-orange-200/90 bg-white p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-800 font-bold">
              <Play className="h-5 w-5 fill-current" />
            </span>
            <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[9px] font-black uppercase text-orange-700">
              Chamber Yard
            </span>
          </div>
          <p className="text-2xl font-black text-stone-950 font-mono">
            {num(dispatchedTrips + plannedTrips)}
          </p>
          <p className="text-[11px] font-bold text-stone-800 mt-0.5">
            Loading / Planned
          </p>
          <p className="text-[10px] text-stone-400 truncate">
            Loading at bhatta chattes
          </p>
        </div>

        {/* Card 3: Kiln Depot Available (Free) */}
        <div className="rounded-2xl border border-blue-200/90 bg-white p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-800 font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700">
              Ready
            </span>
          </div>
          <p className="text-2xl font-black text-stone-950 font-mono">
            {num(availableVehicles)}
          </p>
          <p className="text-[11px] font-bold text-stone-800 mt-0.5">
            Free Tippers at Kiln
          </p>
          <p className="text-[10px] text-stone-400 truncate">
            Ready for instant assignment
          </p>
        </div>

        {/* Card 4: Supply Orders */}
        <Link
          href="/supply-orders"
          className="rounded-2xl border border-amber-300/90 bg-white p-4 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer relative overflow-hidden block"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800 font-bold">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">
              Orders
            </span>
          </div>
          <p className="text-2xl font-black text-stone-950 font-mono">
            {num(d?.supplyOrders?.total || 0)}
          </p>
          <p className="text-[11px] font-bold text-stone-800 mt-0.5">
            Brick Supply Orders
          </p>
          <p className="text-[10px] text-stone-400 truncate">
            Customer demand registry
          </p>
        </Link>

        {/* Card 5: LR / Bilties */}
        <Link
          href="/lr-bilties"
          className="rounded-2xl border border-orange-200/90 bg-white p-4 shadow-xs hover:border-orange-400 hover:shadow-md transition cursor-pointer relative overflow-hidden block"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-800 font-bold">
              <Receipt className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[9px] font-black uppercase text-orange-700">
              Official Bilty
            </span>
          </div>
          <p className="text-2xl font-black text-stone-950 font-mono">
            {num(d?.lrBilties?.total || d?.trips?.total || 0)}
          </p>
          <p className="text-[11px] font-bold text-stone-800 mt-0.5">
            Consignment Notes
          </p>
          <p className="text-[10px] text-stone-400 truncate">
            3-copy delivery bilties
          </p>
        </Link>

        {/* Card 6: RTO / Document Expiry */}
        <div
          onClick={() => {
            window.dispatchEvent(new CustomEvent("ssbc-open-compliance-alert"));
          }}
          className="rounded-2xl border border-rose-200/90 bg-white p-4 shadow-xs hover:border-rose-400 hover:shadow-md transition cursor-pointer relative overflow-hidden"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-800 font-bold">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-black uppercase text-rose-700 flex items-center gap-1">
              {Number(d?.fleet?.documents?.expiringWithin30Days || 0) > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
              )}
              M.V. Act
            </span>
          </div>
          <p className="text-2xl font-black text-stone-950 font-mono">
            {num(d?.fleet?.documents?.expiringWithin30Days || 0)}
          </p>
          <p className="text-[11px] font-bold text-stone-800 mt-0.5">
            RTO Expiry Alert
          </p>
          <p className="text-[10px] text-stone-400 truncate">
            Fitness / Permit / Insurance
          </p>
        </div>
      </section>

      {/* 4. Active Kiln Supply Orders & Site Delivery Fulfillment Tracker (Unique Kiln Feature) */}
      <section className="rounded-3xl border border-[#E8DFD8] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-100 text-orange-800 font-bold">
                <Boxes className="h-4 w-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-stone-950">
                Active Kiln Supply Orders &amp; Site Fulfillment Tracker
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Live customer brick demand, site delivery progress, remaining
              pieces, and 1-click tipper dispatch
            </p>
          </div>
          <Link
            href="/supply-orders"
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-black text-orange-700 hover:bg-orange-100 transition self-start sm:self-center"
          >
            <span>Open Order Desk</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {liveSupplyOrders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs font-bold text-stone-500">
              No active customer supply orders found
            </p>
            <Link
              href="/supply-orders"
              className="mt-2 inline-block text-xs font-black text-orange-600 hover:underline"
            >
              + Create First Supply Order ➔
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {liveSupplyOrders.map((so) => {
              const qty = Number(so.quantity) || 1;
              const disp = Number(so.dispatchedQuantity) || 0;
              const pend = Math.max(0, qty - disp);
              const pct = Math.min(100, Math.round((disp / qty) * 100));

              return (
                <div
                  key={so._id}
                  className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4 hover:border-orange-300 hover:bg-white hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-black text-orange-700 bg-orange-100/70 border border-orange-200 px-2 py-0.5 rounded-md">
                      {so.soNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        so.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : so.status === "partially_dispatched"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}
                    >
                      {so.status === "completed"
                        ? "Completed"
                        : so.status === "partially_dispatched"
                          ? "In Progress"
                          : "Pending"}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-stone-900 mt-2 truncate">
                    {so.partyName}
                  </h3>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                    <span>
                      {so.deliverySite || so.destinationCity || "Site Location"}
                    </span>
                  </p>

                  <div className="mt-3 bg-white p-2.5 rounded-xl border border-stone-200/80 text-xs">
                    <div className="flex justify-between font-bold text-stone-700 mb-1">
                      <span>{so.productName || "Red Clay Bricks"}</span>
                      <span className="font-mono">
                        {qty.toLocaleString("en-IN")} Pcs
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#B83A1B] to-[#E67E22] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 font-semibold">
                      <span className="text-emerald-700 font-mono">
                        Dispatched: {disp.toLocaleString("en-IN")}
                      </span>
                      <span className="text-red-600 font-mono">
                        Remaining: {pend.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-200/60 text-xs">
                    <span className="text-[11px] text-stone-500 font-mono">
                      @ ₹{so.rate}/pc • Total: ₹
                      {Number(so.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                    {pend > 0 && so.status !== "completed" ? (
                      <Link
                        href={`/trips?autoOpenAdd=true&fromSupplyOrder=true&supplyOrderId=${so._id}&supplyOrderNumber=${encodeURIComponent(so.soNumber || "")}&partyName=${encodeURIComponent(so.partyName || "")}&partyId=${encodeURIComponent(so.partyId || "")}&toCity=${encodeURIComponent(so.deliverySite || so.destinationCity || "")}&fromCity=${encodeURIComponent("Shri Shyam Kiln, Tonk Road")}&rate=4500&advanceAmount=1500&weight=${pend}&containerSize=${encodeURIComponent(`${pend} Pcs ${so.productName || "Bricks"}`)}&remarks=${encodeURIComponent(`Dispatch for Supply Order #${so.soNumber} • ${so.partyName} (${pend} Pcs remaining)`)}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#B83A1B] hover:bg-[#9E2A0E] text-white font-bold text-[11px] px-2.5 py-1 transition shadow-xs"
                      >
                        <Truck className="h-3 w-3" />
                        <span>Dispatch Tipper</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600">
                        All Delivered ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Fleet Telemetry & Commercial Analytics (Recharts Engine) */}
      <section className="rounded-3xl border border-[#E8DFD8] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#B83A1B] to-[#9E2A0E] text-white shadow-xs font-black">
                <BarChart3 className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-black text-stone-950 flex items-center gap-2">
                Kiln Telemetry &amp; Commercial Analytics
                <span className="rounded-full bg-orange-100 border border-orange-300/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-800">
                  Recharts Visual Engine
                </span>
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Live brick sales revenue vs tipper fleet burn, vehicle utilization
              ratio &amp; site delivery corridors
            </p>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-stone-100 p-1 border border-stone-200/60">
            <button
              type="button"
              onClick={() => setAnalyticsTab("all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                analyticsTab === "all"
                  ? "bg-gradient-to-r from-[#B83A1B] to-[#D35400] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              All Telemetry
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTab("commercial")}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                analyticsTab === "commercial"
                  ? "bg-gradient-to-r from-[#B83A1B] to-[#D35400] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Commercial &amp; Margins
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTab("operations")}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                analyticsTab === "operations"
                  ? "bg-gradient-to-r from-[#B83A1B] to-[#D35400] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Fleet Corridors &amp; Utilization
            </button>
          </div>
        </div>

        {/* Commercial Highlights Mini-Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-3.5">
            <div className="flex items-center justify-between text-orange-800 text-xs font-bold">
              <span>Brick Sales Billed</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <p className="mt-1 text-lg font-black text-stone-950">
              {money(totalBilled)}
            </p>
            <p className="text-[10px] text-stone-500">Total Invoiced Billing</p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5">
            <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
              <span>Fleet Operating Burn</span>
              <Fuel className="h-4 w-4" />
            </div>
            <p className="mt-1 text-lg font-black text-stone-950">
              {money(totalBurn)}
            </p>
            <p className="text-[10px] text-stone-500">
              Diesel, Tyres &amp; Expenses
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
              <span>Net Gross Margin</span>
              <span className="font-mono text-[11px] font-black">
                {marginPct}%
              </span>
            </div>
            <p className="mt-1 text-lg font-black text-emerald-700">
              {money(netMarginVal)}
            </p>
            <p className="text-[10px] text-stone-500">Gross Operating Profit</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5">
            <div className="flex items-center justify-between text-amber-700 text-xs font-bold">
              <span>Collection Realized</span>
              <span className="font-mono text-[11px] font-black">
                {collectionPct}%
              </span>
            </div>
            <p className="mt-1 text-lg font-black text-stone-950">
              {money(totalCollected)}
            </p>
            <p className="text-[10px] text-stone-500">Party Cash Inflow</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Chart 1: Revenue vs Burn Trend (AreaChart) */}
          {(analyticsTab === "all" || analyticsTab === "commercial") && (
            <div
              className={`${analyticsTab === "commercial" ? "lg:col-span-8" : "lg:col-span-7"} rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs min-w-0 overflow-hidden`}
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#B83A1B]" />
                    Commercial Run-Rate • 6-Month Invoicing vs Operating Burn
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Monthly brick sales vs operational diesel &amp; tipper burn
                    (Real Ledgers)
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-[#B83A1B]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#B83A1B]" />{" "}
                    Billed
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />{" "}
                    Collected
                  </span>
                  <span className="flex items-center gap-1 text-rose-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />{" "}
                    Burn
                  </span>
                </div>
              </div>

              <div className="h-64 w-full min-w-0">
                {mounted ? (
                  financialTrendData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 mb-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                      </div>
                      <p className="text-xs font-bold text-stone-700">
                        No Commercial Revenue / Expense Data Yet
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Create invoices or record trip expenses to generate
                        weekly run-rate
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={financialTrendData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorRev"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#B83A1B"
                              stopOpacity={0.28}
                            />
                            <stop
                              offset="95%"
                              stopColor="#B83A1B"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorRec"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#059669"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="#059669"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorExp"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#DC2626"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#DC2626"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f5ede7"
                        />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 11, fill: "#78716c" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#78716c" }}
                          tickFormatter={(val) =>
                            val >= 100000
                              ? `${(val / 100000).toFixed(1)}L`
                              : val >= 1000
                                ? `${(val / 1000).toFixed(0)}k`
                                : val
                          }
                        />
                        <Tooltip content={<CustomCurrencyTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Billed Sales"
                          stroke="#B83A1B"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                        />
                        <Area
                          type="monotone"
                          dataKey="collections"
                          name="Collections"
                          stroke="#059669"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRec)"
                        />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          name="Operating Burn"
                          stroke="#DC2626"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorExp)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full grid place-items-center text-xs text-stone-400">
                    Loading charts...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chart 2: Operating Expense Distribution (PieChart) */}
          {(analyticsTab === "all" || analyticsTab === "commercial") && (
            <div
              className={`${analyticsTab === "commercial" ? "lg:col-span-4" : "lg:col-span-5"} rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs min-w-0 overflow-hidden`}
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                    <Fuel className="h-4 w-4 text-[#B83A1B]" />
                    Kiln &amp; Tipper Cost Distribution
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Diesel, vehicle repairs, tyre wear &amp; site trip tolls
                  </p>
                </div>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-800">
                  {money(totalBurn)}
                </span>
              </div>

              <div className="h-48 w-full min-w-0">
                {mounted ? (
                  expenseDistributionData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 mb-2">
                        <Fuel className="h-5 w-5 text-orange-500" />
                      </div>
                      <p className="text-xs font-bold text-stone-700">
                        No Operating Expenses Recorded
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Diesel slips, repairs &amp; tyre costs will appear here
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {expenseDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val) => [money(val), "Cost"]}
                          contentStyle={{
                            backgroundColor: "#1C0D08",
                            borderRadius: "12px",
                            border: "1px solid #3E271D",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)",
                          }}
                          labelStyle={{
                            color: "#ffffff",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                          itemStyle={{
                            color: "#f8fafc",
                            fontWeight: "600",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full grid place-items-center text-xs text-stone-400">
                    Loading cost chart...
                  </div>
                )}
              </div>

              {/* Legend with exact amounts */}
              {expenseDistributionData.length === 0 ? (
                <div className="mt-2 pt-2 border-t border-stone-100 text-center text-[11px] text-stone-400">
                  ₹0 Total Operating Expenses Logged
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                  {expenseDistributionData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-[11px]"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-stone-600 truncate">
                        {item.name}
                      </span>
                      <span className="ml-auto font-mono font-bold text-stone-900">
                        {money(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chart 3: Fleet Vehicle Utilization & Allocation (Donut Chart) */}
          {(analyticsTab === "all" || analyticsTab === "operations") && (
            <div
              className={`${analyticsTab === "operations" ? "lg:col-span-4" : "lg:col-span-4"} rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs min-w-0 overflow-hidden`}
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-[#B83A1B]" />
                    Tipper Fleet Allocation
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Loading at kiln, highway transit &amp; free tippers
                  </p>
                </div>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-800">
                  {num(d?.fleet?.vehicles?.total || 0)} Trucks
                </span>
              </div>

              <div className="h-48 w-full min-w-0">
                {mounted ? (
                  fleetUtilizationData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 mb-2">
                        <Truck className="h-5 w-5 text-orange-500" />
                      </div>
                      <p className="text-xs font-bold text-stone-700">
                        No Fleet Vehicles Registered
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Add vehicles to view live yard &amp; highway transit
                        allocation
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fleetUtilizationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {fleetUtilizationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val) => [`${val} Tippers`, "Count"]}
                          contentStyle={{
                            backgroundColor: "#1C0D08",
                            borderRadius: "12px",
                            border: "1px solid #3E271D",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)",
                          }}
                          labelStyle={{
                            color: "#ffffff",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                          itemStyle={{
                            color: "#E67E22",
                            fontWeight: "600",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full grid place-items-center text-xs text-stone-400">
                    Loading fleet chart...
                  </div>
                )}
              </div>

              {/* Status Breakdown Legend */}
              {fleetUtilizationData.length === 0 ? (
                <div className="mt-2 pt-2 border-t border-stone-100 text-center text-[11px] text-stone-400">
                  0 Fleet Units Registered
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                  {fleetUtilizationData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-[11px]"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-stone-600 truncate">
                        {item.name}
                      </span>
                      <span className="ml-auto font-mono font-bold text-stone-900">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chart 4: Top Highway Corridors & Volumes (BarChart) */}
          {(analyticsTab === "all" || analyticsTab === "operations") && (
            <div
              className={`${analyticsTab === "operations" ? "lg:col-span-8" : "lg:col-span-8"} rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs min-w-0 overflow-hidden`}
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                    <Route className="h-4 w-4 text-[#B83A1B]" />
                    Top Kiln Delivery Corridors &amp; Volumes
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Site delivery density and dispatched brick quantities across
                    destinations
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-[#B83A1B]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#B83A1B]" />{" "}
                    Dispatched Trips
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{" "}
                    Bricks ('000 Pcs)
                  </span>
                </div>
              </div>

              <div className="h-56 w-full min-w-0">
                {mounted ? (
                  corridorVolumeData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 mb-2">
                        <Route className="h-5 w-5 text-amber-500" />
                      </div>
                      <p className="text-xs font-bold text-stone-700">
                        No Delivery Corridors Active Yet
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Trips dispatched with Route &amp; Cargo will form
                        density rankings here
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={corridorVolumeData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f5ede7"
                        />
                        <XAxis
                          dataKey="route"
                          tick={{ fontSize: 10, fill: "#78716c" }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#78716c" }} />
                        <Tooltip
                          formatter={(val, name) => [
                            `${val} ${name === "trips" ? "Trips" : "Units"}`,
                            name === "trips"
                              ? "Dispatched Trips"
                              : "Bricks ('000 Pcs)",
                          ]}
                          contentStyle={{
                            backgroundColor: "#1C0D08",
                            borderRadius: "12px",
                            border: "1px solid #3E271D",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)",
                          }}
                          labelStyle={{
                            color: "#ffffff",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                          itemStyle={{
                            color: "#E67E22",
                            fontWeight: "600",
                          }}
                        />
                        <Bar
                          dataKey="trips"
                          name="Trips"
                          fill="#B83A1B"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="tonnage"
                          name="Bricks ('000 Pcs)"
                          fill="#D97706"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full grid place-items-center text-xs text-stone-400">
                    Loading route corridors...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chart 5: Consignment Lifecycle Pipeline */}
          {(analyticsTab === "all" || analyticsTab === "operations") && (
            <div className="lg:col-span-12 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs min-w-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#B83A1B]" />
                    Kiln Dispatch Lifecycle &amp; Delivery Pipeline
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Trip velocity across stages: Planned → Loading at Kiln → On
                    Highway → Site Unloading → Completed
                  </p>
                </div>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-black text-orange-800">
                  Total Dispatches: {num(d?.operations?.trips?.total || 0)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {consignmentStatusData.map((s) => (
                  <span
                    key={s.stage}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-stone-50 border border-stone-200/80 px-2.5 py-1 text-[11px] font-semibold text-stone-700"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.fill }}
                    />
                    <span>{s.stage}:</span>
                    <strong className="font-bold text-stone-900">
                      {s.count}
                    </strong>
                  </span>
                ))}
              </div>

              <div className="h-44 w-full min-w-0">
                {mounted ? (
                  consignmentStatusData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 mb-2">
                        <Layers className="h-5 w-5 text-orange-500" />
                      </div>
                      <p className="text-xs font-bold text-stone-700">
                        No Dispatches in Lifecycle Pipeline Yet
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Trips will automatically populate across Planned,
                        Loading, Highway Transit, Delivered &amp; Completed
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={consignmentStatusData}
                        layout="horizontal"
                        margin={{ top: 16, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f5ede7"
                        />
                        <XAxis
                          dataKey="stage"
                          tick={{ fontSize: 11, fill: "#78716c" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#78716c" }}
                          allowDecimals={false}
                          domain={[
                            0,
                            (dataMax) => Math.max(4, Number(dataMax) + 1),
                          ]}
                        />
                        <Tooltip
                          formatter={(val) => [`${val} Trips`, "Count"]}
                          contentStyle={{
                            backgroundColor: "#1C0D08",
                            borderRadius: "12px",
                            border: "1px solid #3E271D",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "bold",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)",
                          }}
                          labelStyle={{
                            color: "#ffffff",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                          itemStyle={{
                            color: "#E67E22",
                            fontWeight: "bold",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          name="Trips"
                          maxBarSize={48}
                          radius={[8, 8, 0, 0]}
                        >
                          <LabelList
                            dataKey="count"
                            position="top"
                            style={{
                              fontSize: 11,
                              fontWeight: "bold",
                              fill: "#57534e",
                            }}
                          />
                          {consignmentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full grid place-items-center text-xs text-stone-400">
                    Loading pipeline...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Live Highway Transit Board */}
      <section className="rounded-3xl border border-[#E8DFD8] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-100 text-orange-800 font-black">
                <Truck className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-black text-stone-950">
                Live Kiln Tipper Fleet • Highway &amp; Site Dispatch Board
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Real-time brick delivery tippers, driver hotline, live highway
              progress, and site delivery status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                Filter: “{searchQuery}” ({filteredActiveTrips.length})
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="ml-1 text-amber-800 hover:text-black font-black"
                >
                  ✕
                </button>
              </span>
            )}
            <span className="rounded-full bg-stone-100 border border-stone-200 px-3 py-1 font-mono text-xs font-bold text-stone-700">
              Showing: {filteredActiveTrips.length} Active Tippers
            </span>
            <Link
              href="/trips"
              className="inline-flex items-center gap-1 text-xs font-black text-[#B83A1B] hover:text-[#9E2A0E]"
            >
              View All Tippers <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {filteredActiveTrips.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-600 border border-orange-200">
              <Truck className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-bold text-stone-800">
              {searchQuery
                ? "No matching tippers found"
                : "No active tippers on highway at the moment"}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Click <b>+ Dispatch Tipper</b> above to send vehicles to
              construction sites.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredActiveTrips.map((trip) => {
              const st = trip.status?.toLowerCase();

              return (
                <div
                  key={trip._id}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-stone-50/30 p-4 shadow-xs transition hover:border-orange-300 hover:bg-white hover:shadow-md"
                >
                  {/* Card Header: Truck & Status */}
                  <div>
                    <div className="flex items-start justify-between gap-3 border-b border-stone-200/70 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid h-10 w-10 place-items-center rounded-xl font-bold shadow-xs ${
                            st === "in_transit"
                              ? "bg-emerald-600 text-white"
                              : st === "dispatched"
                                ? "bg-[#B83A1B] text-white"
                                : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="inline-flex items-center rounded-md border border-amber-500 bg-[#FEDD00] px-2 py-0.5 font-mono text-xs font-black tracking-wider text-stone-950 shadow-2xs">
                            <span className="mr-1.5 rounded-xs bg-blue-700 px-1 py-0.2 text-[8px] font-black text-white uppercase tracking-tighter">
                              IND
                            </span>
                            {trip.vehicle}
                          </div>
                          <p className="mt-1 text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1">
                            <span>{trip.vehicleType || "Brick Tipper"}</span>
                            <span>•</span>
                            <span className="font-mono text-orange-800 font-extrabold">
                              {trip.weight
                                ? `${Number(trip.weight).toLocaleString("en-IN")} Pcs / MT`
                                : "Brick Delivery"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Badge value={trip.status} />
                    </div>

                    {/* Route Track */}
                    <div className="my-3 rounded-xl border border-stone-200/70 bg-white p-3">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                        <span className="flex items-center gap-1 truncate max-w-[45%]">
                          <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {trip.from || "Tonk Road Kiln"}
                          </span>
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase ${
                            st === "completed" ||
                            st === "delivered" ||
                            st === "settled"
                              ? "text-emerald-700 font-bold"
                              : st === "in_transit"
                                ? "text-amber-600"
                                : "text-stone-500"
                          }`}
                        >
                          {st === "completed"
                            ? "Completed"
                            : st === "delivered"
                              ? "Delivered"
                              : st === "in_transit"
                                ? "On Highway"
                                : "Loading"}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[45%] justify-end">
                          <Navigation className="h-3 w-3 text-orange-600 shrink-0" />
                          <span className="truncate">
                            {trip.to || "Site Location"}
                          </span>
                        </span>
                      </div>

                      <div className="relative mt-2">
                        <div className="h-1.5 w-full rounded-full bg-stone-200">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              st === "completed" ||
                              st === "delivered" ||
                              st === "settled"
                                ? "w-full bg-emerald-500"
                                : st === "in_transit"
                                  ? "w-3/5 bg-gradient-to-r from-orange-500 to-emerald-500 animate-pulse"
                                  : st === "dispatched"
                                    ? "w-1/4 bg-amber-500"
                                    : "w-1/12 bg-stone-300"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                        <span>
                          Dispatch:{" "}
                          <b>
                            {trip.dispatchDate
                              ? new Date(trip.dispatchDate).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                  },
                                )
                              : "—"}
                          </b>
                        </span>
                        {trip.startingOdometer ? (
                          <span>
                            Odometer: <b>{trip.startingOdometer} km</b>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Driver & Consignment Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between rounded-lg bg-stone-100/70 px-2.5 py-1.5">
                        <span className="text-stone-500 font-medium">
                          Driver (चालक):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">
                            {trip.driver}
                          </span>
                          {trip.driverPhone && trip.driverPhone !== "N/A" && (
                            <a
                              href={`tel:${trip.driverPhone}`}
                              className="inline-flex items-center gap-1 rounded bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 text-[11px] font-black text-emerald-800 hover:bg-emerald-200"
                              title="Call Driver"
                            >
                              <Phone className="h-2.5 w-2.5 text-emerald-700" />
                              {trip.driverPhone}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-stone-100/70 px-2.5 py-1.5">
                        <span className="text-stone-500 font-medium">
                          Dispatch Bilty #:
                        </span>
                        <span className="font-mono font-bold text-stone-800">
                          {trip.tripNumber ||
                            trip.bookingNumber ||
                            "Direct Dispatch"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fast Action Buttons Footer */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-stone-200/70 pt-2.5">
                    {st === "dispatched" && (
                      <button
                        onClick={() =>
                          actOnTrip(startTrip, trip._id, "started")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-black text-stone-950 shadow-xs hover:from-amber-400 hover:to-amber-500 transition"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Start Journey
                      </button>
                    )}

                    {st === "in_transit" && (
                      <button
                        onClick={() =>
                          actOnTrip(deliverTrip, trip._id, "delivered")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-teal-800 transition"
                      >
                        <PackageCheck className="h-3 w-3" />
                        Mark Site Delivered
                      </button>
                    )}

                    {/* Diesel Slip Link */}
                    <button
                      onClick={() => router.push(`/fuels?autoOpenAdd=true`)}
                      className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-2 py-1.5 text-xs font-bold text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition"
                      title="Add Diesel Voucher"
                    >
                      <Fuel className="h-3 w-3 text-stone-400" />
                      Fuel
                    </button>

                    <Link
                      href="/trips"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-orange-50 hover:text-orange-700 transition"
                      title="Open Trip Details"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
