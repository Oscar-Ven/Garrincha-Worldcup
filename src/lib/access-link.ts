import "server-only";

import { generateAccessToken } from "@/lib/auth";
import { buildAccessLinkEmail, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { isLocale, type Locale } from "@/lib/translations";

/**
 * Rotates the access token for a user and sends a new permanent access-link email.
 * Safe to call on every "request new link" action — the previous token is invalidated.
 * Accepts an optional locale so the email is sent in the user's language.
 */
export async function rotateAndSendAccessLink(
  userId: string,
  email: string,
  locale?: Locale,
): Promise<void> {
  const { raw: token, hash: accessTokenHash } = generateAccessToken();
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      accessTokenHash,
      accessTokenCreatedAt: now,
      accessTokenRevokedAt: null,
      lastAccessLinkSentAt: now,
    },
  });

  const accessUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/access?token=${token}`;
  await sendEmail(buildAccessLinkEmail({ email, accessUrl, locale }));
}

/** Reads the garrincha_locale cookie value from a request's Cookie header. */
export function getLocaleFromRequest(request: { cookies: { get: (name: string) => { value: string } | undefined } }): Locale {
  const value = request.cookies.get("garrincha_locale")?.value;
  return isLocale(value) ? value : "en";
}
