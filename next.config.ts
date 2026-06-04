import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      // Sentry ingest endpoint for error reporting
      "connect-src 'self' https://*.ingest.de.sentry.io https://*.ingest.sentry.io",
      "frame-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Standalone output bundles the app + Node.js server into .next/standalone/
  // Required for Render Web Service deployment.
  output: "standalone",
  experimental: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry project settings — must match the Sentry project created for this app.
  org: "garrincha-worldcup",
  project: "garrincha-worldcup",

  // Upload source maps to Sentry during production builds.
  // SENTRY_AUTH_TOKEN must be set in the build environment.
  silent: !process.env.CI, // only verbose in CI

  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },

  // Tunnel Sentry requests through the app to avoid ad-blocker interference.
  tunnelRoute: "/monitoring",
});
