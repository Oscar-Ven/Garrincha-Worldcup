import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminLayoutClientShell from "@/components/admin/AdminLayoutClientShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // No user — proxy already redirected protected routes; this only fires for /admin/login itself
  if (!user) {
    return <>{children}</>;
  }

  // Ensure role is appropriate (Owner: SUPER_ADMIN/ADMIN, Manager: CENTER_ADMIN)
  const isOwner = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const isManager = user.role === "CENTER_ADMIN";

  if (!isOwner && !isManager) {
    redirect("/"); // Player accounts have no business here
  }

  const serializedUser = {
    email: user.email,
    fullName: user.fullName,
    nickname: user.nickname,
    role: user.role,
    centerName: user.center?.name ?? "No Assigned Center",
    centerId: user.center?.id ?? "",
  };

  return (
    <AdminLayoutClientShell user={serializedUser}>
      {children}
    </AdminLayoutClientShell>
  );
}
