import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  isLocale,
  localeNames,
  t,
  translations,
  type Locale,
} from "@/lib/translations";

describe("locale detection (isLocale)", () => {
  it("accepts supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("nl")).toBe(true);
    expect(isLocale("fr")).toBe(true);
  });

  it("rejects unsupported and empty values", () => {
    expect(isLocale("de")).toBe(false);
    expect(isLocale("es")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("is case-sensitive — uppercase rejected", () => {
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("FR")).toBe(false);
  });
});

describe("locale names", () => {
  it("has a human-readable name for every locale", () => {
    expect(localeNames.en).toBe("English");
    expect(localeNames.nl).toBe("Nederlands");
    expect(localeNames.fr).toBe("Français");
  });
});

describe("default locale", () => {
  it("is English", () => {
    expect(defaultLocale).toBe("en");
  });
});

describe("translation function t()", () => {
  it("returns the translated string for a valid key", () => {
    expect(t("en", "nav.login")).toBe("Log in");
    expect(t("nl", "nav.login")).toBe("Inloggen");
    expect(t("fr", "nav.login")).toBe("Se connecter");
  });

  it("falls back to English when a key is missing in the target locale", () => {
    // French locale must always fall back to EN, never to the raw key
    expect(t("fr", "nav.login")).not.toBe("nav.login");
  });

  it("returns the raw key when the key is missing in all locales", () => {
    expect(t("en", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("substitutes {variable} placeholders", () => {
    expect(t("en", "dashboard.activationNotice", { center: "Gent" })).toContain("Gent");
    expect(t("fr", "dashboard.representing", { center: "Bruxelles" })).toContain("Bruxelles");
    expect(t("nl", "competition.activationNote", { center: "Kortrijk" })).toContain("Kortrijk");
  });
});

describe("French translations completeness", () => {
  const enKeys = Object.keys(translations.en);
  const frKeys = Object.keys(translations.fr);

  it("French has the same number of keys as English", () => {
    expect(frKeys.length).toBe(enKeys.length);
  });

  it("French has all keys that English has", () => {
    const missing = enKeys.filter((k) => !(k in translations.fr));
    expect(missing).toEqual([]);
  });

  it("no French translation is identical to its key (i.e. not a raw key fallback)", () => {
    const rawKeys = frKeys.filter((k) => translations.fr[k] === k);
    expect(rawKeys).toEqual([]);
  });
});

describe("Dutch translations completeness", () => {
  const enKeys = Object.keys(translations.en);
  const nlKeys = Object.keys(translations.nl);

  it("Dutch has the same number of keys as English", () => {
    expect(nlKeys.length).toBe(enKeys.length);
  });

  it("Dutch has all keys that English has", () => {
    const missing = enKeys.filter((k) => !(k in translations.nl));
    expect(missing).toEqual([]);
  });
});

describe("key translation samples — French", () => {
  const checks: Array<[string, string]> = [
    ["auth.registerFree", "Inscription gratuite"],
    ["auth.accessLinkSent", "il n'expire jamais"],
    ["competition.title", "centre représenté"],
    ["competition.choose", "Représenter ce center"],
    ["dashboard.lockNotice", "5 minutes avant le coup d'envoi"],
    ["admin.healthTitle", "Tableau de santé du système"],
    ["prediction.lockNotice", "5 min avant le coup d'envoi"],
    ["nav.home", "Accueil"],
    ["nav.predict", "Pronostiquer"],
    ["nav.rankings", "Classements"],
  ];

  for (const [key, expected] of checks) {
    it(`fr.${key} contains "${expected}"`, () => {
      expect(t("fr", key)).toContain(expected);
    });
  }
});

describe("access link copy (no-expiry guarantee)", () => {
  const locales: Locale[] = ["en", "nl", "fr"];
  const expiredPatterns = ["expires shortly", "single-use", "temporary link", "verloopt binnenkort", "expire bientôt"];

  for (const locale of locales) {
    it(`[${locale}] auth.accessLinkSent does not contain expiry language`, () => {
      const text = t(locale, "auth.accessLinkSent").toLowerCase();
      for (const pattern of expiredPatterns) {
        expect(text).not.toContain(pattern);
      }
    });
  }
});
