import Link from "next/link";
import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/app-mode";
import { hashToken, createSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await getLocale();
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="page">
        <div className="auth-shell">
          <section className="auth-panel">
            <span className="eyebrow">Personal access link</span>
            <h1>Link not valid</h1>
            <p>Invalid access link.</p>
            <p>
              <Link href="/login">Request a new access link</Link>
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
            <span className="eyebrow">Personal access link</span>
            <h1>Link not valid</h1>
            <p>
              Access links require a live database. Browse the preview in demo
              mode.
            </p>
            <p>
              <Link href="/login">Request a new access link</Link>
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
            <span className="eyebrow">Personal access link</span>
            <h1>Link not valid</h1>
            <p>
              This access link is invalid or has been revoked. Request a new
              link from the login page.
            </p>
            <p>
              <Link href="/login">Request a new access link</Link>
            </p>
          </section>
        </div>
      </main>
    );
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}
