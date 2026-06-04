import "server-only";
import { isPlaceholderValue } from "@/lib/app-mode";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccessLinkEmailPayload {
  to: string;
  displayName: string;
  centerName: string;
  accessUrl: string;
}

// ---------------------------------------------------------------------------
// Provider status
// ---------------------------------------------------------------------------

/**
 * Returns true when both RESEND_API_KEY and EMAIL_FROM are set to non-empty
 * values. Use this to surface configuration status in admin dashboards or
 * health checks without exposing the key values themselves.
 */
export function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  return Boolean(apiKey && from && !isPlaceholderValue(apiKey) && !isPlaceholderValue(from));
}

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

/**
 * Builds the subject line, HTML body, and plain-text body for the permanent
 * access-link email. Exported for unit testing; never called outside email.ts
 * and the test suite.
 */
export function buildEmailContent(payload: AccessLinkEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const { displayName, centerName, accessUrl } = payload;
  const safeName = escapeHtml(displayName);
  const safeCenter = escapeHtml(centerName);
  const safeUrl = escapeHtml(accessUrl);

  const subject = `Your GARRINCHA World Cup access link — ${safeCenter}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#08eb9a;padding:24px 32px;">
              <p style="margin:0;color:#252320;font-size:22px;font-weight:bold;font-family:Arial,sans-serif;">
                GARRINCHA® World Cup Pronostiek
              </p>
              <p style="margin:4px 0 0;color:#252320;font-size:14px;">${safeCenter}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hello ${safeName},</p>
              <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
                Welcome to the GARRINCHA World Cup Pronostiek! Below is your personal access link.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                <strong>This link never expires.</strong> Use it anytime with an internet connection
                to access your account and continue predicting match results.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background:#08eb9a;">
                    <a
                      href="${safeUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display:inline-block;padding:14px 32px;color:#252320;font-size:15px;
                             font-weight:700;text-decoration:none;border-radius:6px;"
                    >
                      Access my account →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
                Or copy and paste this link into your browser:<br />
                <span style="color:#1d4ed8;word-break:break-all;">${safeUrl}</span>
              </p>
              <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
                <strong style="color:#374151;">Keep this link private.</strong>
                It gives full access to your account — do not share it publicly or forward this email
                to others.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                If you did not register for this campaign, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hello ${displayName},`,
    "",
    `Welcome to the GARRINCHA World Cup Pronostiek at ${centerName}!`,
    "",
    "Below is your personal access link.",
    "This link never expires — use it anytime with an internet connection to access your account.",
    "",
    accessUrl,
    "",
    "Keep this link private. It gives full access to your account.",
    "Do not share it publicly or forward this email to others.",
    "",
    "If you did not register for this campaign, you can safely ignore this email.",
  ].join("\n");

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Public builders — called by API routes
// ---------------------------------------------------------------------------

export function buildAccessLinkEmail(opts: {
  email: string;
  accessUrl: string;
  displayName?: string;
  fullName?: string;
  centerName?: string;
}): AccessLinkEmailPayload {
  return {
    to: opts.email,
    displayName: opts.displayName ?? opts.fullName ?? "Player",
    centerName: opts.centerName ?? "GARRINCHA World Cup",
    accessUrl: opts.accessUrl,
  };
}

/** Alias kept for call sites that imported sendEmail directly. */
export async function sendEmail(payload: AccessLinkEmailPayload): Promise<void> {
  return sendAccessLinkEmail(payload);
}

// ---------------------------------------------------------------------------
// Send (Resend provider)
// ---------------------------------------------------------------------------

/**
 * Sends a permanent access-link email via Resend when the provider is
 * configured. Falls back to a safe no-provider mode when RESEND_API_KEY or
 * EMAIL_FROM are absent:
 *
 *  - Development / no config: logs `{ to, subject }` to stdout and returns.
 *  - Production / no config:  logs an error-level warning so operators know
 *    emails are not going out, then returns. Does NOT throw — registration
 *    succeeds even without email delivery.
 *
 * The raw access token is never logged, only the `to` address and subject.
 */
export async function sendAccessLinkEmail(
  payload: AccessLinkEmailPayload,
): Promise<void> {
  const { to } = payload;
  const { subject, html, text } = buildEmailContent(payload);

  const from = process.env.EMAIL_FROM?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();

  // No-provider mode: both env vars must be present to send.
  if (!isEmailConfigured() || !from || !apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[email] Email NOT sent — RESEND_API_KEY or EMAIL_FROM is not configured.",
        { to, subject },
      );
    } else {
      // Development: compact summary only — never log the access URL or token.
      console.log("[email:dev]", JSON.stringify({ to, subject }));
    }
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!response.ok) {
    let detail = "(no body)";
    try {
      detail = await response.text();
    } catch {
      // ignore parse failures
    }
    throw new Error(
      `Resend API error ${response.status} ${response.statusText}: ${detail}`,
    );
  }
}
