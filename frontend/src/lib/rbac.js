import { resources, reportConfigs } from "./resources";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  ACCOUNTANT: "accountant",
  DRIVER: "driver",
  VENDOR: "vendor",
};

const allRoles = [ROLES.SUPER_ADMIN];
const companyAdmins = [ROLES.SUPER_ADMIN];
const operations = [ROLES.SUPER_ADMIN];
const finance = [ROLES.SUPER_ADMIN];

// FRONTEND UX access matrix (Only Master / Super Admin)
export const moduleAccess = {
  dashboard: allRoles,
  settings: companyAdmins,
  reports: allRoles,
  companies: companyAdmins,

  // Operations & Billing
  customers: allRoles,
  "supply-orders": allRoles,
  "advance-memos": allRoles,
  trips: allRoles,
  "lr-bilties": allRoles,
  "driver-trip-settlements": allRoles,
  "vendor-bills": allRoles,
  "customer-invoices": allRoles,

  // Fleet & Maintenance
  vehicles: allRoles,
  drivers: allRoles,
  vendors: allRoles,
  products: allRoles,
  fuels: allRoles,
  fastags: allRoles,
  maintenances: allRoles,
  tyres: allRoles,
  "vehicle-documents": allRoles,

  // Accounts & Expenses
  "office-expenses": allRoles,
  expenses: allRoles,
  loans: allRoles,
  "profit-loss": allRoles,
};

export const roleHome = {
  [ROLES.SUPER_ADMIN]: "/dashboard",
};

export const roleMenu = {
  [ROLES.SUPER_ADMIN]: {
    Home: ["dashboard"],
    Operations: [
      "vehicles",
      "drivers",
      "customers",
      "products",
      "supply-orders",
      "trips",
      "lr-bilties",
      "customer-invoices",
    ],
    "Market Fleet & Fuel": [
      "vendors",
      "vendor-bills",
      "fuels",
      "fastags",
      "tyres",
      // "maintenances",
    ],
    "Accounts & Reports": [
      "expenses",
      // "loans",
      "office-expenses",
      "profit-loss",
      "reports",
      "settings",
    ],
  },
};

export const canViewReport = (_role, _reportOrKey) => {
  return true; // Super admin has full access to all reports
};

export const canViewModule = (role, moduleKey) => {
  if (!role || !moduleKey) return true;
  return true; // Super admin has access to all modules
};

export const canPerform = (_role, _roles = []) => true;

export const isRole = (role, ...allowed) => allowed.includes(role);

export const getRoleMenu = (role) => roleMenu[role] || roleMenu[ROLES.SUPER_ADMIN] || {};

export const getResourcePermission = (_role, _resource, _action) => true;

export const isAllowedPath = (_role, pathname) => {
  if (!pathname) return false;
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true;
  if (pathname === "/dashboard") return true;
  if (pathname === "/select-company" || pathname.startsWith("/select-company/")) return true;
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return true;
  if (pathname === "/reports" || pathname.startsWith("/reports/")) return true;

  const moduleKey = pathname.split("/").filter(Boolean)[0];
  if (!moduleKey) return true;
  if (Object.prototype.hasOwnProperty.call(moduleAccess, moduleKey)) {
    return true;
  }
  return true;
};

export const getVisibleGroupItems = (_role, groups = []) => {
  return groups
    .map((group) => ({
      ...group,
      items: (group.items || []),
    }))
    .filter((group) => group.items.length > 0);
};

export const getResourceRoles = (key) =>
  moduleAccess[key] || resources[key]?.roles || ["super_admin"];
