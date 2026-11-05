"use client";
import {Menu,LogOut} from "lucide-react";
import {usePathname,useRouter} from "next/navigation";
import {clearSession,useActiveCompany} from "@/src/lib/auth";
const titles = {
  "/dashboard": "Dashboard & P&L (डैशबोर्ड)",
  "/orders": "Supply Orders (सप्लाई आर्डर)",
  "/supply-orders": "Supply Orders (सप्लाई आर्डर)",
  "/expenses": "Vehicle Expenses (गाड़ी खर्चा)",
  "/vehicles": "Own Fleet Vehicles (अपनी गाड़ियाँ)",
  "/drivers": "Drivers (ड्राइवर सूची)",
  "/masters": "Customers & Materials (ग्राहक और माल)"
};
export default function Header({user,onMenu}){
 const path=usePathname(),router=useRouter(),company=useActiveCompany();
 const logout=()=>{clearSession();router.replace("/login")};
 return <header className="fixed left-0 right-0 top-0 z-30 flex h-[74px] items-center justify-between border-b border-stone-200 bg-[#fbf9f6]/95 px-4 backdrop-blur lg:static lg:px-8">
  <div className="flex items-center gap-3"><button onClick={onMenu} className="rounded-lg p-2 hover:bg-stone-100 lg:hidden"><Menu size={20}/></button><div><p className="hidden text-[10px] font-bold uppercase tracking-widest text-orange-600 sm:block">{company?.name||"Shri Shyam Bricks & Building Materials"}</p><h1 className="text-base font-black sm:text-lg">{titles[path]||"Shri Shyam Bricks"}</h1></div></div>
  <div className="flex items-center gap-3"><span className="hidden text-sm text-stone-500 sm:block">{user?.name||user?.email||"Account"}</span><button onClick={logout} title="Sign out" className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"><LogOut size={15}/> <span className="hidden sm:inline">Sign out</span></button></div>
 </header>;
}
