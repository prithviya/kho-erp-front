# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: _debug4.spec.ts >> debug: /api/tasks 500 body
- Location: e2e\_debug4.spec.ts:4:1

# Error details

```
TimeoutError: page.waitForFunction: Timeout 15000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - heading "Login" [level=1] [ref=e6]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: User Email
        - textbox "Enter username or email" [ref=e10]: admin@gmail.com
      - generic [ref=e11]:
        - generic [ref=e12]: Password
        - textbox "Enter password" [ref=e13]: admin
      - button "Forgot Password?" [ref=e15]
      - button "Login" [active] [ref=e16]
  - region "Notifications Alt+T"
```

# Test source

```ts
  1   | import type { Page } from "@playwright/test";
  2   | import fs from "fs";
  3   | import path from "path";
  4   | import { fileURLToPath } from "url";
  5   | 
  6   | const __filename = fileURLToPath(import.meta.url);
  7   | const __dirname = path.dirname(__filename);
  8   | 
  9   | // ---------------------------------------------------------------------------
  10  | // Test accounts (see task brief). admin@gmail.com uses a literal "admin"
  11  | // password (pre-existing seeded super admin); the PWTEST accounts all use
  12  | // PwTest@1234.
  13  | // ---------------------------------------------------------------------------
  14  | export const ACCOUNTS = {
  15  |   SUPER_ADMIN: { email: "admin@gmail.com", password: "admin" },
  16  |   CRM_EXECUTIVE: { email: "pw.crm@test.local", password: "PwTest@1234" },
  17  |   MANAGER: { email: "pw.manager@test.local", password: "PwTest@1234" },
  18  |   HR: { email: "pw.hr@test.local", password: "PwTest@1234" },
  19  |   TEAM_MEMBER: { email: "pw.team@test.local", password: "PwTest@1234" },
  20  |   CEO: { email: "pw.ceo@test.local", password: "PwTest@1234" },
  21  | } as const;
  22  | 
  23  | export type RoleKey = keyof typeof ACCOUNTS;
  24  | 
  25  | export const ALL_ROLES: RoleKey[] = [
  26  |   "SUPER_ADMIN",
  27  |   "CRM_EXECUTIVE",
  28  |   "MANAGER",
  29  |   "HR",
  30  |   "TEAM_MEMBER",
  31  |   "CEO",
  32  | ];
  33  | 
  34  | // Mirrors erp_frontend/src/utils/auth.js#getDefaultHomePath
  35  | export const DEFAULT_HOME: Record<RoleKey, string> = {
  36  |   SUPER_ADMIN: "/dashboard",
  37  |   CRM_EXECUTIVE: "/lead-overview",
  38  |   MANAGER: "/onboard-prjt",
  39  |   CEO: "/onboard-prjt",
  40  |   HR: "/onboarding",
  41  |   TEAM_MEMBER: "/assign-board",
  42  | };
  43  | 
  44  | // Mirrors erp_frontend/src/routes/AppRoutes.jsx roles={[...]} per route
  45  | // (read fresh on 2026-10-25 - re-verify against that file if it has changed).
  46  | export const ROUTES: { path: string; roles: RoleKey[] }[] = [
  47  |   { path: "/dashboard", roles: ["SUPER_ADMIN"] },
  48  |   { path: "/lead-overview", roles: ["SUPER_ADMIN", "CRM_EXECUTIVE"] },
  49  |   { path: "/report", roles: ["SUPER_ADMIN"] },
  50  |   { path: "/onboard-prjt", roles: ["SUPER_ADMIN", "MANAGER"] },
  51  |   { path: "/prjt-details", roles: ["SUPER_ADMIN", "MANAGER"] },
  52  |   {
  53  |     path: "/tasks",
  54  |     roles: ["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"],
  55  |   },
  56  |   {
  57  |     path: "/task-board",
  58  |     roles: ["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"],
  59  |   },
  60  |   { path: "/user-management", roles: ["SUPER_ADMIN"] },
  61  |   { path: "/master", roles: ["SUPER_ADMIN"] },
  62  |   { path: "/vendor-overview", roles: ["SUPER_ADMIN", "HR", "MANAGER"] },
  63  |   { path: "/applied", roles: ["SUPER_ADMIN", "HR"] },
  64  |   { path: "/job", roles: ["SUPER_ADMIN", "HR"] },
  65  |   {
  66  |     path: "/assign-board",
  67  |     roles: ["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"],
  68  |   },
  69  |   { path: "/recruitment-process", roles: ["SUPER_ADMIN", "HR"] },
  70  |   { path: "/onboarding", roles: ["SUPER_ADMIN", "HR"] },
  71  |   { path: "/employee", roles: ["SUPER_ADMIN", "HR"] },
  72  |   { path: "/payroll", roles: ["SUPER_ADMIN", "HR"] },
  73  |   // NOTE: CEO is intentionally NOT in this list - AppRoutes.jsx really does
  74  |   // exclude CEO from /leave, even though sidebar menu.js grants CEO a nav
  75  |   // link to it. See the final QA report for details.
  76  |   { path: "/leave", roles: ["SUPER_ADMIN", "HR", "MANAGER", "CRM_EXECUTIVE", "TEAM_MEMBER"] },
  77  | ];
  78  | 
  79  | export function uniqueSuffix(): string {
  80  |   return `${Date.now()}`;
  81  | }
  82  | 
  83  | export async function login(page: Page, role: RoleKey) {
  84  |   const { email, password } = ACCOUNTS[role];
  85  |   await page.goto("/");
  86  |   await page.getByPlaceholder("Enter username or email").fill(email);
  87  |   await page.getByPlaceholder("Enter password").fill(password);
  88  |   await page.getByRole("button", { name: "Login" }).click();
  89  |   // Login navigates away from "/" on success (see Login.jsx -> getDefaultHomePath).
> 90  |   await page.waitForFunction(() => window.location.pathname !== "/", null, {
      |              ^ TimeoutError: page.waitForFunction: Timeout 15000ms exceeded.
  91  |     timeout: 15_000,
  92  |   });
  93  | }
  94  | 
  95  | // ---------------------------------------------------------------------------
  96  | // Diagnostics: console errors / page errors / failed XHR-fetch responses.
  97  | // Flushed to a plain-text log file (not relied on as in-memory shared state,
  98  | // since each spec file may run as a separate worker/module instance).
  99  | // ---------------------------------------------------------------------------
  100 | const LOG_PATH = path.join(__dirname, "diagnostics.log");
  101 | 
  102 | export function attachDiagnostics(page: Page, bucket: string[]) {
  103 |   page.on("pageerror", (err) => {
  104 |     bucket.push(`[pageerror] ${err.message}`);
  105 |   });
  106 |   page.on("console", (msg) => {
  107 |     if (msg.type() === "error") {
  108 |       bucket.push(`[console.error] ${page.url()} :: ${msg.text()}`);
  109 |     }
  110 |   });
  111 |   page.on("response", (res) => {
  112 |     const req = res.request();
  113 |     const type = req.resourceType();
  114 |     if (res.status() >= 400 && (type === "xhr" || type === "fetch")) {
  115 |       if (res.status() === 401 || res.status() === 403) return; // expected during RBAC probing
  116 |       bucket.push(`[http ${res.status()}] ${req.method()} ${res.url()}`);
  117 |     }
  118 |   });
  119 | }
  120 | 
  121 | export function flushIssues(label: string, issues: string[]) {
  122 |   if (!issues.length) return;
  123 |   const unique = [...new Set(issues)];
  124 |   const block = `\n=== ${label} (${new Date().toISOString()}) ===\n${unique.join("\n")}\n`;
  125 |   fs.appendFileSync(LOG_PATH, block);
  126 | }
  127 | 
```