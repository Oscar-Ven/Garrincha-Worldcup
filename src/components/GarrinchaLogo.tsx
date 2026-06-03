export function GarrinchaLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="garrincha-logo compact" aria-label="GARRINCHA">
        GARRINCHA<sup className="garrincha-reg">®</sup>
      </span>
    );
  }

  return (
    <div className="garrincha-badge" aria-label="GARRINCHA® World Cup 2026">
      <span className="garrincha-badge-name">
        GARRINCHA<sup className="garrincha-reg">®</sup>
      </span>
      <span className="garrincha-badge-rule" aria-hidden />
      <span className="garrincha-badge-sub">World Cup Pronostiek 2026</span>
    </div>
  );
}
