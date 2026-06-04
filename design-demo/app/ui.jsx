// ============================================================
// GARRINCHA · shared UI primitives
// ============================================================
const { useState, useEffect, useRef } = React;

// ---------- Logo ----------
function Logo({ h = 26, variant = 'white', style = {} }) {
  const src = variant === 'black' ? 'app/assets/garrincha-black.png' : 'app/assets/garrincha-white.png';
  return <img src={src} alt="GARRINCHA" style={{ height: h, width: 'auto', display: 'block', ...style }} />;
}

// ---------- Circular flag ----------
function Flag({ code = 'TBD', size = 38, ring = true }) {
  const bg = FLAGS[code] || FLAGS.TBD;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      boxShadow: ring ? 'inset 0 0 0 1.5px rgba(255,255,255,0.18)' : 'none',
    }}>
      {code === 'ENG' && (
        <React.Fragment>
          <div style={{ position:'absolute', left:'42%', top:0, width:'16%', height:'100%', background:'#CF142B' }} />
          <div style={{ position:'absolute', top:'42%', left:0, height:'16%', width:'100%', background:'#CF142B' }} />
        </React.Fragment>
      )}
      {code === 'TBD' && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--f-disp)', fontWeight:900, fontStyle:'italic', fontSize:size*0.5, color:'rgba(255,255,255,0.4)' }}>?</div>
      )}
    </div>
  );
}

// ---------- Center badge (shield) ----------
function CenterBadge({ center, size = 34 }) {
  if (!center) return null;
  return (
    <div style={{
      width: size, height: size, flexShrink:0, position:'relative',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <svg viewBox="0 0 40 44" width={size} height={size*1.1} style={{ position:'absolute', inset:0 }}>
        <path d="M20 1 L38 7 V22 C38 33 30 40 20 43 C10 40 2 33 2 22 V7 Z"
          fill={center.color} opacity="0.16" stroke={center.color} strokeWidth="1.6"/>
      </svg>
      <span style={{ position:'relative', fontFamily:'var(--f-disp)', fontWeight:900, fontStyle:'italic',
        fontSize:size*0.34, color:center.color, letterSpacing:'-0.02em' }}>{center.short}</span>
    </div>
  );
}

// ---------- Status pill ----------
function StatusPill({ status, t, live }) {
  if (status === 'live')     return <span className="chip chip-live"><span className="live-dot" />{live || t('live')}</span>;
  if (status === 'locked')   return <span className="chip chip-locked">🔒 {t('locked')}</span>;
  if (status === 'finished') return <span className="chip chip-ghost">{t('ft')}</span>;
  return <span className="chip chip-green">{t('open')}</span>;
}

// ---------- Section title ----------
function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, margin:'2px 0 12px' }}>
      <h3 className="disp" style={{ margin:0, fontSize:23, color:'var(--ink)' }}>{children}</h3>
      {action && <button onClick={onAction} className="label" style={{ background:'none', border:0, color:'var(--green)', fontSize:11.5, cursor:'pointer', letterSpacing:'0.08em', whiteSpace:'nowrap', flexShrink:0 }}>{action}</button>}
    </div>
  );
}

// ---------- Eyebrow ----------
function Eyebrow({ children, color = 'var(--green)' }) {
  return <div className="kick" style={{ fontSize:13, color, marginBottom:8 }}>{children}</div>;
}

// ---------- Score stepper (big, thumb-friendly) ----------
function ScoreBox({ value, onChange, accent = 'var(--green)', disabled, dim, size = 'lg' }) {
  const v = value == null ? 0 : value;
  const set = (n) => { if (!disabled) onChange(Math.max(0, Math.min(20, n))); };
  const S = size === 'sm'
    ? { cw:48, ch:54, fs:30, bw:42, bh:32, gap:6 }
    : { cw:66, ch:74, fs:42, bw:48, bh:38, gap:8 };
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:S.gap, opacity: dim?0.5:1 }}>
      <button aria-label="up" disabled={disabled} onClick={()=>set(v+1)} style={stepBtn(disabled,S)}>
        <Chevron dir="up" />
      </button>
      <div style={{
        width:S.cw, height:S.ch, borderRadius: size==='sm'?13:16, display:'flex', alignItems:'center', justifyContent:'center',
        background: value==null ? 'rgba(255,255,255,0.05)' : 'rgba(95,224,144,0.10)',
        border: `2px solid ${value==null ? 'var(--line-2)' : accent}`,
        boxShadow: value==null ? 'none' : '0 6px 18px -10px var(--green-glow)',
        transition:'all .15s',
      }}>
        <span className="num" style={{ fontSize:S.fs, color: value==null ? 'var(--ink-faint)' : 'var(--ink)' }}>{value==null?'–':v}</span>
      </div>
      <button aria-label="down" disabled={disabled} onClick={()=>set(v-1)} style={stepBtn(disabled,S)}>
        <Chevron dir="down" />
      </button>
    </div>
  );
}
function stepBtn(disabled, S={bw:48,bh:38}){
  return { width:S.bw, height:S.bh, borderRadius:11, border:'1px solid var(--line-2)',
    background:'var(--surface-2)', color: disabled?'var(--ink-faint)':'var(--ink)',
    display:'flex', alignItems:'center', justifyContent:'center', cursor: disabled?'default':'pointer' };
}
function Chevron({ dir='down', s=16, c='currentColor' }){
  const r = { up:'180deg', down:'0deg', left:'90deg', right:'-90deg' }[dir];
  return <svg width={s} height={s} viewBox="0 0 16 16" style={{ transform:`rotate(${r})` }}><path d="M3 6l5 5 5-5" stroke={c} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ---------- Empty state ----------
function EmptyState({ icon = '○', title, body, action, onAction }) {
  return (
    <div className="rise" style={{ textAlign:'center', padding:'48px 26px', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <div style={{ width:72, height:72, borderRadius:'50%', border:'2px dashed var(--line-2)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, color:'var(--ink-faint)', marginBottom:8 }}>{icon}</div>
      <h4 className="disp" style={{ margin:0, fontSize:22, color:'var(--ink)' }}>{title}</h4>
      <p style={{ margin:0, fontSize:14.5, color:'var(--ink-dim)', maxWidth:240, lineHeight:1.45 }}>{body}</p>
      {action && <button className="btn btn-ghost btn-md" style={{ width:'auto', padding:'0 22px', marginTop:14 }} onClick={onAction}>{action}</button>}
    </div>
  );
}

// ---------- QR code (decorative placeholder) ----------
function QRCode({ size = 150, fg = '#0A0D0A', bg = '#fff' }) {
  const cells = 11;
  const seed = '11111011110000010100010110101101001110100100101011010110010101001011101000110011000101100111011111';
  const c = size / cells;
  const rng = (i)=> seed[(i*7+3) % seed.length] === '1';
  const finder = (x,y)=>(
    <g key={x+'-'+y}>
      <rect x={x*c} y={y*c} width={3*c} height={3*c} fill={fg}/>
      <rect x={(x+0.6)*c} y={(y+0.6)*c} width={1.8*c} height={1.8*c} fill={bg}/>
      <rect x={(x+1)*c} y={(y+1)*c} width={c} height={c} fill={fg}/>
    </g>
  );
  const dots = [];
  for (let y=0;y<cells;y++) for (let x=0;x<cells;x++){
    if ((x<4&&y<4)||(x>cells-5&&y<4)||(x<4&&y>cells-5)) continue;
    if (rng(y*cells+x)) dots.push(<rect key={x+'_'+y} x={x*c} y={y*c} width={c} height={c} fill={fg}/>);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius:12, background:bg, display:'block' }}>
      <rect width={size} height={size} fill={bg}/>
      {dots}
      {finder(0,0)}{finder(cells-3,0)}{finder(0,cells-3)}
    </svg>
  );
}

// ---------- Striped image placeholder ----------
function ImgSlot({ label='IMAGE', h=140, r='var(--r-lg)', style={} }) {
  return (
    <div style={{
      height:h, borderRadius:r, position:'relative', overflow:'hidden',
      background:'repeating-linear-gradient(135deg,#161d16 0 12px,#121812 12px 24px)',
      border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', ...style }}>
      <span style={{ fontFamily:'ui-monospace,monospace', fontSize:11, letterSpacing:'0.12em',
        color:'var(--ink-faint)', textTransform:'uppercase' }}>{label}</span>
    </div>
  );
}

// ---------- Toast ----------
function Toast({ show, children }) {
  return (
    <div style={{
      position:'absolute', left:'50%', bottom: show?104:80, transform:`translateX(-50%) translateY(${show?0:10}px)`,
      opacity: show?1:0, transition:'all .3s cubic-bezier(.2,.7,.2,1)', pointerEvents:'none', zIndex:80,
      background:'var(--green)', color:'#06210F', fontFamily:'var(--f-disp)', fontWeight:900, fontStyle:'italic',
      textTransform:'uppercase', fontSize:14, padding:'12px 20px', borderRadius:999, boxShadow:'var(--sh-2)',
      display:'flex', alignItems:'center', gap:8 }}>{children}</div>
  );
}

Object.assign(window, {
  Logo, Flag, CenterBadge, StatusPill, SectionTitle, Eyebrow,
  ScoreBox, Chevron, EmptyState, QRCode, ImgSlot, Toast,
});
