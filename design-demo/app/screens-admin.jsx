// ============================================================
// GARRINCHA · Admin previews — Super Admin, Center Admin, System Health
// ============================================================

function AdminShell({ title, badge, onBack, children }) {
  return (
    <div className="g-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--bg)' }}>
      <div style={{ position:'sticky', top:0, zIndex:30, background:'rgba(10,13,10,0.85)', backdropFilter:'blur(14px)',
        borderBottom:'1px solid var(--line)', padding:'56px 16px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} style={{ width:40, height:40, borderRadius:12, border:'1px solid var(--line-2)', background:'var(--surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Chevron dir="left" c="var(--ink)" />
          </button>
          <div style={{ flex:1 }}>
            <div className="label" style={{ fontSize:8.5, color:'var(--green)' }}>{badge}</div>
            <h1 className="disp" style={{ fontSize:24, color:'var(--ink)', margin:0 }}>{title}</h1>
          </div>
          <Logo h={15} style={{ opacity:.8 }} />
        </div>
      </div>
      <div style={{ padding:'14px 16px 40px', display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:10,
          background:'rgba(111,179,255,0.08)', border:'1px dashed rgba(111,179,255,0.3)' }}>
          <span style={{ fontSize:12 }}>👁</span>
          <span style={{ fontSize:11, color:'var(--info)', fontWeight:600 }}>Concept preview · sample metrics</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function MetricCard({ value, label, accent='var(--ink)', delta }) {
  return (
    <div className="card" style={{ padding:'15px 14px' }}>
      <div className="num" style={{ fontSize:28, color:accent, lineHeight:1 }}>{value}</div>
      <div className="label" style={{ fontSize:8.5, color:'var(--ink-faint)', marginTop:7 }}>{label}</div>
      {delta && <div style={{ fontSize:10.5, color:'var(--green)', marginTop:4, fontWeight:700 }}>↑ {delta}</div>}
    </div>
  );
}

function AdminNavRow({ icon, label, meta, onClick }) {
  return (
    <button onClick={onClick} className="card" style={{ display:'flex', alignItems:'center', gap:13, padding:'14px', cursor:'pointer', textAlign:'left', width:'100%' }}>
      <div style={{ width:38, height:38, borderRadius:11, background:'var(--surface-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="disp" style={{ fontSize:16, color:'var(--ink)' }}>{label}</div>
        {meta && <div style={{ fontSize:11.5, color:'var(--ink-faint)' }}>{meta}</div>}
      </div>
      <Chevron dir="right" c="var(--ink-faint)" />
    </button>
  );
}

function AdminSection({ label, children }) {
  return (
    <div>
      <div className="label" style={{ fontSize:9.5, color:'var(--ink-dim)', margin:'2px 0 10px' }}>{label}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>{children}</div>
    </div>
  );
}

// ============================================================
// SUPER ADMIN
// ============================================================
function SuperAdmin({ t, onBack }) {
  return (
    <AdminShell title={t('super_admin')} badge="Platform control" onBack={onBack}>
      <AdminSection label="Platform overview">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
          <MetricCard value="6" label="Active centers" accent="var(--green)" />
          <MetricCard value="1,248" label="Players" accent="var(--ink)" delta="86 today" />
          <MetricCard value="7,930" label="Predictions" accent="var(--gold)" />
          <MetricCard value="64" label="Matches tracked" accent="var(--ink)" />
        </div>
      </AdminSection>

      <AdminSection label="Manage">
        <AdminNavRow icon="🏟" label="Centers" meta="6 centers · QR codes" onClick={()=>{}} />
        <AdminNavRow icon="👥" label="Players" meta="1,248 registered" onClick={()=>{}} />
        <AdminNavRow icon="⚽" label="Predictions" meta="Matchday fixtures & locks" onClick={()=>{}} />
        <AdminNavRow icon="📊" label="Leaderboards" meta="Global & per center" onClick={()=>{}} />
        <AdminNavRow icon="🏆" label="Prize winners" meta="Per center · export" onClick={()=>{}} />
      </AdminSection>

      <AdminSection label="Tools">
        <AdminNavRow icon="📱" label="QR activation tools" meta="Generate & rotate center codes" onClick={()=>{}} />
        <AdminNavRow icon="✏️" label="Score correction / bonus" meta="Adjust points · audit logged" onClick={()=>{}} />
        <AdminNavRow icon="🩺" label="System health" meta="All services" onClick={()=>{}} />
      </AdminSection>

      <button className="btn btn-ghost btn-md" onClick={()=>{}}>Export campaign report (CSV)</button>
    </AdminShell>
  );
}

// ============================================================
// CENTER ADMIN
// ============================================================
function CenterAdmin({ t, onBack }) {
  const center = CENTERS[0];
  return (
    <AdminShell title={t('center_admin')} badge="Assigned center only" onBack={onBack}>
      {/* center identity */}
      <div style={{ position:'relative', overflow:'hidden', borderRadius:'var(--r-lg)', padding:'16px',
        background:`linear-gradient(110deg,${center.color}1f,var(--surface))`, border:`1px solid ${center.color}55`, display:'flex', alignItems:'center', gap:13 }}>
        <CenterBadge center={center} size={44} />
        <div>
          <div className="label" style={{ fontSize:9, color:center.color }}>Your center</div>
          <div className="disp" style={{ fontSize:21, color:'var(--ink)' }}>GARRINCHA {center.name}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
        <MetricCard value="214" label="Center players" accent="var(--green)" delta="12 today" />
        <MetricCard value="1,460" label="Predictions" accent="var(--gold)" />
      </div>

      {/* QR activation code */}
      <div className="card" style={{ padding:'18px', display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ background:'#fff', padding:8, borderRadius:12, flexShrink:0 }}><QRCode size={92} /></div>
        <div>
          <div className="label" style={{ fontSize:9, color:'var(--green)' }}>Center QR activation</div>
          <div className="disp" style={{ fontSize:18, color:'var(--ink)', marginTop:2 }}>Scan to join {center.name}</div>
          <div style={{ fontFamily:'ui-monospace,monospace', fontSize:11.5, color:'var(--ink-faint)', marginTop:6 }}>code: ANT-2026</div>
          <button className="btn btn-green" style={{ height:36, fontSize:13, marginTop:10, width:'auto', padding:'0 16px' }}>Download poster</button>
        </div>
      </div>

      <AdminSection label="Manage">
        <AdminNavRow icon="👥" label="Center players" meta="214 players" onClick={()=>{}} />
        <AdminNavRow icon="📊" label="Center leaderboard" meta="Live ranking" onClick={()=>{}} />
        <AdminNavRow icon="🏆" label="Center prize winners" meta="Top 3 · export" onClick={()=>{}} />
      </AdminSection>

      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'11px 13px', borderRadius:11, background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)' }}>
        <span style={{ fontSize:13 }}>🔒</span>
        <span style={{ fontSize:11.5, color:'var(--ink-faint)' }}>No access to global Super Admin controls.</span>
      </div>
    </AdminShell>
  );
}

// ============================================================
// SYSTEM HEALTH
// ============================================================
const SERVICES = [
  { name:'App', desc:'Next.js frontend', status:'ok' },
  { name:'Supabase', desc:'Database & auth', status:'ok' },
  { name:'Resend', desc:'Access-link email', status:'ok' },
  { name:'Upstash Redis', desc:'Rate limit & cache', status:'ok' },
  { name:'Vercel', desc:'Hosting & deploy', status:'ok' },
  { name:'Sentry', desc:'Error monitoring', status:'warn' },
  { name:'Football API', desc:'Fixtures & scores', status:'ok' },
  { name:'Campaign data', desc:'Centers & matches', status:'ok' },
  { name:'Security', desc:'Policies & access', status:'ok' },
];
const ST = {
  ok:   { c:'var(--green)', label:'Operational', dot:'var(--green)' },
  warn: { c:'var(--gold)',  label:'Degraded',    dot:'var(--gold)' },
  down: { c:'var(--live)',  label:'Down',        dot:'var(--live)' },
};

function SystemHealth({ t, onBack }) {
  const allOk = SERVICES.every(s=>s.status==='ok');
  return (
    <AdminShell title={t('system_health')} badge="Super Admin only" onBack={onBack}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px', borderRadius:'var(--r-lg)',
        background: allOk?'rgba(95,224,144,0.08)':'rgba(245,194,66,0.08)', border:`1px solid ${allOk?'rgba(95,224,144,0.3)':'rgba(245,194,66,0.3)'}` }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background: allOk?'var(--green)':'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{allOk?'✓':'!'}</div>
        <div>
          <div className="disp" style={{ fontSize:20, color:'var(--ink)' }}>{allOk?'All systems operational':'Minor issue detected'}</div>
          <div style={{ fontSize:12, color:'var(--ink-dim)' }}>{SERVICES.filter(s=>s.status==='ok').length}/{SERVICES.length} services healthy</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
        {SERVICES.map(s=>{
          const st = ST[s.status];
          return (
            <div key={s.name} className="card" style={{ padding:'14px', position:'relative' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                <span style={{ width:9, height:9, borderRadius:99, background:st.dot, boxShadow:`0 0 8px ${st.dot}` }} />
                <span className="disp" style={{ fontSize:15, color:'var(--ink)' }}>{s.name}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--ink-faint)', marginBottom:8, minHeight:14 }}>{s.desc}</div>
              <span className="chip" style={{ fontSize:10, padding:'4px 9px', background:`${st.c}1f`, color:st.c }}>{st.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize:10.5, color:'var(--ink-faint)', textAlign:'center', lineHeight:1.5 }}>
        🔒 Safe status labels only — no secrets, keys or credentials are ever shown.
      </div>
    </AdminShell>
  );
}

Object.assign(window, { SuperAdmin, CenterAdmin, SystemHealth, AdminShell, MetricCard, AdminNavRow, AdminSection });
