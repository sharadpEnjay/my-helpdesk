import * as Sentry from "@sentry/bun";

// Initialize Sentry as early as possible — this file is imported at the very
// top of index.ts, before any other module, so auto-instrumentation can hook in.
// When SENTRY_DSN is unset (e.g. local dev), the SDK is disabled and this is a no-op.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",

  // Performance monitoring. Tune down in production if volume is high.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Send structured logs (console.error etc.) to Sentry.
  enableLogs: true,
});
