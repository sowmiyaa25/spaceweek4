// MISSION CONTROL — Space Week 2026, Day 04. Vanilla JS. Fictional, simplified simulation.
const app = document.getElementById('app');
const bi = (e, t, c) => `<span class="en ${c || ''}">${e}</span><span class="ta">${t}</span>`;
// bl() = inline bilingual text; the language switch shows only one of the two spans
const bl = (e, t) => `<span class="en i">${e}</span><span class="ta i">${t}</span>`;
const btn = (act, e, t, c) => `<button class="btn ${c || ''}" data-act="${act}">${bi(e, t)}</button>`;
const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
const KEYS = { p: 'power', c: 'communication', f: 'fuel', h: 'health', d: 'scientificData', e: 'efficiency', r: 'risk' };
const LABEL = { power: ['POWER', 'மின்சக்தி'], communication: ['COMMUNICATION', 'தொடர்பு'], fuel: ['FUEL', 'எரிபொருள்'], health: ['HEALTH', 'விண்கல நலம்'], scientificData: ['MISSION DATA', 'மிஷன் தரவு'] };

// ---------- mission state ----------
let S, G; // S = spacecraft state, G = run info (current event, decisions, hidden hazard)
const newState = () => ({ power: 100, communication: 100, fuel: 100, health: 100, scientificData: 0, efficiency: 70, risk: 5, decisionScore: 0 });
const riskLabel = r => r < 25 ? ['LOW', 'குறைவு', 'low'] : r < 50 ? ['MODERATE', 'மிதமானது', 'mod'] : r < 75 ? ['HIGH', 'அதிகம்', 'hi'] : ['CRITICAL', 'மிகவும் ஆபத்தானது', 'crit'];
const lvl = v => v > 60 ? '' : v > 30 ? 'am' : 'rd';

// ---------- events: each option changes the state; "alt" makes the outcome depend on current conditions ----------
const EVENTS = [
  { title: ['POWER DROP', 'மின்சக்தி குறைவு'], sit: ['Solar power generation has unexpectedly decreased by 30%.', 'சூரிய மின்உற்பத்தி எதிர்பாராத விதமாக 30% குறைந்துள்ளது.'],
    start: s => { s.power = Math.min(s.power, 70); }, ind: 'POWER OUTPUT|மின் உற்பத்தி|power',
    opts: [
      { t: ['Continue normal operations.', 'வழக்கமான செயல்பாடுகளைத் தொடரவும்.'], d: { p: -15, d: 14, e: 3, r: 12 }, dm: 50,
        c: ['Instruments kept running at full capacity, but the battery drained faster and the safety margin shrank.', 'கருவிகள் முழு திறனுடன் இயங்கின; ஆனால் பேட்டரி வேகமாகக் குறைந்து, பாதுகாப்பு இடைவெளி சுருங்கியது.'] },
      { t: ['Enter power-saving mode.', 'மின்சேமிப்பு நிலைக்கு மாறவும்.'], d: { p: 8, c: -5, d: 8, e: -2, r: -6 }, dm: 82,
        c: ['Power-saving mode stabilized the spacecraft, but scientific instruments operated at reduced capacity.', 'மின்சேமிப்பு நிலை விண்கலத்தை நிலைப்படுத்தியது; ஆனால் அறிவியல் கருவிகள் குறைந்த திறனில் இயங்கின.'] },
      { t: ['Reduce scientific instruments and preserve essential systems.', 'அறிவியல் கருவிகளைக் குறைத்து, அத்தியாவசிய அமைப்புகளைப் பாதுகாக்கவும்.'], d: { p: 12, d: 4, e: -4, r: 2 }, dm: 72,
        c: ['Essential systems are safe and power recovered, but data collection paused for now.', 'அத்தியாவசிய அமைப்புகள் பாதுகாப்பாக உள்ளன, மின்சக்தி மீண்டது; ஆனால் தரவு சேகரிப்பு தற்காலிகமாக நின்றது.'] }] },
  { title: ['COMMUNICATION DELAY', 'தொடர்பு தாமதம்'], sit: ['Signal contact with Earth is becoming unstable.', 'பூமியுடனான சிக்னல் தொடர்பு நிலையற்றதாகி வருகிறது.'],
    start: s => { s.communication = Math.min(s.communication, 45); }, ind: 'COMMUNICATION SIGNAL|தொடர்பு சிக்னல்|communication',
    opts: [
      { t: ['Continue sending full scientific data.', 'முழு அறிவியல் தரவுகளை தொடர்ந்து அனுப்பவும்.'], d: { p: -6, c: -8, d: 14, e: 2, r: 10 }, dm: 48,
        c: ['Much of the data was lost in the weak link, and the signal degraded further.', 'பலவீனமான இணைப்பில் தரவின் பெரும்பகுதி இழக்கப்பட்டது; சிக்னல் மேலும் குறைந்தது.'] },
      { t: ['Prioritize essential telemetry.', 'அத்தியாவசிய டெலிமெட்ரியை முன்னுரிமைப்படுத்தவும்.'], d: { p: -2, c: 20, d: 8, e: 1, r: -5 }, dm: 80,
        c: ['Essential telemetry reached Earth reliably and the link recovered, at the cost of some science data.', 'அத்தியாவசிய டெலிமெட்ரி பூமியை நம்பகமாக அடைந்து இணைப்பு மீண்டது; ஆனால் சில அறிவியல் தரவு விடப்பட்டது.'] },
      { t: ['Attempt high-bandwidth transmission.', 'அதிக அலைவரிசை பரிமாற்றத்தை முயற்சிக்கவும்.'], d: { p: -18, c: 15, d: 18, e: 4, r: 14 }, dm: 62,
        c: ['The high-bandwidth burst succeeded and delivered a lot of data, but it drew heavy power.', 'அதிக அலைவரிசை பரிமாற்றம் வெற்றி பெற்று நிறைய தரவை அனுப்பியது; ஆனால் அதிக மின்சக்தியைப் பயன்படுத்தியது.'],
        alt: s => s.power < 55 ? { d: { p: -18, c: -12, h: -6, d: 5, r: 16 }, c: ['There was not enough power for the burst; the transmitter overheated and the link weakened.', 'பரிமாற்றத்திற்குப் போதுமான மின்சக்தி இல்லை; டிரான்ஸ்மிட்டர் சூடாகி இணைப்பு பலவீனமடைந்தது.'] } : null }] },
  { title: ['UNKNOWN OBJECT DETECTED', 'அடையாளம் தெரியாத பொருள் கண்டறியப்பட்டது'], sit: ['The spacecraft detects an unexpected object near its trajectory.', 'விண்கலத்தின் பாதைக்கு அருகில் எதிர்பாராத ஒரு பொருள் கண்டறியப்பட்டது.'],
    start: () => {}, ind: 'RADAR',
    opts: [
      { t: ['Maintain current trajectory.', 'தற்போதைய பாதையைத் தொடரவும்.'], d: { d: 8, e: 5, r: -3 }, dm: 55,
        c: ['The object was harmless and passed at a safe distance. No fuel was wasted.', 'அந்தப் பொருள் தீங்கற்றது; பாதுகாப்பான தூரத்தில் கடந்து சென்றது. எரிபொருள் வீணாகவில்லை.'],
        alt: (s, g) => g.hazard ? { d: { h: -25, d: 8, e: -4, r: 25 }, c: ['The object turned out to be debris. It grazed the spacecraft and caused damage.', 'அந்தப் பொருள் குப்பைத் துண்டு என்று தெரிந்தது; அது விண்கலத்தைத் தாக்கி சேதம் ஏற்படுத்தியது.'] } : null },
      { t: ['Perform a cautious trajectory adjustment.', 'கவனமாக பாதையைச் சிறிது மாற்றவும்.'], d: { f: -12, d: 8, e: -2, r: -6 }, dm: 78,
        c: ['The adjustment kept a safe distance whether or not the object was dangerous, but it used some fuel.', 'பொருள் ஆபத்தானதா என்பதைப் பொருட்படுத்தாமல் பாதுகாப்பான தூரம் பராமரிக்கப்பட்டது; ஆனால் சிறிது எரிபொருள் செலவானது.'] },
      { t: ['Increase observation time before making a decision.', 'முடிவெடுக்கும் முன் கண்காணிப்பு நேரத்தை அதிகரிக்கவும்.'], d: { p: -5, d: 10, e: -1, r: -4 }, dm: 70,
        c: ['Extra observation improved your confidence about the object, but it cost time and power.', 'கூடுதல் கண்காணிப்பு பொருளைப் பற்றிய தெளிவைத் தந்தது; ஆனால் நேரமும் மின்சக்தியும் செலவானது.'],
        alt: (s, g) => g.hazard ? { d: { p: -5, h: -8, d: 10, e: -1, r: 6 } } : null }] },
  { title: ['THERMAL WARNING', 'வெப்பநிலை எச்சரிக்கை'], sit: ['One spacecraft subsystem is operating outside its normal temperature range.', 'ஒரு விண்கல துணை அமைப்பு இயல்பான வெப்பநிலை வரம்பிற்கு வெளியே இயங்குகிறது.'],
    start: s => { s.health = clamp(s.health - 5); }, ind: 'TEMPERATURE|வெப்பநிலை|warn',
    opts: [
      { t: ['Continue normal operations.', 'வழக்கமான செயல்பாடுகளைத் தொடரவும்.'], d: { p: -3, h: -18, d: 8, e: 3, r: 15 }, dm: 45,
        c: ['The subsystem kept running hot and sustained damage, although science continued.', 'துணை அமைப்பு சூடாகவே இயங்கி சேதமடைந்தது; ஆனால் அறிவியல் பணி தொடர்ந்தது.'] },
      { t: ['Reduce subsystem activity.', 'துணை அமைப்பின் செயல்பாட்டைக் குறைக்கவும்.'], d: { p: 3, h: -3, d: 8, e: -2, r: -5 }, dm: 80,
        c: ['Lower activity let the subsystem cool gradually while most operations continued.', 'செயல்பாடு குறைந்ததால் துணை அமைப்பு மெதுவாகக் குளிர்ந்தது; பெரும்பாலான பணிகள் தொடர்ந்தன.'] },
      { t: ['Enter temporary safe mode.', 'தற்காலிக பாதுகாப்பு நிலைக்கு மாறவும்.'], d: { p: 8, h: 6, d: 2, e: -8, r: -12 }, dm: 66,
        c: ['Safe mode protected the spacecraft and saved power, but the mission fell behind schedule.', 'பாதுகாப்பு நிலை விண்கலத்தைப் பாதுகாத்து மின்சக்தியை சேமித்தது; ஆனால் மிஷன் கால அட்டவணையில் பின்தங்கியது.'] }] },
  { title: ['FUEL RESERVE ALERT', 'எரிபொருள் இருப்பு எச்சரிக்கை'], sit: ['The spacecraft has less fuel remaining than expected.', 'எதிர்பார்த்ததைவிட விண்கலத்தில் குறைவான எரிபொருளே உள்ளது.'],
    start: s => { s.fuel = clamp(s.fuel - 20); }, ind: 'FUEL RESERVE|எரிபொருள் இருப்பு|fuel',
    opts: [
      { t: ['Maintain current trajectory.', 'தற்போதைய பாதையைத் தொடரவும்.'], d: { f: -10, d: 6, r: 8 }, dm: 58,
        c: ['The current path works but leaves a thin fuel reserve for the rest of the mission.', 'தற்போதைய பாதை செயல்படுகிறது; ஆனால் மீதமுள்ள மிஷனுக்கு எரிபொருள் இருப்பு குறைவாகவே உள்ளது.'] },
      { t: ['Optimize the trajectory and conserve fuel.', 'பாதையை மேம்படுத்தி எரிபொருளைச் சேமிக்கவும்.'], d: { f: -3, p: -6, c: -4, d: 6, e: -1, r: -6 }, dm: 82,
        c: ['A smoother trajectory saved fuel, but the longer route drew on power and communication windows.', 'சீரான பாதை எரிபொருளைச் சேமித்தது; ஆனால் நீண்ட வழி மின்சக்தியையும் தொடர்பு நேரத்தையும் எடுத்துக்கொண்டது.'] },
      { t: ['Use additional fuel to shorten the mission phase.', 'கூடுதல் எரிபொருளைப் பயன்படுத்தி மிஷன் கட்டத்தைக் குறைக்கவும்.'], d: { f: -22, d: 12, e: 8, r: 14 }, dm: 52,
        c: ['The shortcut saved time and boosted efficiency, but the fuel reserve is now dangerously low.', 'குறுக்குவழி நேரத்தை மிச்சப்படுத்தி செயல்திறனை உயர்த்தியது; ஆனால் எரிபொருள் இருப்பு ஆபத்தான அளவுக்குக் குறைந்துவிட்டது.'],
        alt: s => s.fuel < 55 ? { d: { f: -22, h: -5, d: 12, e: 8, r: 24 } } : null }] },
  { title: ['FINAL APPROACH', 'இறுதி அணுகுமுறை'], sit: ['ODYSSEY-01 has reached the outer region of KEPLER-X.', 'ODYSSEY-01, KEPLER-X-ன் வெளிப்புறப் பகுதியை அடைந்துவிட்டது.'],
    start: () => {}, ind: 'ALL',
    opts: [
      { t: ['Begin full scientific operations.', 'முழு அறிவியல் செயல்பாடுகளைத் தொடங்கவும்.'], d: { p: -18, c: -5, h: -8, d: 28, e: 5, r: 10 }, dm: 55,
        c: ['Every instrument came online and produced a flood of data.', 'அனைத்து கருவிகளும் இயங்கி அதிக அளவு தரவை உருவாக்கின.'],
        alt: s => (s.power < 45 || s.health < 50) ? { d: { p: -20, h: -22, d: 8, e: -5, r: 22 }, c: ['The systems could not support full operations; instruments overloaded and the spacecraft was damaged.', 'அமைப்புகளால் முழு செயல்பாட்டைத் தாங்க முடியவில்லை; கருவிகள் அதிக சுமையடைந்து விண்கலம் சேதமடைந்தது.'] } : null },
      { t: ['Perform one final systems check.', 'ஒரு இறுதி அமைப்புச் சரிபார்ப்பைச் செய்யவும்.'], d: { p: -6, f: -3, c: 3, h: 4, d: 16, e: 2, r: -8 }, dm: 80,
        c: ['The check confirmed system health and corrected small faults before observations began.', 'சரிபார்ப்பு அமைப்புகளின் நலத்தை உறுதி செய்து, ஆய்வு தொடங்கும் முன் சிறு பிழைகளைச் சரிசெய்தது.'] },
      { t: ['Reduce operations and prioritize spacecraft safety.', 'செயல்பாடுகளைக் குறைத்து விண்கலப் பாதுகாப்பிற்கு முன்னுரிமை அளிக்கவும்.'], d: { p: 4, h: 6, d: 10, e: -4, r: -12 }, dm: 62,
        c: ['The spacecraft is safe, but only limited observations were possible.', 'விண்கலம் பாதுகாப்பாக உள்ளது; ஆனால் குறைந்த அளவு ஆய்வுகளே சாத்தியமாயின.'] }] }
];

// ---------- screens ----------
function showIntro() {
  app.innerHTML = `<section class="center" style="margin-top:7vh"><p class="tag">SPACE WEEK 2026<br>THE JOURNEY BEYOND</p><p class="tag" style="color:var(--cy);margin-top:12px">DAY 04</p>
    <h1 style="margin-top:20px">${bi('MISSION CONTROL', 'மிஷன் கட்டுப்பாடு')}</h1>
    <div class="lead" style="margin-top:20px">${bi('YOU HAVE CONTROL OF THE SPACECRAFT', 'விண்கலத்தின் கட்டுப்பாடு இப்போது உங்களிடம்.')}</div>
    <div class="pnl" style="text-align:left;margin-top:20px"><h2 class="hd">${bi('MISSION BRIEFING', 'மிஷன் விளக்கம்')}</h2>
    ${bi('You are the mission controller of an unmanned deep-space spacecraft.', 'நீங்கள் ஆளில்லா ஆழ்விண்வெளி விண்கலத்தின் மிஷன் கட்டுப்பாட்டாளர்.')}
    <div style="height:8px"></div>${bi('Guide the spacecraft through a series of unexpected situations and successfully complete its scientific mission.', 'எதிர்பாராத சூழ்நிலைகளின் வழியே விண்கலத்தை வழிநடத்தி, அதன் அறிவியல் மிஷனை வெற்றிகரமாக முடியுங்கள்.')}</div>
    ${btn('brief', 'BEGIN MISSION', 'மிஷனை தொடங்கு', 'c')}</section>`;
}
function showBriefing() {
  const P = (e, t, v) => `<div>${bi(e, t)}<b>${v}</b></div>`;
  app.innerHTML = `<section class="pnl"><h2 class="hd">${bi('MISSION BRIEFING', 'மிஷன் விளக்கம்')}</h2>
    <div class="params">${P('MISSION NAME', 'மிஷன் பெயர்', 'PROJECT ODYSSEY')}${P('SPACECRAFT', 'விண்கலம்', 'ODYSSEY-01')}${P('TARGET', 'இலக்கு கிரகம்', 'KEPLER-X')}</div>
    <div class="lead">${bi('OBJECTIVE: Travel to the distant planet KEPLER-X and collect scientific data about its atmosphere and surface.', 'இலக்கு: தொலைதூர கிரகமான KEPLER-X-க்குச் சென்று, அதன் வளிமண்டலம் மற்றும் மேற்பரப்பு பற்றிய அறிவியல் தரவுகளைச் சேகரிக்கவும்.')}</div>
    <div class="params">${P('POWER', 'மின்சக்தி', '100%')}${P('COMMUNICATION', 'தொடர்பு', '100%')}${P('FUEL', 'எரிபொருள்', '100%')}${P('SPACECRAFT HEALTH', 'விண்கல நலம்', '100%')}${P('MISSION DATA', 'மிஷன் தரவு', '0%')}${P('MISSION RISK', 'மிஷன் ஆபத்து', bl('LOW', 'குறைவு'))}</div>
    <p style="color:var(--dim)">${bi('Every decision can change these values.', 'ஒவ்வொரு முடிவும் இந்த மதிப்புகளை மாற்றும்.')}</p>
    ${btn('start', 'ACCEPT MISSION', 'மிஷனை ஏற்கவும்', 'c')}</section>`;
}

// ---------- dashboard ----------
function startMission() {
  S = newState(); G = { event: 0, hazard: Math.random() < .5, dm: [], log: [] };
  const tel = Object.keys(LABEL).map(k => `<div class="tl" id="t-${k}"><div class="row"><span>${bl(LABEL[k][0], LABEL[k][1])}</span><b></b></div><div class="bar"><i></i></div></div>`).join('');
  app.innerHTML = `<div class="dash">
    <section class="pnl a-prog"><h2>${bi('MISSION PROGRESS', 'மிஷன் முன்னேற்றம்')}</h2><div class="bar"><i id="pbar"></i></div><ol id="steps"></ol></section>
    <section class="pnl a-tel"><h2>${bi('SPACECRAFT STATUS', 'விண்கல நிலை')}</h2>${tel}<div id="risk"></div></section>
    <section class="pnl a-ev ev" id="ev"></section>
    <section class="pnl a-vis"><h2>${bi('TRAJECTORY', 'பயணப் பாதை')}</h2>
      <svg class="vis" viewBox="0 0 300 110"><path id="route" d="M30 85 Q110 5 160 55 T270 35" fill="none" stroke="rgba(90,209,255,.3)" stroke-dasharray="3 4"/>
      <path id="done" d="M30 85 Q110 5 160 55 T270 35" fill="none" stroke="#5ad1ff" stroke-width="1.5"/>
      <circle cx="30" cy="85" r="8" fill="#2f6bd0"/><circle cx="270" cy="35" r="9" fill="#c9893d"/><ellipse cx="270" cy="35" rx="15" ry="3.5" fill="none" stroke="#e8c48a" transform="rotate(-20 270 35)"/>
      <text class="en" x="14" y="104">EARTH</text><text class="ta" x="14" y="104">பூமி</text><text class="en" x="110" y="82">DEEP SPACE</text><text class="ta" x="110" y="82">ஆழ்விண்வெளி</text><text x="226" y="62">KEPLER-X</text>
      <g id="craft"><path d="M-6 -3L6 0L-6 3L-3 0Z" fill="#fff"/></g></svg></section>
    <section class="pnl a-log"><h2>${bi('MISSION LOG', 'மிஷன் பதிவேடு')}</h2><ul id="log"></ul></section></div>`;
  addLog('✓', ['Mission initiated', 'மிஷன் தொடங்கப்பட்டது']);
  updateTelemetry(); updateProgress(); loadEvent(0); 
}
function updateTelemetry(changed) {
  Object.keys(LABEL).forEach(k => {
    const el = document.getElementById('t-' + k), v = S[k];
    el.querySelector('b').textContent = v + '%';
    const i = el.querySelector('i'); i.style.width = v + '%'; i.className = k === 'scientificData' ? '' : lvl(v);
    el.classList.toggle('chg', !!(changed && changed[k]));
  });
  const r = riskLabel(S.risk);
  document.getElementById('risk').innerHTML = `<span>${bl('MISSION RISK', 'மிஷன் ஆபத்து')}</span><b class="${r[2]}">${bl(r[0], r[1])}</b>`;
}
let craftAt = 0;
function updateProgress() {
  const n = G.event, route = document.getElementById('route'), L = route.getTotalLength();
  document.getElementById('pbar').style.width = (n / 6 * 100) + '%';
  document.getElementById('steps').innerHTML = EVENTS.map((e, i) => `<li class="${i < n ? 'done' : i === n ? 'cur' : ''}">0${i + 1}</li>`).join('');
  const from = craftAt, to = n / 6 * 0.92 + .04, t0 = performance.now();
  (function step(t) { // slide the spacecraft along the trajectory
    const k = Math.min(1, (t - t0) / 900), f = from + (to - from) * k, p = route.getPointAtLength(f * L), q = route.getPointAtLength(Math.min(L, f * L + 2));
    document.getElementById('craft').setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${Math.atan2(q.y - p.y, q.x - p.x) * 57.3})`);
    document.getElementById('done').style.strokeDasharray = `${f * L} ${L}`;
    if (k < 1) requestAnimationFrame(step); else craftAt = to;
  })(t0);
}
function addLog(icon, tx, warn) {
  const li = document.createElement('li'); if (warn) li.className = 'w';
  li.innerHTML = `${icon} ${bl(tx[0], tx[1])}`;
  const log = document.getElementById('log'); log.insertBefore(li, log.firstChild);
}
function indicator(e) {
  if (e.ind === 'RADAR') return `<div class="ind">${bl('RADAR SCAN', 'ரேடார் ஸ்கேன்')}<div class="radar"><i></i></div></div>`;
  if (e.ind === 'ALL') return `<div class="ind mini">${Object.keys(LABEL).filter(k => k !== 'scientificData').map(k => `<div>${bl(LABEL[k][0], LABEL[k][1])}<br><b>${S[k]}%</b></div>`).join('')}<div>${bl('RISK', 'ஆபத்து')}<br><b class="${riskLabel(S.risk)[2]}">${bl(riskLabel(S.risk)[0], riskLabel(S.risk)[1])}</b></div></div>`;
  const [en, ta, key] = e.ind.split('|');
  return key === 'warn' ? `<div class="ind">${bl(en, ta)}<div class="big warn">${bl('WARNING', 'எச்சரிக்கை')}</div></div>`
    : `<div class="ind">${bl(en, ta)}<div class="big">${S[key]}%</div><div class="bar"><i class="${lvl(S[key])}" style="width:${S[key]}%"></i></div></div>`;
}
function loadEvent(i) { // show a new situation and its options (shuffled so position gives nothing away)
  G.event = i; const e = EVENTS[i]; e.start(S);
  G.opts = e.opts.slice().sort(() => Math.random() - .5);
  updateTelemetry(); updateProgress(); addLog('⚠', e.title, true); 
  document.getElementById('ev').innerHTML = `<h2 class="hd">${bi('CURRENT EVENT · EVENT 0' + (i + 1), 'தற்போதைய நிகழ்வு · 0' + (i + 1))}</h2><h3>${bi(e.title[0], e.title[1])}</h3>
    <div class="sit">${bi(e.sit[0], e.sit[1])}</div>${indicator(e)}
    <p class="hd" style="margin-top:14px">${bi('Choose your response', 'உங்கள் நடவடிக்கையைத் தேர்வு செய்யவும்')}</p>
    ${G.opts.map((o, k) => `<button class="btn opt" data-opt="${k}">${bi(o.t[0], o.t[1])}</button>`).join('')}`;
}
function processDecision(k) { // apply the chosen option's consequences to the spacecraft
  const o = G.opts[k], res = Object.assign({ d: o.d, c: o.c }, o.alt && o.alt(S, G)), before = Object.assign({}, S), changed = {}, chips = [];
  Object.keys(res.d).forEach(key => { const f = KEYS[key]; S[f] = clamp(S[f] + res.d[key]); });
  Object.keys(KEYS).forEach(key => { const f = KEYS[key], diff = S[f] - before[f];
    if (diff) { changed[f] = 1; const nm = f === 'scientificData' ? ['DATA', 'தரவு'] : f === 'efficiency' ? ['EFFICIENCY', 'செயல்திறன்'] : f === 'risk' ? ['RISK', 'ஆபத்து'] : LABEL[f];
      const good = f === 'risk' ? diff < 0 : diff > 0; chips.push(`<span class="chip ${good ? 'up' : 'dn'}">${bl(nm[0], nm[1])} ${diff > 0 ? '+' : '−'}${Math.abs(diff)}</span>`); } });
  G.dm.push(o.dm);
  addLog('✓', o.t); updateTelemetry(changed); 
  const last = G.event === EVENTS.length - 1, dead = S.health <= 0 || S.power <= 0;
  document.getElementById('ev').innerHTML = `<h2 class="hd">${bi('DECISION RECORDED', 'முடிவு பதிவு செய்யப்பட்டது')}</h2>
    <div class="sit">${bi(o.t[0], o.t[1])}</div>
    <div class="cons"><p class="hd">${bi('CONSEQUENCE', 'விளைவு')}</p><p>${bi(res.c[0], res.c[1])}</p><div class="chips">${chips.join('')}</div></div>
    ${btn(last || dead ? 'final' : 'next', last || dead ? 'PROCEED TO FINAL MISSION CHECK' : 'CONTINUE MISSION', last || dead ? 'இறுதி மிஷன் சரிபார்ப்புக்கு செல்க' : 'மிஷனைத் தொடரவும்', 'c')}`;
  if (dead) addLog('⚠', ['Critical system failure', 'முக்கிய அமைப்பு செயலிழப்பு'], true);
  G.event++; if (!last && !dead) { updateProgress(); G.event--; }
  if (last || dead) { G.event = EVENTS.length; updateProgress(); }
}

// ---------- outcome, scores ----------
function calculateOutcome() {
  const ok = S.health >= 50 && S.power >= 30 && S.fuel >= 15 && S.communication >= 25 && S.risk < 60 && S.scientificData >= 60;
  const fail = S.health < 25 || S.power < 10 || S.fuel < 5 || S.communication < 5 || S.risk >= 90 || S.scientificData < 20;
  return fail ? 'fail' : ok ? 'success' : 'partial';
}
function calculateScores() { // hidden weighting: 25 / 20 / 20 / 20 / 15
  const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const sc = { dm: clamp(avg(G.dm)), res: clamp(avg([S.power, S.fuel, S.communication])), rsk: clamp(100 - S.risk), eff: clamp(S.efficiency), sci: clamp(S.scientificData * 1.25) };
  sc.total = clamp(sc.dm * .25 + sc.res * .2 + sc.rsk * .2 + sc.eff * .2 + sc.sci * .15);
  S.decisionScore = sc.total; return sc;
}
function showFinalSequence() {
  G.event = EVENTS.length;
  const sys = [['POWER', 'மின்சக்தி', S.power > 30], ['COMMUNICATION', 'தொடர்பு', S.communication > 25], ['NAVIGATION', 'வழிசெலுத்தல்', S.fuel > 10], ['SPACECRAFT HEALTH', 'விண்கல நலம்', S.health > 40], ['SCIENTIFIC SYSTEMS', 'அறிவியல் அமைப்புகள்', S.scientificData > 30]];
  app.innerHTML = `<section class="pnl center fin"><h2 class="hd">${bi('FINAL MISSION CHECK', 'இறுதி மிஷன் சரிபார்ப்பு')}</h2><ul style="padding:0">${sys.map((s, i) =>
    `<li style="animation-delay:${.5 + i * .5}s" class="${s[2] ? 'ok' : 'am'}">${s[2] ? '✓' : '!'} ${bl(s[0], s[1])}</li>`).join('')}</ul>
    <div class="lead" style="opacity:0;animation:in .6s 3.2s forwards">${bi('ODYSSEY-01 IS APPROACHING KEPLER-X', 'ODYSSEY-01, KEPLER-X-ஐ நெருங்குகிறது')}</div><div class="cd" id="cd"></div></section>`;
  ['03', '02', '01'].forEach((n, i) => setTimeout(() => { document.getElementById('cd').textContent = n; }, 4000 + i * 900));
  setTimeout(showResult, 7000);
}
function showResult() {
  const out = calculateOutcome(); G.outcome = out; calculateScores();
  const R = { success: ['MISSION SUCCESS', 'மிஷன் வெற்றி', 'ok', 'The spacecraft successfully completes its scientific mission.', 'விண்கலம் தனது அறிவியல் மிஷனை வெற்றிகரமாக நிறைவு செய்தது.'],
    partial: ['PARTIAL SUCCESS', 'பகுதி வெற்றி', 'am', 'The spacecraft survives and reaches the destination, but some mission objectives were compromised.', 'விண்கலம் பாதுகாப்பாக இலக்கை அடைந்தது; ஆனால் சில மிஷன் இலக்குகள் குறைவாகவே நிறைவேறின.'],
    fail: ['MISSION FAILURE', 'மிஷன் தோல்வி', 'rd', 'Critical systems or resources were lost before mission completion.', 'மிஷன் முடிவதற்கு முன்பே முக்கிய அமைப்புகள் அல்லது வளங்கள் இழக்கப்பட்டன.'] }[out];
  app.innerHTML = `<section class="pnl center"><h1 class="${R[2]}" style="font-size:clamp(1.6rem,7vw,2.4rem)">${bi(R[0], R[1])}</h1>
    <div class="lead">${bi(R[3], R[4])}</div>
    ${out === 'fail' ? `<div class="lead" style="color:var(--am)">${bi('MISSION FAILURE — BUT EVERY MISSION TEACHES AN ENGINEER SOMETHING.', 'மிஷன் தோல்வியடைந்தாலும், ஒவ்வொரு மிஷனும் ஒரு பொறியாளருக்கு புதிய பாடத்தை கற்றுத் தருகிறது.')}</div>` : ''}
    ${btn('report', 'REVIEW MISSION', 'மிஷனை மதிப்பாய்வு செய்', 'c')}${out !== 'success' ? btn('retry', 'TRY AGAIN', 'மீண்டும் முயற்சி செய்க', 'c alt') : ''}</section>`;
  
}
function showReport() {
  const sc = calculateScores(), out = G.outcome, names = { dm: ['DECISION MAKING', 'முடிவெடுக்கும் திறன்'], res: ['RESOURCE MANAGEMENT', 'வள மேலாண்மை'], rsk: ['RISK MANAGEMENT', 'ஆபத்து மேலாண்மை'], eff: ['MISSION EFFICIENCY', 'மிஷன் செயல்திறன்'], sci: ['SCIENTIFIC PRIORITY', 'அறிவியல் முன்னுரிமை'] };
  const good = { dm: ['Sound decision-making under pressure.', 'அழுத்தத்திலும் சிறந்த முடிவெடுக்கும் திறன்.'], res: ['Excellent resource management.', 'வளங்களை சிறப்பாக நிர்வகித்தீர்கள்.'], rsk: ['Risks were kept under control.', 'ஆபத்துகளை கட்டுக்குள் வைத்தீர்கள்.'], eff: ['The mission stayed efficient.', 'மிஷன் செயல்திறனுடன் நடந்தது.'], sci: ['Science goals were prioritized well.', 'அறிவியல் இலக்குகளுக்கு நல்ல முன்னுரிமை அளித்தீர்கள்.'] };
  const bad = { dm: ['Weigh trade-offs more carefully before acting.', 'செயல்படும் முன் சமரசங்களை இன்னும் கவனமாக எடைபோடுங்கள்.'], res: ['Power, fuel and signal ran low; plan reserves earlier.', 'மின்சக்தி, எரிபொருள், சிக்னல் குறைந்தன; இருப்புகளை முன்கூட்டியே திட்டமிடுங்கள்.'], rsk: ['High-risk decisions reduced mission safety.', 'அதிக ஆபத்தான முடிவுகள் மிஷன் பாதுகாப்பைக் குறைத்தன.'], eff: ['Overly cautious or costly choices reduced efficiency.', 'அதிகப்படியான எச்சரிக்கை அல்லது செலவான தேர்வுகள் செயல்திறனைக் குறைத்தன.'], sci: ['More science data was possible; balance safety with science.', 'இன்னும் அதிக அறிவியல் தரவு பெற முடியும்; பாதுகாப்பையும் அறிவியலையும் சமநிலைப்படுத்துங்கள்.'] };
  const ks = Object.keys(names), best = ks.reduce((a, b) => sc[b] > sc[a] ? b : a), worst = ks.reduce((a, b) => sc[b] < sc[a] ? b : a);
  const res = { success: ['MISSION SUCCESS', 'மிஷன் வெற்றி'], partial: ['PARTIAL SUCCESS', 'பகுதி வெற்றி'], fail: ['MISSION FAILURE', 'மிஷன் தோல்வி'] }[out];
  const learn = [['Spacecraft systems must balance limited resources.', 'விண்கல அமைப்புகள் குறைந்த வளங்களை சமநிலையில் பயன்படுத்த வேண்டும்.'], ['Communication with distant spacecraft can be delayed.', 'தொலைதூர விண்கலத்துடனான தொடர்பு தாமதமாகலாம்.'],
    ['Mission controllers decide using incomplete information.', 'மிஷன் கட்டுப்பாட்டாளர்கள் முழுமையற்ற தகவலைக் கொண்டே முடிவெடுக்கிறார்கள்.'], ['Missions involve trade-offs between safety, science, fuel, power and time.', 'மிஷன்களில் பாதுகாப்பு, அறிவியல், எரிபொருள், மின்சக்தி, நேரம் ஆகியவற்றிடையே சமரசங்கள் உண்டு.'],
    ['A successful mission depends on the entire system working together.', 'முழு அமைப்பும் ஒன்றாகச் செயல்பட்டால்தான் மிஷன் வெற்றி பெறும்.']];
  app.innerHTML = `<section class="pnl"><h2 class="hd">${bi('MISSION PERFORMANCE REPORT', 'மிஷன் செயல்திறன் அறிக்கை')}</h2>
    <div class="row2"><span>${bl('MISSION', 'மிஷன்')}</span><b>PROJECT ODYSSEY</b></div><div class="row2"><span>${bl('RESULT', 'முடிவு')}</span><b>${bl(res[0], res[1])}</b></div>
    <div class="center">${bi('FINAL SCORE', 'இறுதி மதிப்பெண்')}<div class="big2">${sc.total}/100</div></div>
    ${ks.map(k => `<div class="row2"><span>${bl(names[k][0], names[k][1])}</span><b>${sc[k]}/100</b></div>`).join('')}
    <div class="sec"><p class="hd">${bi('KEY STRENGTH', 'முக்கிய பலம்')}</p>${bi(good[best][0], good[best][1])}</div>
    <div class="sec"><p class="hd">${bi('AREA TO IMPROVE', 'மேம்படுத்த வேண்டியது')}</p>${bi(bad[worst][0], bad[worst][1])}</div>
    <div class="sec"><p class="hd">${bi('MISSION SUMMARY', 'மிஷன் சுருக்கம்')}</p>${bi(`ODYSSEY-01 finished with power ${S.power}%, fuel ${S.fuel}% and health ${S.health}%, and collected ${S.scientificData}% of the mission data.`, `ODYSSEY-01 மின்சக்தி ${S.power}%, எரிபொருள் ${S.fuel}%, நலம் ${S.health}% உடன் முடிந்து, மிஷன் தரவில் ${S.scientificData}% சேகரித்தது.`)}</div></section>
    <section class="pnl sec learn"><h2 class="hd">${bi('WHAT YOU LEARNED', 'நீங்கள் கற்றுக்கொண்டவை')}</h2>${learn.map(l => `<p>${bi(l[0], l[1])}</p>`).join('')}</section>
    ${btn('end', 'CONTINUE', 'தொடரவும்', 'c')}`;
}
function showEnd() {
  app.innerHTML = `<section class="center" style="margin-top:8vh"><p class="tag">SPACE WEEK 2026<br>THE JOURNEY BEYOND</p><p class="tag" style="color:var(--cy);margin-top:12px">${bl('DAY 04 · MISSION CONTROL', 'நாள் 04 · மிஷன் கட்டுப்பாடு')}</p>
    <h1 style="margin-top:20px;font-size:clamp(1.6rem,7vw,2.6rem)">${bi('MISSION COMPLETE', 'மிஷன் நிறைவு பெற்றது')}</h1>
    <div class="lead">${bi('Every spacecraft has a mission.<br>Every mission needs a controller.', 'ஒவ்வொரு விண்கலத்திற்கும் ஒரு மிஷன் உண்டு.<br>ஒவ்வொரு மிஷனுக்கும் ஒரு கட்டுப்பாட்டாளர் தேவை.')}</div>
    ${btn('retry', 'TRY AGAIN', 'மீண்டும் முயற்சி செய்க', 'c')}${btn('exit', 'EXIT MISSION', 'மிஷனை முடிக்கவும்', 'c alt')}</section>`;
}
function resetMission() { startMission(); } // restart with fresh values, no page refresh

// ---------- events ----------
const ACT = { brief: showBriefing, start: startMission, next: () => loadEvent(G.event + 1), final: showFinalSequence, report: showReport, retry: resetMission, end: showEnd, exit: showIntro };
app.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'), o = e.target.closest('[data-opt]');
  if (a) { window.scrollTo(0, 0); ACT[a.dataset.act](); }
  if (o) processDecision(+o.dataset.opt);
});
// ---------- language switch (English / Tamil) ----------
function setLang(l) {
  document.body.dataset.lang = l; document.documentElement.lang = l;
  document.querySelectorAll('#lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.l === l));
  try { localStorage.setItem('mcLang', l); } catch (e) {}
}
document.getElementById('lang').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (b) setLang(b.dataset.l); });
let savedLang = 'en'; try { savedLang = localStorage.getItem('mcLang') || 'en'; } catch (e) {}
setLang(savedLang);
showIntro();
