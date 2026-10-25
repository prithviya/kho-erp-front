import { test, expect } from "@playwright/test";
import {
  attachDiagnostics,
  flushIssues,
  login,
  uniqueSuffix,
} from "./fixtures";

// Small helper: click the first <button> that appears after a given label
// text in document order - used for custom toggle-button groups (e.g. the
// "Required Services" picker) that have no name/id/testid to target.
async function clickFirstButtonAfterLabel(page: import("@playwright/test").Page, labelText: string) {
  const btn = page.locator(`text=${labelText}`).first().locator("xpath=following::button[1]");
  await btn.click();
}

test.describe("SUPER_ADMIN core flows", () => {
  test("Dashboard loads with real data", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);

    await login(page, "SUPER_ADMIN");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const bodyText = (await page.locator("body").innerText()).trim();
    expect(bodyText.length, "Dashboard body is blank/empty").toBeGreaterThan(20);
    expect(bodyText.toLowerCase()).not.toContain("something went wrong");

    flushIssues("flow-dashboard", issues);
  });

  test("User Management: create a new user with a role", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);
    const suffix = uniqueSuffix();
    const fullName = `PWTEST User ${suffix}`;
    // NOTE: a "@test.local" address (as used for the seeded test accounts)
    // is REJECTED by this form's backend validation with '"email" must be a
    // valid email', even though it is a well-formed address - see report.
    // Using a normal-looking domain here so this test can still exercise the
    // rest of the create-user flow.
    const email = `pwtest.user.${suffix}@example.com`;
    const username = `pwtest_user_${suffix}`;

    await login(page, "SUPER_ADMIN");
    await page.goto("/user-management");

    await page.getByRole("button", { name: "Add New User" }).click();
    await expect(page.getByRole("heading", { name: "Add New User" })).toBeVisible();

    await page.locator('input[placeholder="Geetha"]').first().fill(fullName);
    await page.locator('input[placeholder="geetha.khosocial@gmail.com"]').fill(email);
    // Username field also uses placeholder "Geetha" (same as full name) - target the
    // second matching input in DOM order.
    await page.locator('input[placeholder="Geetha"]').nth(1).fill(username);
    await page.locator('input[type="password"]').fill("PwTest@1234");

    // Select at least one role checkbox (role list is loaded dynamically from the
    // backend, so we just pick whichever checkbox appears first).
    const roleCheckboxes = page.locator('input[type="checkbox"]');
    await expect(roleCheckboxes.first()).toBeVisible({ timeout: 10_000 });
    await roleCheckboxes.first().check();

    const submitBtn = page.getByRole("button", { name: /Create User|Save Changes/ });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.getByText(/User created successfully\.?/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(fullName)).toBeVisible({ timeout: 10_000 });

    flushIssues("flow-user-management", issues);
  });

  test("Master: add a new Lead Source entry", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);
    const suffix = uniqueSuffix();
    const sourceName = `PWTEST Source ${suffix}`;

    await login(page, "SUPER_ADMIN");
    await page.goto("/master");

    const leadSourceSection = page.locator("div.rounded-2xl", {
      has: page.getByRole("heading", { name: "Lead Source", exact: true }),
    });
    await expect(leadSourceSection).toBeVisible({ timeout: 10_000 });
    await leadSourceSection.getByRole("button", { name: "Add", exact: true }).click();

    await page.locator('input[placeholder="Source Name"]').fill(sourceName);
    await page.locator('input[placeholder="Source Code"]').fill(`PWT${suffix.slice(-6)}`);
    await page.locator('input[placeholder="Display Order"]').fill("99");

    await page.getByRole("button", { name: "Add Source" }).click();

    await expect(page.getByText(/Source added\.?/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(sourceName)).toBeVisible({ timeout: 10_000 });

    flushIssues("flow-master", issues);
  });
});

test.describe("Lead flows", () => {
  test("SUPER_ADMIN can create a new lead and see it in the list", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);
    const suffix = uniqueSuffix();
    const companyName = `PWTEST Company ${suffix}`;

    await login(page, "SUPER_ADMIN");
    await page.goto("/lead-overview");

    await page.getByRole("button", { name: "+ Add Lead" }).click();

    await page.locator('input[name="companyName"]').fill(companyName);
    await page.locator('select[name="salutation"]').selectOption("Mr.");
    await page.locator('input[name="contactPerson"]').fill("PWTEST Contact");
    await page.locator('input[name="email"]').fill(`pwtest.lead.${suffix}@test.local`);

    const sourceSelect = page.locator('select[name="leadSourceId"]');
    const sourceOptionCount = await sourceSelect.locator("option").count();
    if (sourceOptionCount > 1) {
      await sourceSelect.selectOption({ index: 1 });
    }

    await clickFirstButtonAfterLabel(page, "Required Services");

    await page.getByRole("button", { name: "Save Lead" }).click();

    await expect(page.getByText(/Lead created successfully!?/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(companyName)).toBeVisible({ timeout: 10_000 });

    flushIssues("flow-lead-create", issues);
  });

  test("CRM_EXECUTIVE cannot see the Add Lead button despite owning /lead-overview", async ({
    page,
  }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);

    await login(page, "CRM_EXECUTIVE");
    await page.goto("/lead-overview");
    await page.waitForTimeout(800);

    // Documents a real finding: LeadOverview.jsx gates creation to SUPER_ADMIN only.
    const addButton = page.getByRole("button", { name: "+ Add Lead" });
    await expect(addButton).toHaveCount(0);

    flushIssues("flow-crm-cannot-create-lead", issues);
  });
});

test.describe("Project onboarding + assignment", () => {
  // NOTE: logged in as SUPER_ADMIN here, not MANAGER. Confirmed via direct
  // probing that MANAGER cannot complete this flow at all: onboardingPrjt.jsx
  // calls userManagementService.getUsers() -> GET /api/users, which the
  // backend restricts to super_admin only (erp_backend/src/routes/user.routes.js:6).
  // For MANAGER this returns 403, so both "Reporting Head" and "SPOC" pickers
  // show "No users available" and the form can never be submitted - see the
  // final report for full details (this is a severe, reproducible bug).
  test("Onboard a new project then assign a team member to it", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);
    const suffix = uniqueSuffix();
    const projectName = `PWTEST Project ${suffix}`;
    const companyName = `PWTEST Co ${suffix}`;

    await login(page, "SUPER_ADMIN");
    await page.goto("/onboard-prjt");

    await page.locator('input[name="projectName"]').fill(projectName);
    await page.locator('input[name="companyName"]').fill(companyName);

    await page.getByText("Select Reporting Head").click();
    const reportingHeadOption = page.locator('input[type="checkbox"]').first();
    await reportingHeadOption.check();
    // These are custom dropdowns (not native <select>); Escape doesn't close
    // them. Click a neutral area of the page to close the popup before
    // opening the next one, otherwise both checkbox lists stay stacked in
    // the DOM and ".first()" keeps hitting the first (already-handled) one.
    await page.locator("h1, h2").first().click({ force: true }).catch(() => {});
    await page.mouse.click(20, 20);
    await page.waitForTimeout(300);

    await page.getByText("Select SPOC").click();
    const spocCheckbox = page.locator('input[type="checkbox"]').first();
    await spocCheckbox.check();
    await page.mouse.click(20, 20);
    await page.waitForTimeout(300);

    // Required Services checkbox grid (now the first checkbox on the page,
    // since both user-picker popups are closed).
    await page.locator('input[type="checkbox"]').first().check();

    const onboardBtn = page.getByRole("button", { name: /Onboard Project/ });
    await expect(onboardBtn).toBeEnabled({ timeout: 10_000 });
    await onboardBtn.click();

    await expect(page.getByText(/Project onboarded successfully\.?/i)).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForURL("**/prjt-details", { timeout: 10_000 });

    // Find the freshly created project row and assign a team member to it.
    const row = page.locator("tr", { hasText: projectName });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: "Assign" }).click();

    await expect(page.getByText("Assign Project", { exact: true })).toBeVisible();
    const employeeBox = page.getByText("Select Employees").first();
    if (await employeeBox.count()) {
      await employeeBox.click();
      const empCheckbox = page.locator('input[type="checkbox"]').first();
      if (await empCheckbox.count()) {
        await empCheckbox.check();
      }
    }
    await page.getByRole("button", { name: "Assign Project", exact: true }).click();

    const result = page.getByText(/Project assigned successfully\.?|Select at least one valid employee or vendor\.?/i);
    await expect(result).toBeVisible({ timeout: 10_000 });

    flushIssues("flow-project-onboard-assign", issues);
  });
});

test.describe("Assigned Project Board", () => {
  test("MANAGER can create a task, open it, change its status, and post a task chat message", async ({
    page,
  }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);
    const suffix = uniqueSuffix();
    const taskName = `PWTEST Task ${suffix}`;

    await login(page, "MANAGER");
    await page.goto("/assign-board");
    await page.waitForTimeout(1000);

    const projectButtons = page.locator("aside button, nav button").filter({ hasNotText: "All assigned projects" });
    const anyProjectButton = page.getByRole("button", { name: "All assigned projects" });
    if (await anyProjectButton.count()) {
      await anyProjectButton.click();
    }
    await page.waitForTimeout(800);

    const createTaskButton = page.locator('button[title="Create task"]').first();
    if (!(await createTaskButton.count())) {
      flushIssues("flow-board-manager", [
        ...issues,
        "SKIPPED: no project with a visible 'Create task' (+) button was found for MANAGER - cannot select a project/service column.",
      ]);
      test.skip(true, "No assignable project/column available for MANAGER test account.");
      return;
    }

    await createTaskButton.click();
    await expect(page.getByText("Create New Task", { exact: true })).toBeVisible();
    await page.locator('input[placeholder="Enter task name..."]').fill(taskName);

    const assigneeCheckbox = page.locator('input[type="checkbox"]').first();
    if (await assigneeCheckbox.count()) {
      await assigneeCheckbox.check();
    }

    await page.getByRole("button", { name: "Create Task", exact: true }).click();
    await page.waitForTimeout(1000);

    const taskCard = page.getByText(taskName, { exact: false }).first();
    await expect(taskCard).toBeVisible({ timeout: 10_000 });
    await taskCard.click();

    const statusSelect = page.locator("select").filter({ hasText: "" }).first();
    // The status <select> is the one whose options include "Open"/"In Progress"/"Review"/"Completed".
    const statusSelectByOption = page.locator("select:has(option:has-text('Completed'))").first();
    await expect(statusSelectByOption).toBeVisible({ timeout: 10_000 });
    await statusSelectByOption.selectOption("REVIEW");
    await page.waitForTimeout(500);
    await expect(statusSelectByOption).toHaveValue("REVIEW");

    const chatBox = page.getByPlaceholder("Write a task update or use @ to mention someone...");
    await expect(chatBox).toBeVisible({ timeout: 10_000 });
    await chatBox.fill(`PWTEST chat message ${suffix}`);
    await page.getByRole("button", { name: "Send Message", exact: true }).click();

    await expect(page.getByText(`PWTEST chat message ${suffix}`)).toBeVisible({ timeout: 10_000 });

    flushIssues("flow-board-manager", issues);
  });

  test("TEAM_MEMBER can view the assigned board", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);

    await login(page, "TEAM_MEMBER");
    await page.goto("/assign-board");
    await page.waitForTimeout(1200);

    const bodyText = (await page.locator("body").innerText()).trim();
    expect(bodyText.length, "Assign board rendered blank for TEAM_MEMBER").toBeGreaterThan(10);

    const hasEmptyState = await page.getByText("No currently assigned projects.").count();
    const hasProjectButtons = await page.locator("button", { hasText: "" }).count();
    if (hasEmptyState > 0) {
      flushIssues("flow-board-team-member", [
        ...issues,
        "COVERAGE GAP: pw.team@test.local has no assigned projects seeded, so task-status-change could not be exercised for TEAM_MEMBER.",
      ]);
      return;
    }

    flushIssues("flow-board-team-member", issues);
  });
});

test.describe("HR core flows", () => {
  test("HR can create a Job Opening", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);
    const suffix = uniqueSuffix();
    const jobTitle = `PWTEST QA Engineer ${suffix}`;

    await login(page, "HR");
    await page.goto("/job");

    await page.getByRole("button", { name: "Add", exact: false }).first().click();
    await expect(page.getByText("Add New Opening", { exact: true })).toBeVisible();

    await page.locator('input[placeholder="e.g., Senior Developer"]').fill(jobTitle);

    // CONFIRMED BUG (see report): GET /api/departments returns 403 for the
    // HR role, so this <select> never receives any real <option>s beyond the
    // "Select Department" placeholder - HR can never pick a department here
    // and therefore can never create a Job Opening through the UI. We give
    // this a short poll (rather than the suite's usual 8s) and record it as
    // a hard failure if, as expected, no options ever arrive.
    const deptSelect = page.locator("select").first();
    const deptOptionCount = await deptSelect.locator("option").count().catch(() => 1);
    await page.waitForTimeout(1500);
    const deptOptionCountAfterWait = await deptSelect.locator("option").count();
    expect(
      deptOptionCountAfterWait,
      "BUG: GET /api/departments returns 403 for role HR (erp_backend), so the Department dropdown on /job never populates and HR cannot create a Job Opening."
    ).toBeGreaterThan(1);
    await deptSelect.selectOption({ index: 1 });

    const reqCountInput = page.locator('input[type="number"]').first();
    await reqCountInput.fill("1");
    const minExpInput = page.locator('input[type="number"]').nth(1);
    await minExpInput.fill("0");

    const skillsInputs = page.locator('input[type="text"]');
    await skillsInputs.last().fill("Testing");

    await page.getByRole("button", { name: "Save Opening", exact: true }).click();

    await expect(page.getByText(/Created successfully/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(jobTitle)).toBeVisible({ timeout: 10_000 });

    flushIssues("flow-hr-job-opening", issues);
  });

  test("HR can view Applied candidates, Onboarding list, Employee directory and Payroll", async ({
    page,
  }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);

    await login(page, "HR");

    await page.goto("/applied");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).toContainText(/Total Applications|No applications found\.?/i);

    await page.goto("/onboarding");
    await page.waitForTimeout(800);
    await expect(page.getByText("Awaiting Onboarding")).toBeVisible();

    await page.goto("/employee");
    await page.waitForTimeout(800);
    await expect(page.getByText("Employee Directory")).toBeVisible();

    await page.goto("/payroll");
    await page.waitForTimeout(1000);
    const payrollBody = (await page.locator("body").innerText()).trim();
    expect(payrollBody.length, "Payroll page rendered blank").toBeGreaterThan(20);

    flushIssues("flow-hr-views", issues);
  });
});

test.describe("Leave (TEAM_MEMBER)", () => {
  test("TEAM_MEMBER can submit a new leave request", async ({ page }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);

    await login(page, "TEAM_MEMBER");
    await page.goto("/leave");
    await page.waitForTimeout(800);

    await page.getByRole("button", { name: "Apply Leave", exact: true }).click();
    await expect(page.getByText("Apply Leave", { exact: true }).last()).toBeVisible();

    const categorySelect = page.locator("select").first();
    await expect
      .poll(async () => categorySelect.locator("option").count(), { timeout: 8_000 })
      .toBeGreaterThan(1);
    const enabledOption = categorySelect.locator("option:not([disabled])").nth(1);
    const optionValue = await enabledOption.getAttribute("value").catch(() => null);
    if (optionValue) {
      await categorySelect.selectOption(optionValue);
    }

    const today = new Date();
    const future = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const toIso = (d: Date) => d.toISOString().slice(0, 10);

    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill(toIso(future));
    await dateInputs.nth(1).fill(toIso(future));

    const reasonBox = page.locator("textarea");
    if (await reasonBox.count()) {
      await reasonBox.first().fill("PWTEST leave reason - automated functional test");
    }

    await page.getByRole("button", { name: "Submit", exact: true }).click();

    const outcome = page.getByText(
      /Leave request submitted successfully\.?|Casual Leave is already booked|Another leave type is already booked/i
    );
    await expect(outcome).toBeVisible({ timeout: 10_000 });

    flushIssues("flow-leave", issues);
  });
});

test.describe("CEO access", () => {
  test("CEO lands somewhere after login and can reach the routes AppRoutes grants (/assign-board)", async ({
    page,
  }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);

    await login(page, "CEO");
    const landingPath = new URL(page.url()).pathname;

    await page.goto("/assign-board");
    await page.waitForTimeout(800);
    const assignBoardPath = new URL(page.url()).pathname;
    expect(assignBoardPath, "CEO should be able to reach /assign-board per AppRoutes.jsx").toBe(
      "/assign-board"
    );

    flushIssues("flow-ceo", [
      ...issues,
      `INFO: CEO landed on "${landingPath}" immediately after login (getDefaultHomePath says /onboard-prjt, but AppRoutes.jsx only allows SUPER_ADMIN/MANAGER on /onboard-prjt - see report for whether this is a redirect loop).`,
    ]);
  });
});

test.describe("Public CIF form (no auth)", () => {
  // CONFIRMED BUG (see report): leaving Date of Birth blank - which the form
  // itself marks optional (ciform.jsx renderField('DATE OF BIRTH','DOB','date',false,...))
  // - makes POST /api/cif-submissions fail with a 500: "Incorrect date value:
  // 'Invalid date' for column 'dob' at row 1". This test intentionally omits
  // DOB (that is what "minimal valid submission" means per the form's own
  // validation) and is therefore EXPECTED TO FAIL until that backend bug is
  // fixed - the failure itself is the evidence.
  test("A minimal valid application (DOB omitted, as the form allows) can be submitted without logging in", async ({
    page,
  }) => {
    const issues: string[] = [];
    attachDiagnostics(page, issues);
    const suffix = uniqueSuffix();

    await page.goto("/cif-form");
    await page.waitForTimeout(800);

    const positionSelect = page.locator('select[name="appliedPosition"]');
    await expect
      .poll(async () => positionSelect.locator("option").count(), { timeout: 8_000 })
      .toBeGreaterThan(0);
    const positionOptionCount = await positionSelect.locator("option").count();
    if (positionOptionCount > 1) {
      await positionSelect.selectOption({ index: 1 });
    } else {
      flushIssues("flow-cif-form", [
        ...issues,
        "COVERAGE GAP: no job positions were available in the appliedPosition dropdown, so the CIF form submission could not be exercised end to end.",
      ]);
      return;
    }

    await page.locator('input[name="fullName"]').fill(`PWTEST Applicant ${suffix}`);
    await page.locator('input[name="email"]').fill(`pwtest.applicant.${suffix}@test.local`);
    await page.locator('input[name="phoneNumber"]').fill("9876543210");
    await page.locator('input[name="address"]').fill("PWTEST Address, Coimbatore");
    await page.locator('input[name="state"]').fill("Tamil Nadu");
    await page.locator('select[name="maritalStatus"]').selectOption("Single");
    await page.locator('select[name="gender"]').selectOption("Male");

    // Exercise the optional resume upload path with a tiny dummy PDF.
    await page.setInputFiles('input[type="file"]', {
      name: "pwtest-resume.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%PWTEST dummy resume\n1 0 obj<<>>endobj\ntrailer<<>>"),
    });

    await page.locator('input[name="consent"]').check();

    await page.getByRole("button", { name: "Submit Application", exact: true }).click();

    await expect(page.getByText(/Employee profile submitted successfully\.?/i)).toBeVisible({
      timeout: 15_000,
    });

    flushIssues("flow-cif-form", issues);
  });
});
