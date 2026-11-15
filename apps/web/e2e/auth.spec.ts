import { expect, test, type Page } from "@playwright/test";
import { totp } from "@mailfox/core";
import { E2E_EMAIL, E2E_PASSWORD } from "./global-setup";

async function signIn(page: Page, password = E2E_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for the server action to finish (redirect, error or 2FA step) before the test moves on.
  await page.waitForLoadState("networkidle");
}

async function signInToDashboard(page: Page) {
  await signIn(page);
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

test("unauthenticated visitors are sent to the login page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("wrong password shows a clear error", async ({ page }) => {
  await signIn(page, "definitely-wrong-1");
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("sign in → populated dashboard → ⌘K search", async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Welcome back, E2E" })).toBeVisible();
  for (const label of ["Sent today", "Last 30 days", "Open rate", "Bounce rate", "Complaint rate"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText("November newsletter")).toBeVisible();
  await expect(page.getByText(/Worker (online|offline)|Can’t reach Redis/)).toBeVisible();

  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await page.keyboard.type("settings");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});

test("team page lets an admin see role controls", async ({ page }) => {
  await signInToDashboard(page);
  await page.goto("/settings/team");
  await expect(page.getByRole("cell", { name: /sara@mailfox\.local/ }).first()).toBeVisible();
  await expect(page.getByLabel("Role for sara@mailfox.local")).toBeVisible();
  // Admins can't edit owners
  await expect(page.getByLabel("Role for admin@mailfox.local")).toHaveCount(0);
});

test("enable 2FA, then sign in with an authenticator code and with a recovery code", async ({ page }) => {
  await signInToDashboard(page);
  await page.goto("/settings/security");
  await page.getByRole("button", { name: "Set up two-factor" }).click();
  const secret = (await page.getByTestId("totp-secret").textContent())?.trim() ?? "";
  expect(secret).toMatch(/^[A-Z2-7]{32}$/);

  await page.getByLabel("Code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("Two-factor authentication is on").first()).toBeVisible();
  const codes = await page
    .getByRole("list", { name: "Recovery codes" })
    .getByRole("listitem")
    .allTextContents();
  expect(codes).toHaveLength(8);

  // Sign in with the *next* time-step's code (the current one was just used and replay is blocked).
  await signOut(page);
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Two-factor check" })).toBeVisible();
  await page.getByLabel("Authentication code").fill(totp(secret, Date.now() + 30_000));
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Recovery code works exactly once.
  await signOut(page);
  await signIn(page);
  await page.getByLabel("Authentication code").fill(codes[0] ?? "");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await signOut(page);
  await signIn(page);
  await page.getByLabel("Authentication code").fill(codes[0] ?? "");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByText("Enter a 6-digit code or one of your recovery codes")).toBeVisible();
});
