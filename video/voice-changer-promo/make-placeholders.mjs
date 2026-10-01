// Generates labelled placeholder screenshots in ./assets/screenshots/.
// Replace each PNG with a real 1170x2532 App Store screenshot of the same name.
import {createRequire} from 'node:module';
import {execSync} from 'node:child_process';
const {chromium} = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'assets/screenshots');
const screens = [
  {file: 'record.png', step: '1', title: 'Record', hint: 'Tap to record your voice', tint: ['#E9E4FF', '#FFE3F1']},
  {file: 'effects.png', step: '2', title: 'Effects', hint: 'Robot · Chipmunk · Monster · Alien · Echo', tint: ['#E2F4FF', '#EDE6FF']},
  {file: 'preview.png', step: '3', title: 'Preview', hint: 'Live playback', tint: ['#DEF7EE', '#E4ECFF']},
  {file: 'adjust.png', step: '4', title: 'Adjust', hint: 'Pitch and speed', tint: ['#FFEBDD', '#FFE3F1']},
  {file: 'share.png', step: '5', title: 'Share', hint: 'WhatsApp · Instagram · TikTok', tint: ['#FFE3F1', '#E2F4FF']},
];
await fs.mkdir(outDir, {recursive: true});
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1170, height: 2532}});
for (const s of screens) {
  await page.setContent(`<body style="margin:0;width:1170px;height:2532px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:48px;font-family:Helvetica,Arial,sans-serif;color:#2A2550;background:linear-gradient(160deg,${s.tint[0]},${s.tint[1]})">
    <div style="position:absolute;top:60px;left:90px;font-size:52px;font-weight:600">9:41</div>
    <div style="width:260px;height:260px;border-radius:72px;border:6px dashed #8C84C8;display:grid;place-items:center;font-size:150px;font-weight:700;color:#8C84C8">${s.step}</div>
    <div style="font-size:120px;font-weight:700;letter-spacing:-3px">${s.title}</div>
    <div style="font-size:54px;color:#5F5A7A;text-align:center;max-width:900px;line-height:1.3">${s.hint}</div>
    <div style="margin-top:80px;padding:22px 40px;border-radius:999px;background:#FFFFFFAA;font:500 44px monospace;color:#5F5A7A">PLACEHOLDER · ${s.file}</div>
  </body>`);
  await page.screenshot({path: path.join(outDir, s.file)});
  console.log('wrote', s.file);
}
await browser.close();
