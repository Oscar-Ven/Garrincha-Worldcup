import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/app-mode";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token || isPreviewMode()) { redirect("/login"); }
  redirect(`/api/auth/access?token=${encodeURIComponent(token)}`);
}