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
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://www.garrincha.be",
      "font-src 'self' https://fonts.gstatic.com",
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

  // Suppress Sentry build output unless CI is explicitly set.
  silent: !process.env.CI,

  // Only upload source maps when SENTRY_AUTH_TOKEN is present.
  // Without a token the upload would fail and potentially break the build.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Remove Sentry debug logging from production bundles to reduce bundle size.
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },

  // Tunnel Sentry requests through the app to avoid ad-blocker interference.
  tunnelRoute: "/monitoring",
});
