import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/root/.channelforge/bin/chrome-nosandbox', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.goto('file://' + process.cwd() + '/turnos.html', { waitUntil: 'load' });
const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 3000 ? requestAnimationFrame(f) : r(n / 3); }; requestAnimationFrame(f); }));
console.log('fps (headless, software raster):', fps.toFixed(1));
for (const t of [6, 22, 42, 70]) { await p.evaluate(t => window.__seek(t), t); await p.screenshot({ path: `out/phone-${t}.png` }); }
await b.close();
