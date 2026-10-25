import { test, expect } from "@playwright/test";
import {
  ALL_ROLES,
  ROUTES,
  attachDiagnostics,
  flushIssues,
  login,
} from "./fixtures";

test.describe("RBAC route matrix", () => {
  for (const role of ALL_ROLES) {
    test(`role ${role} can only reach the routes AppRoutes.jsx grants it`, async ({
      page,
    }) => {
      const issues: string[] = [];
      attachDiagnostics(page, issues);

      await login(page, role);

      const mismatches: string[] = [];

      for (const route of ROUTES) {
        const allowed = route.roles.includes(role);

        await page.goto(route.path);
        await page.waitForLoadState("domcontentloaded");
        // Allow client-side RoleRoute redirect (<Navigate>) to settle.
        await page.waitForTimeout(600);

        const actualPath = new URL(page.url()).pathname;

        if (allowed) {
          const ok = actualPath === route.path;
          expect
            .soft(ok, `${role} should be able to reach ${route.path} but landed on ${actualPath}`)
            .toBeTruthy();
          if (!ok) mismatches.push(`ALLOWED-BUT-REDIRECTED: ${role} ${route.path} -> ${actualPath}`);
        } else {
          const ok = actualPath !== route.path;
          expect
            .soft(
              ok,
              `${role} should NOT be able to reach ${route.path} but it rendered at ${actualPath}`
            )
            .toBeTruthy();
          if (!ok) mismatches.push(`FORBIDDEN-BUT-REACHABLE: ${role} ${route.path}`);
        }
      }

      flushIssues(`rbac-${role}`, [...issues, ...mismatches]);
    });
  }
});
