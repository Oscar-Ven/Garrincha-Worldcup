"""Patch globals.css: replace old matches page CSS with new design system."""
import sys

NEW_CSS = r"""/* ============================================================
   MATCHES PAGE  mc-* = Matches Client design system
   ============================================================ */

:root {
  --mc-gold:      #F5C242;
  --mc-gold-dim:  rgba(245,194,66,0.15);
  --mc-card:      #141a13;
  --mc-card-2:    #19211a;
  --mc-border:    rgba(255,255,255,0.08);
  --mc-ink:       #F1F5EE;
  --mc-muted:     rgba(241,245,238,0.55);
  --mc-faint:     rgba(241,245,238,0.30);
  --mc-live:      #FF5A4D;
}

.mc-page { background: var(--bg); min-height: 100vh; }

.mc-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

/* ── Hero ── */
.mc-hero {
  position: relative;
  overflow: hidden;
  padding: 52px 0 0;
  background:
    radial-gradient(ellipse 60% 80% at 75% 50%, rgba(245,194,66,0.13) 0%, transparent 65%),
    radial-gradient(ellipse 80% 60% at 20% 80%, rgba(95,224,144,0.05) 0%, transparent 50%),
    var(--bg);
}

.mc-hero-bg {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0 47px, rgba(255,255,255,0.018) 47px 48px),
    repeating-linear-gradient(90deg, transparent 0 47px, rgba(255,255,255,0.018) 47px 48px);
  pointer-events: none;
}

.mc-hero-inner {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 32px;
  align-items: center;
  padding-bottom: 36px;
  position: relative;
  z-index: 1;
}

.mc-hero-content { display: flex; flex-direction: column; gap: 12px; }

.mc-eyebrow {
  font-family: var(--f-disp);
  font-weight: 800;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 13px;
  color: var(--mc-gold);
}

.mc-hero-title {
  font-family: var(--f-disp);
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
  font-size: clamp(2.4rem, 5vw, 4.2rem);
  line-height: 0.92;
  color: var(--mc-ink);
  margin: 0;
  letter-spacing: -0.02em;
}

.mc-hero-sub { font-size: 16px; color: var(--mc-muted); margin: 0; line-height: 1.5; }

.mc-hero-date { font-size: 14px; color: var(--mc-muted); margin: 0; display: flex; align-items: center; gap: 6px; }

.mc-hero-visual { position: relative; display: flex; align-items: center; justify-content: center; height: 180px; }

.mc-trophy-glow {
  position: absolute;
  width: 180px; height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,194,66,0.35) 0%, rgba(245,194,66,0.1) 50%, transparent 70%);
  filter: blur(24px);
  z-index: 0;
}

.mc-trophy-icon { position: relative; z-index: 1; filter: drop-shadow(0 0 20px rgba(245,194,66,0.4)); }

/* ── Stats ── */
.mc-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 24px 0 0;
  position: relative; z-index: 1;
  border-top: 1px solid var(--mc-border);
  margin-top: 4px;
}

.mc-stat-card {
  background: var(--mc-card);
  border: 1px solid var(--mc-border);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.mc-stat-icon { color: var(--mc-gold); flex-shrink: 0; opacity: 0.9; }
.mc-stat-value { font-family: var(--f-num); font-weight: 800; font-size: 28px; color: var(--mc-ink); line-height: 1; letter-spacing: -0.02em; }
.mc-stat-label { font-size: 12px; color: var(--mc-muted); margin-top: 3px; line-height: 1.3; }

/* ── Body ── */
.mc-body { padding: 28px 0 80px; display: flex; flex-direction: column; gap: 20px; }

/* ── Scoring card ── */
.mc-scoring-card {
  background: var(--mc-card);
  border: 1px solid var(--mc-border);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex; align-items: center; gap: 14px;
}

.mc-scoring-icon-wrap {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--mc-gold-dim);
  border: 1px solid rgba(245,194,66,0.25);
  display: flex; align-items: center; justify-content: center;
  color: var(--mc-gold); flex-shrink: 0;
}

.mc-scoring-text { flex: 1; min-width: 0; }
.mc-scoring-title { font-weight: 700; font-size: 14px; color: var(--mc-ink); }
.mc-scoring-sub { font-size: 12.5px; color: var(--mc-muted); margin-top: 2px; line-height: 1.4; }

.mc-scoring-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--mc-border);
  background: transparent; color: var(--mc-muted);
  font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
  transition: color 0.15s, border-color 0.15s;
}
.mc-scoring-btn:hover { color: var(--mc-gold); border-color: rgba(245,194,66,0.4); }

.mc-scoring-detail { background: var(--mc-card); border: 1px solid var(--mc-border); border-radius: 14px; padding: 20px; margin-top: -12px; }
.mc-scoring-grid { display: flex; flex-direction: column; gap: 12px; }
.mc-scoring-row { display: flex; align-items: flex-start; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--mc-border); }
.mc-scoring-row:last-child { border-bottom: none; }
.mc-scoring-pts { font-family: var(--f-num); font-weight: 800; font-size: 22px; letter-spacing: -0.02em; min-width: 44px; flex-shrink: 0; }
.mc-scoring-row-label { font-weight: 700; font-size: 14px; color: var(--mc-ink); }
.mc-scoring-row-desc { font-size: 12.5px; color: var(--mc-muted); margin-top: 2px; }

/* ── Filter tabs ── */
.mc-filters { display: flex; flex-direction: column; gap: 8px; }
.mc-filter-row { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
.mc-filter-row::-webkit-scrollbar { display: none; }

.mc-filter-btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 36px; padding: 0 14px;
  border-radius: 20px;
  border: 1px solid var(--mc-border);
  background: var(--mc-card);
  color: var(--mc-muted);
  font-family: var(--f-body); font-weight: 600; font-size: 13px;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
  transition: all 0.15s;
}
.mc-filter-btn:hover { border-color: rgba(245,194,66,0.4); color: var(--mc-ink); }
.mc-filter-btn--active { background: var(--mc-gold); border-color: var(--mc-gold); color: #0a0d0a; font-weight: 700; }
.mc-filter-btn--section { font-style: italic; font-family: var(--f-disp); font-weight: 800; }

/* ── Match list header ── */
.mc-list-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.mc-list-title { display: flex; align-items: baseline; gap: 10px; }
.mc-list-title > span:first-child { font-family: var(--f-disp); font-weight: 900; font-style: italic; text-transform: uppercase; font-size: 22px; color: var(--mc-ink); }
.mc-list-count { font-size: 13px; color: var(--mc-muted); }

.mc-sort-select {
  height: 36px; padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--mc-border);
  background: var(--mc-card); color: var(--mc-muted);
  font-size: 13px; font-family: var(--f-body);
  cursor: pointer; outline: none;
}
.mc-sort-select:focus { border-color: var(--mc-gold); }

/* ── Match grid ── */
.mc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }

/* ── Match card ── */
.mc-card {
  background: var(--mc-card);
  border: 1px solid var(--mc-border);
  border-radius: 16px;
  padding: 18px 18px 14px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color 0.15s, transform 0.12s;
}
.mc-card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }

.mc-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.mc-card-meta { display: flex; align-items: center; gap: 8px; }

.mc-card-num {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--mc-card-2); border: 1px solid var(--mc-border);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--f-num); font-weight: 800; font-size: 11px; color: var(--mc-muted);
  flex-shrink: 0;
}

.mc-card-stage { font-size: 12px; color: var(--mc-muted); font-weight: 600; }

.mc-status {
  display: inline-flex; align-items: center;
  height: 22px; padding: 0 8px;
  border-radius: 5px;
  font-size: 10px; font-weight: 800; letter-spacing: 0.06em;
  white-space: nowrap; flex-shrink: 0;
}
.mc-status--upcoming { background: rgba(99,179,237,0.14); color: #63b3ed; }
.mc-status--live { background: rgba(255,90,77,0.15); color: var(--mc-live); animation: mc-pulse 1.6s infinite; }
.mc-status--finished { background: rgba(241,245,238,0.07); color: var(--mc-faint); }
.mc-status--locked { background: rgba(241,245,238,0.06); color: var(--mc-faint); }

@keyframes mc-pulse { 0%,100%{opacity:1} 50%{opacity:.65} }

.mc-card-teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; padding: 4px 0; }
.mc-team { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }

.mc-flag-wrap {
  width: 48px; height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--mc-card-2); border: 1.5px solid var(--mc-border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.mc-flag { width: 100%; height: 100%; object-fit: cover; }
.mc-flag-placeholder { font-size: 20px; color: var(--mc-faint); }

.mc-team-name {
  font-size: 12.5px; font-weight: 700; color: var(--mc-ink);
  line-height: 1.2;
  max-width: 90px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.mc-center-col { display: flex; align-items: center; justify-content: center; min-width: 48px; }

.mc-vs {
  font-family: var(--f-disp);
  font-weight: 900; font-style: italic;
  font-size: 18px; color: var(--mc-faint); text-transform: uppercase;
}

.mc-final-score { display: flex; align-items: center; gap: 6px; font-family: var(--f-num); font-weight: 800; font-size: 22px; color: var(--mc-ink); }
.mc-score-sep { color: var(--mc-faint); font-size: 18px; }

.mc-card-foot { display: flex; flex-direction: column; gap: 5px; padding-top: 10px; border-top: 1px solid var(--mc-border); }
.mc-info-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mc-muted); line-height: 1.4; }

/* ── CTA block ── */
.mc-cta-block {
  text-align: center; padding: 48px 24px;
  border: 1px solid var(--mc-border);
  border-radius: 20px; background: var(--mc-card);
}
.mc-cta-title { font-family: var(--f-disp); font-weight: 900; font-style: italic; text-transform: uppercase; font-size: clamp(1.4rem, 3vw, 2rem); color: var(--mc-ink); margin-bottom: 10px; line-height: 1; }
.mc-cta-sub { font-size: 14px; color: var(--mc-muted); max-width: 420px; margin: 0 auto 20px; line-height: 1.6; }
.mc-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.mc-empty { text-align: center; padding: 60px 24px; color: var(--mc-muted); font-size: 15px; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .mc-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .mc-hero-inner { grid-template-columns: 1fr; }
  .mc-hero-visual { display: none; }
}

@media (max-width: 768px) {
  .mc-container { padding: 0 16px; }
  .mc-hero { padding: 36px 0 0; }
  .mc-hero-title { font-size: clamp(1.8rem, 7vw, 3rem); }
  .mc-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .mc-stat-card { padding: 14px 14px; }
  .mc-stat-value { font-size: 22px; }
  .mc-grid { grid-template-columns: 1fr; }
  .mc-body { gap: 14px; }
  .mc-scoring-card { flex-wrap: wrap; }
  .mc-scoring-btn { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .mc-hero-title { font-size: 1.8rem; }
  .mc-stat-card { padding: 12px 12px; gap: 10px; }
  .mc-stat-value { font-size: 20px; }
  .mc-card { padding: 14px 14px 12px; }
  .mc-team-name { font-size: 11.5px; max-width: 75px; }
  .mc-flag-wrap { width: 40px; height: 40px; }
}

"""

with open('src/app/globals.css', 'r', encoding='utf-8') as f:
    content = f.read()

old_start = content.find('/* ============================================================\n   MATCHES PAGE')
sr_only_start = content.find('/* ============================================================ */\n\n/* Utility */')

before = content[:old_start]
after = content[sr_only_start:]

with open('src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write(before + NEW_CSS + '\n' + after)

print('Done — replaced matches CSS')
