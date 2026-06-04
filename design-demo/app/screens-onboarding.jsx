// ============================================================
// GARRINCHA · Onboarding screens — Landing, QR, Register
// ============================================================

// ---------- Language switch ----------
function LangSwitch({ lang, setLang, dark = true }) {
  const langs = ['en','nl','fr'];
  return (
    <div style={{ display:'flex', gap:3, padding:3, borderRadius:999,
      background: dark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)', backdropFilter:'blur(8px)' }}>
      {langs.map(l => (
        <button key={l} onClick={()=>setLang(l)} style={{
          border:0, cursor:'pointer', width:34, height:30, borderRadius:999,
          fontFamily:'var(--f-disp)', fontWeight:900, fontStyle:'italic', fontSize:13,
          textTransform:'uppercase', transition:'all .15s',
          background: lang===l ? 'var(--green)' : 'transparent',
          color: lang===l ? '#06210F' : (dark?'var(--ink-dim)':'#555') }}>{l}</button>
      ))}
    </div>
  );
}

// ---------- How-it-works step ----------
function HowStep({ n, title, body, last }) {
  return (
    <div style={{ display:'flex', gap:14, position:'relative' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0, background:'var(--green-deep)',
          border:'1.5px solid var(--green)', display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--f-disp)', fontWeight:900, fontStyle:'italic', fontSize:18, color:'var(--green)' }}>{n}</div>
        {!last && <div style={{ width:2, flex:1, background:'linear-gradient(var(--green-deep),transparent)', marginTop:4 }} />}
      </div>
      <div style={{ paddingBottom: last?0:22 }}>
        <div className="disp" style={{ fontSize:18, color:'var(--ink)', marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:13.5, color:'var(--ink-dim)', lineHeight:1.45 }}>{body}</div>
      </div>
    </div>
  );
}

// ============================================================
// LANDING
// ============================================================
function Landing({ t, lang, setLang, go, tweaks }) {
  const hero = tweaks.heroStyle || 'stadium';

  const heroBg = {
    stadium: { background:'radial-gradient(120% 90% at 50% -10%, #16331F 0%, #0A0D0A 60%)' },
    arcade:  { background:'linear-gradient(180deg,#0E120D 0%,#0A0D0A 100%)' },
    premium: { background:'radial-gradient(130% 80% at 80% 0%, #1a1505 0%, #0A0D0A 55%)' },
  }[hero];

  const accent = hero === 'premium' ? 'var(--gold)' : 'var(--green)';

  return (
    <div className="g-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--bg)' }}>

      {/* HERO */}
      <div className={hero==='stadium'?'pitch-lines':''} style={{ position:'relative', padding:'0 22px 30px', ...heroBg, overflow:'hidden' }}>
        {/* glow orbs */}
        {hero!=='arcade' && <div style={{ position:'absolute', top:-60, left:'50%', transform:'translateX(-50%)', width:300, height:300, borderRadius:'50%', background: hero==='premium'?'var(--gold-glow)':'var(--green-glow)', filter:'blur(70px)', opacity:.5 }} />}

        {/* header */}
        <div style={{ position:'relative', zIndex:2, paddingTop:58, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Logo h={22} />
          <LangSwitch lang={lang} setLang={setLang} />
        </div>

        {/* tagline */}
        <div style={{ position:'relative', zIndex:2, marginTop:34 }}>
          <div className="chip chip-green" style={{ background: hero==='premium'?'rgba(245,194,66,0.15)':'rgba(95,224,144,0.14)', color:accent }}>
            ⚽ {t('tagline')}
          </div>
          <h1 className="disp" style={{ fontSize:44, margin:'16px 0 0', whiteSpace:'pre-line', lineHeight:1.02,
            color:'var(--ink)', textShadow:'0 2px 30px rgba(0,0,0,0.4)' }}>
            {renderHeroTitle(t('hero_title'), accent)}
          </h1>
          <p style={{ fontSize:15.5, lineHeight:1.5, color:'var(--ink-dim)', margin:'20px 0 0', maxWidth:330 }}>{t('hero_sub')}</p>
        </div>

        {/* hero CTAs */}
        <div style={{ position:'relative', zIndex:2, marginTop:26, display:'flex', flexDirection:'column', gap:11 }}>
          <button className={hero==='premium'?'btn btn-gold btn-lg':'btn btn-green btn-lg'} onClick={()=>go('qr')} style={{ position:'relative', overflow:'hidden' }}>
            {t('cta_register')}
            <div style={{ position:'absolute', top:0, bottom:0, width:60, background:'linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)', animation:'sweep 3.4s infinite' }} />
          </button>
          <button className="btn btn-ghost btn-md" onClick={()=>go('dash')}>{t('cta_have_link')}</button>
        </div>

        {/* quick stats strip */}
        <div style={{ position:'relative', zIndex:2, marginTop:26, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[['6','centers'],['€0','free'],['∞','access']].map(([a,b],i)=>(
            <div key={i} style={{ textAlign:'center', padding:'12px 6px', borderRadius:14, background:'rgba(255,255,255,0.04)', border:'1px solid var(--line)' }}>
              <div className="num" style={{ fontSize:26, color: i===2?accent:'var(--ink)' }}>{a}</div>
              <div className="label" style={{ fontSize:9.5, color:'var(--ink-faint)', marginTop:2 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding:'30px 22px 8px' }}>
        <Eyebrow color={accent}>{t('how_title')}</Eyebrow>
        <div style={{ marginTop:14 }}>
          <HowStep n="1" title={t('how_1_t')} body={t('how_1_d')} />
          <HowStep n="2" title={t('how_2_t')} body={t('how_2_d')} />
          <HowStep n="3" title={t('how_3_t')} body={t('how_3_d')} />
          <HowStep n="4" title={t('how_4_t')} body={t('how_4_d')} />
          <HowStep n="5" title={t('how_5_t')} body={t('how_5_d')} last />
        </div>
      </div>

      {/* SCORING */}
      <div style={{ padding:'18px 22px' }}>
        <div className="card" style={{ padding:'20px 18px', background:'linear-gradient(160deg,#19211A,#11160F)' }}>
          <Eyebrow color={accent}>{t('scoring_title')}</Eyebrow>
          <div style={{ display:'flex', flexDirection:'column', gap:2, marginTop:8 }}>
            {SCORING.map((s,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom: i<3?'1px solid var(--line)':'none' }}>
                <span style={{ fontSize:14.5, color:'var(--ink-dim)' }}>{t(s.key)}</span>
                <span className="num" style={{ fontSize:22, color: s.pts===5?'var(--gold)': s.pts===0?'var(--ink-faint)':'var(--green)' }}>
                  +{s.pts}<span style={{ fontSize:11, marginLeft:3, color:'var(--ink-faint)' }}>{t('pts')}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRIZE TEASER */}
      <div style={{ padding:'8px 22px 30px' }}>
        <div style={{ position:'relative', overflow:'hidden', borderRadius:'var(--r-lg)', padding:'24px 20px',
          background:'linear-gradient(135deg,#2a2208,#0A0D0A)', border:'1px solid rgba(245,194,66,0.25)' }}>
          <div style={{ position:'absolute', right:-30, top:-30, width:140, height:140, borderRadius:'50%', background:'var(--gold-glow)', filter:'blur(40px)' }} />
          <div style={{ position:'relative' }}>
            <div style={{ fontSize:40, marginBottom:6 }}>🏆</div>
            <div className="disp" style={{ fontSize:24, color:'var(--gold)' }}>{t('prize_teaser')}</div>
            <button className="btn btn-gold btn-md" style={{ marginTop:18 }} onClick={()=>go('qr')}>{t('cta_register')}</button>
          </div>
        </div>
        <div style={{ textAlign:'center', marginTop:24, opacity:.5 }}>
          <Logo h={16} />
          <div className="label" style={{ fontSize:9, color:'var(--ink-faint)', marginTop:8 }}>World Cup Prediction · Belgium</div>
        </div>
      </div>
    </div>
  );
}

// highlight the last line of the hero title in accent color
function renderHeroTitle(text, accent) {
  const lines = text.split('\n');
  return lines.map((ln,i)=>(
    <span key={i} style={{ color: i>=lines.length-2 ? accent : 'var(--ink)' }}>{ln}{i<lines.length-1?'\n':''}</span>
  ));
}

// ============================================================
// QR ACTIVATION  (simulated scan landing)
// ============================================================
function QRActivate({ t, go, setCenter }) {
  const [scanned, setScanned] = useState(false);
  const detected = CENTERS[0]; // Antwerp — scanned center
  useEffect(()=>{ const id=setTimeout(()=>setScanned(true), 1400); return ()=>clearTimeout(id); },[]);

  return (
    <div style={{ height:'100%', background:'radial-gradient(120% 80% at 50% 0%, #16331F, #0A0D0A 60%)', padding:'76px 22px 30px', display:'flex', flexDirection:'column' }}>
      <Logo h={20} style={{ margin:'0 auto' }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        {!scanned ? (
          <React.Fragment>
            <div style={{ position:'relative', width:200, height:200, borderRadius:24, overflow:'hidden', boxShadow:'0 20px 50px -10px rgba(0,0,0,.6)' }}>
              <QRCode size={200} />
              <div style={{ position:'absolute', left:0, right:0, height:3, background:'var(--green)', boxShadow:'0 0 14px var(--green)', animation:'qrscan 1.4s ease-in-out infinite' }} />
              <style>{`@keyframes qrscan{0%,100%{top:8%}50%{top:88%}}`}</style>
            </div>
            <div className="disp" style={{ fontSize:24, color:'var(--ink)', marginTop:26 }}>Scanning…</div>
            <div style={{ fontSize:14, color:'var(--ink-dim)', marginTop:6 }}>Reading center QR code</div>
          </React.Fragment>
        ) : (
          <div className="rise" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ width:88, height:88, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--sh-green)' }}>
              <svg width="44" height="44" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#06210F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="chip chip-green" style={{ marginTop:22 }}>✓ {t('qr_active')}</div>
            <div className="disp" style={{ fontSize:30, color:'var(--ink)', marginTop:16 }}>{t('qr_center')}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, padding:'12px 18px', borderRadius:16, background:'var(--surface)', border:'1px solid var(--line)' }}>
              <CenterBadge center={detected} size={32} />
              <div style={{ textAlign:'left' }}>
                <div className="disp" style={{ fontSize:18, color:'var(--ink)' }}>GARRINCHA {detected.name}</div>
                <div style={{ fontSize:12, color:'var(--ink-dim)' }}>{detected.city}, Belgium</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <button className="btn btn-green btn-lg" disabled={!scanned} onClick={()=>{ go('register'); }} style={{ opacity: scanned?1:0.4 }}>
        {t('cta_register')}
      </button>
      <button className="label" onClick={()=>go('noqr')} style={{ background:'none', border:0, color:'var(--ink-faint)', fontSize:10.5, marginTop:14, cursor:'pointer' }}>
        See: opened without QR →
      </button>
    </div>
  );
}

// ============================================================
// NO-QR ERROR STATE
// ============================================================
function NoQR({ t, go }) {
  return (
    <div style={{ height:'100%', background:'var(--bg)', padding:'76px 22px 30px', display:'flex', flexDirection:'column' }}>
      <Logo h={20} style={{ margin:'0 auto' }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        <div style={{ width:88, height:88, borderRadius:'50%', background:'rgba(255,90,77,0.12)', border:'2px solid rgba(255,90,77,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38 }}>📷</div>
        <h2 className="disp" style={{ fontSize:30, color:'var(--ink)', marginTop:24 }}>{t('no_qr_title')}</h2>
        <p style={{ fontSize:15, color:'var(--ink-dim)', lineHeight:1.5, maxWidth:300, marginTop:10 }}>{t('no_qr_body')}</p>
      </div>
      <button className="btn btn-green btn-lg" onClick={()=>go('qr')}>Scan a center QR</button>
      <button className="btn btn-ghost btn-md" style={{ marginTop:11 }} onClick={()=>go('landing')}>Back to home</button>
    </div>
  );
}

// ============================================================
// REGISTER FORM
// ============================================================
function Register({ t, go, profile, setProfile }) {
  const [f, setF] = useState({ name:'', email:'', phone:'', nick:'', consent:false });
  const [err, setErr] = useState({});
  const detected = CENTERS[0];

  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = t('err_required');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = t('err_email');
    if (!f.nick.trim()) e.nick = t('err_required');
    if (!f.consent) e.consent = t('err_consent');
    setErr(e);
    if (Object.keys(e).length===0) {
      setProfile({ ...profile, ...f, email: f.email });
      go('sent');
    }
  };

  const field = (key, label, type='text', hint) => (
    <div>
      <label className="label" style={{ fontSize:10.5, color:'var(--ink-dim)', display:'block', marginBottom:8 }}>{label}</label>
      <input className={'field'+(err[key]?' field-err':'')} type={type} value={f[key]}
        onChange={e=>setF({...f,[key]:e.target.value})} placeholder={label} />
      {err[key] && <div style={{ fontSize:12, color:'var(--live)', marginTop:6, fontWeight:600 }}>⚠ {err[key]}</div>}
      {hint && !err[key] && <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:6 }}>{hint}</div>}
    </div>
  );

  return (
    <div className="g-scroll" style={{ height:'100%', overflowY:'auto', background:'var(--bg)', padding:'66px 22px 30px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Logo h={18} />
        <div className="chip chip-green">✓ {t('qr_active')}</div>
      </div>

      {/* detected center confirmation */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20, padding:'12px 14px', borderRadius:14, background:'rgba(95,224,144,0.07)', border:'1px solid rgba(95,224,144,0.22)' }}>
        <CenterBadge center={detected} size={30} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'var(--green)' }} className="label">{t('qr_center')}</div>
          <div className="disp" style={{ fontSize:17, color:'var(--ink)' }}>GARRINCHA {detected.name}</div>
        </div>
      </div>

      <h1 className="disp" style={{ fontSize:32, color:'var(--ink)', margin:'24px 0 4px' }}>{t('reg_title')}</h1>
      <p style={{ fontSize:14, color:'var(--ink-dim)', marginBottom:22 }}>{t('reg_sub')}</p>

      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        {field('name', t('f_name'))}
        {field('email', t('f_email'), 'email')}
        {field('phone', t('f_phone'), 'tel')}
        {field('nick', t('f_nick'), 'text', t('f_nick_hint'))}

        {/* consent */}
        <button onClick={()=>setF({...f,consent:!f.consent})} style={{ display:'flex', alignItems:'flex-start', gap:12, background:'none', border:0, cursor:'pointer', textAlign:'left', padding:0 }}>
          <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, marginTop:1,
            border:`2px solid ${err.consent?'var(--live)':f.consent?'var(--green)':'var(--line-2)'}`,
            background: f.consent?'var(--green)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {f.consent && <svg width="15" height="15" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#06210F" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{ fontSize:13.5, color:'var(--ink-dim)', lineHeight:1.4 }}>{t('consent')}</span>
        </button>
        {err.consent && <div style={{ fontSize:12, color:'var(--live)', marginTop:-8, fontWeight:600 }}>⚠ {err.consent}</div>}
      </div>

      <button className="btn btn-green btn-lg" style={{ marginTop:26 }} onClick={submit}>{t('create_account')}</button>
    </div>
  );
}

// ============================================================
// EMAIL SENT / ACCESS LINK CONFIRMATION
// ============================================================
function Sent({ t, go, profile }) {
  return (
    <div style={{ height:'100%', background:'radial-gradient(120% 70% at 50% 0%, #16331F, #0A0D0A 55%)', padding:'76px 22px 30px', display:'flex', flexDirection:'column' }}>
      <Logo h={20} style={{ margin:'0 auto' }} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        <div style={{ position:'relative' }}>
          <div style={{ width:96, height:96, borderRadius:24, background:'var(--surface)', border:'1px solid var(--line-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:46, boxShadow:'var(--sh-2)' }}>✉️</div>
          <div style={{ position:'absolute', right:-8, bottom:-8, width:38, height:38, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--sh-green)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#06210F" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <h2 className="disp" style={{ fontSize:32, color:'var(--ink)', marginTop:26 }}>{t('sent_title')}</h2>
        <p style={{ fontSize:15, color:'var(--ink-dim)', marginTop:10 }}>{t('sent_body')}</p>
        <div className="disp" style={{ fontSize:18, color:'var(--green)', marginTop:4 }}>{profile.email || 'you@email.com'}</div>

        {/* access link visual preview */}
        <div style={{ marginTop:24, width:'100%', padding:'14px 16px', borderRadius:14, background:'var(--surface)', border:'1px dashed var(--line-2)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:'var(--green-deep)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>🔗</div>
          <div style={{ textAlign:'left', overflow:'hidden' }}>
            <div className="label" style={{ fontSize:9, color:'var(--green)' }}>Your permanent access link</div>
            <div style={{ fontFamily:'ui-monospace,monospace', fontSize:12, color:'var(--ink-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>garrincha.app/p/9f3a…2b71</div>
          </div>
        </div>
        <p style={{ fontSize:13, color:'var(--ink-faint)', marginTop:16, lineHeight:1.5, maxWidth:300 }}>{t('sent_note')}</p>
      </div>
      <button className="btn btn-green btn-lg" onClick={()=>go('dash')}>{t('sent_open')}</button>
    </div>
  );
}

Object.assign(window, { LangSwitch, Landing, QRActivate, NoQR, Register, Sent, HowStep });
