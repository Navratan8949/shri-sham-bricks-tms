"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, Fuel, Truck, Users, Package, LogOut, X } from "lucide-react";
import { clearSession, useActiveCompany } from "@/src/lib/auth";

const items = [
  ["/dashboard", "Dashboard & P&L", "डैशबोर्ड और नफा-नुकसान", LayoutDashboard],
  ["/masters", "Customers & Materials", "ग्राहक और माल मास्टर", Package],
  ["/vehicles", "Vehicles", "अपनी गाड़ियाँ (फ्लीट)", Truck],
  ["/drivers", "Drivers", "ड्राइवर सूची व वेतन", Users],
  ["/orders", "Supply Orders", "सप्लाई आर्डर रजिस्टर", ClipboardList],
  ["/expenses", "Vehicle Expenses", "गाड़ी खर्चा रजिस्टर", Fuel],
];
export default function Sidebar({ user, open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const company = useActiveCompany();
  const logout = () => { clearSession(); router.replace("/login"); };
  return <>
    {open && <button aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[275px] flex-col bg-[#21160f] text-white transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <img src="/images/logo.png" alt="Shri Shyam Bricks" className="h-11 w-11 rounded-xl bg-white object-contain p-1"/>
        <div className="min-w-0"><p className="truncate text-sm font-bold">{company?.name || "Shri Shyam Bricks"}</p><p className="text-xs text-orange-300">Building Materials & Fleet</p></div>
        <button onClick={onClose} className="ml-auto lg:hidden"><X size={18}/></button>
      </div>
      <nav className="flex-1 space-y-1.5 px-3 py-5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-orange-300">Workspace</p>
        {items.map(([href, label, sub, Icon]) => {
          const active =
            pathname === href ||
            pathname.startsWith(href + "/") ||
            (href === "/orders" && pathname.startsWith("/supply-orders"));
          return <Link key={href} href={href} onClick={onClose} className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 transition ${active ? "bg-orange-600 text-white shadow-lg shadow-orange-950/30" : "text-stone-300 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={19} className={active ? "text-white" : "text-orange-400"} />
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm tracking-tight leading-tight">{label}</p>
              <p className={`text-[10px] leading-tight ${active ? "text-orange-100 font-medium" : "text-stone-400"}`}>{sub}</p>
            </div>
          </Link>;
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 truncate text-xs text-stone-300">{user?.name || user?.email || "Account"}</div>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-stone-300 hover:bg-white/10 hover:text-white"><LogOut size={17}/> Sign out</button>
      </div>
    </aside>
  </>;
}
