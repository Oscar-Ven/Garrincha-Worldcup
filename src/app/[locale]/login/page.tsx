import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/translations";
import RequestLinkForm from "@/components/public/RequestLinkForm";

export function generateMetadata() {
  return { title: "Login — GARRINCHA World Cup" };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: lp } = await params;
  if (!isLocale(lp)) redirect("/en/login");
  const locale = lp as Locale;

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-md mx-auto px-6">
        <div className="mb-10">
          <p className="text-lime-400 font-bold uppercase tracking-[0.15em] text-xs mb-3">
            GARRINCHA World Cup 2026
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
            Login
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Enter your email and we&apos;ll send you a secure login link — no password needed.
          </p>
        </div>

        <RequestLinkForm />

        <p className="mt-8 text-center text-zinc-600 text-sm">
          Not registered yet?{" "}
          <a
            href={`/${locale}/register`}
            className="text-zinc-400 hover:text-lime-400 underline underline-offset-4 transition-colors"
          >
            Join the competition
          </a>
        </p>
      </div>
    </div>
  );
}
