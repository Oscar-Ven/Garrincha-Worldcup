import "server-only";
import crypto from "crypto";
import { isPlaceholderValue } from "@/lib/app-mode";
import { defaultLocale, t, type Locale } from "@/lib/translations";

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

function generateUnsubToken(userId: string): string {
  const secret = process.env.JWT_SECRET ?? "garrincha-unsub-fallback";
  return crypto
    .createHmac("sha256", secret)
    .update(`unsub:${userId}`)
    .digest("base64url");
}

function buildUnsubUrl(userId: string): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://worldcup.garrincha.be";
  const tok = generateUnsubToken(userId);
  return `${appUrl}/api/unsubscribe?uid=${encodeURIComponent(userId)}&tok=${tok}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccessLinkEmailPayload {
  to: string;
  displayName: string;
  centerName: string;
  accessUrl: string;
  locale?: Locale;
  userId?: string;
}

// ---------------------------------------------------------------------------
// Provider status
// ---------------------------------------------------------------------------

export function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  return Boolean(
    apiKey && from && !isPlaceholderValue(apiKey) && !isPlaceholderValue(from),
  );
}

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

export function buildEmailContent(payload: AccessLinkEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    displayName,
    centerName,
    accessUrl,
    locale = defaultLocale,
    userId,
  } = payload;
  const safeName = escapeHtml(displayName);
  const safeCenter = escapeHtml(centerName);
  const safeUrl = escapeHtml(accessUrl);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://worldcup.garrincha.be";
  const logoUrl = `${appUrl}/branding/garrincha-black.png`;
  const unsubUrl = userId
    ? escapeHtml(buildUnsubUrl(userId))
    : `${appUrl}/api/unsubscribe`;

  const subject = t(locale, "email.subject", { center: safeCenter });
  const greeting = t(locale, "email.greeting", { name: safeName });
  const welcome = t(locale, "email.welcome");
  const accountReady = t(locale, "email.accountReady", { center: safeCenter });
  const neverExpires = t(locale, "email.neverExpires");
  const buttonText = t(locale, "email.button");
  const copyPaste = t(locale, "email.copyPaste");
  const keepPrivate = t(locale, "email.keepPrivate");
  const ignore = t(locale, "email.ignore");

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">

          <!-- Logo header -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px 28px;border-bottom:1px solid #e5e7eb;">
              <img
                src="${logoUrl}"
                alt="Garrincha"
                width="140"
                height="auto"
                style="display:block;border:0;"
              />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 20px;font-size:16px;color:#111111;font-weight:600;line-height:1.4;">
                ${greeting}
              </p>

              <p style="margin:0 0 12px;font-size:15px;color:#333333;line-height:1.7;">
                ${welcome}
              </p>

              <p style="margin:0 0 36px;font-size:15px;color:#333333;line-height:1.7;">
                ${accountReady}
              </p>

              <!-- CTA button — centered, black bg, white text -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a
                      href="${safeUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display:inline-block;padding:16px 44px;background:#111111;color:#ffffff;
                             font-size:16px;font-weight:700;text-decoration:none;border-radius:6px;
                             letter-spacing:0.01em;font-family:Arial,sans-serif;"
                    >
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;text-align:center;">
                ${neverExpires}
              </p>

              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;text-align:center;">
                ${copyPaste}
              </p>
              <p style="margin:0 0 32px;font-size:13px;text-align:center;">
                <a href="${safeUrl}" style="color:#111111;word-break:break-all;">${safeUrl}</a>
              </p>

              <hr style="margin:0 0 24px;border:none;border-top:1px solid #e5e7eb;" />

              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
                <strong style="color:#555555;">${keepPrivate}</strong>
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                ${ignore}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">
                <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer"
                   style="color:#6b7280;text-decoration:none;">www.garrincha.be</a>
                &nbsp;&middot;&nbsp;
                <a href="${unsubUrl}" style="color:#6b7280;text-decoration:none;">Unsubscribe</a>
              </p>
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                &copy; 2026 Garrincha. All rights reserved.
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
    greeting,
    "",
    welcome,
    accountReady,
    "",
    `${buttonText}:`,
    accessUrl,
    "",
    neverExpires,
    "",
    keepPrivate,
    "",
    ignore,
    "",
    "---",
    "www.garrincha.be",
    `Unsubscribe: ${userId ? buildUnsubUrl(userId) : `${appUrl}/api/unsubscribe`}`,
    "© 2026 Garrincha. All rights reserved.",
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
  locale?: Locale;
  userId?: string;
}): AccessLinkEmailPayload {
  return {
    to: opts.email,
    displayName: opts.displayName ?? opts.fullName ?? "Garrincha player",
    centerName: opts.centerName ?? "GARRINCHA World Cup",
    accessUrl: opts.accessUrl,
    locale: opts.locale,
    userId: opts.userId,
  };
}

/** Alias kept for call sites that imported sendEmail directly. */
export async function sendEmail(payload: AccessLinkEmailPayload): Promise<void> {
  return sendAccessLinkEmail(payload);
}

// ---------------------------------------------------------------------------
// Send (Resend provider)
// ---------------------------------------------------------------------------

export async function sendAccessLinkEmail(
  payload: AccessLinkEmailPayload,
): Promise<void> {
  const { to } = payload;
  const { subject, html, text } = buildEmailContent(payload);

  const from = process.env.EMAIL_FROM?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!isEmailConfigured() || !from || !apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[email] Email NOT sent — RESEND_API_KEY or EMAIL_FROM is not configured.",
        { to, subject },
      );
    } else {
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
    signal: AbortSignal.timeout(10_000),
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

// ---------------------------------------------------------------------------
// Unsubscribe token verification (used by /api/unsubscribe)
// ---------------------------------------------------------------------------

export function verifyUnsubToken(userId: string, tok: string): boolean {
  const expected = generateUnsubToken(userId);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(tok, "base64url"),
      Buffer.from(expected, "base64url"),
    );
  } catch {
    return false;
  }
}
