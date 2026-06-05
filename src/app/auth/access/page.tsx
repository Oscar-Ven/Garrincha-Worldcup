import Link from "next/link";
import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/app-mode";
import { hashToken, createSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { Role } from "@prisma/client";

function AccessErrorPage({ title, body, linkLabel }: { title: string; body: string; linkLabel: string }) {
  return (
    <div className="auth-page" style={{ alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "min(100dvh, 100vh)" }}>
      <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(255,90,77,0.12)", border: "2px solid rgba(255,90,77,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, marginBottom: 20 }}>🔗</div>
      <h2 className="disp" style={{ fontSize: 28, color: "var(--ink)", marginBottom: 10 }}>{title}</h2>
      <p style={{ fontSize: 14, color: "var(--ink-dim)", lineHeight: 1.5, maxWidth: 280, marginBottom: 24 }}>{body}</p>
      <Link href="/login" className="btn btn-green btn-md btn-auto" style={{ textDecoration: "none", width: "auto", padding: "0 22px" }}>
        {linkLabel}
      </Link>
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

  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}
