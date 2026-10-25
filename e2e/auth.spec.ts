import { test, expect } from "@playwright/test";
import {
  ACCOUNTS,
  ALL_ROLES,
  DEFAULT_HOME,
  attachDiagnostics,
  flushIssues,
  login,
} from "./fixtures";

test.describe("Auth", () => {
  for (const role of ALL_ROLES) {
    test(`successful login as ${role} redirects to the correct default home`, async ({
      page,
    }) => {
      const issues: string[] = [];
      attachDiagnostics(page, issues);

      await login(page, role);

      const pathname = new URL(page.url()).pathname;
      expect(pathname, `expected ${role} to land on ${DEFAULT_HOME[role]}`).toBe(
        DEFAULT_HOME[role]
      );

      // Page should render real content, not stay blank.
      const bodyText = (await page.locator("body").innerText()).trim();
      expect(bodyText.length, `${role} home page rendered blank body`).toBeGreaterThan(20);

      flushIssues(`auth-login-${role}`, issues);
    });
  }

  test("wrong password shows an error and does not log in", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);

    await page.goto("/");
    await page.getByPlaceholder("Enter username or email").fill(ACCOUNTS.CRM_EXECUTIVE.email);
    await page.getByPlaceholder("Enter password").fill("DefinitelyWrongPassword123!");
    await page.getByRole("button", { name: "Login" }).click();

    // A toast error should appear (react-toastify renders a container with role="alert"
    // or class Toastify__toast - we just look for any visible toast text).
    const toast = page.locator(".Toastify__toast, [role='alert']").first();
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // Must NOT navigate away from the login page.
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/");

    flushIssues("auth-wrong-password", issues);
  });

  test("logout clears the session and returns to /", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);

    await login(page, "SUPER_ADMIN");

    // Open the profile menu (avatar button with a chevron-down icon) and click Logout.
    const profileToggle = page.locator("header button:has(svg.lucide-chevron-down)").first();
    await profileToggle.click();
    await page.getByText("Logout", { exact: true }).click();

    await page.waitForURL("**/", { timeout: 10_000 });
    expect(new URL(page.url()).pathname).toBe("/");

    // Session must actually be cleared: navigating straight to a protected
    // route afterwards should bounce back to "/" rather than render it.
    await page.goto("/dashboard");
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/");

    flushIssues("auth-logout", issues);
  });
});
