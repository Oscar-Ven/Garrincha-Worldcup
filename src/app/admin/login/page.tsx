import { Suspense } from "react";
import { getLocale } from "@/lib/i18n";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminLoginPage() {
  const locale = await getLocale();
  const isPreview = !hasDatabaseConfig();

  return (
    <main data-locale={locale}>
      <p>TODO: admin login{isPreview ? " (preview — DB not configured)" : ""}</p>
      <Suspense>{/* TODO: admin login form */}</Suspense>
    </main>
  );
}
