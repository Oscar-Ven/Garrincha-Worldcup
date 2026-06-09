import { redirect } from "next/navigation";
import { isLocale, type Locale, t } from "@/lib/translations";
import { isPreviewMode } from "@/lib/app-mode";
import { demoCenters } from "@/lib/ui-demo-data";
import RegisterForm from "./RegisterForm";
import PrizeCards from "@/components/public/PrizeCards";

async function getCenters() {
  if (isPreviewMode()) {
    return demoCenters.map((c) => ({ id: c.id, name: c.name, city: c.city }));
  }
  const { prisma } = await import("@/lib/prisma");
  return prisma.garrinchaCenter.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; source?: string; center?: string }>;
}) {
  const { locale: lp } = await params;
  if (!isLocale(lp)) redirect("/en");
  const locale = lp as Locale;

  const { code, source, center: centerParam } = await searchParams;
  const fromQr = source === "qr";
  const centers = await getCenters();

  // Match center by ID (safe fallback to "" if not found or invalid)
  const matchedCenter = centerParam
    ? centers.find((c) => c.id === centerParam)
    : undefined;
  const initialCenterId = matchedCenter?.id ?? "";

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-lime-400 font-bold uppercase tracking-[0.15em] text-xs mb-3">
            {t(locale, "register.eyebrow")}
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
            {t(locale, "auth.registerTitle")}
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-md">
            {t(locale, "auth.registerCopy")}
          </p>
          <div className="flex items-center gap-4 mt-6 text-xs text-zinc-500 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-lime-400/20 border border-lime-400/50 flex items-center justify-center text-lime-400 font-bold text-[10px]">
                1
              </span>
              {t(locale, "auth.step1")}
            </span>
            <span className="text-zinc-700">—</span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-lime-400 border border-lime-400 flex items-center justify-center text-zinc-950 font-bold text-[10px]">
                2
              </span>
              {t(locale, "auth.step2")}
            </span>
            <span className="text-zinc-700">—</span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 font-bold text-[10px]">
                3
              </span>
              {t(locale, "auth.step3")}
            </span>
          </div>
        </div>

        <div className="mb-10">
          <PrizeCards preview prizesHref={`/${locale}/prizes`} />
        </div>

        <RegisterForm
          locale={locale}
          centers={centers}
          activationCode={code}
          initialCenterId={initialCenterId}
          fromQr={fromQr}
        />

        <p className="mt-8 text-center text-zinc-600 text-sm">
          {t(locale, "auth.already")}{" "}
          <a
            href={`/${locale}/login`}
            className="text-zinc-400 hover:text-lime-400 underline underline-offset-4 transition-colors"
          >
            {t(locale, "auth.requestLink")}
          </a>
        </p>
      </div>
    </div>
  );
}
