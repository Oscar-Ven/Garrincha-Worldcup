import Image from "next/image";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="container">
        <div className="site-footer-main">
          <Link href="/" className="site-footer-brand" aria-label="GARRINCHA home">
            <Image
              src="/branding/garrincha-white.png"
              alt=""
              width={270}
              height={66}
              className="site-footer-brand-logo"
              style={{ width: "auto", height: 24 }}
            />
            <div>
              <span className="site-footer-brand-name">GARRINCHA</span>
              <span className="site-footer-brand-sub">World Cup 2026</span>
            </div>
          </Link>

          <div className="site-footer-social">
            <a
              href="https://www.instagram.com/garrincha_belgium/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GARRINCHA on Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a
              href="https://www.facebook.com/garrinchabelgium/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GARRINCHA on Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@garrinchabelgium"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GARRINCHA on YouTube"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="site-footer-legal">
          <span>©2026 Kempes BV</span>
          <span className="site-footer-sep">·</span>
          <span>BE0635670989</span>
          <span className="site-footer-sep">·</span>
          <span>Kortrijksesteenweg 1166, 9051 Gent</span>
          <span className="site-footer-sep">·</span>
          <Link href="/legal">Legal</Link>
          <span className="site-footer-sep">·</span>
          <Link href="/privacy">Privacy</Link>
          <span className="site-footer-sep">·</span>
          <Link href="/terms">Terms</Link>
          <span className="site-footer-sep">·</span>
          <Link href="/admin/login">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
