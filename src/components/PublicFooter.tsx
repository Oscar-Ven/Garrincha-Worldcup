import Image from "next/image";
import Link from "next/link";
import { type Locale, t } from "@/lib/translations";

interface PublicFooterProps {
  locale: Locale;
}

/**
 * Shared footer used on EVERY public page — landing, register, login,
 * leaderboards, legal pages. Identical layout, spacing, colors.
 */
export function PublicFooter({ locale }: PublicFooterProps) {
  return (
    <footer className="pub-footer">
      <div className="pub-footer-inner">
        {/* Brand column */}
        <div className="pub-footer-brand">
          <Image
            src="/garrincha-white.png"
            alt="GARRINCHA"
            height={22}
            width={132}
            style={{ height: 22, width: "auto" }}
          />
          <p className="pub-footer-tagline">
            www.worldcup-garrincha.com is owned by Garrincha.
          </p>
          <p className="pub-footer-about">{t(locale, "ft_about")}</p>
          <p className="pub-footer-disclaimer">
            This campaign is independently operated and is not affiliated with FIFA, UEFA, or any official World Cup organizer unless explicitly stated.
          </p>
          <p className="pub-footer-legal">Kempes BV · BE0635670989 · ©2026</p>
        </div>

        {/* Navigation columns */}
        <div className="pub-footer-cols">
          <div className="pub-footer-col">
            <h4>Platform</h4>
            <Link href="/">{t(locale, "nav.home")}</Link>
            <Link href="/register">{t(locale, "nav.register")}</Link>
            <Link href="/leaderboards">{t(locale, "nav.leaderboards")}</Link>
            <Link href="/login">{t(locale, "register.requestLink")}</Link>
          </div>
          <div className="pub-footer-col">
            <h4>Legal</h4>
            <Link href="/privacy">{t(locale, "footer.privacy")}</Link>
            <Link href="/terms">{t(locale, "footer.terms")}</Link>
            <Link href="/legal">Legal Notice</Link>
            <Link href="/cookies">Cookie Policy</Link>
          </div>
          <div className="pub-footer-col">
            <h4>GARRINCHA®</h4>
            <a href="https://www.garrincha.be" target="_blank" rel="noopener noreferrer">
              garrincha.be
            </a>
            <a href="https://www.instagram.com/garrincha_belgium/" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="https://www.facebook.com/garrinchabelgium/" target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <Link href="/admin/login">Admin</Link>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="pub-footer-bottom">
        <span>Kempes BV · BE0635670989 · Kortrijksesteenweg 1166, 9051 Gent, Belgium</span>
        <span>EN · NL · FR</span>
      </div>
    </footer>
  );
}
