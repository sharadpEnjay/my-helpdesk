
import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin@123";
const AGENT_EMAIL = "agent-e2e@example.com";
const AGENT_PASSWORD = "agent@123";

async function signInViaApi(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password },
  });
  expect(response.ok(), `Sign-in API call failed for ${email}`).toBeTruthy();
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

test.describe("Login Page UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the card with title and subtitle", async ({ page }) => {
    await expect(
      page.getByText("Helpdesk", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Sign in to your account")).toBeVisible();
  });

  test("renders the email field with correct label and placeholder", async ({
    page,
  }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("renders the password field with correct label and placeholder", async ({
    page,
  }) => {
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  });

  test("renders the submit button with text Sign In", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Sign In" })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("Client-side Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows both errors when form is submitted empty", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("shows email error for an invalid email format", async ({ page }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible();
  });

  test("shows only email error when password is missing", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(
      page.getByText("Please enter a valid email address")
    ).not.toBeVisible();
  });

  test("shows only email error when only password is provided", async ({
    page,
  }) => {
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText("Please enter a valid email address")
    ).toBeVisible();
    await expect(page.getByText("Password is required")).not.toBeVisible();
  });

  test("does not navigate away when validation fails", async ({ page }) => {
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------

test.describe("Successful Login", () => {
  test("admin is redirected to home page after sign in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });

  test("admin name is shown in the navbar after sign in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/");
    // The Navbar renders the user's name next to the Sign Out button.
    await expect(page.getByText("Admin")).toBeVisible();
  });

  test("admin user sees the Users link in the navbar", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/");
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("the Sign Out button is visible in the navbar after sign in", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("/");
    await expect(
      page.getByRole("button", { name: "Sign Out" })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("Failed Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows server error for wrong password", async ({ page }) => {
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("shows server error for a non-existent email", async ({ page }) => {
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("button shows Signing in... while the request is in flight", async ({
    page,
  }) => {
    // Hold the sign-in request in place so we can inspect the loading state.
    let releaseRequest!: () => void;
    const requestHeld = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    await page.route("**/api/auth/sign-in/email", async (route) => {
      await requestHeld;
      await route.continue();
    });

    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    // While the request is blocked the button must show the loading label.
    await expect(
      page.getByRole("button", { name: "Signing in..." })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In" })
    ).not.toBeVisible();

    // Release the request and let the test complete normally.
    releaseRequest();
    await page.waitForURL("/");
  });

  test("button is disabled while submitting", async ({ page }) => {
    let releaseRequest!: () => void;
    const requestHeld = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    await page.route("**/api/auth/sign-in/email", async (route) => {
      await requestHeld;
      await route.continue();
    });

    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByRole("button", { name: "Signing in..." })
    ).toBeDisabled();

    releaseRequest();
    await page.waitForURL("/");
  });
});

// ---------------------------------------------------------------------------

test.describe("Sign Out", () => {
  test.beforeEach(async ({ page }) => {
    // Use the API helper so the sign-in form tests stay independent.
    await signInViaApi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/");
    // Wait for the app to fully render the authenticated state.
    await expect(
      page.getByRole("button", { name: "Sign Out" })
    ).toBeVisible();
  });

  test("clicking Sign Out redirects to the login page", async ({ page }) => {
    await page.getByRole("button", { name: "Sign Out" }).click();

    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test("the login form is shown after sign out", async ({ page }) => {
    await page.getByRole("button", { name: "Sign Out" }).click();

    await page.waitForURL("/login");
    await expect(
      page.getByText("Helpdesk", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In" })
    ).toBeVisible();
  });

  test("visiting a protected route after sign out redirects to login", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForURL("/login");

    // Attempt to navigate back to the protected home page.
    await page.goto("/");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------

test.describe("Route Protection", () => {
  test('unauthenticated user visiting "/" is redirected to "/login"', async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test('unauthenticated user visiting "/users" is redirected to "/login"', async ({
    page,
  }) => {
    await page.goto("/users");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test('authenticated admin can access "/users"', async ({ page }) => {
    await signInViaApi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/users");

    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test.describe("non-admin role", () => {
    test('agent visiting "/users" is redirected to "/"', async ({ page }) => {
      await signInViaApi(page, AGENT_EMAIL, AGENT_PASSWORD);
      await page.goto("/users");

      // AdminRoute redirects non-admin roles back to the home page.
      await page.waitForURL("/");
      await expect(page).toHaveURL("/");
    });

    test("agent does not see the Users link in the navbar", async ({
      page,
    }) => {
      await signInViaApi(page, AGENT_EMAIL, AGENT_PASSWORD);
      await page.goto("/");

      await expect(
        page.getByRole("button", { name: "Sign Out" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Users" })
      ).not.toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------

test.describe("Session Persistence", () => {
  test("session survives a full page reload", async ({ page }) => {
    await signInViaApi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/");
    await expect(page).toHaveURL("/");

    await page.reload();

    // Must still be on the home page — not bounced back to login.
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Admin")).toBeVisible();
  });

  test("session survives navigating away and back", async ({ page }) => {
    await signInViaApi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/");
    await page.waitForURL("/");

    // Navigate to the users page and then back to home.
    await page.getByRole("link", { name: "Users" }).click();
    await page.waitForURL("/users");

    await page.getByRole("link", { name: "Helpdesk" }).click();
    await page.waitForURL("/");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation").getByText("Admin")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------

test.describe("Authenticated User on Login Page", () => {
  test('visiting "/login" while authenticated redirects to "/"', async ({
    page,
  }) => {
    await signInViaApi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/login");

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});

// ---------------------------------------------------------------------------

test.describe("Catch-all Route", () => {
  test("unknown route redirects unauthenticated user to login", async ({
    page,
  }) => {
    await page.goto("/this/route/does/not/exist");

    // App catch-all → Navigate to "/" → ProtectedRoute → Navigate to "/login"
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });

  test("unknown route redirects authenticated user to home page", async ({
    page,
  }) => {
    await signInViaApi(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/this/route/does/not/exist");

    // App catch-all → Navigate to "/"
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
