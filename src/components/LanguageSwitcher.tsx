"use client";

import { localeNames, type Locale } from "@/lib/translations";

export function LanguageSwitcher({ locale, dark = true }: { locale: Locale; dark?: boolean }) {
  async function switchLocale(nextLocale: Locale) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    window.location.reload();
  }

  return (
    <div
      className="lang-switch"
      aria-label="Language selector"
      style={!dark ? { background: "rgba(0,0,0,0.06)" } : undefined}
    >
      {(["en", "nl", "fr"] as const).map((item) => (
        <button
          key={item}
          type="button"
          className={locale === item ? "active" : ""}
          onClick={() => switchLocale(item)}
          title={localeNames[item]}
          aria-pressed={locale === item}
          style={!dark && locale !== item ? { color: "#555" } : undefined}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
