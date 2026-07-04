import { test, expect } from "@playwright/test";
import { TEST_SERVER_PORT, TEST_WEBHOOK_SECRET } from "./test-config.ts";

// This endpoint is a server-to-server webhook (no browser involved in real
// usage), so tests hit the test server directly via the `request` fixture
// instead of going through the client's dev-server proxy.
const SERVER_URL = `http://localhost:${TEST_SERVER_PORT}`;
const WEBHOOK_URL = `${SERVER_URL}/api/webhooks/inbound-email`;
const TICKETS_URL = `${SERVER_URL}/api/tickets`;
const SIGN_IN_URL = `${SERVER_URL}/api/auth/sign-in/email`;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin@123";

test.describe("Inbound Email Webhook", () => {
  test.describe("Successful ticket creation", () => {
    test("creates a ticket when all fields are provided", async ({
      request,
    }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { "x-webhook-secret": TEST_WEBHOOK_SECRET },
        data: {
          from: "customer@example.com",
          fromName: "Jane Customer",
          subject: "Need help with billing",
          body: "I was charged twice for my last invoice.",
          bodyHtml: "<p>I was charged twice for my last invoice.</p>",
        },
      });

      expect(response.status()).toBe(201);
      const responseBody = await response.json();
      expect(responseBody.status).toBe("created");
      expect(typeof responseBody.ticketId).toBe("number");
    });

    test("creates a ticket with only the required fields", async ({
      request,
    }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { "x-webhook-secret": TEST_WEBHOOK_SECRET },
        data: {
          from: "minimal@example.com",
          subject: "Quick question",
          body: "Does this plan support SSO?",
        },
      });

      expect(response.status()).toBe(201);
      const responseBody = await response.json();
      expect(responseBody.status).toBe("created");
      expect(typeof responseBody.ticketId).toBe("number");
    });

    test("strips Re:/Fwd: prefixes from the subject", async ({ request }) => {
      const uniqueBody = `Prefix stripping check ${Date.now()}`;

      const webhookResponse = await request.post(WEBHOOK_URL, {
        headers: { "x-webhook-secret": TEST_WEBHOOK_SECRET },
        data: {
          from: "prefixed@example.com",
          subject: "Re: Fwd: Help",
          body: uniqueBody,
        },
      });

      expect(webhookResponse.status()).toBe(201);
      const { ticketId } = await webhookResponse.json();

      // Sign in so we can read the ticket back and verify the stored subject.
      const signInResponse = await request.post(SIGN_IN_URL, {
        data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      });
      expect(signInResponse.ok(), "Admin sign-in failed").toBeTruthy();

      const ticketsResponse = await request.get(TICKETS_URL);
      expect(ticketsResponse.ok()).toBeTruthy();
      const tickets: Array<{ id: number; subject: string }> =
        await ticketsResponse.json();

      const createdTicket = tickets.find((t) => t.id === ticketId);
      expect(createdTicket).toBeDefined();
      expect(createdTicket?.subject).toBe("Help");
    });
  });

  test.describe("Webhook secret validation", () => {
    test("rejects a request with an invalid webhook secret", async ({
      request,
    }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { "x-webhook-secret": "wrong-secret" },
        data: {
          from: "customer@example.com",
          subject: "Hello",
          body: "This should be rejected.",
        },
      });

      expect(response.status()).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.error).toBe("Invalid webhook secret");
    });

    test("rejects a request with a missing webhook secret header", async ({
      request,
    }) => {
      const response = await request.post(WEBHOOK_URL, {
        data: {
          from: "customer@example.com",
          subject: "Hello",
          body: "This should be rejected.",
        },
      });

      expect(response.status()).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.error).toBe("Invalid webhook secret");
    });
  });

  test.describe("Payload validation", () => {
    test("rejects a request with missing required fields", async ({
      request,
    }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { "x-webhook-secret": TEST_WEBHOOK_SECRET },
        data: {
          from: "customer@example.com",
          // subject and body are omitted
        },
      });

      expect(response.status()).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe(
        "Invalid input: expected string, received undefined"
      );
    });

    test("rejects a request with an invalid email in the from field", async ({
      request,
    }) => {
      const response = await request.post(WEBHOOK_URL, {
        headers: { "x-webhook-secret": TEST_WEBHOOK_SECRET },
        data: {
          from: "not-an-email",
          subject: "Hello",
          body: "This should be rejected.",
        },
      });

      expect(response.status()).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe("Invalid sender email");
    });
  });
});
