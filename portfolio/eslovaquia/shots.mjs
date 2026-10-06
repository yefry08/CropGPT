import puppeteer from 'puppeteer-core';
const [,, file, out, ...times] = process.argv;
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/root/.channelforge/bin/chrome-nosandbox', args: ['--no-sandbox','--allow-file-access-from-files'] });
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.setViewport({ width: 540, height: 960 });
await p.goto('file://' + process.cwd() + '/' + file + '?t=0', { waitUntil: 'load' });
const total = await p.evaluate(() => window.__total);
console.log('TOTAL', total.toFixed(2));
const ts = times.length ? times.map(Number) : Array.from({length: 40}, (_, i) => +(i * total / 40).toFixed(2));
for (const t of ts) { await p.evaluate(t => window.__seek(t), t); await p.screenshot({ path: `${out}-${String(t.toFixed(2)).padStart(6,'0')}.png` }); }
console.log('errors:', errs.length ? errs : 'none');
await b.close();
