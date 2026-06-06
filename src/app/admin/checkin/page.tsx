import { redirect } from "next/navigation";
import { requireCenterAdmin } from "@/lib/auth";
import { getActiveSession } from "@/lib/checkin";
import { getLocale } from "@/lib/i18n";
import { hasDatabaseConfig } from "@/lib/ui-demo-data";

export default async function AdminCheckInPage() {
  const locale = await getLocale();

  if (!hasDatabaseConfig()) {
    return (
      <main data-locale={locale}>
        <p>TODO: check-in page (preview mode)</p>
      </main>
    );
  }

  let admin;
  try { admin = await requireCenterAdmin(); }
  catch { redirect("/admin/login?next=/admin/checkin"); }

  const session = await getActiveSession(admin.center.id);

  return (
    <main data-locale={locale}>
      <p>TODO: check-in — {admin.center.name} (active session: {session ? session.code : "none"})</p>
    </main>
  );
}
