import * as Sentry from "@sentry/react";

// When VITE_SENTRY_DSN is unset (e.g. local dev), the SDK is disabled and this is a no-op.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // Performance monitoring — only propagate traces to our own API.
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  tracePropagationTargets: [/^\/api/],

  // Session Replay: sample a fraction of sessions, but always on error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
