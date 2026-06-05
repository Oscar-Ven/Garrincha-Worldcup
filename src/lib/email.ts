import "server-only";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccessLinkEmailPayload {
  to: string;
  displayName: string;
  centerName: string;
  accessUrl: string;
  locale?: Locale;
}

// ---------------------------------------------------------------------------
// Provider status
// ---------------------------------------------------------------------------

export function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  return Boolean(apiKey && from && !isPlaceholderValue(apiKey) && !isPlaceholderValue(from));
}

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

export function buildEmailContent(payload: AccessLinkEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const { displayName, centerName, accessUrl, locale = defaultLocale } = payload;
  const safeName = escapeHtml(displayName);
  const safeCenter = escapeHtml(centerName);
  const safeUrl = escapeHtml(accessUrl);

  const subject = t(locale, "email.subject", { center: safeCenter });
  const greeting = t(locale, "email.greeting", { name: safeName });
  const welcome = t(locale, "email.welcome");
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
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px;">
              <p style="margin:0;color:#111111;font-size:22px;font-weight:bold;font-family:Arial,sans-serif;">
                GARRINCHA® World Cup Pronostiek
              </p>
              <p style="margin:4px 0 0;color:#111111;font-size:14px;">${safeCenter}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#111111;">${greeting}</p>
              <p style="margin:0 0 8px;font-size:15px;color:#333333;line-height:1.6;">
                ${welcome}
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
                <strong>${neverExpires}</strong>
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background:#ffffff;">
                    <a
                      href="${safeUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="display:inline-block;padding:14px 32px;color:#111111;font-size:15px;
                             font-weight:700;text-decoration:none;border-radius:6px;"
                    >
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">
                ${copyPaste}<br />
                <span style="color:#111111;word-break:break-all;">${safeUrl}</span>
              </p>
              <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
                <strong style="color:#333333;">${keepPrivate}</strong>
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                ${ignore}
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
    t(locale, "email.greeting", { name: displayName }),
    "",
    `${t(locale, "email.welcome")} ${t(locale, "email.neverExpires")}`,
    "",
    accessUrl,
    "",
    t(locale, "email.keepPrivate"),
    "",
    t(locale, "email.ignore"),
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
}): AccessLinkEmailPayload {
  return {
    to: opts.email,
    displayName: opts.displayName ?? opts.fullName ?? "Player",
    centerName: opts.centerName ?? "GARRINCHA World Cup",
    accessUrl: opts.accessUrl,
    locale: opts.locale,
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

  // 10s hard timeout prevents email send from hanging a serverless function.
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
