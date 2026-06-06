import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/lib/translations";

export const getLocale = cache(async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("garrincha_locale")?.value;
  return isLocale(value) ? value : defaultLocale;
});
