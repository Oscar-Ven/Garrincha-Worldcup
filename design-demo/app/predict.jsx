// ============================================================
// GARRINCHA · Prediction cards (3 variants) + Predict screen
// ============================================================

function TeamRow({ code, t, align='left', big }) {
  const name = FLAG_LABEL[code] || 'TBD';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:11, flexDirection: align==='right'?'row-reverse':'row', flex:1, minWidth:0 }}>
      <Flag code={code} size={big?44:38} />
      <div style={{ textAlign:align, minWidth:0 }}>
        <div className="disp" style={{ fontSize: big?20:17, color:'var(--ink)', lineHeight:1 }}>{code}</div>
        <div style={{ fontSize:11, color:'var(--ink-faint)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
      </div>
    </div>
  );
}

function LockNote({ t }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:12,
      fontSize:11.5, color:'var(--ink-faint)' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2"/></svg>
      {t('lock_note')}
    </div>
  );
}

// ---------- The card ----------
function PredictionCard({ match, pred, onSave, t, variant='gamesheet' }) {
  const [draft, setDraft] = useState(pred || [null,null]);
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(()=>{ setDraft(pred || [null,null]); }, [pred]);

  const editable = match.status === 'open';
  const both = draft[0]!=null && draft[1]!=null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(pred || [null,null]);

  const save = () => { if (both){ onSave(match.id, draft); setSavedFlash(true); setTimeout(()=>setSavedFlash(false),1600); } };

  // ----- header (stage + status) -----
  const header = (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <span className="label" style={{ fontSize:10, color:'var(--ink-faint)' }}>{match.stage}</span>
      <StatusPill status={match.status} t={t} live={match.live} />
    </div>
  );

  // ----- meta line (date / kickoff / points) -----
  const metaLine = () => {
    if (match.status==='finished') return null;
    return (
      <div style={{ textAlign:'center', marginTop: variant==='compact'?10:14 }}>
        <span className="num" style={{ fontSize:15, color:'var(--ink)' }}>{match.time}</span>
        <span style={{ fontSize:12, color:'var(--ink-faint)', marginLeft:8 }}>{match.date}</span>
      </div>
    );
  };

  // =================== COMPACT ===================
  if (variant==='compact') {
    return (
      <div className="card" style={{ padding:'14px 16px' }}>
        {header}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <TeamRow code={match.home} t={t} />
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <ScoreBox size="sm" value={draft[0]} disabled={!editable} onChange={v=>setDraft([v,draft[1]])} />
            <span className="num" style={{ fontSize:18, color:'var(--ink-faint)' }}>:</span>
            <ScoreBox size="sm" value={draft[1]} disabled={!editable} onChange={v=>setDraft([draft[0],v])} />
          </div>
          <TeamRow code={match.away} t={t} align="right" />
        </div>
        {metaLine()}
        {editable && dirty && both && (
          <button className="btn btn-green" style={{ height:44, fontSize:15, marginTop:12 }} onClick={save}>{savedFlash?'✓ '+t('saved'):t('save_pred')}</button>
        )}
        {match.status==='live' && <LiveBar match={match} pred={pred} t={t} />}
      </div>
    );
  }

  // =================== SCOREBOARD ===================
  if (variant==='scoreboard') {
    return (
      <div style={{ borderRadius:'var(--r-lg)', overflow:'hidden', border:'1px solid var(--line-2)',
        background:'linear-gradient(180deg,#0d120d,#080a08)', position:'relative' }}>
        <div style={{ padding:'14px 18px 0' }}>{header}</div>
        {/* LED board */}
        <div style={{ padding:'6px 18px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
            <Flag code={match.home} size={48} />
            <span className="disp" style={{ fontSize:18, color:'var(--ink)' }}>{match.home}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ScoreBox value={draft[0]} disabled={!editable} onChange={v=>setDraft([v,draft[1]])} accent="var(--gold)" />
            <span className="num" style={{ fontSize:30, color:'var(--gold)' }}>:</span>
            <ScoreBox value={draft[1]} disabled={!editable} onChange={v=>setDraft([draft[0],v])} accent="var(--gold)" />
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
            <Flag code={match.away} size={48} />
            <span className="disp" style={{ fontSize:18, color:'var(--ink)' }}>{match.away}</span>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.03)', padding:'12px 18px', borderTop:'1px solid var(--line)' }}>
          <div style={{ textAlign:'center', marginBottom: editable&&both&&dirty?12:0 }}>
            <span className="num" style={{ fontSize:15, color:'var(--gold)' }}>{match.time}</span>
            <span style={{ fontSize:12, color:'var(--ink-faint)', marginLeft:8 }}>{match.date}</span>
          </div>
          {editable && both && dirty && <button className="btn btn-gold" style={{ height:46, fontSize:16 }} onClick={save}>{savedFlash?'✓ '+t('saved'):t('save_pred')}</button>}
          {!editable && match.status==='live' && <LiveBar match={match} pred={pred} t={t} />}
        </div>
      </div>
    );
  }

  // =================== GAMESHEET (default) ===================
  return (
    <div className="card" style={{ padding:'16px 18px', position:'relative', overflow:'hidden' }}>
      {match.status==='live' && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'var(--live)' }} />}
      {header}

      {/* big VS row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <TeamRow code={match.home} t={t} big />
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 6px' }}>
          <span className="disp" style={{ fontSize:13, color:'var(--ink-faint)' }}>VS</span>
        </div>
        <TeamRow code={match.away} t={t} align="right" big />
      </div>

      {/* prediction steppers */}
      <div style={{ marginTop:16, padding:'16px 0 4px', borderTop:'1px solid var(--line)' }}>
        <div className="label" style={{ fontSize:9.5, color:'var(--green)', textAlign:'center', marginBottom:12 }}>{t('your_pred')}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:18 }}>
          <ScoreBox value={draft[0]} disabled={!editable} dim={!editable} onChange={v=>setDraft([v,draft[1]])} />
          <span className="num" style={{ fontSize:28, color:'var(--ink-faint)', marginTop:-6 }}>:</span>
          <ScoreBox value={draft[1]} disabled={!editable} dim={!editable} onChange={v=>setDraft([draft[0],v])} />
        </div>
      </div>

      {metaLine()}

      {editable
        ? (both && dirty
            ? <button className="btn btn-green" style={{ height:48, marginTop:14 }} onClick={save}>{savedFlash?'✓ '+t('saved'):t('save_pred')}</button>
            : <LockNote t={t} />)
        : match.status==='live'
          ? <LiveBar match={match} pred={pred} t={t} />
          : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:12, fontSize:12, color:'var(--ink-faint)' }}>🔒 {t('locked')}</div>}
    </div>
  );
}

// live current-score strip
function LiveBar({ match, pred, t }) {
  return (
    <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12, background:'rgba(255,90,77,0.10)', border:'1px solid rgba(255,90,77,0.25)',
      display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <span className="chip chip-live" style={{ padding:0, background:'none' }}><span className="live-dot" /> {match.live}</span>
      <span className="num" style={{ fontSize:22, color:'var(--ink)' }}>{match.sc?match.sc[0]:0} : {match.sc?match.sc[1]:0}</span>
      <span style={{ fontSize:11.5, color:'var(--ink-dim)' }}>{pred?`${t('your_pred')}: ${pred[0]}-${pred[1]}`:'—'}</span>
    </div>
  );
}

// ---------- Finished result card ----------
function ResultCard({ r, t }) {
  const col = r.pts===5?'var(--gold)':r.pts===0?'var(--ink-faint)':'var(--green)';
  return (
    <div className="card" style={{ padding:'14px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span className="label" style={{ fontSize:10, color:'var(--ink-faint)' }}>{r.stage}</span>
        <span className="chip chip-ghost">{t('ft')}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <TeamRow code={r.home} t={t} />
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="num" style={{ fontSize:30, color:'var(--ink)' }}>{r.final[0]}</span>
          <span className="num" style={{ fontSize:20, color:'var(--ink-faint)' }}>:</span>
          <span className="num" style={{ fontSize:30, color:'var(--ink)' }}>{r.final[1]}</span>
        </div>
        <TeamRow code={r.away} t={t} align="right" />
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, paddingTop:12, borderTop:'1px solid var(--line)' }}>
        <span style={{ fontSize:12.5, color:'var(--ink-dim)' }}>{t('your_pred')}: <span className="num" style={{ color:'var(--ink)', fontSize:14 }}>{r.pred[0]}-{r.pred[1]}</span></span>
        <span className="chip" style={{ background: r.pts===0?'rgba(255,255,255,0.05)':`${r.pts===5?'rgba(245,194,66,.15)':'rgba(95,224,144,.14)'}`, color:col }}>
          <span className="num" style={{ fontSize:15 }}>+{r.pts}</span> {t('pts')} {t('earned')}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// PREDICT SCREEN
// ============================================================
function PredictScreen({ t, tweaks, preds, savePred, repCenter, go }) {
  const variant = tweaks.cardStyle || 'gamesheet';
  const openCount = MATCHES.filter(m=>m.status==='open').length;

  if (!repCenter) {
    return (
      <div style={{ height:'100%', background:'var(--bg)' }}>
        <ScreenHeader t={t} title={t('predict_title')} />
        <div style={{ padding:'10px 18px' }}>
          <EmptyState icon="🏟" title={t('choose_first')} body={t('choose_center_sub')} action={t('choose_center')} onAction={()=>go('dash')} />
        </div>
      </div>
    );
  }

  return (
    <div className="g-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--bg)' }}>
      <ScreenHeader t={t} title={t('predict_title')} sub={`${openCount} ${t('open_preds')}`} />
      <div style={{ padding:'4px 18px 120px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* matchday banner */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:16,
          background:'linear-gradient(100deg,#16331F,#0E120D)', border:'1px solid rgba(95,224,144,0.2)' }}>
          <div>
            <div className="label" style={{ fontSize:9, color:'var(--green)' }}>{t('matchday')} 1</div>
            <div className="disp" style={{ fontSize:20, color:'var(--ink)', whiteSpace:'nowrap' }}>09–12 Jun</div>
          </div>
          <div className="chip chip-ghost" style={{ fontSize:10 }}>Placeholder fixtures</div>
        </div>

        {MATCHES.map(m => (
          <PredictionCard key={m.id} match={m} pred={preds[m.id]} onSave={savePred} t={t} variant={variant} />
        ))}

        {/* results */}
        <div style={{ marginTop:8 }}>
          <SectionTitle>{t('finished')}</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {RESULTS.map(r => <ResultCard key={r.id} r={r} t={t} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PredictionCard, ResultCard, PredictScreen, TeamRow, LockNote, LiveBar });
