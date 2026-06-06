import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";

export default async function LoginPage() {
  const locale = await getLocale();
  redirect(`/${locale}`);
}
