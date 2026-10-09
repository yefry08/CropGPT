// Streams drawn frames straight into ffmpeg: no PNG ever touches the disk.
// Usage: CHROME=... node renderpipe.mjs film.html [--out out/film.mp4] [--from 0] [--to N]
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2), flags = new Map();
let file;
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) flags.set(args[i], args[++i]); else if (!file) file = args[i];
}
if (!file) throw new Error('Usage: node renderpipe.mjs film.html [--out file.mp4]');
const name = path.basename(file, '.html');
const outFile = path.resolve(flags.get('--out') || path.join(path.dirname(file), 'out', `${name}.mp4`));
mkdirSync(path.dirname(outFile), { recursive: true });
const chrome = process.env.CHROME || '/root/.channelforge/bin/chrome-nosandbox';
if (!existsSync(chrome)) throw new Error('No Chrome at ' + chrome);

const url = pathToFileURL(path.resolve(file));
url.searchParams.set('bare', '1'); url.searchParams.set('frame', '0');
const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
let code = 0;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url.href, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: 60000 });
  const meta = await page.evaluate(() => ({ N: window.__NDRAW, fps: window.__fps, size: window.__size, error: window.__error }));
  if (meta.error || errors.length) throw new Error(meta.error || errors.join('\n'));
  const from = Number(flags.get('--from') ?? 0), to = Number(flags.get('--to') ?? meta.N);
  console.log(`${name}: frames ${from}..${to - 1} of ${meta.N}, ${meta.fps} fps draw, ${meta.size.w}x${meta.size.h}`);

  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-framerate', String(meta.fps), '-f', 'image2pipe', '-c:v', 'png', '-i', '-',
    '-vf', 'fps=24', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => { ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))); });
  ff.stdin.on('error', e => { if (e.code !== 'EPIPE') throw e; });
  const write = buf => new Promise(res => { if (ff.stdin.write(buf)) res(); else ff.stdin.once('drain', res); });

  const t0 = Date.now();
  for (let i = from; i < to; i++) {
    const data = await page.evaluate(i => window.__frame(i), i);
    if (errors.length) throw new Error(`Frame ${i}: ${errors.join('\n')}`);
    await write(Buffer.from(data.split(',')[1], 'base64'));
    if ((i - from + 1) % 240 === 0) {
      const done_ = i - from + 1, rate = done_ / ((Date.now() - t0) / 1000);
      console.log(`${done_}/${to - from}  ${rate.toFixed(1)} fps  eta ${Math.round((to - 1 - i) / rate / 60)} min`);
    }
  }
  ff.stdin.end();
  await done;
  console.log('Finished: ' + outFile);
} catch (e) { console.error(e.message); code = 1; } finally { await browser.close(); }
process.exit(code);
