import { hasDatabaseConfig } from "@/lib/ui-demo-data";
import { type Locale, t } from "@/lib/translations";

export function DataModeNotice({ locale }: { locale: Locale }) {
  if (hasDatabaseConfig()) return null;

  return (
    <div className="notice" role="status">
      {t(locale, "preview.notice")}
    </div>
  );
}
