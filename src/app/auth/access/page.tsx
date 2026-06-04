import Link from "next/link";
import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/app-mode";
import { hashToken, createSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/translations";
import { Role } from "@prisma/client";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const locale = await getLocale();
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="page">
        <div className="auth-shell">
          <section className="auth-panel">
            <span className="eyebrow">{t(locale, "auth.accessLinkEyebrow")}</span>
            <h1>{t(locale, "auth.accessLinkInvalid")}</h1>
            <p>{t(locale, "auth.accessLinkMissing")}</p>
            <p>
              <Link href="/login">{t(locale, "auth.requestNewLink")}</Link>
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (isPreviewMode()) {
    return (
      <main className="page">
        <div className="auth-shell">
          <section className="auth-panel">
            <span className="eyebrow">{t(locale, "auth.accessLinkEyebrow")}</span>
            <h1>{t(locale, "auth.accessLinkInvalid")}</h1>
            <p>{t(locale, "auth.accessPreviewCopy")}</p>
            <p>
              <Link href="/login">{t(locale, "auth.requestNewLink")}</Link>
            </p>
          </section>
        </div>
      </main>
    );
  }

  const tokenHash = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      accessTokenHash: tokenHash,
      accessTokenRevokedAt: null,
      role: Role.USER,
    },
    select: { id: true, role: true },
  });

  if (!user) {
    return (
      <main className="page">
        <div className="auth-shell">
          <section className="auth-panel">
            <span className="eyebrow">{t(locale, "auth.accessLinkEyebrow")}</span>
            <h1>{t(locale, "auth.accessLinkInvalid")}</h1>
            <p>{t(locale, "auth.accessLinkRevoked")}</p>
            <p>
              <Link href="/login">{t(locale, "auth.requestNewLink")}</Link>
            </p>
          </section>
        </div>
      </main>
    );
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}
