---
name: e2e-infrastructure
description: E2E test infrastructure facts — available packages, ports, config locations
metadata:
  type: project
---

## Available packages in root devDependencies

- `pg` + `@types/pg` — available to e2e tests for direct DB access
- `@playwright/test` — test runner

## Port assignments

- Test server (Express): 3002
- Test client (Vite):    5174
- Dev server:            3001 / 5173

## Test DB

- Name: `my-helpdesk-test`
- URL constant: `TEST_DB_URL` from `e2e/test-config.ts`
- Recreated fresh on every global-setup run (DROP + CREATE + migrate + seed)
- Global teardown is a no-op — DB is preserved for inspection after tests

## Global setup seeds

- Admin user: email `admin@example.com` (or `ADMIN_EMAIL` env), password `admin@123` (or `ADMIN_PASSWORD` env), role `admin`, name `Admin`
- No other users are seeded; non-admin tests must create users directly via pg

## Import patterns used in e2e/

```typescript
import pg from "pg";                           // pg default import
import { TEST_DB_URL } from "./test-config.ts"; // .ts extension required (allowImportingTsExtensions)
```

## Vite proxy

In test mode, the client (`localhost:5174`) proxies `/api` to `localhost:3002`.
`page.request.post("/api/auth/...")` routes through this proxy automatically
because baseURL is `http://localhost:5174`.
