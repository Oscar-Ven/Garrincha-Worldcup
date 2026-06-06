import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";

export default async function HomePage() {
  const locale = await getLocale();
  redirect(`/${locale}`);
}
