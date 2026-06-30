---
name: auth-test-patterns
description: Patterns for seeding test users and authenticating in Playwright auth tests
metadata:
  type: project
---

## Better Auth password hashing

Better Auth uses `node:crypto` scrypt with these parameters:
- N=16384, r=16, p=1, dkLen=64
- Format stored in DB: `${salt_hex}:${hash_hex}` where salt is 16 random bytes as hex

```typescript
import { randomBytes, scrypt } from "node:crypto";

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, derivedKey) => (err ? reject(err) : resolve(derivedKey))
    );
  });
  return `${salt}:${key.toString("hex")}`;
}
```

## Account table schema for credential provider

When inserting a test user directly into the DB:
- `providerId = "credential"` (Better Auth's email/password provider)
- `accountId = userId` (Better Auth uses the userId as accountId for credential accounts)

## signInViaApi helper

`page.request.post()` shares the same cookie jar as the browser context. Use this for fast
pre-authentication in tests that are not about the login form itself:

```typescript
async function signInViaApi(page: Page, email: string, password: string): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
}
```

After this call, `page.goto("/")` will have the session cookie set.

## Non-admin user creation

Since `disableSignUp: true` blocks the public API, create non-admin test users
by inserting directly into the test DB via `pg.Client` with `TEST_DB_URL` from test-config.ts.
Use `ensureAgentUser()` pattern (idempotent, checks existence before inserting) called in `test.beforeAll`.

**Why:** sign-up API is disabled in production auth config; seed.ts creates its own auth instance
to bypass this, but e2e tests cannot easily do the same.

## Route interception for loading state tests

Use `page.route()` + a held promise to freeze in-flight requests and assert loading UI:

```typescript
let releaseRequest!: () => void;
const requestHeld = new Promise<void>((resolve) => { releaseRequest = resolve; });
await page.route("**/api/auth/sign-in/email", async (route) => {
  await requestHeld;
  await route.continue();
});
// ... fill form and click ...
await expect(page.getByRole("button", { name: "Signing in..." })).toBeVisible();
releaseRequest();
await page.waitForURL("/");
```
