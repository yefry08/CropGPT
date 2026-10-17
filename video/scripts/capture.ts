// Captures the live platform at 1920x1080 with Playwright and reads the home-page counters.
// Writes assets/captures/<key>.png and assets/captures/status.json. Never fakes a screen:
// a step that fails leaves its capture missing and the video shows [CAPTURA PENDIENTE].
//
// The platform's markup is unknown ahead of time, so each step finds its target by visible text.
// If a step misses, adjust the matching text in STEPS below and run `npm run capture` again.
import { chromium, type Page } from "playwright-core";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { PLATFORM_URL, WIDTH, HEIGHT } from "../config.ts";

const DIR = new URL("../assets/captures/", import.meta.url);
const out = (k: string) => new URL(`${k}.png`, DIR).pathname;
const log: Record<string, string> = {};

function finish(ok: boolean, extra: object = {}) {
  writeFileSync(new URL("status.json", DIR), JSON.stringify({ ok, url: PLATFORM_URL, at: new Date().toISOString(), steps: log, ...extra }, null, 2) + "\n");
}

mkdirSync(DIR, { recursive: true });
for (const k of ["home", "list", "filters", "anomalies", "detail", "sources"]) rmSync(out(k), { force: true });

if (!/^https?:\/\//.test(PLATFORM_URL)) {
  log.url = `PLATFORM_URL no es una URL (${PLATFORM_URL}). Defínela en config.ts.`;
  finish(false);
  console.error(`STOP: ${log.url}`);
  process.exit(1);
}

const executablePath = process.env.CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

try {
  const res = await page.goto(PLATFORM_URL, { waitUntil: "networkidle", timeout: 45000 });
  if (!res || res.status() >= 400) throw new Error(`HTTP ${res?.status()}`);
} catch (e) {
  log.url = `No se pudo abrir ${PLATFORM_URL}: ${(e as Error).message}`;
  finish(false);
  console.error(`STOP: ${log.url}`);
  await browser.close();
  process.exit(1);
}

// Reads counters: short numeric elements, classified by the words in their card.
async function readFigures(p: Page) {
  const cards: { num: string; ctx: string }[] = await p.evaluate(() => {
    const res: { num: string; ctx: string }[] = [];
    document.querySelectorAll("body *").forEach((el) => {
      const t = (el as HTMLElement).innerText?.trim();
      if (!t || el.children.length > 0 || !/^[\d.,\s]+(\s?(M|K|mil|millones|million))?$/i.test(t) || !/\d/.test(t)) return;
      const card = el.parentElement?.parentElement ?? el.parentElement;
      res.push({ num: t, ctx: (card as HTMLElement)?.innerText ?? "" });
    });
    return res;
  });
  const toInt = (s: string) => parseInt(s.replace(/[^\d]/g, ""), 10);
  const figures: Record<string, number> = {};
  for (const { num, ctx } of cards) {
    if (/anomal/i.test(ctx) && figures.anomalies === undefined) figures.anomalies = toInt(num);
    else if (/pa[ií]s|countr/i.test(ctx) && figures.countries === undefined) figures.countries = toInt(num);
    else if (/contrat|contract/i.test(ctx) && figures.contracts === undefined) figures.contracts = toInt(num);
  }
  return { figures, raw: cards.slice(0, 30) };
}

async function step(key: string, fn: () => Promise<void>) {
  try {
    await fn();
    await page.waitForTimeout(800);
    await page.screenshot({ path: out(key) });
    log[key] = "ok";
  } catch (e) {
    log[key] = `falló: ${(e as Error).message.split("\n")[0]}`;
  }
}
const clickText = async (re: RegExp) => {
  await page.getByText(re).first().click({ timeout: 8000 });
  await page.waitForLoadState("networkidle").catch(() => {});
};

const STEPS: [string, () => Promise<void>][] = [
  ["home", async () => {}],
  ["list", async () => {
    await clickText(/^(contratos|contracts)$/i);
    const search = page.getByRole("searchbox").or(page.getByPlaceholder(/buscar|search/i)).first();
    if (await search.count()) await search.click();
  }],
  ["filters", async () => {
    // Opens the first country filter so the filter options are visible.
    const country = page.getByLabel(/pa[ií]s|country/i).first();
    await country.click({ timeout: 8000 });
  }],
  ["anomalies", async () => {
    await page.keyboard.press("Escape");
    const box = page.getByLabel(/anomal/i).first();
    if (await box.count()) await box.check({ timeout: 8000 }).catch(() => box.click());
    else await clickText(/solo con anomal|only anomal/i);
  }],
  ["detail", async () => {
    await page.getByRole("row").nth(1).or(page.getByRole("link", { name: /ver|detalle|view|detail/i }).first()).first().click({ timeout: 8000 });
    await page.waitForLoadState("networkidle").catch(() => {});
  }],
  ["sources", async () => {
    await page.goto(PLATFORM_URL, { waitUntil: "networkidle" });
    const h = page.getByText(/fuentes de datos por pa[ií]s|data sources by country/i).first();
    if (!(await h.count())) await clickText(/fuentes|sources/i);
    await page.getByText(/fuentes de datos por pa[ií]s|data sources by country/i).first().scrollIntoViewIfNeeded({ timeout: 8000 });
  }],
];

const home = await readFigures(page);
for (const [k, fn] of STEPS) await step(k, fn);
await browser.close();
finish(true, { figures: home.figures, rawCounters: home.raw });
console.log(JSON.stringify({ steps: log, figures: home.figures }, null, 2));
