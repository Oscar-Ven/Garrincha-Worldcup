import { hasDatabaseConfig } from "@/lib/app-mode";
import { type Locale, t } from "@/lib/translations";

export function DataModeNotice({ locale }: { locale: Locale }) {
  if (hasDatabaseConfig()) return null;

  return (
    <div className="chip chip-info" style={{ marginBottom: 14, display: "flex", borderRadius: 11 }}>
      <span>👁</span>
      <span>{t(locale, "preview.notice")}</span>
    </div>
  );
}
