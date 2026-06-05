import Link from "next/link";

/**
 * Slim single-row footer used on every public page.
 * Desktop: [company text] [legal links] [icons →]
 * Mobile: wraps cleanly into compact stacked rows.
 * No locale prop needed — legal/brand text is fixed.
 */
export function PublicFooter() {
  return (
    <footer className="sf" aria-label="Site footer">
      <div className="sf-inner">

        {/* Left — company identity */}
        <span className="sf-company">
          Kempes BV · BE0635670989 · Kortrijksesteenweg 1166, 9051 Gent, Belgium
        </span>

        {/* Middle — legal links (removed duplicate "Legal Notice" → same as "Legal") */}
        <nav className="sf-links" aria-label="Legal links">
          <Link href="/legal">Legal</Link>
          <span className="sf-dot" aria-hidden>·</span>
          <Link href="/privacy">Privacy policy</Link>
          <span className="sf-dot" aria-hidden>·</span>
          <Link href="/terms">Terms</Link>
          <span className="sf-dot" aria-hidden>·</span>
          <Link href="/cookies">Cookie Policy</Link>
        </nav>

        {/* Right — social + admin icons */}
        <div className="sf-icons">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/garrincha_belgium/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GARRINCHA on Instagram"
            className="sf-icon"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/garrinchabelgium/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GARRINCHA on Facebook"
            className="sf-icon"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
            </svg>
          </a>

          {/* Admin */}
          <Link
            href="/admin/login"
            aria-label="Admin login"
            className="sf-icon"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8" r="4"/>
              <path d="M20 21a8 8 0 10-16 0"/>
              <circle cx="19" cy="19" r="3" fill="currentColor" stroke="none"/>
              <path d="M19 17v4M17 19h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  );
}
