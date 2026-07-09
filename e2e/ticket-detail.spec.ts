import { test, expect, type Page } from "@playwright/test";
import { TEST_WEBHOOK_SECRET } from "./test-config.ts";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin@123";

async function signInAsAdmin(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.ok(), "Admin sign-in failed").toBeTruthy();
}

interface WebhookTicketInput {
  from: string;
  fromName?: string;
  subject: string;
  body: string;
}

// Tickets in this app are only ever created via the inbound-email webhook
// (there is no "create ticket" UI flow and the test DB starts empty - see
// e2e/global-setup.ts). Route ticket creation through the real webhook, the
// same way e2e/tickets.spec.ts and e2e/webhooks.spec.ts do, so each test
// gets its own isolated ticket instead of depending on shared seed data.
async function createTicketViaWebhook(
  page: Page,
  data: WebhookTicketInput
): Promise<number> {
  const response = await page.request.post("/api/webhooks/inbound-email", {
    headers: { "x-webhook-secret": TEST_WEBHOOK_SECRET },
    data,
  });
  expect(response.status(), "Webhook ticket creation failed").toBe(201);
  const body = await response.json();
  return body.ticketId as number;
}

test.describe("Ticket Detail Page", () => {
  let ticketId: number;
  let uniqueSubject: string;

  test.beforeEach(async ({ page }) => {
    uniqueSubject = `Ticket detail test ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    ticketId = await createTicketViaWebhook(page, {
      from: "detail-customer@example.com",
      fromName: "Dana Detail",
      subject: uniqueSubject,
      body: "I cannot log into my account after resetting my password.",
    });

    await signInAsAdmin(page);
    await page.goto(`/tickets/${ticketId}`);
    await expect(page.getByRole("heading", { name: uniqueSubject })).toBeVisible();
  });

  test("submitting a reply appends it to the thread with agent styling", async ({
    page,
  }) => {
    const replyBody = `Thanks for reaching out, we're on it. ${Date.now()}`;

    await page.getByPlaceholder("Type your reply...").fill(replyBody);
    await page.getByRole("button", { name: "Send Reply" }).click();

    await expect(page.getByText(replyBody)).toBeVisible();

    // Agent replies render an "Agent" badge (purple styling); customer
    // replies would render a "Customer" badge instead - assert the badge
    // sits alongside the new reply's own text.
    const replyCard = page.getByText(replyBody).locator("xpath=..");
    await expect(replyCard.getByText("Agent", { exact: true })).toBeVisible();

    // The form resets on a successful submit.
    await expect(page.getByPlaceholder("Type your reply...")).toHaveValue("");

    // Persisted server-side: reload and confirm the reply is still there.
    await page.reload();
    await expect(page.getByText(replyBody)).toBeVisible();
  });

  test("changing the status via the sidebar updates the ticket", async ({ page }) => {
    const statusSelect = page.getByRole("combobox", { name: "Status" });
    await expect(statusSelect).toHaveText(/open/i);

    await statusSelect.click();
    await page.getByRole("option", { name: /^resolved$/i }).click();

    await expect(statusSelect).toHaveText(/resolved/i);

    // Persisted server-side: reload and confirm the change stuck.
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Status" })).toHaveText(/resolved/i);
  });

});
