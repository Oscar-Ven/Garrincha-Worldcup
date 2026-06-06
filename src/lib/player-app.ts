import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";

export async function requirePlayerContext() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "CENTER_ADMIN") {
    redirect("/admin");
  }

  if (user.role !== "USER") {
    redirect("/");
  }

  return { user, locale };
}