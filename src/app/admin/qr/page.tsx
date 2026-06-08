import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QrCode, Copy, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://worldcup-garrincha.com";

export default async function AdminQrLinksPage() {
  const admin = await getCurrentUser();
  if (!admin) redirect("/admin/login");

  const isOwner = admin.role === "SUPER_ADMIN" || admin.role === "ADMIN";
  if (!isOwner) redirect("/admin");

  const centers = await prisma.garrinchaCenter.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });

  const defaultUrl = `${BASE_URL}/en/register?source=qr`;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <QrCode className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">QR Registration Links</h1>
        </div>
        <p className="text-sm text-gray-500">
          Copy these URLs to generate QR codes for your printed posters at each center.
          Players scan the code to register and start predicting.
        </p>
      </div>

      {/* Poster copy text */}
      <div className="bg-green-50 border border-green-200 p-5 space-y-2">
        <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">Suggested poster text</p>
        <p className="text-sm font-bold text-green-900">
          "Scan to register and predict World Cup matches. Add GARRINCHA to your home screen after registration."
        </p>
        <p className="text-xs text-green-700 font-medium">Short version: "Scan. Register. Predict. Win points."</p>
      </div>

      {/* Default global link */}
      <div className="bg-white border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Default Registration Link (all centers)
        </h2>
        <QrLinkRow label="All GARRINCHA Centers" url={defaultUrl} />
      </div>

      {/* Center-specific links */}
      <div className="bg-white border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Center-Specific Registration Links
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          These links pre-select the center in the registration form, so players don't have to choose.
        </p>

        <div className="space-y-3">
          {centers.map((center) => {
            const url = `${BASE_URL}/en/register?source=qr&center=${center.id}`;
            const label = center.name.replace("GARRINCHA ", "");
            return (
              <QrLinkRow
                key={center.id}
                label={`${label} — ${center.city}`}
                url={url}
              />
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 p-5 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-700">How to create a QR code from these URLs:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-500">
          <li>Copy the URL above using the "Copy" button.</li>
          <li>Paste it into a free QR code generator (e.g. qr.io, goqr.me, or Google Workspace).</li>
          <li>Download the QR code as a high-resolution PNG.</li>
          <li>Add it to your center poster alongside the suggested text above.</li>
        </ol>
      </div>
    </div>
  );
}

function QrLinkRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-gray-200 bg-gray-50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
        <p className="text-xs font-mono text-gray-500 break-all">{url}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium transition-colors"
          title="Open link"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Preview
        </a>
        <CopyButton url={url} />
      </div>
    </div>
  );
}

// Client component is declared separately so the server page stays clean
import CopyButton from "./CopyButton";
