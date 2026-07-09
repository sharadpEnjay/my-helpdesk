---
name: project-e2e-ticket-lifecycle
description: How tickets get into the e2e test DB (webhook-only, no seed-tickets.ts) and the ticket detail page's structure/API contract
metadata:
  type: project
---

The e2e test DB (`my-helpdesk-test`) starts **empty of tickets** on every run
— `e2e/global-setup.ts` only seeds the admin user and one agent user
(`agent-e2e@example.com` / `agent@123`, role `agent`). `server/prisma/seed-tickets.ts`
(a 100-ticket dev-seed script) is a separate script that is **not** invoked
by global setup, so don't assume any tickets pre-exist — every ticket-detail
or ticket-list spec must create its own ticket via the inbound-email webhook
first (see `createTicketViaWebhook` helper pattern already in
`e2e/tickets.spec.ts` / `e2e/webhooks.spec.ts`, reused in
`e2e/ticket-detail.spec.ts`).

Ticket detail page (`/tickets/:id`, `client/src/pages/TicketDetailPage.tsx`)
composition, useful for future spec updates:
- `TicketDetail.tsx` — subject as `<h1>` (role heading), `#<id>`, sender
  name/email, body text (plain `whitespace-pre-wrap` or `bodyHtml` via
  `dangerouslySetInnerHTML` if present).
- `ReplyThread.tsx` — GET/POST `/api/tickets/:id/replies`. Reply cards show
  a text badge "Agent" or "Customer" (`reply.senderType`), purple styling
  for agent. Form always submits `senderType: "agent"` (hardcoded default,
  not user-selectable in the UI) via `Textarea` placeholder "Type your
  reply..." + button "Send Reply"; form resets (textarea clears) on success.
- `UpdateTicket.tsx` — PATCH `/api/tickets/:id`, three `FieldSelect`
  comboboxes (Status/Category/Assigned To) — see
  [[project-e2e-select-labels]] for the aria-label fix needed to select
  them by role. `/api/users/agents` (returns ALL non-deleted users, not
  just role=agent, ordered by name) backs the Assigned To options — seeded
  users appear as "Admin" and "E2E Agent".
- `BackButton.tsx` — plain `Link` styled as ghost button, `getByRole("link",
  { name: "Back to tickets" })` navigates to `/tickets`.

GET `/api/tickets` (list endpoint) returns a paginated shape
`{ data, total, page, pageSize }` as of 2026-07-09 (server/routes/tickets.ts
was mid-refactor, uncommitted) — `e2e/webhooks.spec.ts`'s
"strips Re:/Fwd: prefixes" test still does `tickets.find(...)` on the raw
array and is currently broken (`tickets.find is not a function`) as a result.
This is a pre-existing bug unrelated to ticket-detail work, not something the
e2e-test-writer introduced — worth fixing (change to
`(await ticketsResponse.json()).data.find(...)`) next time that spec is
touched.

See also [[project-e2e-setup]].
