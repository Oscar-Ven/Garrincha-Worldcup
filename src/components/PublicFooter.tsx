import Link from "next/link";
import Image from "next/image";

/**
 * Full-width public footer.
 * Layout (desktop): [logo + company info] … [legal links] … [social + admin icons]
 * Mobile: stacks vertically, left-aligned.
 * Background: #1B4332 (dark green). All text white or white/70.
 */
export function PublicFooter() {
  return (
    <footer className="footer" aria-label="Site footer">
      <div className="footer-inner">

        {/* Left — logo + company identity */}
        <div className="footer-brand">
          <Link href="/" className="footer-logo" aria-label="GARRINCHA home">
            <Image
              src="/garrincha-white.png"
              alt="GARRINCHA"
              width={120}
              height={32}
              style={{ height: 32, width: "auto" }}
            />
          </Link>
          <span className="footer-company">
            Kempes BV · BE0635670989 · Kortrijksesteenweg 1166, 9051 Gent, Belgium
          </span>
        </div>

        {/* Middle — legal links */}
        <nav className="footer-nav" aria-label="Legal links">
          <Link href="/legal">Legal</Link>
          <span className="footer-dot" aria-hidden>·</span>
          <Link href="/privacy">Privacy policy</Link>
          <span className="footer-dot" aria-hidden>·</span>
          <Link href="/terms">Terms</Link>
          <span className="footer-dot" aria-hidden>·</span>
          <Link href="/cookies">Cookie Policy</Link>
        </nav>

        {/* Right — social icons + admin */}
        <div className="footer-icons">

          {/* Instagram */}
          <a
            href="https://www.instagram.com/garrincha_belgium/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GARRINCHA on Instagram"
            className="footer-icon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
            className="footer-icon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@garrinchabelgium"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GARRINCHA on YouTube"
            className="footer-icon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
              <polygon fill="#1B4332" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
            </svg>
          </a>

          {/* Admin login */}
          <Link
            href="/admin/login"
            aria-label="Admin login"
            className="footer-icon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
