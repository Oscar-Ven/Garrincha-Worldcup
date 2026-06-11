"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface ImportReport {
  dryRun: DryRunReport;
  accountsCreated: number;
  accountsSkippedExisting: number;
  accountsFailedCreate: number;
  jobsCreated: number;
  errors: string[];
}

interface QueueStatus {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  skipped_unsubscribed: number;
  total: number;
  lastSentAt: string | null;
  throughput?: {
    emailsPerRun: number;
    batchSize: number;
    cronIntervalMinutes: number;
    estimatedMinutesRemaining: number;
  };
}

interface BatchResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportClient() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);

  const [importLoading, setImportLoading] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/import/antwerpen/status");
      if (res.ok) {
        setQueueStatus(await res.json() as QueueStatus);
        setQueueError(null);
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setQueueError(body.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      setQueueError(err instanceof Error ? err.message : "Failed to load queue status");
    }
  }, []);

  // Load queue on mount; auto-refresh every 10 s.
  // Initial fetch is deferred via setTimeout so setState is called inside a callback,
  // not synchronously in the effect body (satisfies @eslint-react/hooks-extra rule).
  useEffect(() => {
    const init = setTimeout(() => void refreshQueue(), 0);
    const poll = setInterval(() => void refreshQueue(), 10_000);
    return () => { clearTimeout(init); clearInterval(poll); };
  }, [refreshQueue]);

  async function handleImport() {
    setImportLoading(true);
    setImportReport(null);
    setImportError(null);

    try {
      let res: Response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        res = await fetch("/api/admin/import/antwerpen", {
          method: "POST",
          body: formData,
          // No Content-Type header — browser sets multipart boundary automatically
        });
      } else {
        res = await fetch("/api/admin/import/antwerpen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setImportError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setImportReport(await res.json() as ImportReport);
      await refreshQueue();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setImportLoading(false);
    }
  }

  async function handleSendBatch() {
    setBatchLoading(true);
    setBatchResult(null);
    setBatchError(null);

    try {
      const res = await fetch("/api/admin/import/antwerpen/send-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setBatchError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      setBatchResult(await res.json() as BatchResult);
      await refreshQueue();
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBatchLoading(false);
    }
  }

  const dr = importReport?.dryRun;
  const hasCritical = (dr?.criticalErrors?.length ?? 0) > 0;
  const hasPending = (queueStatus?.pending ?? 0) > 0;

  return (
    <div style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.4rem" }}>
        Antwerpen Player Import
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        <strong>Step 1 — Run Import:</strong> reads the CSV, creates player accounts, queues invitation jobs.<br />
        <strong>Step 2 — Send emails:</strong> Vercel Cron sends up to 500 invitations every 5 minutes automatically.
        Use <em>Send Next Batch</em> to dispatch immediately.
      </p>

      {/* Queue status */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ ...sectionHead, marginBottom: 0 }}>Invitation Queue</h2>
          <button
            onClick={() => void refreshQueue()}
            style={{ fontSize: "0.75rem", color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
          >
            ↻ Refresh
          </button>
        </div>

        {queueError && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>Status unavailable: {queueError}</p>
        )}

        {queueStatus && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {[
                { label: "Pending", value: queueStatus.pending, color: "#f59e0b" },
                { label: "Processing", value: queueStatus.processing, color: "#3b82f6" },
                { label: "Sent", value: queueStatus.sent, color: "#16a34a" },
                { label: "Failed", value: queueStatus.failed, color: "#dc2626" },
                { label: "Unsubscribed", value: queueStatus.skipped_unsubscribed, color: "#6b7280" },
                { label: "Total", value: queueStatus.total, color: "#111111" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center", padding: "0.5rem", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color }}>{value.toLocaleString()}</div>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "2px" }}>{label}</div>
                </div>
              ))}
            </div>
            {queueStatus.throughput && queueStatus.pending > 0 && (
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0 0 0.35rem" }}>
                Sending ~{queueStatus.throughput.emailsPerRun} emails every {queueStatus.throughput.cronIntervalMinutes} min
                {" "}· est. {queueStatus.throughput.estimatedMinutesRemaining} min remaining
              </p>
            )}
            {queueStatus.lastSentAt && (
              <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
                Last sent: {new Date(queueStatus.lastSentAt).toLocaleString("nl-BE")}
              </p>
            )}
            {queueStatus.total === 0 && (
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>No invitation jobs yet. Run the import first.</p>
            )}
          </>
        )}

        {!queueStatus && !queueError && (
          <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: 0 }}>Loading…</p>
        )}
      </div>

      {/* File picker */}
      <div style={card}>
        <h2 style={{ ...sectionHead, marginBottom: "0.5rem" }}>Import File</h2>
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.75rem", marginTop: 0 }}>
          Upload the Antwerpen CSV file. If left empty, the server will try to use the file bundled with the deployment.
          The file is never stored permanently — it is parsed in memory and discarded.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          style={{ fontSize: "0.875rem", color: "#374151" }}
        />
        {selectedFile && (
          <p style={{ fontSize: "0.8rem", color: "#16a34a", margin: "0.4rem 0 0" }}>
            ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB) — will be uploaded on import
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <button
          onClick={() => void handleImport()}
          disabled={importLoading}
          style={actionBtn(importLoading, "#111111")}
        >
          {importLoading ? "Importing… (please wait)" : "Run Import"}
        </button>

        <button
          onClick={() => void handleSendBatch()}
          disabled={batchLoading || !hasPending}
          style={actionBtn(batchLoading || !hasPending, "#1d4ed8")}
        >
          {batchLoading ? "Sending… (up to 500 emails)" : "Send Next Batch"}
        </button>
      </div>

      {/* Import error */}
      {importError && (
        <div style={alertBox("error")}>
          <strong>Import error:</strong> {importError}
        </div>
      )}

      {/* Batch result */}
      {batchResult && (
        <div style={alertBox(batchResult.failed > 0 ? "warn" : "success")}>
          <strong>Batch complete:</strong>{" "}
          {batchResult.sent} sent · {batchResult.failed} failed · {batchResult.skipped} unsubscribed
          {" "}({batchResult.processed} processed total)
          {batchResult.errors.length > 0 && (
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", fontSize: "0.8rem" }}>
              {batchResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
              {batchResult.errors.length > 10 && (
                <li>…and {batchResult.errors.length - 10} more</li>
              )}
            </ul>
          )}
        </div>
      )}

      {batchError && (
        <div style={alertBox("error")}>
          <strong>Batch error:</strong> {batchError}
        </div>
      )}

      {/* Import report */}
      {importReport && (
        <>
          {hasCritical && (
            <div style={alertBox("error")}>
              <strong>Critical errors — import was not executed:</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {dr!.criticalErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <div style={card}>
            <h2 style={sectionHead}>Import Report</h2>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.875rem" }}>
              <tbody>
                {([
                  ["File", dr?.filePath ?? "—"],
                  ["Total rows in file", dr?.totalRows ?? 0],
                  ["Valid rows (after dedup)", dr?.validRowCount ?? 0],
                  ["Invalid rows skipped", dr?.invalidRowCount ?? 0],
                  ["Duplicate emails in file", dr?.excelDuplicateCount ?? 0],
                  ["Already in database", dr?.existingAccountCount ?? 0],
                  ["New rows to process", dr?.newAccountCount ?? 0],
                  ["Accounts created", importReport.accountsCreated],
                  ["Accounts skipped (already exist)", importReport.accountsSkippedExisting],
                  ["Accounts failed", importReport.accountsFailedCreate],
                  ["Invitation jobs queued", importReport.jobsCreated],
                  ["Garrincha Antwerpen Zuid assigned", dr?.zuidCount ?? 0],
                  ["Garrincha Antwerpen Noord assigned", dr?.noordCount ?? 0],
                  ["Missing phone numbers (allowed)", dr?.missingPhoneCount ?? 0],
                  ["Email sender configured", dr?.emailConfigured ? "Yes" : "No — check RESEND_API_KEY"],
                ] as [string, string | number][]).map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "6px 0", color: "#374151", fontWeight: 500, width: "55%" }}>{label}</td>
                    <td style={{ padding: "6px 0 6px 1rem", color: "#111111" }}>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

          {(dr?.excelDuplicateEmails?.length ?? 0) > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={sectionHead}>Duplicate Emails in File (2nd+ occurrence skipped)</h2>
              <ul style={{ fontSize: "0.8rem", paddingLeft: "1.25rem", color: "#374151" }}>
                {dr!.excelDuplicateEmails.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}

          {importReport.errors.length > 0 && (
            <div style={alertBox("warn")}>
              <strong>Runtime errors:</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {importReport.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

function alertBox(type: "error" | "warn" | "success"): React.CSSProperties {
  const colors = {
    error:   { bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d" },
    warn:    { bg: "#fffbeb", border: "#fde68a", text: "#78350f" },
    success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#14532d" },
  }[type];
  return {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: "6px",
    padding: "1rem",
    marginBottom: "1.5rem",
    color: colors.text,
    fontSize: "0.875rem",
  };
}

function actionBtn(disabled: boolean, baseColor: string): React.CSSProperties {
  return {
    padding: "12px 28px",
    background: disabled ? "#9ca3af" : baseColor,
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
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
