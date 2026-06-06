import { Suspense } from "react";
import { getLocale } from "@/lib/i18n";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export const metadata = { title: "Request access link — GARRINCHA World Cup 2026" };

export default async function LoginPage() {
  const locale = await getLocale();
  const isPreview = !hasDatabaseConfig();

  return (
    <main data-locale={locale}>
      <p>TODO: player login{isPreview ? " (preview)" : ""}</p>
      <Suspense>{/* TODO: login form */}</Suspense>
    </main>
  );
}
