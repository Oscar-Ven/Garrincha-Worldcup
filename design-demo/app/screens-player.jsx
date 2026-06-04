// ============================================================
// GARRINCHA · Player shell — Header, Bottom nav, Dashboard, Profile
// ============================================================

// ---------- Screen header (sticky) ----------
function ScreenHeader({ t, title, sub, right }) {
  return (
    <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(10,13,10,0.82)', backdropFilter:'blur(14px)',
      borderBottom:'1px solid var(--line)', padding:'60px 18px 14px' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          {sub && <div className="label" style={{ fontSize:9.5, color:'var(--green)', marginBottom:3 }}>{sub}</div>}
          <h1 className="disp" style={{ fontSize:30, color:'var(--ink)', margin:0 }}>{title}</h1>
        </div>
        {right || <Logo h={16} style={{ opacity:.85, marginBottom:4 }} />}
      </div>
    </div>
  );
}

// ---------- Bottom nav ----------
function BottomNav({ t, tab, go }) {
  const items = [
    { k:'dash',    label:t('nav_home'),    icon:'home' },
    { k:'predict', label:t('nav_predict'), icon:'ball' },
    { k:'ranks',   label:t('nav_ranks'),   icon:'chart' },
    { k:'prizes',  label:t('nav_prizes'),  icon:'trophy' },
    { k:'profile', label:t('nav_you'),     icon:'user' },
  ];
  return (
    <div style={{ position:'absolute', left:0, right:0, bottom:0, zIndex:70,
      paddingBottom:22, paddingTop:8, background:'linear-gradient(180deg,transparent,rgba(10,13,10,0.95) 30%)' }}>
      <div style={{ margin:'0 14px', height:64, borderRadius:22, background:'rgba(25,33,26,0.92)', backdropFilter:'blur(18px)',
        border:'1px solid var(--line-2)', boxShadow:'0 12px 30px rgba(0,0,0,0.45)',
        display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 6px' }}>
        {items.map(it=>{
          const on = tab===it.k;
          return (
            <button key={it.k} onClick={()=>go(it.k)} style={{ background:'none', border:0, cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1, padding:'8px 0', position:'relative' }}>
              <NavIcon name={it.icon} on={on} />
              <span style={{ fontFamily:'var(--f-body)', fontWeight:700, fontSize:9.5, letterSpacing:'0.02em',
                color: on?'var(--green)':'var(--ink-faint)' }}>{it.label}</span>
              {on && <div style={{ position:'absolute', top:2, width:5, height:5, borderRadius:99, background:'var(--green)', boxShadow:'0 0 8px var(--green)' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavIcon({ name, on }) {
  const c = on?'var(--green)':'var(--ink-faint)';
  const sw = on?2.3:2;
  const p = {
    home:  <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" stroke={c} strokeWidth={sw} fill={on?'rgba(95,224,144,0.12)':'none'} strokeLinejoin="round"/>,
    ball:  <g><circle cx="12" cy="12" r="9" stroke={c} strokeWidth={sw} fill={on?'rgba(95,224,144,0.12)':'none'}/><path d="M12 7l3 2-1 4h-4l-1-4z" stroke={c} strokeWidth={sw*0.8} fill="none" strokeLinejoin="round"/></g>,
    chart: <g><path d="M5 21V10M12 21V4M19 21v-7" stroke={c} strokeWidth={sw} strokeLinecap="round"/></g>,
    trophy:<path d="M7 4h10v3a5 5 0 01-10 0zM5 5H3v1a3 3 0 003 3M19 5h2v1a3 3 0 01-3 3M9 14h6l-1 4h-4z" stroke={c} strokeWidth={sw} fill={on?'rgba(95,224,144,0.12)':'none'} strokeLinejoin="round"/>,
    user:  <g><circle cx="12" cy="8" r="4" stroke={c} strokeWidth={sw} fill={on?'rgba(95,224,144,0.12)':'none'}/><path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round"/></g>,
  }[name];
  return <svg width="23" height="23" viewBox="0 0 24 24">{p}</svg>;
}

// ---------- Stat tile ----------
function Stat({ label, value, unit, accent='var(--ink)', empty }) {
  return (
    <div className="card" style={{ padding:'14px 12px', textAlign:'center' }}>
      <div className="num" style={{ fontSize:30, color: empty?'var(--ink-faint)':accent, lineHeight:1 }}>{value}{unit && <span style={{ fontSize:13, color:'var(--ink-faint)', marginLeft:2 }}>{unit}</span>}</div>
      <div className="label" style={{ fontSize:8.5, color:'var(--ink-faint)', marginTop:7 }}>{label}</div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ t, profile, repCenter, setRepCenter, preds, go }) {
  const [sel, setSel] = useState(null);
  const made = Object.keys(preds).length;
  const total = MATCHES.length;
  const pct = Math.round(made/total*100);
  const next = MATCHES.filter(m=>m.status==='open').slice(0,2);

  return (
    <div className="g-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--bg)' }}>
      {/* greeting header */}
      <div style={{ padding:'58px 18px 16px', background:'radial-gradient(120% 80% at 80% -20%, #16331F, var(--bg) 60%)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Logo h={18} />
          <div className="chip chip-green" style={{ fontSize:11 }}>📡 {t('remote_access')}</div>
        </div>
        <div style={{ marginTop:18, display:'flex', alignItems:'center', gap:13 }}>
          <div style={{ width:50, height:50, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--f-disp)', fontWeight:900, fontStyle:'italic', fontSize:22, color:'#06210F' }}>
            {(profile.nick||profile.name||'P')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:13, color:'var(--ink-dim)' }}>{t('welcome')},</div>
            <div className="disp" style={{ fontSize:26, color:'var(--ink)' }}>{profile.nick||profile.name||'Player'}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'4px 18px 120px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* remote access note */}
        <div style={{ display:'flex', gap:11, padding:'13px 15px', borderRadius:16, background:'var(--surface)', border:'1px solid var(--line)' }}>
          <div style={{ fontSize:20 }}>🔗</div>
          <div>
            <div className="disp" style={{ fontSize:15, color:'var(--ink)', lineHeight:1.12 }}>{t('first_activation')} · {t('remote_access')}</div>
            <div style={{ fontSize:12.5, color:'var(--ink-dim)', marginTop:5, lineHeight:1.4 }}>{t('remote_note')}</div>
          </div>
        </div>

        {/* center: choose or locked */}
        {!repCenter ? (
          <div className="card" style={{ padding:'18px 16px' }}>
            <SectionTitle>{t('choose_center')}</SectionTitle>
            <p style={{ fontSize:13, color:'var(--ink-dim)', margin:'2px 0 14px', lineHeight:1.4 }}>{t('choose_center_sub')}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
              {CENTERS.map(c=>{
                const on = sel===c.id;
                return (
                  <button key={c.id} onClick={()=>setSel(c.id)} style={{ cursor:'pointer', textAlign:'left',
                    padding:'12px', borderRadius:14, display:'flex', alignItems:'center', gap:10,
                    background: on?`${c.color}1a`:'var(--surface-2)', border:`1.5px solid ${on?c.color:'var(--line)'}`, transition:'all .15s' }}>
                    <CenterBadge center={c} size={28} />
                    <div style={{ minWidth:0 }}>
                      <div className="disp" style={{ fontSize:14, color:'var(--ink)' }}>{c.name}</div>
                      <div style={{ fontSize:10, color:'var(--ink-faint)' }}>{c.city}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button className="btn btn-green btn-md" style={{ marginTop:16, opacity: sel?1:0.4 }} disabled={!sel}
              onClick={()=>setRepCenter(cById(sel))}>
              {sel?`${t('center_locked')} GARRINCHA ${cById(sel).name}`:t('choose_center')}
            </button>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:12, fontSize:11, color:'var(--ink-faint)' }}>
              🔒 {t('center_locked_note')}
            </div>
          </div>
        ) : (
          <div style={{ position:'relative', overflow:'hidden', borderRadius:'var(--r-lg)', padding:'16px',
            background:`linear-gradient(110deg,${repCenter.color}1f,var(--surface))`, border:`1px solid ${repCenter.color}55` }}>
            <div style={{ display:'flex', alignItems:'center', gap:13 }}>
              <CenterBadge center={repCenter} size={44} />
              <div style={{ flex:1 }}>
                <div className="label" style={{ fontSize:9, color:repCenter.color }}>{t('center_locked')}</div>
                <div className="disp" style={{ fontSize:21, color:'var(--ink)' }}>GARRINCHA {repCenter.name}</div>
              </div>
              <span className="chip chip-locked">🔒</span>
            </div>
          </div>
        )}

        {/* stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }}>
          <Stat label={t('your_points')} value={0} accent="var(--gold)" empty />
          <Stat label={t('global_rank')} value="—" empty />
          <Stat label={t('center_rank')} value="—" empty />
        </div>

        {/* progress */}
        <div className="card" style={{ padding:'16px', display:'flex', alignItems:'center', gap:16 }}>
          <ProgressRing pct={pct} made={made} total={total} />
          <div style={{ flex:1 }}>
            <div className="disp" style={{ fontSize:18, color:'var(--ink)' }}>{t('matchday')} 1</div>
            <div style={{ fontSize:13, color:'var(--ink-dim)', marginTop:2 }}>{made} / {total} {t('predict_title').toLowerCase()}</div>
            <button className="btn btn-green" style={{ height:40, fontSize:14, marginTop:10 }} onClick={()=>go('predict')}>
              {made===0?t('predict_title'):t('view_all')}
            </button>
          </div>
        </div>

        {/* upcoming */}
        <div>
          <SectionTitle action={t('view_all')} onAction={()=>go('predict')}>{t('upcoming')}</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {next.map(m=>(
              <button key={m.id} onClick={()=>go('predict')} className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer', textAlign:'left' }}>
                <Flag code={m.home} size={30} />
                <span className="disp" style={{ fontSize:15, color:'var(--ink)' }}>{m.home}</span>
                <span style={{ fontSize:11, color:'var(--ink-faint)', flex:1, textAlign:'center' }}>{m.time}<br/>{m.date.split(' ').slice(0,2).join(' ')}</span>
                <span className="disp" style={{ fontSize:15, color:'var(--ink)' }}>{m.away}</span>
                <Flag code={m.away} size={30} />
              </button>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:12, fontSize:11.5, color:'var(--ink-faint)' }}>⏱ {t('lock_note')}</div>
        </div>

        {/* leaderboard links */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <LinkCard icon="🌍" label={t('tab_global')} sub={t('ranks_title')} onClick={()=>go('ranks')} />
          <LinkCard icon="🏟" label={t('tab_center')} sub={t('ranks_title')} onClick={()=>go('ranks')} />
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ pct, made, total }) {
  const r=26, c=2*Math.PI*r;
  return (
    <div style={{ position:'relative', width:68, height:68, flexShrink:0 }}>
      <svg width="68" height="68" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--green)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c-(pct/100)*c} style={{ transition:'stroke-dashoffset .6s' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span className="num" style={{ fontSize:17, color:'var(--ink)' }}>{made}</span>
        <span style={{ fontSize:9, color:'var(--ink-faint)' }}>/{total}</span>
      </div>
    </div>
  );
}

function LinkCard({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} className="card" style={{ padding:'14px', cursor:'pointer', textAlign:'left', display:'flex', flexDirection:'column', gap:6 }}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <div>
        <div className="disp" style={{ fontSize:15, color:'var(--ink)' }}>{label}</div>
        <div className="label" style={{ fontSize:8, color:'var(--ink-faint)', marginTop:2 }}>{sub}</div>
      </div>
    </button>
  );
}

// ============================================================
// PROFILE
// ============================================================
function Profile({ t, lang, setLang, profile, repCenter, go, openAdmin }) {
  return (
    <div className="g-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--bg)' }}>
      <ScreenHeader t={t} title={t('nav_you')} />
      <div style={{ padding:'8px 18px 120px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* identity */}
        <div className="card" style={{ padding:'18px 16px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--f-disp)', fontWeight:900, fontStyle:'italic', fontSize:24, color:'#06210F' }}>
            {(profile.nick||'P')[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="disp" style={{ fontSize:21, color:'var(--ink)' }}>{profile.nick||'Player'}</div>
            <div style={{ fontSize:12.5, color:'var(--ink-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile.email||'you@email.com'}</div>
          </div>
          {repCenter && <CenterBadge center={repCenter} size={34} />}
        </div>

        {/* language */}
        <div className="card" style={{ padding:'16px' }}>
          <div className="label" style={{ fontSize:9.5, color:'var(--ink-dim)', marginBottom:12 }}>Language · Taal · Langue</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {['en','nl','fr'].map(l=>(
              <button key={l} onClick={()=>setLang(l)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'13px 14px', borderRadius:12, cursor:'pointer', border:`1.5px solid ${lang===l?'var(--green)':'var(--line)'}`,
                background: lang===l?'rgba(95,224,144,0.08)':'var(--surface-2)' }}>
                <span className="disp" style={{ fontSize:15, color:'var(--ink)' }}>{I18N[l].lang_name}</span>
                {lang===l && <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="var(--green)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
            ))}
          </div>
        </div>

        {/* remote access link */}
        <div className="card" style={{ padding:'16px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'var(--green-deep)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>🔗</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="disp" style={{ fontSize:14, color:'var(--ink)' }}>{t('remote_access')}</div>
            <div style={{ fontFamily:'ui-monospace,monospace', fontSize:11, color:'var(--ink-faint)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>garrincha.app/p/9f3a…2b71</div>
          </div>
        </div>

        {/* admin entry (demo) */}
        <div>
          <SectionTitle>{t('admin')}</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            <AdminLink label={t('super_admin')} onClick={()=>openAdmin('super')} />
            <AdminLink label={t('center_admin')} onClick={()=>openAdmin('center')} />
            <AdminLink label={t('system_health')} onClick={()=>openAdmin('health')} />
          </div>
          <div style={{ fontSize:10.5, color:'var(--ink-faint)', marginTop:10, textAlign:'center' }}>Admin previews — staff access only</div>
        </div>
      </div>
    </div>
  );
}

function AdminLink({ label, onClick }) {
  return (
    <button onClick={onClick} className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'15px 16px', cursor:'pointer' }}>
      <span className="disp" style={{ fontSize:16, color:'var(--ink)' }}>{label}</span>
      <Chevron dir="right" c="var(--ink-faint)" />
    </button>
  );
}

Object.assign(window, { ScreenHeader, BottomNav, Dashboard, Profile, Stat, ProgressRing, LinkCard, AdminLink, NavIcon });
