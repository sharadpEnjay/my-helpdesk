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

// ---------------------------------------------------------------------------

test.describe("Tickets List Page", () => {
  test("the Tickets link is visible in the navbar and navigates to /tickets", async ({
    page,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/");

    await page.getByRole("link", { name: "Tickets" }).click();

    await page.waitForURL("/tickets");
    await expect(
      page.getByRole("heading", { name: "Tickets" })
    ).toBeVisible();
  });

  test("a ticket created via the webhook appears in the table", async ({
    page,
  }) => {
    const uniqueSubject = `Webhook visible ticket ${Date.now()}`;

    await createTicketViaWebhook(page, {
      from: "webhook-visible@example.com",
      fromName: "Webhook Visible",
      subject: uniqueSubject,
      body: "This ticket should show up in the tickets list.",
    });

    await signInAsAdmin(page);
    await page.goto("/tickets");

    await expect(
      page.getByRole("cell", { name: uniqueSubject, exact: true })
    ).toBeVisible();
  });
});
