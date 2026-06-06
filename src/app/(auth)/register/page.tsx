import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const locale = await getLocale();
  const { code } = await searchParams;
  const dest = code ? `/${locale}/register?code=${code}` : `/${locale}/register`;
  redirect(dest);
}
