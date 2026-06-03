import "server-only";

import { cookies } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/lib/translations";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("garrincha_locale")?.value;
  return isLocale(value) ? value : defaultLocale;
}
