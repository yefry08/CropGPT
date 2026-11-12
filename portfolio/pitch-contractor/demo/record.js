// Records the live walkthrough in a headed Chromium on Xvfb; ffmpeg grabs the X display. Logs scene start times.
const { chromium } = require('playwright');
const fs = require('fs');
const DUR = JSON.parse(fs.readFileSync(process.argv[2]));   // seconds of narration per scene
const URL = 'https://contractor-ai-one.vercel.app';
const log = []; let T0;
const mark = k => { log.push([k, (Date.now() - T0) / 1000]); fs.writeFileSync('scenes.json', JSON.stringify(log)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ headless: false, args: ['--kiosk', '--window-size=1920,1080', '--window-position=0,0', '--disable-infobars', '--hide-scrollbars'] });
  const ctx = await b.newContext({ viewport: null }); const p = await ctx.newPage();
  await ctx.addInitScript(() => {
    const add = () => { if (document.getElementById('_cur')) return; const c = document.createElement('div'); c.id = '_cur';
      c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-8.5L21 10z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg>';
      Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(960px,540px)' }); document.documentElement.appendChild(c);
      addEventListener('mousemove', e => { c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`; }, true); };
    document.readyState === 'loading' ? addEventListener('DOMContentLoaded', add) : add();
    try { localStorage.setItem('lang', 'en'); } catch {}
  });
  const pos = { x: 960, y: 540 };
  const move = async (x, y, steps = 30) => { await p.mouse.move(x, y, { steps }); pos.x = x; pos.y = y; };
  const moveTo = async loc => { const bb = await loc.boundingBox(); await move(bb.x + bb.width / 2, bb.y + bb.height / 2); };
  const click = async loc => { await loc.scrollIntoViewIfNeeded(); await moveTo(loc); await sleep(250); await loc.click(); };
  const scroll = async (dy, ms = 1500) => { const n = 30; for (let i = 0; i < n; i++) { await p.mouse.wheel(0, dy / n); await sleep(ms / n); } };
  const hold = async (k, t0) => { const left = DUR[k] * 1000 - (Date.now() - t0); if (left > 0) await sleep(left); };
  // warm up: load once in English so the first frame is ready
  await p.goto(URL + '/', { waitUntil: 'networkidle', timeout: 90000 }); await p.selectOption('select >> nth=0', 'en'); await sleep(1500);
  await p.goto(URL + '/', { waitUntil: 'networkidle' }); await p.selectOption('select >> nth=0', 'en').catch(() => {}); await sleep(1500);
  fs.writeFileSync('ready', '1'); while (!fs.existsSync('go')) await sleep(100);
  T0 = Date.now();
  let t = Date.now(); mark('n1'); await p.mouse.move(700, 960, { steps: 1 }); await sleep(800); await move(1450, 960, 12); await hold('n1', t);
  await move(560, 40, 6);
  t = Date.now(); mark('n2'); await click(p.locator('a[href="/analyze"]').first()); await p.getByRole('button', { name: /Upload PDF/ }).waitFor(); await sleep(1000);
  await click(p.getByRole('button', { name: /Upload PDF/ })); await sleep(900); await moveTo(p.locator('select').nth(1)); await sleep(900);
  await click(p.getByRole('button', { name: 'Continue' })); await sleep(700);
  await p.setInputFiles('input[type=file]', 'contrato-ejemplo.pdf'); await sleep(1200); await hold('n2', t);
  t = Date.now(); mark('n3'); await click(p.getByRole('button', { name: 'Continue' }));
  await p.getByRole('button', { name: 'Calculate' }).waitFor({ timeout: 60000 }); await sleep(600);
  await moveTo(p.locator('input[type=text]').nth(0)); await sleep(1200); await moveTo(p.locator('input[type=number]').first()); await sleep(1500);
  const calc = p.getByRole('button', { name: 'Calculate' }); await p.waitForTimeout(Math.max(0, DUR.n3 * 1000 - (Date.now() - t) - 1200)); await click(calc);
  t = Date.now(); mark('n4'); await p.getByText('Deviation from the median').first().waitFor({ timeout: 60000 }); await sleep(800);
  await moveTo(p.getByText('Deviation from the median').first()); await sleep(Math.max(1500, DUR.n4 * 1000 * .45 - (Date.now() - t)));
  await scroll(520, 1800); await move(900, 640); await hold('n4', t);
  t = Date.now(); mark('n5'); await p.evaluate(() => scrollTo(0, 0)); await click(p.locator('nav a[href="/anomalies"], header a[href="/anomalies"]').first());
  await p.locator('table a').first().waitFor(); await sleep(1500); await moveTo(p.locator('table td').nth(3)); await sleep(1500);
  await scroll(300, 1500); await hold('n5', t);
  t = Date.now(); mark('n6'); await click(p.locator('table a').nth(2)); await p.getByText('Deviation from the model').first().waitFor({ timeout: 60000 }); await sleep(1500);
  await p.getByText('Deviation from the model').first().scrollIntoViewIfNeeded(); await scroll(200, 800); await moveTo(p.getByText('Deviation from the model').first()); await hold('n6', t);
  t = Date.now(); mark('n7'); await p.evaluate(() => scrollTo(0, 0)); await click(p.locator('a[href="/territorios"]').first());
  await p.getByText('Chocó').first().waitFor(); await sleep(1000); await click(p.getByText('Chocó').first()); await p.getByText('What the population needs').first().waitFor({ timeout: 60000 }); await sleep(1500);
  await p.getByText('What the population needs').first().scrollIntoViewIfNeeded(); await scroll(120, 600); await moveTo(p.getByText('No adequate water or sanitation').first()); await sleep(1500);
  await moveTo(p.getByText(/water and sanitation contracts/).first()); await hold('n7', t);
  t = Date.now(); mark('n8'); await p.evaluate(() => scrollTo(0, 0)); await click(p.locator('a[href="/dashboard"]').first());
  await p.getByText('Institutional dashboard').first().waitFor(); await sleep(2000); await scroll(420, 2000); await hold('n8', t); await sleep(1500);
  mark('end'); await b.close();
})().catch(e => { console.error(e); fs.writeFileSync('error', String(e)); process.exit(1); });
