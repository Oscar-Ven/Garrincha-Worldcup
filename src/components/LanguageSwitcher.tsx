"use client";

import { useRouter } from "next/navigation";
import { localeNames, type Locale } from "@/lib/translations";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  async function switchLocale(nextLocale: Locale) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    router.refresh();
  }

  return (
    <div className="language-switcher" aria-label="Language selector">
      {(["en", "nl"] as const).map((item) => (
        <button
          aria-pressed={locale === item}
          className={locale === item ? "active" : ""}
          key={item}
          onClick={() => switchLocale(item)}
          title={localeNames[item]}
          type="button"
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
