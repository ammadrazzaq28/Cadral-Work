// Voice Changer promo — 1080x1920 (9:16) HyperFrames composition.
// Built on the bs-creatormotion-cards-action-checklist skill: a persistent checklist
// beside phone media, with each 0.20 s stroke-drawn check firing at its task `at`
// timestamp and the screen state changing on the same beat.
//
//   node video/voice-changer-promo/build.mjs
//   npx --yes hyperframes@0.8.30 render video/voice-changer-promo/project \
//     --output video/voice-changer-promo/output/voice-changer-promo.mp4 --fps 30 --quality high --strict
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const skillAssets = path.join(root, '.claude/skills/bs-creatormotion-cards-action-checklist/references/runtime-assets');
const screenshots = path.join(root, 'assets/screenshots');
const out = path.join(here, 'project');
const c = JSON.parse(await fs.readFile(path.join(here, 'content.json'), 'utf8'));

const W = 1080, H = 1920, FPS = 30;
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));

// ---------- assets ----------
await fs.rm(out, {recursive: true, force: true});
await fs.mkdir(path.join(out, 'assets/fonts'), {recursive: true});
await fs.mkdir(path.join(out, 'assets/screens'), {recursive: true});
const fontFiles = (await fs.readdir(path.join(skillAssets, 'fonts'))).filter(f => /^(inter|ibm-plex-mono|ibmplexmono)/.test(f));
for (const f of fontFiles) await fs.copyFile(path.join(skillAssets, 'fonts', f), path.join(out, 'assets/fonts', f));
await fs.copyFile(path.join(skillAssets, 'gsap.min.js'), path.join(out, 'assets/gsap.min.js'));
for (const t of c.tasks) await fs.copyFile(path.join(screenshots, t.screen), path.join(out, 'assets/screens', t.screen));
const fontCSS = (await Promise.all(['inter.css', 'ibm-plex-mono.css'].map(async f =>
  (await fs.readFile(path.join(skillAssets, 'fonts', f), 'utf8')).replace(/url\(([^)]+)\)/g, 'url(assets/fonts/$1)')))).join('\n');

// ---------- waveform shapes (one per effect) ----------
const BARS = 30;
const rand = i => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
const shapes = {
  flat: i => 0.08,
  voice: i => 0.25 + 0.7 * rand(i) * Math.sin(Math.PI * (i + 0.5) / BARS),
  Robot: i => [0.85, 0.85, 0.85, 0.3, 0.3, 0.3][i % 6],
  Chipmunk: i => (i % 2 ? 0.22 : 0.55) + 0.15 * rand(i + 7),
  Monster: i => 0.55 + 0.45 * Math.sin(Math.PI * (i + 0.5) / BARS),
  Alien: i => 0.5 + 0.42 * Math.sin(i * 0.75),
  Echo: i => { const k = i % 10; const burst = [1, 0.62, 0.36][Math.floor(i / 10)]; return 0.1 + burst * Math.max(0, 1 - Math.abs(k - 2.5) / 3); },
  tuned: i => 0.18 + 0.6 * ([0.85, 0.85, 0.3, 0.3][i % 4]) * (0.75 + 0.25 * Math.sin(i * 0.4)),
};
const prism = ['#8B7CFF', '#A88BFF', '#C996F5', '#F29BCB', '#FF9EB8', '#9ED0FF', '#7FD9E8', '#8FE3C8'];
const barColor = i => prism[Math.floor(i / BARS * prism.length)];

// ---------- timeline helpers ----------
const A = [];
const r3 = n => Math.round(n * 1000) / 1000;
const tw = (kind, sel, vars, at) => A.push(`tl.${kind}(${JSON.stringify(sel)},${JSON.stringify(vars)},${r3(at)});`);
const morph = (shape, at, dur = 0.35, ease = 'power2.inOut') => {
  for (let i = 0; i < BARS; i++) tw('to', `#bar-${i}`, {scaleY: r3(Math.max(0.06, Math.min(1, shapes[shape](i)))), duration: dur, ease}, at + i * 0.006);
};
const swap = (fromSel, toSel, at, d = 0.22) => { if (fromSel) tw('to', fromSel, {opacity: 0, duration: d, ease: 'power2.out'}, at); tw('to', toSel, {opacity: 1, duration: d, ease: 'power2.out'}, at); };
const tapAt = at => {
  A.push(`tl.fromTo('#tap',{opacity:0,scale:.6},{opacity:.9,scale:1,duration:.18,ease:'power2.out',immediateRender:false},${r3(at - 0.32)});`);
  A.push(`tl.to('#tap',{opacity:0,scale:1.5,duration:.3,ease:'power2.out'},${r3(at - 0.08)});`);
};

const T = c.tasks.map(t => t.at);
const [t1, t2, t3, t4, t5] = T;

// ---------- markup ----------
const tasksHTML = c.tasks.map((t, i) => `
  <div class="task" id="task-${i}">
    <span class="box" id="box-${i}"><span class="box-fill" id="fill-${i}"></span><svg viewBox="0 0 60 60"><path id="tick-${i}" pathLength="1" d="M13 31L25 43L48 17"/></svg></span>
    <span class="task-label">${esc(t.label)}</span>
  </div>`).join('');

const barsHTML = Array.from({length: BARS}, (_, i) => `<i id="bar-${i}" class="bar" style="background:${barColor(i)}"></i>`).join('');
const screensHTML = c.tasks.map((t, i) => `<img id="screen-${i}" class="screen" src="assets/screens/${esc(t.screen)}" alt="${esc(c.appName)} screen ${i + 1}">`).join('');
const chipsHTML = c.effects.map((e, i) => `<span class="chip" id="chip-${i}">${esc(e)}</span>`).join('');
const shareHTML = c.shareTargets.map((s, i) => `<span class="pill" id="share-${i}">${esc(s)}</span>`).join('');

const html = `
<div class="bg"><span class="orb orb-a"></span><span class="orb orb-b"></span><span class="orb orb-c"></span></div>
<div id="demo">
  <section id="checklist" class="glass">
    <p class="eyebrow">${esc(c.eyebrow)}</p>
    <h1 class="list-title">${esc(c.checklistTitle)}</h1>
    <div class="tasks">${tasksHTML}</div>
  </section>

  <div id="phone"><div class="screen-wrap">${screensHTML}<span id="tap"></span></div><span class="island"></span></div>

  <section id="studio" class="glass">
    <div class="studio-head">
      <span id="rec-dot"></span>
      <span class="studio-label" id="studio-label">Ready</span>
      <span class="studio-meta mono" id="studio-meta">0:00</span>
    </div>
    <div class="wave">${barsHTML}<span id="playhead"></span></div>
    <div class="panel-stack">
      <div class="panel" id="panel-rec"><span class="rec-btn"><span class="rec-core" id="rec-core"></span></span><span class="panel-note">Hold to talk</span></div>
      <div class="panel chips" id="panel-fx">${chipsHTML}</div>
      <div class="panel" id="panel-play"><span class="play-btn"><svg viewBox="0 0 40 40"><path id="play-icon" d="M14 10L31 20L14 30Z"/><g id="pause-icon"><rect x="12" y="10" width="6" height="20" rx="2"/><rect x="22" y="10" width="6" height="20" rx="2"/></g></svg></span><span class="track"><span id="progress"></span></span></div>
      <div class="panel sliders" id="panel-adjust">
        <div class="slider"><span class="s-label">Pitch</span><span class="rail"><span class="knob" id="knob-pitch"></span></span></div>
        <div class="slider"><span class="s-label">Speed</span><span class="rail"><span class="knob" id="knob-speed"></span></span></div>
      </div>
      <div class="panel chips" id="panel-share">${shareHTML}<span class="sent" id="sent">Sent ✓</span></div>
    </div>
  </section>
</div>

<div id="endcard">
  <div class="app-icon" id="end-icon"><span></span><span></span><span></span><span></span><span></span></div>
  <h2 id="end-name">${esc(c.appName)}</h2>
  <p id="end-tagline">${esc(c.tagline)}</p>
  <div class="badge" id="end-badge"><span class="b-small">${esc(c.badge[0])}</span><span class="b-big">${esc(c.badge[1])}</span></div>
</div>`;

// ---------- styles: Soft Prism (light) ----------
const css = `
:root{--ink:#221D45;--muted:#5E587E;--glass:rgba(255,255,255,.62);--glass-line:rgba(255,255,255,.9);--rule:#DCD6F2;
--prism:linear-gradient(120deg,#8B7CFF 0%,#F29BCB 52%,#7FD9E8 100%);--shadow:0 24px 60px rgba(92,76,170,.16);
--font:"Inter",sans-serif;--mono:"IBM Plex Mono",monospace}
*{box-sizing:border-box}html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#F4F1FF;color:var(--ink);font-family:var(--font);font-weight:450;font-optical-sizing:auto;font-synthesis:none;-webkit-font-smoothing:antialiased}
#composition{position:relative;width:${W}px;height:${H}px;overflow:hidden}
h1,h2,p{margin:0}.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.bg{position:absolute;inset:0;background:linear-gradient(165deg,#F1ECFF 0%,#FFEAF4 46%,#E5F6FB 100%)}
.orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.75}
.orb-a{width:620px;height:620px;left:-180px;top:-120px;background:#D9CFFF}
.orb-b{width:560px;height:560px;right:-200px;top:760px;background:#FFD0E6}
.orb-c{width:640px;height:640px;left:120px;bottom:-300px;background:#C8EEF6}
.glass{position:absolute;background:var(--glass);border:2px solid var(--glass-line);border-radius:40px;box-shadow:var(--shadow);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
#demo{position:absolute;inset:0}

#checklist{left:60px;right:60px;top:110px;padding:34px 40px 30px}
.eyebrow{font:500 24px/1.2 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.list-title{margin-top:12px;font-size:54px;line-height:1.08;font-weight:700;letter-spacing:-.028em}
.tasks{margin-top:22px;display:flex;flex-direction:column;gap:6px}
.task{position:relative;display:flex;align-items:center;gap:22px;padding:11px 16px;border-radius:22px;font-size:30px;line-height:1.22;font-weight:550;letter-spacing:-.01em}
.task::before{content:"";position:absolute;inset:0;border-radius:22px;background:rgba(255,255,255,.85);opacity:var(--hl,0)}
.task>*{position:relative}
.box{display:grid;place-items:center;flex:none;width:48px;height:48px;border:2.5px solid var(--ink);border-radius:12px;position:relative;overflow:hidden;color:#fff}
.box-fill{position:absolute;inset:0;background:var(--prism);opacity:0}
.box svg{position:relative;width:40px;height:40px}
.box path{fill:none;stroke:currentColor;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1}

#phone{position:absolute;left:70px;top:730px;width:400px;height:860px;border-radius:64px;background:#fff;padding:12px;box-shadow:0 30px 70px rgba(92,76,170,.24),inset 0 0 0 2px #E6E1FA}
.screen-wrap{position:relative;width:100%;height:100%;border-radius:52px;overflow:hidden;background:#EEE9FF}
.screen{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0}
#screen-0{opacity:1}
.island{position:absolute;top:28px;left:50%;width:120px;height:34px;margin-left:-60px;border-radius:20px;background:#15122B}
#tap{position:absolute;left:50%;top:70%;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;border:5px solid #fff;background:rgba(139,124,255,.35);box-shadow:0 0 0 8px rgba(139,124,255,.18);opacity:0}

#studio{left:500px;right:60px;top:820px;height:600px;padding:34px 30px}
.studio-head{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:650;letter-spacing:-.01em}
#rec-dot{width:18px;height:18px;border-radius:50%;background:#C9C1F5}
.studio-label{flex:1}
.studio-meta{font-size:24px;color:var(--muted);font-weight:500}
.wave{position:relative;margin-top:34px;height:200px;display:flex;align-items:center;justify-content:space-between;padding:0 4px}
.bar{display:block;width:8px;height:100%;border-radius:8px;transform-origin:50% 50%}
#playhead{position:absolute;top:-10px;bottom:-10px;left:0;width:4px;border-radius:4px;background:var(--ink);opacity:0}
.panel-stack{position:relative;margin-top:44px;height:220px}
.panel{position:absolute;inset:0;display:flex;align-items:center;gap:18px;opacity:0}
#panel-rec{opacity:1}
.rec-btn{display:grid;place-items:center;width:104px;height:104px;border-radius:50%;border:5px solid #FF8FA8;background:#fff;flex:none}
.rec-core{width:66px;height:66px;border-radius:50%;background:#FF6B8B}
.panel-note{font-size:26px;color:var(--muted);font-weight:500}
.chips{flex-wrap:wrap;align-content:center;gap:12px}
.chip,.pill{padding:12px 20px;border-radius:999px;background:rgba(255,255,255,.9);border:2px solid var(--rule);font-size:25px;font-weight:600}
.chip.on{background:var(--prism);color:#fff;border-color:transparent}
.play-btn{display:grid;place-items:center;width:96px;height:96px;border-radius:50%;background:var(--prism);flex:none;box-shadow:0 10px 24px rgba(139,124,255,.35)}
.play-btn svg{width:44px;height:44px;fill:#fff}
#pause-icon{opacity:0}
.track{flex:1;height:12px;border-radius:12px;background:var(--rule);overflow:hidden}
#progress{display:block;width:100%;height:100%;background:var(--prism);transform-origin:0 50%}
.sliders{flex-direction:column;align-items:stretch;justify-content:center;gap:34px}
.slider{display:flex;align-items:center;gap:18px}
.s-label{width:96px;font-size:26px;font-weight:600}
.rail{position:relative;flex:1;height:10px;border-radius:10px;background:var(--rule)}
.knob{position:absolute;top:50%;left:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:#fff;border:6px solid #A88BFF;box-shadow:0 6px 14px rgba(92,76,170,.25)}
.sent{width:100%;margin-top:6px;font-size:28px;font-weight:650;color:#3BAF8F;opacity:0}

#endcard{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;padding-bottom:120px;opacity:0}
.app-icon{width:220px;height:220px;border-radius:56px;background:var(--prism);box-shadow:0 30px 70px rgba(139,124,255,.38);display:flex;align-items:center;justify-content:center;gap:14px}
.app-icon span{width:18px;border-radius:10px;background:#fff}
.app-icon span:nth-child(1),.app-icon span:nth-child(5){height:54px}.app-icon span:nth-child(2),.app-icon span:nth-child(4){height:100px}.app-icon span:nth-child(3){height:140px}
#end-name{margin-top:24px;font-size:104px;line-height:1.04;font-weight:720;letter-spacing:-.035em}
#end-tagline{font-size:46px;font-weight:500;color:var(--muted);letter-spacing:-.015em}
.badge{margin-top:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;width:380px;height:118px;border-radius:26px;background:#111;color:#fff;box-shadow:0 18px 40px rgba(17,17,17,.22)}
.b-small{font-size:24px;font-weight:500;letter-spacing:.01em}
.b-big{font-size:46px;font-weight:650;letter-spacing:-.02em;line-height:1.05}
`;

// ---------- timeline ----------
A.push(`tl.from('#demo',{opacity:0,duration:.3,ease:'power2.out'},0);`);
for (let i = 0; i < BARS; i++) tw('set', `#bar-${i}`, {scaleY: 0.08}, 0);
const hl = (i, from, to) => { tw('to', `#task-${i}`, {'--hl': 1, duration: 0.25, ease: 'power2.out'}, from); tw('to', `#task-${i}`, {'--hl': 0, duration: 0.3, ease: 'power2.out'}, to); };
const check = (i, at) => {
  // The skill's defining beat: 0.20 s stroke at the action timestamp, screen state changes on the same beat.
  A.push(`tl.fromTo('#tick-${i}',{strokeDashoffset:1},{strokeDashoffset:0,duration:.20,ease:'power2.out',immediateRender:false},${r3(at)});`);
  tw('to', `#fill-${i}`, {opacity: 1, duration: 0.12, ease: 'power2.out'}, at);
  tw('set', `#box-${i}`, {borderColor: 'rgba(0,0,0,0)'}, at);
  if (i + 1 < c.tasks.length) swap(`#screen-${i}`, `#screen-${i + 1}`, at);
};
const label = (text, at) => tw('set', '#studio-label', {textContent: text}, at);
const meta = (text, at) => tw('set', '#studio-meta', {textContent: text}, at);

// 1 · Record
hl(0, 0.3, t1);
tapAt(0.75);
label('Recording…', 0.75); tw('to', '#rec-dot', {backgroundColor: '#FF6B8B', duration: 0.15}, 0.75);
tw('to', '#rec-core', {scale: 0.6, borderRadius: '14px', duration: 0.25, ease: 'power2.out'}, 0.75);
morph('voice', 0.8, 0.5, 'power2.out');
morph('Chipmunk', 1.35, 0.3); morph('voice', 1.7, 0.3);
['0:01', '0:02', '0:03'].forEach((s, k) => meta(s, 1.1 + k * 0.4));
tapAt(t1);
tw('to', '#rec-core', {scale: 1, borderRadius: '33px', duration: 0.2}, t1);
tw('to', '#rec-dot', {backgroundColor: '#C9C1F5', duration: 0.15}, t1);
check(0, t1);

// 2 · Pick an effect (waveform changes shape with each effect)
hl(1, t1 + 0.1, t2);
swap('#panel-rec', '#panel-fx', t1);
label('Choose effect', t1); meta('0:03', t1);
const fxStart = t1 + 0.35, fxStep = (t2 - 0.35 - fxStart) / c.effects.length;
c.effects.forEach((e, k) => {
  const at = fxStart + k * fxStep;
  if (k) tw('set', `#chip-${k - 1}`, {className: 'chip'}, at);
  tw('set', `#chip-${k}`, {className: 'chip on'}, at);
  label(e, at); morph(e, at, 0.3);
});
const pick = c.effects.indexOf(c.pickedEffect);
tapAt(t2);
tw('set', `#chip-${c.effects.length - 1}`, {className: 'chip'}, t2 - 0.35);
tw('set', `#chip-${pick}`, {className: 'chip on'}, t2 - 0.35);
label(c.pickedEffect, t2 - 0.35); morph(c.pickedEffect, t2 - 0.35, 0.3);
A.push(`tl.fromTo('#chip-${pick}',{scale:1},{scale:1.12,duration:.14,yoyo:true,repeat:1,ease:'power2.out',immediateRender:false},${r3(t2 - 0.35)});`);
check(1, t2);

// 3 · Preview with live playback
hl(2, t2 + 0.1, t3);
swap('#panel-fx', '#panel-play', t2);
label(`Preview · ${c.pickedEffect}`, t2);
const p0 = t2 + 0.6, p1 = t3 - 0.15;
tapAt(p0);
tw('to', '#play-icon', {opacity: 0, duration: 0.12}, p0); tw('to', '#pause-icon', {opacity: 1, duration: 0.12}, p0);
for (let i = 0; i < BARS; i++) tw('set', `#bar-${i}`, {opacity: 0.4}, p0);
tw('set', '#playhead', {opacity: 1, x: 0}, p0);
tw('to', '#playhead', {x: 450, duration: p1 - p0, ease: 'none'}, p0);
A.push(`tl.fromTo('#progress',{scaleX:0},{scaleX:1,duration:${r3(p1 - p0)},ease:'none',immediateRender:true},${r3(p0)});`);
for (let i = 0; i < BARS; i++) tw('to', `#bar-${i}`, {opacity: 1, duration: 0.1}, p0 + (p1 - p0) * (i / BARS));
['0:01', '0:02', '0:03'].forEach((s, k) => meta(s, p0 + (p1 - p0) * (k + 1) / 3));
tw('to', '#playhead', {opacity: 0, duration: 0.15}, p1);
tw('to', '#play-icon', {opacity: 1, duration: 0.12}, t3); tw('to', '#pause-icon', {opacity: 0, duration: 0.12}, t3);
check(2, t3);

// 4 · Fine-tune pitch and speed
hl(3, t3 + 0.1, t4);
swap('#panel-play', '#panel-adjust', t3);
label('Fine-tune', t3); meta('', t3);
const a0 = t3 + 0.35;
tw('to', '#knob-pitch', {x: 92, duration: 0.7, ease: 'power3.inOut'}, a0);
meta('Pitch +4', a0 + 0.2); morph('Chipmunk', a0 + 0.1, 0.6);
tw('to', '#knob-speed', {x: -48, duration: 0.7, ease: 'power3.inOut'}, a0 + 0.85);
meta('Speed 0.9×', a0 + 1.05); morph('tuned', a0 + 0.95, 0.6);
tapAt(t4);
check(3, t4);

// 5 · Export & share
hl(4, t4 + 0.1, t5);
swap('#panel-adjust', '#panel-share', t4);
label('Share', t4); meta('MP4 · M4A', t4);
c.shareTargets.forEach((s, k) => A.push(`tl.from('#share-${k}',{opacity:0,y:18,scale:.92,duration:.3,ease:'back.out(1.15)',immediateRender:false},${r3(t4 + 0.25 + k * 0.28)});`));
tapAt(t5 - 0.15);
tw('to', '#share-2', {backgroundColor: '#8B7CFF', color: '#fff', borderColor: '#8B7CFF', duration: 0.15}, t5 - 0.15);
tw('to', '#sent', {opacity: 1, duration: 0.2}, t5);
check(4, t5);

// Completed-state reading hold, then end card
const e0 = c.endCardAt;
tw('to', '#demo', {opacity: 0, scale: 0.96, duration: 0.45, ease: 'power2.inOut'}, e0);
tw('to', '#endcard', {opacity: 1, duration: 0.3, ease: 'power2.out'}, e0 + 0.25);
A.push(`tl.from('#end-icon',{scale:.6,opacity:0,duration:.5,ease:'back.out(1.15)',immediateRender:false},${r3(e0 + 0.3)});`);
A.push(`tl.from('#end-icon span',{scaleY:.2,duration:.5,stagger:.05,ease:'power3.out',immediateRender:false},${r3(e0 + 0.45)});`);
A.push(`tl.from('#end-name',{opacity:0,y:30,duration:.5,ease:'power3.out',immediateRender:false},${r3(e0 + 0.55)});`);
A.push(`tl.from('#end-tagline',{opacity:0,y:24,duration:.5,ease:'power3.out',immediateRender:false},${r3(e0 + 0.8)});`);
A.push(`tl.from('#end-badge',{opacity:0,y:24,duration:.5,ease:'power3.out',immediateRender:false},${r3(e0 + 1.05)});`);
A.push(`tl.to({}, {duration:.01},${r3(c.duration - 0.01)});`);

const doc = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(c.appName)} · Promo</title><style>${fontCSS}\n${css}</style></head>
<body><div id="composition" data-composition-id="${c.slug}" data-start="0" data-duration="${c.duration}" data-width="${W}" data-height="${H}" data-fps="${FPS}">${html}</div>
<script src="assets/gsap.min.js"></script><script>
const tl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}});
${A.join('\n')}
window.__timelines=window.__timelines||{};window.__timelines[${JSON.stringify(c.slug)}]=tl;
</script></body></html>`;

await fs.writeFile(path.join(out, 'index.html'), doc);
await fs.writeFile(path.join(out, 'hyperframes.json'), JSON.stringify({$schema: 'https://hyperframes.heygen.com/schema/hyperframes.json', paths: {assets: 'assets'}, media: {autoProxy: false}, skill: 'bs-creatormotion-cards-action-checklist'}, null, 2));
await fs.writeFile(path.join(out, 'build.json'), JSON.stringify({slug: c.slug, skill: 'bs-creatormotion-cards-action-checklist', style: 'soft-prism', width: W, height: H, fps: FPS, duration: c.duration, tasks: c.tasks}, null, 2));
console.log(`Built ${path.relative(root, out)}/index.html (${W}x${H}, ${c.duration}s)`);
