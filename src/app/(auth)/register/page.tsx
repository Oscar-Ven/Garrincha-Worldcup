import { getLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { demoCenters, hasDatabaseConfig } from "@/lib/ui-demo-data";

export const metadata = { title: "Register — GARRINCHA World Cup 2026" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const activationCode = params.code ?? params.session ?? null;

  const centers = hasDatabaseConfig()
    ? await prisma.garrinchaCenter
        .findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
        .catch(() => demoCenters)
    : demoCenters;

  return (
    <main data-locale={locale}>
      <p>TODO: register page — {centers.length} centers{activationCode ? ` (code: ${activationCode})` : ""}</p>
    </main>
  );
}
