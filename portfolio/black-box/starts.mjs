import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/root/.channelforge/bin/chrome-nosandbox', args: ['--no-sandbox'] });
const p = await b.newPage(); await p.goto('file://' + process.cwd() + '/black-box.html?t=0');
console.log(JSON.stringify(await p.evaluate(() => ({ total: window.__total, starts: DEF.map(d => d.start) })))); await b.close();
