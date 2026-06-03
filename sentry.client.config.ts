import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of transactions for performance monitoring.
  // Raise this in production once the baseline is established.
  tracesSampleRate: 0.1,

  // Only enable in production to avoid noise during development.
  enabled: process.env.NODE_ENV === "production",

  // Do not send PII — no user emails in error reports.
  sendDefaultPii: false,
});
