// ============================================================
// GARRINCHA · Desktop Admin (Super Admin · Center Admin · System Health)
// ============================================================
const { useState: uS } = React;

const D_CENTERS = [
  { id:'antwerp',  short:'ANT', name:'Antwerp',  city:'Antwerp',  color:'#5FE090', admin:'M. Peeters',   players:214, preds:1460, status:'live' },
  { id:'brussels', short:'BRU', name:'Brussels', city:'Brussels', color:'#F5C242', admin:'S. Dubois',    players:301, preds:2090, status:'live' },
  { id:'ghent',    short:'GNT', name:'Ghent',    city:'Ghent',    color:'#6FB3FF', admin:'L. Janssens',  players:188, preds:1205, status:'live' },
  { id:'liege',    short:'LIE', name:'Liège',    city:'Liège',    color:'#FF8C66', admin:'C. Lambert',   players:142, preds:870,  status:'live' },
  { id:'leuven',   short:'LEU', name:'Leuven',   city:'Leuven',   color:'#C792EA', admin:'T. Maes',      players:121, preds:640,  status:'live' },
  { id:'bruges',   short:'BRG', name:'Bruges',   city:'Bruges',   color:'#4ED9C0', admin:'F. De Smet',   players:97,  status:'setup', preds:0 },
];

const D_PLAYERS = [
  { nick:'DeBruyne_Jr',  center:'antwerp',  email:'d•••@email.com', pts:184, preds:7, joined:'02 Jun', status:'active' },
  { nick:'PenaltyQueen', center:'brussels', email:'p•••@email.com', pts:171, preds:7, joined:'02 Jun', status:'active' },
  { nick:'TikiTaka_07',  center:'ghent',    email:'t•••@email.com', pts:166, preds:7, joined:'03 Jun', status:'active' },
  { nick:'NutmegNico',   center:'antwerp',  email:'n•••@email.com', pts:152, preds:6, joined:'03 Jun', status:'active' },
  { nick:'TheGaffer',    center:'liege',    email:'g•••@email.com', pts:148, preds:6, joined:'04 Jun', status:'active' },
  { nick:'GoalMachine',  center:'leuven',   email:'m•••@email.com', pts:141, preds:7, joined:'04 Jun', status:'active' },
  { nick:'CleanSheet99', center:'bruges',   email:'c•••@email.com', pts:137, preds:6, joined:'05 Jun', status:'active' },
  { nick:'CornerKickK',  center:'brussels', email:'k•••@email.com', pts:130, preds:7, joined:'05 Jun', status:'flagged' },
];

const D_SERVICES = [
  { name:'App',           desc:'Next.js frontend',     status:'ok',   up:'99.98%' },
  { name:'Supabase',      desc:'Database & auth',      status:'ok',   up:'99.99%' },
  { name:'Resend',        desc:'Access-link email',    status:'ok',   up:'99.95%' },
  { name:'Upstash Redis', desc:'Rate limit & cache',   status:'ok',   up:'99.97%' },
  { name:'Vercel',        desc:'Hosting & deploy',     status:'ok',   up:'100%'  },
  { name:'Sentry',        desc:'Error monitoring',     status:'warn', up:'98.40%' },
  { name:'Football API',  desc:'Fixtures & scores',    status:'ok',   up:'99.90%' },
  { name:'Campaign data', desc:'Centers & matches',    status:'ok',   up:'100%'  },
  { name:'Security',      desc:'Policies & access',    status:'ok',   up:'100%'  },
];
const D_ST = { ok:{c:'var(--green)',label:'Operational'}, warn:{c:'var(--gold)',label:'Degraded'}, down:{c:'var(--live)',label:'Down'} };
const cById = (id)=> D_CENTERS.find(c=>c.id===id);

// ---------- small bits ----------
function Shield({ c, size=30 }) {
  return (
    <span style={{ width:size, height:size*1.1, position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg viewBox="0 0 40 44" width={size} height={size*1.1} style={{ position:'absolute', inset:0 }}>
        <path d="M20 1 L38 7 V22 C38 33 30 40 20 43 C10 40 2 33 2 22 V7 Z" fill={c.color} fillOpacity="0.16" stroke={c.color} strokeWidth="1.6"/>
      </svg>
      <b style={{ position:'relative', fontFamily:'var(--f-disp)', fontStyle:'italic', fontSize:size*0.32, color:c.color }}>{c.short}</b>
    </span>
  );
}
function Dot({ s }){ return <span style={{ width:9, height:9, borderRadius:99, background:D_ST[s].c, boxShadow:`0 0 8px ${D_ST[s].c}`, display:'inline-block' }} />; }
function Pill({ children, c='var(--green)' }){ return <span className="apill" style={{ background:`${c}1f`, color:c }}>{children}</span>; }
function QR({ size=150 }){
  const n=11, c=size/n, seed='11111011110000010100010110101101001110100100101011010110010101001011101000110011000101100111011111';
  const dots=[]; for(let y=0;y<n;y++)for(let x=0;x<n;x++){ if((x<4&&y<4)||(x>n-5&&y<4)||(x<4&&y>n-5))continue; if(seed[(y*n+x)%seed.length]==='1') dots.push(<rect key={x+'_'+y} x={x*c} y={y*c} width={c} height={c} fill="#0A0D0A"/>); }
  const fnd=(x,y)=>(<g key={x+'-'+y}><rect x={x*c} y={y*c} width={3*c} height={3*c} fill="#0A0D0A"/><rect x={(x+0.6)*c} y={(y+0.6)*c} width={1.8*c} height={1.8*c} fill="#fff"/><rect x={(x+1)*c} y={(y+1)*c} width={c} height={c} fill="#0A0D0A"/></g>);
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:'block'}}><rect width={size} height={size} fill="#fff"/>{dots}{fnd(0,0)}{fnd(n-3,0)}{fnd(0,n-3)}</svg>;
}

function KPI({ value, label, accent='var(--ink)', delta }) {
  return (
    <div className="acard kpi">
      <div className="num kpi-v" style={{ color:accent }}>{value}</div>
      <div className="kpi-l">{label}</div>
      {delta && <div className="kpi-d">↑ {delta}</div>}
    </div>
  );
}

function Table({ cols, rows, render }) {
  return (
    <div className="acard" style={{ overflow:'hidden', padding:0 }}>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr>{cols.map(c=> <th key={c.key} style={{ textAlign:c.align||'left' }}>{c.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>{cols.map(c=> <td key={c.key} style={{ textAlign:c.align||'left' }}>{render(r,c.key)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Panel({ title, action, children, style }) {
  return (
    <div className="acard" style={style}>
      {(title||action) && <div className="panel-h"><h3>{title}</h3>{action}</div>}
      {children}
    </div>
  );
}

// ============================================================
// PAGES — SUPER ADMIN
// ============================================================
function SuperOverview() {
  const totalPlayers = D_CENTERS.reduce((a,c)=>a+c.players,0);
  const totalPreds = D_CENTERS.reduce((a,c)=>a+c.preds,0);
  return (
    <React.Fragment>
      <div className="kpi-row">
        <KPI value="6" label="Active centers" accent="var(--green)" />
        <KPI value={totalPlayers.toLocaleString()} label="Players" delta="86 today" />
        <KPI value={totalPreds.toLocaleString()} label="Predictions" accent="var(--gold)" delta="612 today" />
        <KPI value="64" label="Matches tracked" />
      </div>

      <div className="two-col">
        <Panel title="Centers" action={<a className="link">Manage all →</a>}>
          <Table
            cols={[{key:'name',label:'Center'},{key:'admin',label:'Center admin'},{key:'players',label:'Players',align:'right'},{key:'preds',label:'Predictions',align:'right'},{key:'status',label:'Status',align:'right'}]}
            rows={D_CENTERS}
            render={(r,k)=>{
              if(k==='name') return <div className="cell-center"><Shield c={r} size={26} /><b>{r.name}</b></div>;
              if(k==='admin') return <span className="muted">{r.admin}</span>;
              if(k==='players') return <b className="num">{r.players}</b>;
              if(k==='preds') return <span className="num muted">{r.preds.toLocaleString()}</span>;
              if(k==='status') return r.status==='live'? <Pill>● Live</Pill> : <Pill c="var(--gold)">● Setup</Pill>;
            }} />
        </Panel>

        <div className="stack">
          <Panel title="Quick tools">
            <div className="tool-list">
              {[['📱','QR activation','Generate & rotate codes'],['✏️','Score correction','Adjust points · logged'],['🎁','Bonus points','Award campaign bonuses'],['📤','Export report','Players · CSV / XLSX']].map((x,i)=>(
                <button key={i} className="tool-row"><span className="tool-ic">{x[0]}</span><span><b>{x[1]}</b><small>{x[2]}</small></span><span className="chev">›</span></button>
              ))}
            </div>
          </Panel>
          <Panel title="Campaign">
            <div className="mini-stat"><span className="muted">Matchday</span><b className="num">1 / 8</b></div>
            <div className="mini-stat"><span className="muted">Window</span><b>09–12 Jun</b></div>
            <div className="mini-stat"><span className="muted">Next lock</span><b style={{color:'var(--green)'}}>Today 18:05</b></div>
            <div className="progress"><div style={{ width:'13%' }} /></div>
          </Panel>
        </div>
      </div>
    </React.Fragment>
  );
}

function CentersPage() {
  return (
    <Panel title="All centers" action={<a className="link">+ Add center</a>}>
      <Table
        cols={[{key:'name',label:'Center'},{key:'city',label:'City'},{key:'admin',label:'Center admin'},{key:'players',label:'Players',align:'right'},{key:'preds',label:'Predictions',align:'right'},{key:'status',label:'Status',align:'right'}]}
        rows={D_CENTERS}
        render={(r,k)=>{
          if(k==='name') return <div className="cell-center"><Shield c={r} size={26} /><b>{r.name}</b></div>;
          if(k==='city') return <span className="muted">{r.city}</span>;
          if(k==='admin') return <span className="muted">{r.admin}</span>;
          if(k==='players') return <b className="num">{r.players}</b>;
          if(k==='preds') return <span className="num muted">{r.preds.toLocaleString()}</span>;
          if(k==='status') return r.status==='live'? <Pill>● Live</Pill> : <Pill c="var(--gold)">● Setup</Pill>;
        }} />
    </Panel>
  );
}

function PlayersPage({ centerFilter }) {
  const [q,setQ] = uS('');
  const rows = D_PLAYERS.filter(p=>(!centerFilter||p.center===centerFilter) && (!q||p.nick.toLowerCase().includes(q.toLowerCase())));
  return (
    <Panel title={centerFilter? 'Center players' : 'All players'} action={<input className="search-sm" placeholder="Search nickname…" value={q} onChange={e=>setQ(e.target.value)} />}>
      <Table
        cols={[{key:'nick',label:'Nickname'},{key:'email',label:'Email'},...(centerFilter?[]:[{key:'center',label:'Center'}]),{key:'preds',label:'Predictions',align:'right'},{key:'pts',label:'Points',align:'right'},{key:'joined',label:'Joined',align:'right'},{key:'status',label:'',align:'right'}]}
        rows={rows}
        render={(r,k)=>{
          if(k==='nick') return <b>{r.nick}</b>;
          if(k==='email') return <span className="muted mono">{r.email}</span>;
          if(k==='center'){ const c=cById(r.center); return <div className="cell-center"><Shield c={c} size={22} /><span className="muted">{c.name}</span></div>; }
          if(k==='preds') return <span className="num muted">{r.preds}</span>;
          if(k==='pts') return <b className="num" style={{color:'var(--gold)'}}>{r.pts}</b>;
          if(k==='joined') return <span className="muted">{r.joined}</span>;
          if(k==='status') return r.status==='flagged'? <Pill c="var(--live)">flagged</Pill> : <Pill>active</Pill>;
        }} />
    </Panel>
  );
}

function GenericTablePage({ title, centerFilter }) {
  const base = centerFilter ? D_PLAYERS.filter(p=>p.center===centerFilter) : D_PLAYERS;
  const rows = [...base].sort((a,b)=>b.pts-a.pts).map((p,i)=>({ ...p, rank:i+1 }));
  const cols = [{key:'rank',label:'#'},{key:'nick',label:'Player'},...(centerFilter?[]:[{key:'center',label:'Center'}]),{key:'preds',label:'Predictions',align:'right'},{key:'pts',label:'Points',align:'right'}];
  return (
    <Panel title={title}>
      <Table
        cols={cols}
        rows={rows}
        render={(r,k)=>{
          if(k==='rank') return <b className="num" style={{color: r.rank<=3?'var(--gold)':'var(--ink-faint)'}}>{r.rank}</b>;
          if(k==='nick') return <b>{r.nick}</b>;
          if(k==='center'){ const c=cById(r.center); return <div className="cell-center"><Shield c={c} size={22} /><span className="muted">{c.name}</span></div>; }
          if(k==='preds') return <span className="num muted">{r.preds}</span>;
          if(k==='pts') return <b className="num" style={{color:'var(--gold)'}}>{r.pts}</b>;
        }} />
    </Panel>
  );
}

function QRToolsPage({ only }) {
  if (only) {
    const c = cById(only);
    return (
      <Panel title="Center QR activation">
        <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
          <div className="qr-box"><QR size={150} /></div>
          <div style={{ flex:1, minWidth:200 }}>
            <div className="cell-center" style={{ marginBottom:10 }}><Shield c={c} size={28} /><b style={{fontFamily:'var(--f-disp)',fontStyle:'italic',fontSize:20}}>GARRINCHA {c.name}</b></div>
            <div className="muted" style={{ fontSize:13.5, lineHeight:1.5, maxWidth:380 }}>Players scan this code at your center to register and represent {c.name}.</div>
            <div className="mono muted" style={{ marginTop:10 }}>code: {c.short}-2026</div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}><button className="abtn green">Download poster (PDF)</button><button className="abtn ghost">Rotate code</button></div>
            <div className="muted" style={{ fontSize:12, marginTop:16 }}>🔒 No access to other centers or global controls.</div>
          </div>
        </div>
      </Panel>
    );
  }
  return (
    <div className="two-col">
      <Panel title="Center QR codes" action={<a className="link">Rotate all</a>}>
        <Table
          cols={[{key:'name',label:'Center'},{key:'code',label:'Activation code'},{key:'act',label:'',align:'right'}]}
          rows={D_CENTERS}
          render={(r,k)=>{
            if(k==='name') return <div className="cell-center"><Shield c={r} size={24} /><b>{r.name}</b></div>;
            if(k==='code') return <span className="mono muted">{r.short}-2026</span>;
            if(k==='act') return <span style={{display:'flex',gap:8,justifyContent:'flex-end'}}><a className="link">Poster</a><a className="link">Rotate</a></span>;
          }} />
      </Panel>
      <Panel title="Activation poster">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'8px 0' }}>
          <div className="qr-box"><QR size={150} /></div>
          <div style={{ textAlign:'center' }}><b style={{fontFamily:'var(--f-disp)',fontStyle:'italic',fontSize:18}}>Scan to join Antwerp</b><div className="muted mono" style={{marginTop:4}}>code: ANT-2026</div></div>
          <button className="abtn green">Download poster (PDF)</button>
        </div>
      </Panel>
    </div>
  );
}

// ============================================================
// SYSTEM HEALTH
// ============================================================
function HealthPage() {
  const allOk = D_SERVICES.every(s=>s.status==='ok');
  return (
    <React.Fragment>
      <div className="acard health-banner" style={{ borderColor: allOk?'rgba(95,224,144,.3)':'rgba(245,194,66,.3)', background: allOk?'rgba(95,224,144,.06)':'rgba(245,194,66,.06)' }}>
        <div className="hb-ic" style={{ background: allOk?'var(--green)':'var(--gold)' }}>{allOk?'✓':'!'}</div>
        <div style={{ flex:1 }}>
          <h3 style={{ fontFamily:'var(--f-disp)', fontStyle:'italic', fontSize:24, margin:0 }}>{allOk?'All systems operational':'Minor issue detected'}</h3>
          <div className="muted">{D_SERVICES.filter(s=>s.status==='ok').length}/{D_SERVICES.length} services healthy · auto-checked every 60s</div>
        </div>
        <button className="abtn ghost">Refresh</button>
      </div>
      <div className="health-grid">
        {D_SERVICES.map(s=>(
          <div key={s.name} className="acard svc">
            <div className="svc-top"><Dot s={s.status} /><b>{s.name}</b><Pill c={D_ST[s.status].c}>{D_ST[s.status].label}</Pill></div>
            <div className="muted svc-desc">{s.desc}</div>
            <div className="svc-foot"><span className="muted">Uptime 30d</span><b className="num">{s.up}</b></div>
          </div>
        ))}
      </div>
      <div className="muted" style={{ textAlign:'center', fontSize:12.5 }}>🔒 Safe status labels only — no secrets, keys or credentials are ever shown.</div>
    </React.Fragment>
  );
}

// ============================================================
// CENTER ADMIN
// ============================================================
function CenterOverview() {
  const c = D_CENTERS[0];
  return (
    <React.Fragment>
      <div className="acard center-hero" style={{ background:`linear-gradient(110deg,${c.color}1f,var(--surface))`, borderColor:`${c.color}55` }}>
        <Shield c={c} size={48} />
        <div style={{ flex:1 }}>
          <div className="kpi-l" style={{ color:c.color }}>Your center</div>
          <h2 style={{ fontFamily:'var(--f-disp)', fontStyle:'italic', fontSize:30, margin:'2px 0 0' }}>GARRINCHA {c.name}</h2>
        </div>
        <Pill c="var(--green)">● Live</Pill>
      </div>
      <div className="kpi-row">
        <KPI value={c.players} label="Center players" accent="var(--green)" delta="12 today" />
        <KPI value={c.preds.toLocaleString()} label="Predictions" accent="var(--gold)" />
        <KPI value="#2" label="Center rank (overall)" />
        <KPI value="ANT-2026" label="Activation code" />
      </div>
      <div className="two-col">
        <GenericTablePage title="Center leaderboard" centerFilter="antwerp" />
        <Panel title="Center QR">
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'6px 0' }}>
            <div className="qr-box"><QR size={140} /></div>
            <button className="abtn green">Download poster</button>
            <div className="muted" style={{fontSize:12,textAlign:'center'}}>🔒 No access to global Super Admin controls.</div>
          </div>
        </Panel>
      </div>
    </React.Fragment>
  );
}

// ============================================================
// SHELL
// ============================================================
const NAV = {
  super: [
    { k:'overview',  label:'Overview',     ic:'▦' },
    { k:'centers',   label:'Centers',      ic:'🏟' },
    { k:'players',   label:'Players',      ic:'👥' },
    { k:'leaderboards', label:'Leaderboards', ic:'📊' },
    { k:'prizes',    label:'Prize winners',ic:'🏆' },
    { k:'qr',        label:'QR tools',     ic:'📱' },
    { k:'health',    label:'System health',ic:'🩺' },
  ],
  center: [
    { k:'overview',  label:'Overview',     ic:'▦' },
    { k:'players',   label:'Center players',ic:'👥' },
    { k:'leaderboards', label:'Leaderboard', ic:'📊' },
    { k:'prizes',    label:'Prize winners',ic:'🏆' },
    { k:'qr',        label:'Center QR',    ic:'📱' },
  ],
};
const TITLES = { overview:'Overview', centers:'Centers', players:'Players', leaderboards:'Leaderboards', prizes:'Prize winners', qr:'QR activation', health:'System health' };

function AdminDesktop() {
  const [role,setRole] = uS('super');
  const [page,setPage] = uS('overview');
  const [navOpen,setNavOpen] = uS(false);
  const nav = NAV[role];

  const switchRole = (r)=>{ setRole(r); setPage('overview'); };
  const goPage = (p)=>{ setPage(p); setNavOpen(false); };

  const body = () => {
    if (role==='center') {
      if (page==='overview') return <CenterOverview />;
      if (page==='players') return <PlayersPage centerFilter="antwerp" />;
      if (page==='qr') return <QRToolsPage only="antwerp" />;
      return <GenericTablePage title={TITLES[page]} centerFilter="antwerp" />;
    }
    switch(page){
      case 'overview': return <SuperOverview />;
      case 'centers':  return <CentersPage />;
      case 'players':  return <PlayersPage />;
      case 'qr':       return <QRToolsPage />;
      case 'health':   return <HealthPage />;
      default:         return <GenericTablePage title={TITLES[page]} />;
    }
  };

  return (
    <div className="admin-root">
      <aside className={'side'+(navOpen?' open':'')}>
        <div className="side-top">
          <img src="app/assets/garrincha-white.png" alt="GARRINCHA" style={{ height:20 }} />
          <span className="side-tag">ADMIN</span>
        </div>
        <div className="role-switch">
          <button className={role==='super'?'on':''} onClick={()=>switchRole('super')}>Super</button>
          <button className={role==='center'?'on':''} onClick={()=>switchRole('center')}>Center</button>
        </div>
        <nav className="side-nav">
          {nav.map(n=>(
            <button key={n.k} className={'side-link'+(page===n.k?' active':'')} onClick={()=>goPage(n.k)}>
              <span className="side-ic">{n.ic}</span>{n.label}
              {n.k==='health' && <Dot s="warn" />}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <div className="avatar">A</div>
          <div style={{ flex:1, minWidth:0 }}><b style={{fontSize:13}}>Admin</b><div className="muted" style={{fontSize:11}}>{role==='super'?'Platform':'Antwerp'}</div></div>
          <span className="chev">⎋</span>
        </div>
      </aside>

      {navOpen && <div className="scrim" onClick={()=>setNavOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="hamb" onClick={()=>setNavOpen(true)}>☰</button>
          <div>
            <div className="crumb">{role==='super'?'Super Admin':'Center Admin · Antwerp'}</div>
            <h1>{TITLES[page]}</h1>
          </div>
          <div className="top-right">
            <span className="preview-tag">👁 Concept preview · sample data</span>
            <span className="date-pill">Wed 10 Jun · 16:42</span>
          </div>
        </header>
        <div className="content">{body()}</div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminDesktop />);
