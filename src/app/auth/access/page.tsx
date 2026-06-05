import Link from "next/link";
import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/app-mode";
import { hashToken } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { Role } from "@prisma/client";

function AccessErrorPage({
  title,
  body,
  linkLabel,
}: {
  title: string;
  body: string;
  linkLabel: string;
}) {
  return (
    <div className="auth-page">
      <div className="auth-error-card">
        {/* Error icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#ffffff",
            border: "1.5px solid #dddddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" stroke="#111111" strokeWidth="2" />
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="12"
              stroke="#111111"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16" r="1" fill="#111111" />
          </svg>
        </div>

        <h2
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontStyle: "normal",
            fontWeight: 800,
            fontSize: "1.4rem",
            color: "var(--green-deep)",
            lineHeight: 1.15,
            marginBottom: 10,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-3)",
            lineHeight: 1.55,
            maxWidth: 300,
            marginBottom: 24,
          }}
        >
          {body}
        </p>

        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.65rem 1.5rem",
            background: "#111111",
            color: "#FFFFFF",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
          }}
        >
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const locale = await getLocale();
  const { token } = await searchParams;

  if (!token) {
    return (
      <AccessErrorPage
        title={t(locale, "auth.accessLinkInvalid")}
        body={t(locale, "auth.accessLinkMissing")}
        linkLabel={t(locale, "auth.requestNewLink")}
      />
    );
  }

  if (isPreviewMode()) {
    return (
      <AccessErrorPage
        title={t(locale, "auth.accessLinkInvalid")}
        body={t(locale, "auth.accessPreviewCopy")}
        linkLabel={t(locale, "auth.requestNewLink")}
      />
    );
  }

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { accessTokenHash: tokenHash, accessTokenRevokedAt: null, role: Role.USER },
    select: { id: true, role: true },
  });

  if (!user) {
    return (
      <AccessErrorPage
        title={t(locale, "auth.accessLinkInvalid")}
        body={t(locale, "auth.accessLinkRevoked")}
        linkLabel={t(locale, "auth.requestNewLink")}
      />
    );
  }

  // Next.js 15: cookies().set() is only allowed in Route Handlers / Server Actions,
  // NOT in Server Component pages. Redirect to the API route which handles the
  // session cookie correctly and then redirects to /dashboard.
  redirect(`/api/auth/access?token=${encodeURIComponent(token)}`);
}
