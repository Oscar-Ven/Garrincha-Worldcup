export default function GlobalLoading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
      aria-label="Loading"
      role="status"
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid var(--line-2)",
          borderTopColor: "var(--green)",
          animation: "spin 0.75s linear infinite",
        }}
      />
      <span style={{ color: "var(--ink-faint)", fontSize: 13, letterSpacing: "0.04em" }}>Loading…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
