// ============================================================
// GARRINCHA · Leaderboards (3 variants) + Prize winners
// ============================================================

// Sample standings — CLEARLY marked placeholder/preview only
const SAMPLE_BOARD = [
  { rank:1, nick:'DeBruyne_Jr',  center:'antwerp',  pts:184, played:7 },
  { rank:2, nick:'PenaltyQueen', center:'brussels', pts:171, played:7 },
  { rank:3, nick:'TikiTaka_07',  center:'ghent',    pts:166, played:7 },
  { rank:4, nick:'NutmegNico',   center:'antwerp',  pts:152, played:7 },
  { rank:5, nick:'TheGaffer',    center:'liege',    pts:148, played:6 },
  { rank:6, nick:'GoalMachine',  center:'leuven',   pts:141, played:7 },
  { rank:7, nick:'CleanSheet99', center:'bruges',   pts:137, played:6 },
  { rank:8, nick:'CornerKickK',  center:'brussels', pts:130, played:7 },
];

function PreviewToggle({ mode, setMode, t }) {
  return (
    <div style={{ display:'flex', gap:4, padding:4, borderRadius:12, background:'var(--surface)', border:'1px solid var(--line)', margin:'0 0 14px' }}>
      {[['preview','Preview (sample)'],['empty','Live / empty']].map(([k,l])=>(
        <button key={k} onClick={()=>setMode(k)} style={{
          flex:1, height:36, borderRadius:9, border:0, cursor:'pointer',
          fontFamily:'var(--f-body)', fontWeight:700, fontSize:12, letterSpacing:'0.02em',
          background: mode===k?'var(--surface-2)':'transparent', color: mode===k?'var(--ink)':'var(--ink-dim)' }}>{l}</button>
      ))}
    </div>
  );
}

function PreviewBanner({ children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 13px', borderRadius:11, marginBottom:14,
      background:'rgba(111,179,255,0.10)', border:'1px dashed rgba(111,179,255,0.35)' }}>
      <span style={{ fontSize:13 }}>👁</span>
      <span style={{ fontSize:11.5, color:'var(--info)', fontWeight:600, lineHeight:1.3 }}>{children}</span>
    </div>
  );
}

const cById = (id)=> CENTERS.find(c=>c.id===id);

// ---------- Tabs ----------
function SegTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:4, padding:4, borderRadius:14, background:'var(--surface)', border:'1px solid var(--line)' }}>
      {tabs.map(tab=>(
        <button key={tab.k} onClick={()=>onChange(tab.k)} style={{
          flex:1, height:42, borderRadius:10, border:0, cursor:'pointer',
          fontFamily:'var(--f-disp)', fontWeight:900, fontStyle:'italic', textTransform:'uppercase', fontSize:14,
          background: active===tab.k?'var(--green)':'transparent', color: active===tab.k?'#06210F':'var(--ink-dim)',
          transition:'all .15s' }}>{tab.label}</button>
      ))}
    </div>
  );
}

// ============================================================
// LEADERBOARD SCREEN
// ============================================================
function Leaderboard({ t, tweaks, repCenter, profile }) {
  const [tab, setTab] = useState('global');
  const [mode, setMode] = useState('preview');
  const style = tweaks.boardStyle || 'podium';

  const rows = tab==='center' && repCenter
    ? SAMPLE_BOARD.filter(r=>r.center===repCenter.id).map((r,i)=>({...r, rank:i+1}))
    : SAMPLE_BOARD;

  return (
    <div className="g-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--bg)' }}>
      <ScreenHeader t={t} title={t('ranks_title')} />
      <div style={{ padding:'4px 18px 120px' }}>
        <SegTabs active={tab} onChange={setTab} tabs={[{k:'global',label:t('tab_global')},{k:'center',label:t('tab_center')}]} />
        <div style={{ height:14 }} />
        <PreviewToggle mode={mode} setMode={setMode} t={t} />

        {mode==='empty' ? (
          <EmptyState icon="📊" title={t('empty_board_t')} body={t('empty_board_d')} />
        ) : (
          <React.Fragment>
            <PreviewBanner>Sample standings — preview only. The live app shows real data once matches are scored.</PreviewBanner>
            {style==='podium'  && <BoardPodium rows={rows} t={t} profile={profile} tab={tab} />}
            {style==='clean'   && <BoardClean  rows={rows} t={t} profile={profile} tab={tab} />}
            {style==='versus'  && <BoardVersus rows={rows} t={t} tab={tab} repCenter={repCenter} />}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ----- variant: podium -----
function BoardPodium({ rows, t, profile, tab }) {
  const top = rows.slice(0,3);
  const rest = rows.slice(3);
  const order = [top[1], top[0], top[2]].filter(Boolean); // 2,1,3
  const heights = { 1:108, 2:84, 3:70 };
  const medal = { 1:'var(--gold)', 2:'#C8CDD4', 3:'#CD8B5B' };
  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:10, marginBottom:18 }}>
        {order.map(p=>{
          const c = cById(p.center);
          return (
            <div key={p.rank} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
              <CenterBadge center={c} size={30} />
              <div className="disp" style={{ fontSize:13, color:'var(--ink)', marginTop:6, textAlign:'center', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nick}</div>
              <div className="num" style={{ fontSize:18, color:medal[p.rank], marginBottom:6 }}>{p.pts}</div>
              <div style={{ width:'100%', height:heights[p.rank], borderRadius:'12px 12px 0 0',
                background:`linear-gradient(180deg,${medal[p.rank]}33, ${medal[p.rank]}08)`, border:`1px solid ${medal[p.rank]}55`, borderBottom:0,
                display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:10 }}>
                <span className="disp" style={{ fontSize:30, color:medal[p.rank] }}>{p.rank}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {rest.map(p=> <RankRow key={p.rank} p={p} t={t} />)}
      </div>
    </div>
  );
}

// ----- variant: clean -----
function BoardClean({ rows, t }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {rows.map(p=> <RankRow key={p.rank} p={p} t={t} highlight={p.rank<=3} />)}
    </div>
  );
}

function RankRow({ p, t, highlight }) {
  const c = cById(p.center);
  const medal = p.rank===1?'var(--gold)':p.rank===2?'#C8CDD4':p.rank===3?'#CD8B5B':null;
  return (
    <div className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
      background: medal && highlight?`linear-gradient(100deg,${medal}14,transparent)`:'var(--surface)',
      borderColor: medal && highlight?`${medal}40`:'var(--line)' }}>
      <span className="disp" style={{ fontSize:20, width:26, textAlign:'center', color: medal||'var(--ink-faint)' }}>{p.rank}</span>
      <CenterBadge center={c} size={28} />
      <div style={{ flex:1, minWidth:0 }}>
        <div className="disp" style={{ fontSize:16, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.nick}</div>
        <div style={{ fontSize:11, color:'var(--ink-faint)' }}>{c?c.name:''} · {p.played} {t('predict_title').toLowerCase()}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <span className="num" style={{ fontSize:22, color: medal||'var(--green)' }}>{p.pts}</span>
        <div className="label" style={{ fontSize:8, color:'var(--ink-faint)' }}>{t('pts')}</div>
      </div>
    </div>
  );
}

// ----- variant: versus (center vs center) -----
function BoardVersus({ rows, t }) {
  // aggregate points by center
  const agg = {};
  SAMPLE_BOARD.forEach(r=>{ agg[r.center]=(agg[r.center]||0)+r.pts; });
  const centers = Object.entries(agg).map(([id,pts])=>({ c:cById(id), pts })).sort((a,b)=>b.pts-a.pts);
  const max = centers[0].pts;
  return (
    <div>
      <div className="label" style={{ fontSize:9.5, color:'var(--green)', marginBottom:10 }}>Center vs center</div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {centers.map((x,i)=>(
          <div key={x.c.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span className="disp" style={{ fontSize:16, width:20, color: i===0?'var(--gold)':'var(--ink-faint)' }}>{i+1}</span>
            <CenterBadge center={x.c} size={26} />
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span className="disp" style={{ fontSize:14, color:'var(--ink)' }}>{x.c.name}</span>
                <span className="num" style={{ fontSize:15, color:x.c.color }}>{x.pts}</span>
              </div>
              <div style={{ height:9, borderRadius:99, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${x.pts/max*100}%`, borderRadius:99, background:x.c.color, transition:'width .6s' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="label" style={{ fontSize:9.5, color:'var(--ink-faint)', marginBottom:10 }}>Top players</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {rows.slice(0,5).map(p=> <RankRow key={p.rank} p={p} t={t} />)}
      </div>
    </div>
  );
}

// ============================================================
// PRIZE WINNERS SCREEN
// ============================================================
function Prizes({ t }) {
  const [mode, setMode] = useState('preview');
  const [filter, setFilter] = useState('all');
  const winners = SAMPLE_BOARD.slice(0,3);

  return (
    <div className="g-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--bg)' }}>
      <ScreenHeader t={t} title={t('prizes_title')} />
      <div style={{ padding:'4px 18px 120px' }}>
        <p style={{ fontSize:14, color:'var(--ink-dim)', marginBottom:14, marginTop:-4 }}>{t('prizes_sub')}</p>
        <PreviewToggle mode={mode} setMode={setMode} t={t} />

        {/* center filter */}
        <div className="g-scroll" style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:14 }}>
          <FilterChip active={filter==='all'} onClick={()=>setFilter('all')}>{t('all_centers')}</FilterChip>
          {CENTERS.map(c=> <FilterChip key={c.id} active={filter===c.id} color={c.color} onClick={()=>setFilter(c.id)}>{c.name}</FilterChip>)}
        </div>

        {mode==='empty' ? (
          <EmptyState icon="🏆" title={t('empty_prize_t')} body={t('empty_prize_d')} />
        ) : (
          <React.Fragment>
            <PreviewBanner>Sample winners — preview only. Real winners are published when the campaign ends.</PreviewBanner>
            {/* podium hero */}
            <div style={{ position:'relative', overflow:'hidden', borderRadius:'var(--r-lg)', padding:'20px 16px 18px', marginBottom:16,
              background:'linear-gradient(160deg,#2a2208,#0E120D)', border:'1px solid rgba(245,194,66,0.3)' }}>
              <div style={{ position:'absolute', top:-30, left:'50%', transform:'translateX(-50%)', width:160, height:160, borderRadius:'50%', background:'var(--gold-glow)', filter:'blur(50px)' }} />
              <div style={{ position:'relative', textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:32 }}>🏆</div>
                <div className="disp" style={{ fontSize:18, color:'var(--gold)', marginTop:2 }}>{filter==='all'?'Overall':cById(filter)?.name} winners</div>
              </div>
              <div style={{ position:'relative', display:'flex', flexDirection:'column', gap:10 }}>
                {winners.map((w,i)=>{
                  const c=cById(w.center); const col=['var(--gold)','#C8CDD4','#CD8B5B'][i];
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14,
                      background:'rgba(255,255,255,0.04)', border:`1px solid ${col}44` }}>
                      <div className="disp" style={{ fontSize:24, color:col, width:28, textAlign:'center' }}>{i+1}</div>
                      <CenterBadge center={c} size={30} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="disp" style={{ fontSize:17, color:'var(--ink)' }}>{w.nick}</div>
                        <div style={{ fontSize:11, color:'var(--ink-faint)' }}>{c.name}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span className="num" style={{ fontSize:20, color:col }}>{w.pts}</span>
                        <div className="label" style={{ fontSize:8, color:'var(--ink-faint)' }}>{t('pts')}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

function FilterChip({ children, active, onClick, color='var(--green)' }) {
  return (
    <button onClick={onClick} className="chip" style={{ flexShrink:0, cursor:'pointer', border:0,
      background: active?color:'rgba(255,255,255,0.06)', color: active?'#06210F':'var(--ink-dim)', fontWeight:700 }}>{children}</button>
  );
}

Object.assign(window, { Leaderboard, Prizes, SegTabs, SAMPLE_BOARD, RankRow, FilterChip, PreviewBanner, PreviewToggle });
