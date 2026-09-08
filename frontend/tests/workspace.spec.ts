import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function password(role: string) {
  if (process.env.E2E_PASSWORD) return process.env.E2E_PASSWORD;
  const text = fs.readFileSync(
    path.resolve(process.env.E2E_CREDENTIALS_FILE || "../backend/demo-credentials.txt"),
    "utf8",
  );
  const line = text
    .split(/\r?\n/)
    .find((s) => s.startsWith(`${role}@demo.local: `));
  if (!line) throw new Error("Provision demo credentials before browser tests");
  return line.split(": ").slice(1).join(": ");
}
async function login(page: Page, role = "clinician") {
  await page.goto("/");
  await page.getByLabel("Demo account").selectOption(`${role}@demo.local`);
  await page.getByLabel("Password", { exact: true }).fill(password(role));
  await page.getByRole("button", { name: "Enter clinician workspace" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Clinical intelligence, with oversight.",
    }),
  ).toBeVisible();
}

test("clinician analyzes, inspects evidence, reviews, reloads and opens report/audit", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await page.screenshot({
    path: "../docs/screenshots/dashboard.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "New Analysis", exact: true })
    .click();
  await page
    .getByLabel("Case", { exact: true })
    .selectOption({ label: "SYN-002 — Hard contraindication" });
  await page.getByRole("button", { name: "Run safety-first analysis" }).click();
  await expect(
    page.getByRole("heading", { name: "SYN-002 / Candidate comparison" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /^DEMO Atlas Excluded Efficacy/ })
    .click();
  await expect(page.getByText("BLOCK · DEMO-HISTORY-01")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record clinician decision" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: /^DEMO Birch Pareto optimal Efficacy/ })
    .click();
  await page
    .getByLabel("Comment (optional)")
    .fill("Synthetic browser QA: approved only for further review.");
  await page.getByRole("button", { name: "Record clinician decision" }).click();
  await expect(
    page.getByText("Synthetic browser QA: approved only for further review."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Synthetic browser QA: approved only for further review."),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/analysis.png",
    fullPage: true,
  });
  const reportUrl = await page
    .getByRole("link", { name: "Print report" })
    .getAttribute("href");
  const report = await page.request.get(reportUrl!);
  expect(report.status()).toBe(200);
  expect(await report.text()).toContain("This output is not a prescription");
  await page
    .getByRole("button", { name: "Audit trail", exact: true })
    .last()
    .click();
  await expect(
    page.getByText("Clinician decision", { exact: true }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("missing-data case abstains with no approvable candidate", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Open analysis for SYN-005" }).click();
  await expect(
    page.getByRole("heading", { name: "Analysis abstained" }),
  ).toBeVisible();
  await expect(
    page
      .getByText("Insufficient validated evidence for recommendation.")
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record clinician decision" }),
  ).toBeDisabled();
  await page.getByLabel("Review decision").selectOption("REQUEST_INFORMATION");
  await page.getByRole("button", { name: "Record clinician decision" }).click();
  await expect(page.locator(".review-entry").last()).toContainText(
    "Request information",
  );
});

test("create and edit structured synthetic case, then analyze", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /^Cases/ })
    .click();
  await page.getByRole("button", { name: "New case", exact: true }).click();
  const label = `SYN-QA-${Date.now().toString().slice(-6)}`;
  await page.getByLabel("Case identifier", { exact: true }).fill(label);
  await page.getByLabel("Lab observations (JSON)").fill('{"DEMO-LAB":72}');
  await page
    .getByLabel("Genomic observations (JSON)")
    .fill('{"DEMO-G1":"unflagged"}');
  await page
    .getByLabel("Organ indicators (JSON)")
    .fill('{"DEMO-ORGAN":"available"}');
  await page
    .getByLabel("I confirm this is a synthetic demonstration case.")
    .check();
  await page.getByRole("button", { name: "Save synthetic case" }).click();
  await expect(
    page.getByRole("heading", { name: "Start with a structured case." }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /^Cases/ })
    .click();
  await page
    .getByRole("button", { name: `Edit ${label}`, exact: true })
    .click();
  await page
    .getByLabel("Demonstration notes")
    .fill("Synthetic browser QA case; no patient information.");
  await page
    .getByLabel("I confirm this is a synthetic demonstration case.")
    .check();
  await page.getByRole("button", { name: "Save synthetic case" }).click();
  await page.getByRole("button", { name: "Run safety-first analysis" }).click();
  await expect(
    page.getByRole("heading", { name: `${label} / Candidate comparison` }),
  ).toBeVisible();
});

test("researcher cannot sign off or manage the library", async ({ page }) => {
  await login(page, "researcher");
  await page.getByRole("button", { name: "Open analysis for SYN-001" }).click();
  await expect(
    page.getByText("Only the clinician role can record a decision."),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Therapy Library" })
    .click();
  await expect(
    page.getByRole("button", { name: "Add demo entry" }),
  ).toHaveCount(0);
  const denied = await page.request.post("/api/v1/admin/therapies", {
    data: {},
  });
  expect(denied.status()).toBe(403);
});

test("mobile navigation, persisted case and no page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /^Cases/ })
    .click();
  await page.getByRole("button", { name: "Open analysis for SYN-001" }).click();
  await expect(
    page.getByRole("heading", { name: "SYN-001 / Candidate comparison" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "../docs/screenshots/mobile-analysis.png",
    fullPage: true,
  });
});
