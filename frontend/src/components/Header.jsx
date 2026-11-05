"use client";
import Link from "next/link";
import { Menu, LogOut, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, useActiveCompany, getFileUrl } from "@/src/lib/auth";
import AlertsCenter from "@/src/components/AlertsCenter";

const titles = {
  "/dashboard": { en: "Dashboard & P&L", hi: "डैशबोर्ड" },
  "/orders": { en: "Customer Orders", hi: "ग्राहक आर्डर" },
  "/supply-orders": { en: "Customer Orders", hi: "ग्राहक आर्डर" },
  "/expenses": { en: "Vehicle Expenses", hi: "गाड़ी खर्चा" },
  "/vehicles": { en: "Own Fleet Vehicles", hi: "अपनी गाड़ियाँ" },
  "/drivers": { en: "Drivers", hi: "ड्राइवर सूची" },
  "/masters": { en: "Customers & Materials", hi: "ग्राहक और माल" },
  "/settings": { en: "System Settings", hi: "सिस्टम सेटिंग्स" },
  "/profile": { en: "Super Admin Profile", hi: "एडमिन प्रोफ़ाइल" }
};

export default function Header({ user, onMenu }) {
  const path = usePathname(),
    router = useRouter(),
    company = useActiveCompany();
  const logout = () => {
    clearSession();
    router.replace("/login");
  };

  const currentTitle = titles[path] || {
    en: "Shri Shyam Bricks",
    hi: "बिल्डिंग मैटेरियल्स"
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[74px] items-center justify-between border-b border-stone-200 bg-[#fbf9f6]/95 px-3 sm:px-6 backdrop-blur lg:static lg:px-8">
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 mr-2">
        <button
          onClick={onMenu}
          className="shrink-0 rounded-lg p-2 hover:bg-stone-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="hidden text-[10px] font-bold uppercase tracking-widest text-orange-600 sm:block truncate">
            {company?.name || "Shri Shyam Bricks & Building Materials"}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <h1 className="text-sm sm:text-base lg:text-lg font-black text-stone-900 leading-tight">
              {currentTitle.en}
            </h1>
            <span className="text-[11px] sm:text-xs font-bold text-stone-500 leading-tight">
              ({currentTitle.hi})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fleet & Document Alerts Center */}
        <AlertsCenter />

        {/* Clickable Profile Pill */}
        <Link
          href="/profile"
          title="Super Admin Profile (प्रोफ़ाइल देखें)"
          className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1.5 sm:px-2.5 sm:py-1.5 hover:border-orange-300 hover:bg-orange-50/50 shadow-2xs transition group"
        >
          {user?.profileImage ? (
            <img
              src={getFileUrl(user.profileImage)}
              alt="Avatar"
              className="h-7 w-7 rounded-lg object-cover shadow-xs border border-orange-200"
            />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-orange-600 text-white text-xs font-black shadow-xs">
              {user?.name?.slice(0, 1)?.toUpperCase() || "A"}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-black text-stone-900 leading-tight group-hover:text-orange-600 transition truncate max-w-[120px]">
              {user?.name || "Super Admin"}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 leading-tight">
              Super Admin 👑
            </p>
          </div>
        </Link>

        {/* Desktop-only Sign Out Button (Hidden on Mobile per user request) */}
        <button
          onClick={logout}
          title="Sign out"
          className="hidden sm:flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 shadow-2xs transition cursor-pointer"
        >
          <LogOut size={15} />{" "}
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
