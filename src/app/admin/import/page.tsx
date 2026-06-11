import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const isOwner = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  if (!isOwner) redirect("/admin");

  return <ImportClient />;
}
