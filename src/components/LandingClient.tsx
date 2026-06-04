"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { type Locale, t } from "@/lib/translations";

export function LandingClient({ locale }: { locale: Locale }) {
  const navRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Scroll-based nav glass effect ──────────────────────────────
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── IntersectionObserver reveal ────────────────────────────────
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ── Smooth anchor scroll (offset for fixed nav) ────────────────
  useEffect(() => {
    const handleClick = (e: Event) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: (target as HTMLElement).getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
      setMenuOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const navLinks = [
    { href: "#how",     label: t(locale, "how_title_label") },
    { href: "#scoring", label: t(locale, "nav_scoring") },
    { href: "#centers", label: t(locale, "nav_centers") },
    { href: "#prize",   label: t(locale, "nav_prize") },
  ];

  return (
    <nav ref={navRef} className={`lp-nav${menuOpen ? " menu-open" : ""}`} id="nav">
      <div className="lp-nav-in">
        {/* Logo */}
        <a href="#top" aria-label="GARRINCHA home" className="lp-nav-logo">
          <Image src="/garrincha-white.png" alt="GARRINCHA" height={22} width={132} style={{ height: 22, width: "auto" }} />
        </a>

        {/* Desktop nav links */}
        <div className="lp-nav-links" id="navlinks">
          {navLinks.map((nl) => (
            <a key={nl.href} href={nl.href}>{nl.label}</a>
          ))}
        </div>

        {/* Right: lang + CTA + burger */}
        <div className="lp-nav-right">
          <LanguageSwitcher locale={locale} />
          <Link href="/register" className="cta cta-green cta-sm">{t(locale, "nav_register")}</Link>
          <button
            className="lp-burger"
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
