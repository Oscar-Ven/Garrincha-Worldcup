import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";

export default async function Page() {
  const locale = await getLocale();
  redirect(`/${locale}/leaderboards`);
}
