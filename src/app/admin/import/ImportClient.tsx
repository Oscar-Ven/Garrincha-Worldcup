"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types (mirror player-import.ts — kept local to avoid server-only imports)
// ---------------------------------------------------------------------------

type EmailStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped_existing"
  | "skipped_duplicate"
  | "skipped_invalid"
  | "skipped_unsubscribed";

interface CenterAssignment {
  email: string;
  centerName: string;
}

interface DryRunReport {
  filePath: string;
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
  newAccountCount: number;
  existingAccountCount: number;
  excelDuplicateCount: number;
  missingPhoneCount: number;
  zuidCount: number;
  noordCount: number;
  centerAssignments: CenterAssignment[];
  newEmails: string[];
  existingEmails: string[];
  excelDuplicateEmails: string[];
  invalidRows: Array<{
    rowIndex: number;
    email: string;
    fullName: string;
    errors: string[];
    warnings: string[];
  }>;
  criticalErrors: string[];
  emailConfigured: boolean;
}

interface ImportedPlayer {
  email: string;
  fullName: string;
  userId: string;
  nickname: string;
  centerName: string;
  emailStatus: EmailStatus;
  emailError?: string;
}

interface ImportReport {
  dryRun: DryRunReport;
  accountsCreated: number;
  accountsSkippedExisting: number;
  accountsFailedCreate: number;
  emailsSent: number;
  emailsFailed: number;
  emailsSkippedExisting: number;
  emailsSkippedUnsubscribed: number;
  players: ImportedPlayer[];
  errors: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(s: EmailStatus): string {
  switch (s) {
    case "sent": return "#16a34a";
    case "failed": return "#dc2626";
    case "skipped_existing":
    case "skipped_unsubscribed":
    case "skipped_duplicate":
    case "skipped_invalid":
      return "#6b7280";
    default: return "#6b7280";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportClient() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function handleImport() {
    setLoading(true);
    setReport(null);
    setFetchError(null);

    try {
      const res = await fetch("/api/admin/import/antwerpen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setFetchError(body.error ?? `HTTP ${res.status}`);
        return;
      }

      setReport(await res.json() as ImportReport);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const dr = report?.dryRun;
  const hasCritical = (dr?.criticalErrors?.length ?? 0) > 0;

  return (
    <div style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.4rem" }}>
        Import Antwerpen Players
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Reads <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>data/import/antwerpen.xls</code>.
        Runs a dry-run first, then automatically creates new player accounts and sends invitation
        emails. Existing players are skipped. Import is idempotent — safe to re-run.
      </p>

      <button
        onClick={handleImport}
        disabled={loading}
        style={{
          padding: "12px 32px",
          background: loading ? "#9ca3af" : "#111111",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "2rem",
          display: "block",
        }}
      >
        {loading ? "Importing… (this may take a minute)" : "Run Import"}
      </button>

      {/* Fetch-level error */}
      {fetchError && (
        <div style={alertBox("error")}>
          <strong>Error:</strong> {fetchError}
        </div>
      )}

      {report && (
        <>
          {/* Critical errors — import was blocked */}
          {hasCritical && (
            <div style={alertBox("error")}>
              <strong>Critical errors — import was not executed:</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {dr!.criticalErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Summary table */}
          <div style={card}>
            <h2 style={sectionHead}>Import Report</h2>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.875rem" }}>
              <tbody>
                {[
                  ["File path", dr?.filePath ?? "—"],
                  ["Total rows in file", dr?.totalRows ?? 0],
                  ["Valid rows", dr?.validRowCount ?? 0],
                  ["Invalid rows (skipped)", dr?.invalidRowCount ?? 0],
                  ["New accounts to create", dr?.newAccountCount ?? 0],
                  ["New accounts created", report.accountsCreated],
                  ["Existing accounts skipped", report.accountsSkippedExisting],
                  ["Accounts failed to create", report.accountsFailedCreate],
                  ["Duplicate emails in file (skipped)", dr?.excelDuplicateCount ?? 0],
                  ["Missing phone numbers", dr?.missingPhoneCount ?? 0],
                  ["Missing phone — allowed", "Yes (optional field)"],
                  ["Garrincha Antwerpen Zuid assigned", dr?.zuidCount ?? 0],
                  ["Garrincha Antwerpen Noord assigned", dr?.noordCount ?? 0],
                  ["Emails sent", report.emailsSent],
                  ["Emails failed", report.emailsFailed],
                  ["Emails skipped (existing accounts)", report.emailsSkippedExisting],
                  ["Emails skipped (unsubscribed)", report.emailsSkippedUnsubscribed],
                  ["Email sender configured", dr?.emailConfigured ? "Yes" : "No — check RESEND_API_KEY"],
                ].map(([label, value]) => (
                  <tr key={String(label)} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "6px 0", color: "#374151", fontWeight: 500, width: "55%" }}>{label}</td>
                    <td style={{ padding: "6px 0 6px 1rem", color: "#111111" }}>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Processed players */}
          {report.players.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={sectionHead}>Processed Players ({report.players.length})</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.8rem", minWidth: "640px" }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      {["Email", "Full name", "Nickname", "Center", "Email status"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.players.map((p, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        <td style={cell}>{p.email}</td>
                        <td style={cell}>{p.fullName}</td>
                        <td style={cell}>{p.nickname || "—"}</td>
                        <td style={cell}>{p.centerName}</td>
                        <td style={cell}>
                          <span style={{ color: statusColor(p.emailStatus), fontWeight: 600 }}>
                            {p.emailStatus}
                          </span>
                          {p.emailError && (
                            <span style={{ display: "block", color: "#9ca3af", fontSize: "0.7rem", marginTop: "2px" }}>
                              {p.emailError}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invalid rows */}
          {(dr?.invalidRows?.length ?? 0) > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={sectionHead}>Invalid Rows Skipped ({dr!.invalidRows.length})</h2>
              <ul style={{ fontSize: "0.8rem", paddingLeft: "1.25rem", color: "#374151" }}>
                {dr!.invalidRows.map((r) => (
                  <li key={r.rowIndex} style={{ marginBottom: "4px" }}>
                    Row {r.rowIndex}: <strong>{r.fullName || "(no name)"}</strong>{" "}
                    / {r.email || "(no email)"} — {r.errors.join("; ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duplicate emails in file */}
          {(dr?.excelDuplicateEmails?.length ?? 0) > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={sectionHead}>Duplicate Emails in File (2nd+ occurrence skipped)</h2>
              <ul style={{ fontSize: "0.8rem", paddingLeft: "1.25rem", color: "#374151" }}>
                {dr!.excelDuplicateEmails.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Run-time errors */}
          {report.errors.length > 0 && (
            <div style={alertBox("warn")}>
              <strong>Runtime errors:</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {report.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline style helpers
// ---------------------------------------------------------------------------

function alertBox(type: "error" | "warn"): React.CSSProperties {
  const isError = type === "error";
  return {
    background: isError ? "#fef2f2" : "#fffbeb",
    border: `1px solid ${isError ? "#fecaca" : "#fde68a"}`,
    borderRadius: "6px",
    padding: "1rem",
    marginBottom: "1.5rem",
    color: isError ? "#7f1d1d" : "#78350f",
    fontSize: "0.875rem",
  };
}

const card: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "1.25rem",
  marginBottom: "1.5rem",
};

const sectionHead: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  marginBottom: "0.75rem",
  marginTop: 0,
};

const cell: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #e5e7eb",
  verticalAlign: "top",
};
