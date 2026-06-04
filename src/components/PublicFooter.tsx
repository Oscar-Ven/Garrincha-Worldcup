import Image from "next/image";
import Link from "next/link";
import { type Locale, t } from "@/lib/translations";

// ── All 10 GARRINCHA centers ──────────────────────────────────────────────────
const GARRINCHA_CENTERS = [
  { short: "AN",  name: "Antwerpen Noord",      color: "#5FE090" },
  { short: "AZ",  name: "Antwerpen Zuid",       color: "#F5C242" },
  { short: "CD",  name: "Charleroi Dampremy",   color: "#FF8C66" },
  { short: "CM",  name: "Charleroi Montignies", color: "#FF5A4D" },
  { short: "DG",  name: "Diegem",               color: "#6FB3FF" },
  { short: "GA",  name: "Gent Arsenaal",        color: "#C792EA" },
  { short: "GT",  name: "Gent The Loop",        color: "#4ED9C0" },
  { short: "KT",  name: "Kortrijk",             color: "#FFD060" },
  { short: "LK",  name: "Luik",                 color: "#FF9F1C" },
  { short: "WD",  name: "Westgate Dilbeek",     color: "#78D97C" },
];

// ── SVG social icons ──────────────────────────────────────────────────────────
function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PublicFooterProps { locale: Locale; }

export function PublicFooter({ locale }: PublicFooterProps) {
  return (
    <footer className="pub-footer" aria-label="Site footer">

      {/* ── Main footer body ── */}
      <div className="pub-footer-body">

        {/* Brand + description */}
        <div className="pub-footer-brand">
          <Image
            src="/garrincha-white.png"
            alt="GARRINCHA"
            height={26}
            width={156}
            style={{ height: 26, width: "auto", opacity: 0.9 }}
          />
          <p className="pub-footer-desc">
            {t(locale, "ft_about")}
          </p>
          <p className="pub-footer-disclaimer">
            This campaign is independently operated and is not affiliated with FIFA, UEFA, or any official World Cup organizer unless explicitly stated.
          </p>

          {/* Social icons */}
          <div className="pub-footer-social">
            <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer" aria-label="garrincha.be website" className="pub-footer-social-link">
              <IconGlobe />
            </a>
            <a href="https://www.instagram.com/garrincha_belgium/" target="_blank" rel="noopener noreferrer" aria-label="GARRINCHA on Instagram" className="pub-footer-social-link">
              <IconInstagram />
            </a>
            <a href="https://www.facebook.com/garrinchabelgium/" target="_blank" rel="noopener noreferrer" aria-label="GARRINCHA on Facebook" className="pub-footer-social-link">
              <IconFacebook />
            </a>
            <a href="https://www.linkedin.com/company/garrincha/" target="_blank" rel="noopener noreferrer" aria-label="GARRINCHA on LinkedIn" className="pub-footer-social-link">
              <IconLinkedIn />
            </a>
          </div>
        </div>

        {/* Nav columns */}
        <div className="pub-footer-cols">
          {/* Platform */}
          <div className="pub-footer-col">
            <h4>Platform</h4>
            <Link href="/">{t(locale, "nav.home")}</Link>
            <Link href="/register">{t(locale, "nav.register")}</Link>
            <Link href="/leaderboards">{t(locale, "nav.leaderboards")}</Link>
            <Link href="/login">{t(locale, "register.requestLink")}</Link>
          </div>

          {/* Centers */}
          <div className="pub-footer-col pub-footer-col-centers">
            <h4>10 Centers</h4>
            <div className="pub-footer-centers-grid">
              {GARRINCHA_CENTERS.map((c) => (
                <span key={c.short} className="pub-footer-center-item">
                  <span className="pub-footer-center-dot" style={{ background: c.color }} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="pub-footer-col">
            <h4>Legal</h4>
            <Link href="/terms">General terms and conditions</Link>
            <Link href="/privacy">{t(locale, "footer.privacy")}</Link>
            <Link href="/cookies">Cookie policy</Link>
            <Link href="/legal">Legal Notice</Link>
            <Link href="/admin/login">Admin</Link>
          </div>
        </div>
      </div>

      {/* ── Legal strip — exact required format ── */}
      <div className="pub-footer-legal-strip">
        <span>
          ©2026 Kempes BV
          <span className="pub-footer-sep">|</span>
          BE0635670989
          <span className="pub-footer-sep">|</span>
          Kortrijksesteenweg 1166, 9051 Gent
          <span className="pub-footer-sep">|</span>
          <Link href="/terms">General terms and conditions</Link>
          <span className="pub-footer-sep">|</span>
          <Link href="/privacy">Privacy policy</Link>
          <span className="pub-footer-sep">|</span>
          <Link href="/cookies">Cookie policy</Link>
        </span>
        <span className="pub-footer-lang-hint">EN · NL · FR</span>
      </div>
    </footer>
  );
}
