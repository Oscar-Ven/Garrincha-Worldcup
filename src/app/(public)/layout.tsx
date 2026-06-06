import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const user = hasDatabaseConfig() ? await getCurrentUser() : null;
  return (
    <div data-locale={locale} data-logged-in={String(!!user)}>
      {/* TODO: site nav */}
      {children}
      {/* TODO: site footer */}
    </div>
  );
}
