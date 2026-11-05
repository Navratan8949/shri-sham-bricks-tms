export const getStoredUser = () => {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = sessionStorage.getItem("ssbc_user") || sessionStorage.getItem("nrl_user");
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
};
export const getToken = () => typeof window !== "undefined" ? (sessionStorage.getItem("ssbc_token") || sessionStorage.getItem("nrl_token")) : null;
export const saveSession = (token, user) => {
    sessionStorage.setItem("ssbc_token", token);
    sessionStorage.setItem("ssbc_user", JSON.stringify(user));
    sessionStorage.setItem("nrl_token", token);
    sessionStorage.setItem("nrl_user", JSON.stringify(user));
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ssbc_user_changed", { detail: user }));
        window.dispatchEvent(new CustomEvent("nrl_user_changed", { detail: user }));
    }
};
export const clearSession = () => {
    sessionStorage.removeItem("ssbc_token");
    sessionStorage.removeItem("ssbc_user");
    sessionStorage.removeItem("ssbc_company");
    sessionStorage.removeItem("ssbc_active_company");
    sessionStorage.removeItem("nrl_token");
    sessionStorage.removeItem("nrl_user");
    sessionStorage.removeItem("nrl_company");
    sessionStorage.removeItem("nrl_active_company");
};
export const roleLabel = (role) => {
  return "Master (Super Admin)";
};
export const companyName = (user) => {
    const active = getActiveCompany();
    if (active?.name)
        return active.name;
    if (!user?.companyId)
        return "All Companies";
    return typeof user.companyId === "object" ? user.companyId.name : "Company";
};

export const getActiveCompany = () => {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = sessionStorage.getItem("ssbc_active_company") || sessionStorage.getItem("nrl_active_company");
        if (raw) {
            const comp = JSON.parse(raw);
            if (comp?.name) comp.name = comp.name.replace(/\s+co\.?$/i, "");
            return comp;
        }
        const user = getStoredUser();
        if (user?.companyId && typeof user.companyId === "object") {
            const comp = { ...user.companyId };
            if (comp?.name) comp.name = comp.name.replace(/\s+co\.?$/i, "");
            return comp;
        }
        return null;
    }
    catch {
        return null;
    }
};

export const setActiveCompany = (company) => {
    if (typeof window === "undefined")
        return;
    if (!company) {
        sessionStorage.removeItem("ssbc_company");
        sessionStorage.removeItem("ssbc_active_company");
        sessionStorage.removeItem("nrl_company");
        sessionStorage.removeItem("nrl_active_company");
    }
    else {
        const cleaned = typeof company === "object" ? { ...company } : company;
        if (cleaned?.name) cleaned.name = cleaned.name.replace(/\s+co\.?$/i, "");
        sessionStorage.setItem("ssbc_company", cleaned._id);
        sessionStorage.setItem("ssbc_active_company", JSON.stringify(cleaned));
        sessionStorage.setItem("nrl_company", cleaned._id);
        sessionStorage.setItem("nrl_active_company", JSON.stringify(cleaned));
        window.dispatchEvent(new CustomEvent("ssbc_company_changed", { detail: cleaned }));
        window.dispatchEvent(new CustomEvent("nrl_company_changed", { detail: cleaned }));
    }
};

import { useEffect, useState } from "react";
import api from "@/src/services/api";

export const useActiveCompany = () => {
    // Initialize with null to match SSR output and prevent hydration mismatch
    const [company, setCompany] = useState(null);

    useEffect(() => {
        const syncCompany = async () => {
            const current = getActiveCompany();
            if (current) {
                setCompany(current);
                return;
            }
            const companyId = sessionStorage.getItem("nrl_company");
            if (companyId) {
                try {
                    const res = await api.get(`/companies/${companyId}`);
                    if (res?.data?.data) {
                        setActiveCompany(res.data.data);
                        setCompany(res.data.data);
                        return;
                    }
                }
                catch (e) {
                    console.error("Failed to sync active company", e);
                }
            }
            try {
                const res = await api.get("/companies");
                const list = res?.data?.data || [];
                if (list.length === 1) {
                    setActiveCompany(list[0]);
                    setCompany(list[0]);
                }
            } catch {}
        };

        syncCompany();

        const onCompanyChange = (e) => {
            setCompany(e.detail);
        };
        window.addEventListener("nrl_company_changed", onCompanyChange);
        window.addEventListener("ssbc_company_changed", onCompanyChange);
        return () => {
            window.removeEventListener("nrl_company_changed", onCompanyChange);
            window.removeEventListener("ssbc_company_changed", onCompanyChange);
        };
    }, []);

    return company;
};

export const getFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
        return url;
    }
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002/api").replace(/\/api\/?$/, "");
    return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
};
