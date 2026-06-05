import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "GARRINCHA Manager Portal",
    template: "%s — GARRINCHA Manager",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div data-portal="admin">{children}</div>;
}
