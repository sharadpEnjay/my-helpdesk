---
name: project-e2e-select-labels
description: shadcn/Radix Select components in this app often lack a real accessible label - how to detect the gap and the fix used
metadata:
  type: project
---

Several sidebar/form `Select` components in this app render a plain
`<div>{label}</div>` next to the `<Select>` instead of a proper `<Label
htmlFor>` (e.g. `client/src/components/UpdateTicket.tsx`'s `FieldSelect` used
on the ticket detail page for Status/Category/Assigned To). Radix
`SelectTrigger` gets `role="combobox"` for free, but with no
`aria-label`/`aria-labelledby` wired up, `page.getByLabel(...)` and
`page.getByRole("combobox", { name: ... })` cannot find it — the accessible
name computes from `SelectValue`'s currently-selected text, not the field
label.

Contrast with `client/src/components/UpdateTicket.tsx`'s sibling forms (e.g.
the Create/Edit User dialog covered in `e2e/users.spec.ts`), which use React
Hook Form + shadcn `<FormField>`/`<Label htmlFor>` wiring, so
`page.getByLabel("Role").click()` already works there — that pattern is not
universal across the app, verify per-component.

**Fix applied 2026-07-09**: added `aria-label={label}` directly on
`SelectTrigger` inside `FieldSelect` (`client/src/components/UpdateTicket.tsx`)
so tests can do `page.getByRole("combobox", { name: "Status" })`. This is a
one-line, additive, real accessibility improvement (not just a test hook), so
it's in-scope for the e2e-test-writer agent to make directly rather than
resorting to fragile DOM-structure locators (`xpath=..`, `.filter({hasText})`
chains). Prefer this approach again if a future Select/Combobox lacks an
accessible name: add `aria-label` on the trigger rather than reaching for
positional/structural locators.

See also [[project-e2e-setup]], [[project-e2e-api-testing]].
