import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/translations";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) redirect("/en");

  return (
    <>
      <Navbar locale={locale as Locale} />
      <main>{children}</main>
      <Footer locale={locale as Locale} />
    </>
  );
}
