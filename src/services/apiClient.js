import { clearSession, getSession } from "../utils/session";
import { hasModulePermission, isSuperAdmin } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL;
let refreshPromise = null;

const API_MODULES = [
  ["/lead", { view: ["lead_management", "reports"], create: ["lead_management"], edit: ["lead_management"], delete: ["lead_management"] }],
  ["/lead-sources", { view: ["master", "lead_management", "reports"], create: ["master"], edit: ["master"], delete: ["master"] }],
  ["/lead-statuses", { view: ["master", "lead_management", "reports"], create: ["master"], edit: ["master"], delete: ["master"] }],
  ["/services", ["master"]],
  ["/departments", { view: ["master", "opening", "onboarding", "employee"], create: ["master"], edit: ["master"], delete: ["master"] }],
  ["/service-categories", { view: ["master", "lead_management", "vendor_management", "project_onboard", "project_details", "tasks", "assign_board"], create: ["master"], edit: ["master"], delete: ["master"] }],
  ["/vendor", { view: ["vendor_management", "project_details", "project_onboard", "assign_board", "tasks"], create: ["vendor_management"], edit: ["vendor_management"], delete: ["vendor_management"] }],
  ["/openings", ["opening"]],
  ["/cif-personals", ["cif_form"]],
  ["/cif-academics", ["cif_form"]],
  ["/cif-experiences", ["cif_form"]],
  ["/cif-languages", ["cif_form"]],
  ["/cif-references", ["cif_form"]],
  ["/cif-skills", ["cif_form"]],
  ["/cif-software", ["cif_form"]],
  ["/cif-submissions", {
    view: ["applied", "recruitment", "onboarding"],
    create: [],
    edit: ["applied", "recruitment"],
    delete: ["applied", "recruitment", "onboarding"],
  }],
  ["/project-onboards", {
    view: ["project_onboard", "project_details", "tasks", "assign_board"],
    create: ["project_onboard"],
    edit: ["project_onboard", "project_details"],
    delete: ["project_onboard", "project_details"],
  }],
  ["/tasks", {
    view: ["tasks", "task_board", "task_schedule", "assign_board"],
    create: ["tasks", "assign_board"],
    edit: ["tasks", "task_board", "assign_board"],
    delete: ["tasks"],
  }],
  ["/task-chat", {
    view: ["tasks", "task_board", "task_schedule", "assign_board"],
    create: ["tasks", "task_board", "task_schedule", "assign_board"],
    edit: ["tasks", "task_board", "task_schedule", "assign_board"],
    delete: ["tasks", "task_board", "task_schedule", "assign_board"],
  }],
  ["/project-chat", {
    view: ["project_details", "project_onboard"],
    create: ["project_details", "project_onboard"],
    edit: ["project_details", "project_onboard"],
    delete: ["project_details", "project_onboard"],
  }],
  ["/notifications", {
    view: ["tasks", "task_board", "task_schedule", "assign_board", "project_details", "project_onboard"],
    create: ["tasks", "task_board", "task_schedule", "assign_board", "project_details", "project_onboard"],
    edit: ["tasks", "task_board", "task_schedule", "assign_board", "project_details", "project_onboard"],
    delete: ["tasks", "task_board", "task_schedule", "assign_board", "project_details", "project_onboard"],
  }],
  ["/dashboard", ["dashboard"]],
  ["/employees", { view: ["employee", "onboarding", "payroll_management", "project_details", "project_onboard", "tasks", "assign_board"], create: ["employee"], edit: ["employee"], delete: ["employee"] }],
  ["/recruitments", ["recruitment"]],
  ["/onboardings", { view: ["onboarding", "employee", "payroll_management"], create: ["onboarding"], edit: ["onboarding"], delete: ["onboarding"] }],
  ["/leaves", ["leave"]],
  ["/payrolls", ["payroll_management"]],
];

const API_ACTIONS = {
  GET: "view",
  HEAD: "view",
  POST: "create",
  PUT: "edit",
  PATCH: "edit",
  DELETE: "delete",
};

function enforceFrontendApiPermission(url, method) {
  const path = String(url).split("?")[0].replace(/\/+$/, "") || "/";
  const normalizedMethod = String(method || "GET").toUpperCase();

  if (
    normalizedMethod === "OPTIONS"
    || path.startsWith("/auth/")
    || (normalizedMethod === "GET" && /^\/openings\/public(?:\/|$)/.test(path))
    || (normalizedMethod === "POST" && path === "/cif-submissions")
  ) {
    return;
  }

  if (isSuperAdmin()) {
    return;
  }

  if (path === "/menus" || path.startsWith("/menus/")) {
    if (path === "/menus/my" && normalizedMethod === "GET") {
      return;
    }
    throw Object.assign(new Error("Only Super Admin can manage menus."), { status: 403 });
  }

  if (path === "/roles" || path.startsWith("/roles/")) {
    if (path === "/roles" && normalizedMethod === "GET"
      && (hasModulePermission("user_management.view") || hasModulePermission("onboarding.view"))) {
      return;
    }
    throw Object.assign(new Error("Only Super Admin can manage roles and permissions."), { status: 403 });
  }

  if (
    path.startsWith("/user-roles")
    || path.startsWith("/modules")
    || path.startsWith("/permissions")
    || path.startsWith("/users/")
      && !path.startsWith("/users/directory")
    || path === "/users" && normalizedMethod !== "GET"
  ) {
    throw Object.assign(new Error("Only Super Admin can perform this user or access-management action."), { status: 403 });
  }

  const action = API_ACTIONS[normalizedMethod];
  if (!action) {
    return;
  }

  let moduleCodes = API_MODULES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1];
  if (path === "/users") {
    moduleCodes = ["user_management"];
  } else if (path === "/users/directory" || path.startsWith("/users/directory/")) {
    moduleCodes = ["employee", "onboarding", "project_onboard", "project_details", "tasks", "task_board", "task_schedule", "assign_board", "lead_management"];
  }

  if (!moduleCodes) {
    return;
  }

  const actionModuleCodes = Array.isArray(moduleCodes) ? moduleCodes : moduleCodes[action] || [];
  if (!actionModuleCodes.some((moduleCode) => hasModulePermission(`${moduleCode}.${action}`))) {
    throw Object.assign(new Error(`You do not have permission to ${action} this module.`), { status: 403 });
  }
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function refreshSession() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await parseJsonSafe(response);
      return {
        ok: response.ok && Boolean(result?.success),
        result,
      };
    } catch {
      return { ok: false, result: null };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request(url, options = {}, retry = true) {
  enforceFrontendApiPermission(url, options.method);

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry) {
    const refreshed = await refreshSession();
    if (refreshed.ok) {
      return request(url, options, false);
    }

    clearSession();
    window.location.href = "/";
    return {
      success: false,
      data: null,
      message: "Session expired. Please log in again.",
    };
  }

  const result = await parseJsonSafe(response);
  if (!response.ok) {
    const err = new Error(result?.message || "Something went wrong.");
    err.status = response.status;
    err.errors = result?.errors || null;
    throw err;
  }

  return result ?? { success: true, data: null };
}

export function getCurrentUserSession() {
  return getSession();
}