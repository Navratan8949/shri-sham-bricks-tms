"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { getActiveCompany, getStoredUser, getToken, setActiveCompany } from "@/src/lib/auth";
import api from "@/src/services/api";
import RouteAccessGuard from "./RouteAccessGuard";


export default function AppShell({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    if (!t || !u) {
      router.replace("/login");
      return;
    }
    // If super_admin has not selected an active operating company, auto-select single company or prompt /select-company
    if (u.role === "super_admin") {
      const active = getActiveCompany();
      const storedCompanyId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("ssbc_company")
          : null;
      if (!active && !storedCompanyId) {
        api
          .get("/companies")
          .then((res) => {
            const list = res?.data?.data || [];
            if (list.length === 1) {
              setActiveCompany(list[0]);
              setUser(u);
            } else if (list.length > 1) {
              router.replace("/select-company");
            }
          })
          .catch(() => {});
      }
    }
    setUser(u);

    // Sync fresh user details (e.g. role promotions) from backend
    api
      .get("/auth/me")
      .then((res) => {
        const freshUser = res.data?.user || res.data?.data;
        if (freshUser) {
          sessionStorage.setItem("ssbc_user", JSON.stringify(freshUser));
          sessionStorage.setItem("nrl_user", JSON.stringify(freshUser));
          setUser(freshUser);
        }
      })
      .catch(() => {});

    // Listen for live profile updates
    const onUserChange = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener("ssbc_user_changed", onUserChange);
    window.addEventListener("nrl_user_changed", onUserChange);
    return () => {
      window.removeEventListener("ssbc_user_changed", onUserChange);
      window.removeEventListener("nrl_user_changed", onUserChange);
    };
  }, [router]);

  if (!user)
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbf9f6]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
      </div>
    );

  return (
    <div className="flex h-screen bg-[#fbf9f6] text-stone-900 overflow-hidden">
      <Sidebar
        user={user}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          user={user}
          onMenu={() => setOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full pt-[88px] px-4 pb-4 sm:pt-[96px] sm:px-6 sm:pb-6 lg:p-8 custom-scrollbar">
          <RouteAccessGuard user={user}>{children}</RouteAccessGuard>
        </main>
      </div>
    </div>
  );
}
