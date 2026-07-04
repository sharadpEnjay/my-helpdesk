import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin@123";

async function signInAsAdmin(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.ok(), "Admin sign-in failed").toBeTruthy();
}

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test("lists users in the table", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("cell", { name: ADMIN_EMAIL, exact: true })).toBeVisible();
  });

  test("creates a new user", async ({ page }) => {
    const uniqueEmail = `e2e-create-${Date.now()}@example.com`;

    await page.getByRole("button", { name: "Create User" }).click();
    await expect(page.getByRole("heading", { name: "Create New User" })).toBeVisible();

    await page.getByLabel("Name").fill("E2E Created User");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Role").click();
    await page.getByRole("option", { name: "Agent" }).click();
    await page.getByLabel("Password").fill("testpass123");
    await page.getByRole("button", { name: "Create User" }).click();

    await expect(page.getByRole("cell", { name: uniqueEmail, exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "E2E Created User", exact: true })).toBeVisible();
  });

  test("edits an existing user", async ({ page }) => {
    const uniqueEmail = `e2e-edit-${Date.now()}@example.com`;

    // First create a user to edit
    await page.getByRole("button", { name: "Create User" }).click();
    await page.getByLabel("Name").fill("Before Edit");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Role").click();
    await page.getByRole("option", { name: "Agent" }).click();
    await page.getByLabel("Password").fill("testpass123");
    await page.getByRole("button", { name: "Create User" }).click();
    await expect(page.getByRole("cell", { name: "Before Edit", exact: true })).toBeVisible();

    // Edit the user
    const row = page.getByRole("row").filter({ hasText: "Before Edit" });
    await row.getByRole("button", { name: "Edit Before Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit User" })).toBeVisible();

    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill("After Edit");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByRole("cell", { name: "After Edit", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Before Edit", exact: true })).not.toBeVisible();
  });

  test("deletes a user", async ({ page }) => {
    const uniqueEmail = `e2e-delete-${Date.now()}@example.com`;

    // First create a user to delete
    await page.getByRole("button", { name: "Create User" }).click();
    await page.getByLabel("Name").fill("To Be Deleted");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Role").click();
    await page.getByRole("option", { name: "Agent" }).click();
    await page.getByLabel("Password").fill("testpass123");
    await page.getByRole("button", { name: "Create User" }).click();
    await expect(page.getByRole("cell", { name: "To Be Deleted", exact: true })).toBeVisible();

    // Delete the user
    const row = page.getByRole("row").filter({ hasText: "To Be Deleted" });
    await row.getByRole("button", { name: "Delete To Be Deleted" }).click();
    await expect(page.getByRole("heading", { name: "Delete User" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByRole("cell", { name: "To Be Deleted", exact: true })).not.toBeVisible();
  });
});
