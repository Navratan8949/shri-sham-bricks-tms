"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LockKeyhole,
  Mail,
  ArrowRight,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
  Flame,
  Boxes,
  PhoneCall,
  AlertCircle,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  FileText,
  BadgeCheck,
  Building2,
  TrendingUp,
} from "lucide-react";
import { login } from "@/src/services/auth.service";
import {
  saveSession,
  getToken,
  getActiveCompany,
  getStoredUser,
  setActiveCompany,
} from "@/src/lib/auth";
import { getCompanies } from "@/src/services/company.service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const active = getActiveCompany();
        if (active?.name) return active.name.replace(/\s+co\.?$/i, "");
      } catch {
        // ignore SSR
      }
    }
    return "Shri Shyam Bricks";
  });

  useEffect(() => {
    if (getToken()) {
      const u = getStoredUser();
      const active = getActiveCompany();
      const storedId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("ssbc_company") ||
            sessionStorage.getItem("nrl_company")
          : null;
      if (u?.role === "super_admin" && !active && !storedId) {
        getCompanies()
          .then((res) => {
            const list = res?.data || [];
            if (list.length === 1) {
              setActiveCompany(list[0]);
              router.replace("/dashboard");
            } else if (list.length > 1) {
              router.replace("/select-company");
            } else {
              router.replace("/dashboard");
            }
          })
          .catch(() => router.replace("/dashboard"));
      } else {
        router.replace("/dashboard");
      }
      return;
    }
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await login({ email, password });
      saveSession(r.token, r.user);

      const autoCompany =
        r.company ||
        r.autoSelectedCompany ||
        (r.user?.companyId && typeof r.user.companyId === "object"
          ? r.user.companyId
          : null);

      if (autoCompany) {
        setActiveCompany(autoCompany);
        router.replace("/dashboard");
        return;
      }

      if (r.user?.role === "super_admin") {
        try {
          const compRes = await getCompanies();
          const list = compRes?.data || [];
          if (list.length === 1) {
            setActiveCompany(list[0]);
            router.replace("/dashboard");
            return;
          } else if (list.length > 1) {
            router.replace("/select-company");
            return;
          }
        } catch {
          // fallback
        }
      }

      router.replace("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password. Please verify and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail("admin@shrishyambricks.com");
    setPassword("admin@123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Light Warm Atmospheric Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-orange-200/50 via-amber-100/40 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[650px] w-[650px] rounded-full bg-gradient-to-tl from-amber-200/40 via-orange-100/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-orange-300/10 blur-[100px]" />

      {/* Subtle Light Masonry Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='30' viewBox='0 0 60 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v30H0z' fill='none'/%3E%3Cpath d='M0 0h30v15H0zm30 15h30v15H30zM0 15h30v15H0zm30-15h30v15H30z' fill='%23b45309' fill-opacity='0.4' stroke='%23b45309' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ========================================================= */}
      {/* TOP HEADER / BACK TO PUBLIC SITE (Clean Light)             */}
      {/* ========================================================= */}
      <header className="relative z-20 border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-md shadow-orange-950/5 group-hover:scale-105 transition flex items-center justify-center border border-orange-100">
              <Image
                src="/images/logo.png"
                alt="Shri Shyam Bricks Logo"
                width={44}
                height={44}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-stone-900 group-hover:text-orange-600 transition uppercase">
                  {companyName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-black text-orange-700">
                  <Flame className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
                  KILN ERP
                </span>
              </div>
              <p className="text-[11px] font-semibold text-stone-500">
                Manufacturing, Fleet Dispatch &amp; Accounts Portal
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-bold text-stone-700 shadow-xs hover:border-orange-300 hover:text-orange-600 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Public Website</span>
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN LOGIN SECTION (Fresh Light Aesthetic)                */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Visual Showcase (Light & Elegant) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-6">
            <div>
              {/* Kiln Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-bold text-orange-800 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tonk Road Hub • Jaipur Kiln Yard</span>
              </div>

              <h1 className="mt-5 text-3xl xl:text-4xl font-black text-stone-900 leading-tight tracking-tight">
                Smart Command Desk for Brick Manufacturing &amp; Fleet Dispatch.
              </h1>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed font-normal">
                Seamless management of customer supply indents, tipper truck
                trips, digital LR / bilty notes, and GST billing ledgers.
              </p>
            </div>

            {/* Feature Cards Grid (Crisp Light Cards) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-orange-300 hover:shadow-sm transition">
                <div className="flex items-center gap-2 text-orange-600 text-xs font-black">
                  <Boxes className="h-4 w-4" /> Supply Orders
                </div>
                <p className="mt-1 text-[11px] text-stone-500 leading-snug">
                  Customer indents, brick grades &amp; delivery sites
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-orange-300 hover:shadow-sm transition">
                <div className="flex items-center gap-2 text-amber-600 text-xs font-black">
                  <Truck className="h-4 w-4" /> Lorry Dispatch
                </div>
                <p className="mt-1 text-[11px] text-stone-500 leading-snug">
                  Tipper fleet assignment &amp; trip odometer challans
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-orange-300 hover:shadow-sm transition">
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-black">
                  <FileText className="h-4 w-4" /> LR / Bilty
                </div>
                <p className="mt-1 text-[11px] text-stone-500 leading-snug">
                  Computerized consignment notes &amp; e-Way bill records
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-orange-300 hover:shadow-sm transition">
                <div className="flex items-center gap-2 text-orange-600 text-xs font-black">
                  <BadgeCheck className="h-4 w-4" /> Customer Billing
                </div>
                <p className="mt-1 text-[11px] text-stone-500 leading-snug">
                  GST sales tax invoices, party ledgers &amp; cash receipts
                </p>
              </div>
            </div>

            {/* Bottom Live Operations Pill */}
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50/70 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-orange-600 fill-orange-500/30" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Jaipur Kiln Complex
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Tonk Road Corridors Active
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[10px] font-black text-emerald-800">
                  ● ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Crisp White Login Card (7 cols on lg) */}
          <div className="w-full lg:col-span-7 max-w-lg mx-auto">
            <div className="relative rounded-3xl border border-stone-200 bg-white p-7 sm:p-10 shadow-xl shadow-stone-200/60">
              {/* Form Card Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white p-1.5 shadow-md shadow-stone-900/5 border border-stone-200 flex items-center justify-center">
                      <Image
                        src="/images/logo.png"
                        alt="Shri Shyam Bricks Logo"
                        width={48}
                        height={48}
                        priority
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-orange-600 block">
                        Admin Portal
                      </span>
                      <span className="text-sm font-extrabold text-stone-900">
                        {companyName}
                      </span>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  Sign in to Operations Desk
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-stone-500">
                  Enter your admin credentials to access fleet, supply orders
                  &amp; customer billing.
                </p>
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-2.5 py-1 text-xs font-bold text-orange-700 transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                    Quick Fill Super Admin
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 animate-in fade-in duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@shrishyambricks.com"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/80 pl-10 pr-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      Password
                    </label>
                    <span className="text-[11px] text-stone-400">
                      Encrypted credentials
                    </span>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/80 pl-10 pr-11 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-600/25 hover:from-orange-500 hover:to-amber-500 transition active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying Credentials...
                      </span>
                    ) : (
                      <>
                        <span>Sign In to Operations Portal</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security & Support Note */}
              <div className="mt-6 border-t border-stone-100 pt-5 space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Protected by 256-Bit SSL &amp; Role-Based Super Admin Control
                </div>
                <div className="text-center text-[11px] text-stone-400">
                  Kiln Dispatch Desk Helpline:{" "}
                  <a
                    href="tel:+919829012345"
                    className="font-bold text-orange-600 hover:underline"
                  >
                    +91 98290 12345
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* FOOTER (Clean Light)                                      */}
      {/* ========================================================= */}
      <footer className="relative z-20 border-t border-stone-200/80 bg-white py-4 text-xs text-stone-500">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-2">
          <p>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-orange-600 transition">
              Public Website
            </Link>
            <span>•</span>
            <span className="text-stone-400">
              Jaipur Kiln Hub • Sanganer Industrial Zone, Rajasthan
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
