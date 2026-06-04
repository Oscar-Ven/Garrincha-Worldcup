// ============================================================
// GARRINCHA · App shell — routing, state, chapters, tweaks
// ============================================================
const { useState: uS, useEffect: uE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroStyle": "stadium",
  "cardStyle": "gamesheet",
  "boardStyle": "podium"
}/*EDITMODE-END*/;

const LS = 'garrincha_demo_v1';
const loadState = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch(e){ return {}; } };

const CHAPTERS = [
  { group:'Onboarding', items:[
    { k:'landing',  label:'Landing page' },
    { k:'qr',       label:'QR activation' },
    { k:'register', label:'Registration' },
    { k:'sent',     label:'Access link sent' },
    { k:'noqr',     label:'No-QR error state' },
  ]},
  { group:'Player app', items:[
    { k:'dash',     label:'Dashboard' },
    { k:'predict',  label:'Prediction cards' },
    { k:'ranks',    label:'Leaderboards' },
    { k:'prizes',   label:'Prize winners' },
    { k:'profile',  label:'Profile & language' },
  ]},
  { group:'Admin (mobile)', items:[
    { k:'a_super',  label:'Super Admin' },
    { k:'a_center', label:'Center Admin' },
    { k:'a_health', label:'System Health' },
  ]},
];

const PLAYER_TABS = ['dash','predict','ranks','prizes','profile'];

function App() {
  const saved = loadState();
  const urlScreen = (()=>{ try { return new URLSearchParams(location.search).get('screen'); } catch(e){ return null; } })();
  const [t_, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang]       = uS(saved.lang || 'en');
  const [screen, setScreen]   = uS(urlScreen || saved.screen || 'landing');
  const [profile, setProfile] = uS(saved.profile || { name:'', email:'', nick:'', phone:'' });
  const [repCenter, setRepCenter] = uS(saved.repCenter || null);
  const [preds, setPreds]     = uS(saved.preds || {});
  const [scale, setScale]     = uS(1);

  // persist
  uE(()=>{ localStorage.setItem(LS, JSON.stringify({ lang, screen, profile, repCenter, preds })); },
    [lang, screen, profile, repCenter, preds]);

  // responsive scale
  uE(()=>{
    const fit = ()=>{ const h=window.innerHeight; setScale(Math.min(1, (h-90)/874)); };
    fit(); window.addEventListener('resize', fit); return ()=>window.removeEventListener('resize', fit);
  },[]);

  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const go = (s) => { if (s==='predict' && !repCenter) setRepCenter(CENTERS[0]); setScreen(s); };
  const savePred = (id, p) => setPreds(prev => ({ ...prev, [id]: p }));
  const openAdmin = (which) => setScreen('a_'+which);

  const isPlayer = PLAYER_TABS.includes(screen);
  const navTab = screen==='ranks' ? 'ranks' : screen;

  const reset = () => { localStorage.removeItem(LS); setProfile({name:'',email:'',nick:'',phone:''}); setRepCenter(null); setPreds({}); setScreen('landing'); setLang('en'); };

  // render current screen
  const renderScreen = () => {
    switch(screen){
      case 'landing':  return <Landing t={t} lang={lang} setLang={setLang} go={go} tweaks={t_} />;
      case 'qr':       return <QRActivate t={t} go={go} setCenter={setRepCenter} />;
      case 'noqr':     return <NoQR t={t} go={go} />;
      case 'register': return <Register t={t} go={go} profile={profile} setProfile={setProfile} />;
      case 'sent':     return <Sent t={t} go={go} profile={profile} />;
      case 'dash':     return <Dashboard t={t} profile={profile} repCenter={repCenter} setRepCenter={setRepCenter} preds={preds} go={go} />;
      case 'predict':  return <PredictScreen t={t} tweaks={t_} preds={preds} savePred={savePred} repCenter={repCenter} go={go} />;
      case 'ranks':    return <Leaderboard t={t} tweaks={t_} repCenter={repCenter} profile={profile} />;
      case 'prizes':   return <Prizes t={t} />;
      case 'profile':  return <Profile t={t} lang={lang} setLang={setLang} profile={profile} repCenter={repCenter} go={go} openAdmin={openAdmin} />;
      case 'a_super':  return <SuperAdmin t={t} onBack={()=>go('profile')} />;
      case 'a_center': return <CenterAdmin t={t} onBack={()=>go('profile')} />;
      case 'a_health': return <SystemHealth t={t} onBack={()=>go('profile')} />;
      default: return <Landing t={t} lang={lang} setLang={setLang} go={go} tweaks={t_} />;
    }
  };

  return (
    <div className="g-app" style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* page chrome bg */}
      <div className="pitch-lines" style={{ position:'fixed', inset:0, background:'radial-gradient(120% 80% at 50% -10%, #11180F 0%, #07090700 60%)', pointerEvents:'none' }} />

      {/* top bar */}
      <header style={{ position:'relative', zIndex:5, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid var(--line)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Logo h={20} />
          <div style={{ width:1, height:20, background:'var(--line-2)' }} />
          <span className="label" style={{ fontSize:10, color:'var(--ink-dim)' }}>World Cup Prediction · Concept</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:11.5, color:'var(--ink-faint)' }}>Switch <b style={{color:'var(--green)'}}>EN / NL / FR</b> &amp; variants live →</span>
          <button onClick={reset} className="chip chip-ghost" style={{ cursor:'pointer', border:0 }}>↺ Restart demo</button>
        </div>
      </header>

      {/* main */}
      <div style={{ position:'relative', zIndex:5, display:'flex', gap:0, alignItems:'flex-start' }}>

        {/* chapter rail */}
        <aside className="g-scroll" style={{ width:248, flexShrink:0, height:'calc(100vh - 57px)', overflowY:'auto', borderRight:'1px solid var(--line)', padding:'20px 16px' }}>
          {CHAPTERS.map(ch=>(
            <div key={ch.group} style={{ marginBottom:18 }}>
              <div className="label" style={{ fontSize:9, color:'var(--green)', marginBottom:9, paddingLeft:6 }}>{ch.group}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {ch.items.map(it=>{
                  const on = screen===it.k;
                  return (
                    <button key={it.k} onClick={()=>go(it.k)} style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 11px', borderRadius:10, cursor:'pointer', border:0, textAlign:'left',
                      background: on?'var(--surface-2)':'transparent', color: on?'var(--ink)':'var(--ink-dim)', transition:'all .12s' }}>
                      <span style={{ width:6, height:6, borderRadius:99, background: on?'var(--green)':'var(--line-2)', flexShrink:0 }} />
                      <span style={{ fontFamily:'var(--f-body)', fontWeight: on?700:500, fontSize:13.5 }}>{it.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* quick variant switchers */}
          <div style={{ marginTop:8, paddingTop:16, borderTop:'1px solid var(--line)' }}>
            <div className="label" style={{ fontSize:9, color:'var(--gold)', marginBottom:10, paddingLeft:6 }}>Variants</div>
            <QuickVariant label="Landing hero" value={t_.heroStyle} opts={[['stadium','Stadium'],['arcade','Arcade'],['premium','Premium']]} onPick={v=>setTweak('heroStyle',v)} />
            <QuickVariant label="Prediction card" value={t_.cardStyle} opts={[['gamesheet','Sheet'],['compact','Compact'],['scoreboard','Board']]} onPick={v=>setTweak('cardStyle',v)} />
            <QuickVariant label="Leaderboard" value={t_.boardStyle} opts={[['podium','Podium'],['clean','Clean'],['versus','Versus']]} onPick={v=>setTweak('boardStyle',v)} />
          </div>
        </aside>

        {/* stage */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', padding:'24px 24px 40px', minHeight:'calc(100vh - 57px)' }}>
          <div style={{ height: 874*scale, width: 402*scale }}>
            <div style={{ transform:`scale(${scale})`, transformOrigin:'top center' }}>
              <IOSDevice dark width={402} height={874}>
                <div style={{ position:'relative', height:'100%' }}>
                  {renderScreen()}
                  {isPlayer && <BottomNav t={t} tab={navTab} go={go} />}
                </div>
              </IOSDevice>
            </div>
          </div>
          <div style={{ marginTop:16, fontSize:11, color:'var(--ink-faint)', textAlign:'center' }}>
            iPhone · 402×874 — also works 360–430px wide
          </div>
        </main>
      </div>

      {/* tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Visual variants" />
        <TweakRadio label="Landing hero" value={t_.heroStyle} options={['stadium','arcade','premium']} onChange={v=>setTweak('heroStyle',v)} />
        <TweakRadio label="Prediction card" value={t_.cardStyle} options={['gamesheet','compact','scoreboard']} onChange={v=>setTweak('cardStyle',v)} />
        <TweakRadio label="Leaderboard" value={t_.boardStyle} options={['podium','clean','versus']} onChange={v=>setTweak('boardStyle',v)} />
        <TweakSection label="Language" />
        <TweakRadio label="UI language" value={lang} options={['en','nl','fr']} onChange={setLang} />
      </TweaksPanel>
    </div>
  );
}

function QuickVariant({ label, value, opts, onPick }) {
  return (
    <div style={{ marginBottom:12, paddingLeft:6 }}>
      <div style={{ fontSize:10.5, color:'var(--ink-faint)', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', gap:4 }}>
        {opts.map(([k,l])=>(
          <button key={k} onClick={()=>onPick(k)} style={{ flex:1, padding:'7px 4px', borderRadius:8, cursor:'pointer', border:0,
            fontFamily:'var(--f-body)', fontWeight:700, fontSize:10.5,
            background: value===k?'var(--green)':'var(--surface-2)', color: value===k?'#06210F':'var(--ink-dim)' }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
