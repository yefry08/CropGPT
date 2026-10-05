// Records black-box.html to MP4: seeks every frame (deterministic), hides the player UI.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
const FPS = 30, out = process.argv[2] || 'out/black-box.mp4', page = process.argv[3] || 'nexus.html';
const b = await puppeteer.launch({ executablePath: '/root/.channelforge/bin/chrome-nosandbox', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
await p.goto('file://' + process.cwd() + '/' + page + '?t=0', { waitUntil: 'load' });
await p.addStyleTag({ content: '#ui{display:none!important}' });
const total = await p.evaluate(() => window.__total), n = Math.ceil(total * FPS);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let i = 0; i < n; i++) {
  await p.evaluate(t => window.__seek(t), i / FPS);
  const png = await p.screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 300 === 0) console.log(`frame ${i}/${n}`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', out);
