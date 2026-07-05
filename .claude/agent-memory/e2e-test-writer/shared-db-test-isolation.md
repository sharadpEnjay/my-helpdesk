---
name: shared-db-test-isolation
description: How to write DB-state-dependent assertions (empty states, ordering) safely when the test DB is shared across all spec files for the whole run
metadata:
  type: project
---

## The problem

`e2e/global-setup.ts` recreates the test DB **once** per full test run, not per
file or per test. Every `.spec.ts` file (auth, users, webhooks, tickets, ...)
shares the same rows for the whole run, and `fullyParallel: true` means files
run concurrently across workers. Any test that asserts "the list is empty" or
"this is the only row" is racy if other spec files (e.g. `webhooks.spec.ts`)
are concurrently inserting rows of the same type.

## Pattern: mock the network response for empty-state tests

Don't rely on the DB actually being empty. Use `page.route()` to stub the API
response so the empty-state UI renders deterministically regardless of what
other tests have inserted:

```typescript
await page.route("**/api/tickets", async (route) => {
  await route.fulfill({ json: [] });
});
await page.goto("/tickets");
await expect(page.getByText("No tickets found")).toBeVisible();
```

Used for the tickets list empty-state test in `e2e/tickets.spec.ts`.

## Pattern: relative ordering instead of absolute position

For "newest first" / sort-order tests, don't assume the row at index 0 is
yours — other concurrent tests may have inserted newer rows in between. Create
two uniquely-named records, then compare their relative position among *all*
rendered rows:

```typescript
const rowTexts = await page.getByRole("row").allTextContents();
const olderIndex = rowTexts.findIndex((t) => t.includes(olderSubject));
const newerIndex = rowTexts.findIndex((t) => t.includes(newerSubject));
expect(newerIndex).toBeLessThan(olderIndex);
```

## Pattern: unique identifiers for "does my row exist" checks

Use `Date.now()` (or a shared per-test suffix) in subjects/emails/names so
`getByRole("cell", { name: uniqueValue, exact: true })` or
`getByRole("row").filter({ hasText: uniqueValue })` can't collide with rows
created by other concurrently-running spec files. This is already the
convention in `users.spec.ts` (`e2e-create-${Date.now()}@example.com`) — the
same approach was extended to `e2e/tickets.spec.ts` for ticket subjects and
sender emails created via the inbound-email webhook.

Related: [[auth-test-patterns]], [[e2e-infrastructure]]
