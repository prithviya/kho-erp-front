import type { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Test accounts (see task brief). admin@gmail.com uses a literal "admin"
// password (pre-existing seeded super admin); the PWTEST accounts all use
// PwTest@1234.
// ---------------------------------------------------------------------------
export const ACCOUNTS = {
  SUPER_ADMIN: { email: "admin@gmail.com", password: "admin" },
  CRM_EXECUTIVE: { email: "pw.crm@test.local", password: "PwTest@1234" },
  MANAGER: { email: "pw.manager@test.local", password: "PwTest@1234" },
  HR: { email: "pw.hr@test.local", password: "PwTest@1234" },
  TEAM_MEMBER: { email: "pw.team@test.local", password: "PwTest@1234" },
  CEO: { email: "pw.ceo@test.local", password: "PwTest@1234" },
} as const;

export type RoleKey = keyof typeof ACCOUNTS;

export const ALL_ROLES: RoleKey[] = [
  "SUPER_ADMIN",
  "CRM_EXECUTIVE",
  "MANAGER",
  "HR",
  "TEAM_MEMBER",
  "CEO",
];

// Mirrors erp_frontend/src/utils/auth.js#getDefaultHomePath
export const DEFAULT_HOME: Record<RoleKey, string> = {
  SUPER_ADMIN: "/dashboard",
  CRM_EXECUTIVE: "/lead-overview",
  MANAGER: "/onboard-prjt",
  CEO: "/onboard-prjt",
  HR: "/onboarding",
  TEAM_MEMBER: "/assign-board",
};

// Mirrors erp_frontend/src/routes/AppRoutes.jsx roles={[...]} per route
// (read fresh on 2026-10-25 - re-verify against that file if it has changed).
export const ROUTES: { path: string; roles: RoleKey[] }[] = [
  { path: "/dashboard", roles: ["SUPER_ADMIN"] },
  { path: "/lead-overview", roles: ["SUPER_ADMIN", "CRM_EXECUTIVE"] },
  { path: "/report", roles: ["SUPER_ADMIN"] },
  { path: "/onboard-prjt", roles: ["SUPER_ADMIN", "MANAGER"] },
  { path: "/prjt-details", roles: ["SUPER_ADMIN", "MANAGER"] },
  {
    path: "/tasks",
    roles: ["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"],
  },
  {
    path: "/task-board",
    roles: ["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"],
  },
  { path: "/user-management", roles: ["SUPER_ADMIN"] },
  { path: "/master", roles: ["SUPER_ADMIN"] },
  { path: "/vendor-overview", roles: ["SUPER_ADMIN", "HR", "MANAGER"] },
  { path: "/applied", roles: ["SUPER_ADMIN", "HR"] },
  { path: "/job", roles: ["SUPER_ADMIN", "HR"] },
  {
    path: "/assign-board",
    roles: ["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"],
  },
  { path: "/recruitment-process", roles: ["SUPER_ADMIN", "HR"] },
  { path: "/onboarding", roles: ["SUPER_ADMIN", "HR"] },
  { path: "/employee", roles: ["SUPER_ADMIN", "HR"] },
  { path: "/payroll", roles: ["SUPER_ADMIN", "HR"] },
  // NOTE: CEO is intentionally NOT in this list - AppRoutes.jsx really does
  // exclude CEO from /leave, even though sidebar menu.js grants CEO a nav
  // link to it. See the final QA report for details.
  { path: "/leave", roles: ["SUPER_ADMIN", "HR", "MANAGER", "CRM_EXECUTIVE", "TEAM_MEMBER"] },
];

export function uniqueSuffix(): string {
  return `${Date.now()}`;
}

export async function login(page: Page, role: RoleKey) {
  const { email, password } = ACCOUNTS[role];
  await page.goto("/");
  await page.getByPlaceholder("Enter username or email").fill(email);
  await page.getByPlaceholder("Enter password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  // Login navigates away from "/" on success (see Login.jsx -> getDefaultHomePath).
  await page.waitForFunction(() => window.location.pathname !== "/", null, {
    timeout: 15_000,
  });
}

// ---------------------------------------------------------------------------
// Diagnostics: console errors / page errors / failed XHR-fetch responses.
// Flushed to a plain-text log file (not relied on as in-memory shared state,
// since each spec file may run as a separate worker/module instance).
// ---------------------------------------------------------------------------
const LOG_PATH = path.join(__dirname, "diagnostics.log");

export function attachDiagnostics(page: Page, bucket: string[]) {
  page.on("pageerror", (err) => {
    bucket.push(`[pageerror] ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      bucket.push(`[console.error] ${page.url()} :: ${msg.text()}`);
    }
  });
  page.on("response", (res) => {
    const req = res.request();
    const type = req.resourceType();
    if (res.status() >= 400 && (type === "xhr" || type === "fetch")) {
      if (res.status() === 401 || res.status() === 403) return; // expected during RBAC probing
      bucket.push(`[http ${res.status()}] ${req.method()} ${res.url()}`);
    }
  });
}

export function flushIssues(label: string, issues: string[]) {
  if (!issues.length) return;
  const unique = [...new Set(issues)];
  const block = `\n=== ${label} (${new Date().toISOString()}) ===\n${unique.join("\n")}\n`;
  fs.appendFileSync(LOG_PATH, block);
}
