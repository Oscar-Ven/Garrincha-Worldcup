"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Locale } from "@/lib/translations";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "nl", label: "NL" },
  { code: "fr", label: "FR" },
];

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    // Replace the locale segment at the start of the path
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          className={`px-2 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
            l.code === locale
              ? "text-lime-400 border-b border-lime-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
