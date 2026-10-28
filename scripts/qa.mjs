// Playwright walkthrough: intro → knock → every section → guestbook post. Screenshots → docs/qa/
// Usage: node scripts/qa.mjs [baseUrl] [--only=mobile|desktop] [--intro] [--sections] [--theme=light]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3210";
const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const doIntro = process.argv.includes("--intro") || !process.argv.includes("--sections");
const doSections = process.argv.includes("--sections") || !process.argv.includes("--intro");
const theme = process.argv.find((a) => a.startsWith("--theme="))?.split("=")[1] ?? "dark";
const out = path.join(root, "docs/qa");
fs.mkdirSync(out, { recursive: true });

const viewports = [
  { name: "mobile", ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
  { name: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
].filter((v) => !only || v.name === only);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const errors = [];

for (const vp of viewports) {
  const { name, ...opts } = vp;

  if (doIntro) {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript((t) => localStorage.setItem("nj-theme", t), theme);
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push(`[${name}] ${m.text()}`));
    page.on("pageerror", (e) => errors.push(`[${name}] ${e.message}`));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await wait(1200);
    await page.screenshot({ path: `${out}/${theme}-${name}-00-preloader.png` });
    await page.waitForSelector(".intro__begin", { timeout: 20000 });
    await wait(1200);
    await page.screenshot({ path: `${out}/${theme}-${name}-01a-ready.png` });
    const music = await page.evaluate(() => document.querySelector("audio")?.getAttribute("src"));
    await page.click(".intro__begin");
    await wait(600);
    const playing = await page.evaluate(() => {
      const a = document.querySelector(".intro audio");
      return a ? !a.paused : false;
    });
    console.log(`[${name}] music ${music} playing after tap: ${playing}`);
    await wait(2600);
    await page.screenshot({ path: `${out}/${theme}-${name}-01-video.png` });
    await page.waitForSelector('.intro[data-phase="door"]', { timeout: 30000 });
    await wait(3600);
    await page.screenshot({ path: `${out}/${theme}-${name}-02-door.png` });
    await page.click(".door__btn", { force: true });
    for (const [i, t] of [600, 1300, 2000, 2700, 3400].entries()) {
      await wait(i === 0 ? t : t - [600, 1300, 2000, 2700, 3400][i - 1]);
      await page.screenshot({ path: `${out}/${theme}-${name}-03-open-${i}.png` });
    }
    await wait(2600);
    await page.screenshot({ path: `${out}/${theme}-${name}-04-verse.png` });
    await ctx.close();
  }

  if (doSections) {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript((t) => localStorage.setItem("nj-theme", t), theme);
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push(`[${name}] ${m.text()}`));
    page.on("pageerror", (e) => errors.push(`[${name}] ${e.message}`));
    await page.goto(`${base}/?skip`, { waitUntil: "networkidle" });
    await wait(1500);
    // Walk down the page slowly so every ScrollTrigger fires, shooting a frame per screen.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.round(opts.viewport.height * 0.8);
    let i = 0;
    for (let y = 0; y < total + step; y += step) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await wait(1500);
      await page.screenshot({ path: `${out}/${theme}-${name}-s${String(i++).padStart(2, "0")}.png` });
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      if (y > h) break;
    }
    // Guestbook round trip
    await page.evaluate(() => document.querySelector("#guestbook")?.scrollIntoView());
    await wait(1200);
    await page.fill('input[name="name"]', "QA Guest");
    await page.fill('textarea[name="message"]', "May the Lord bless your home with peace and joy.");
    await page.click(".chip:nth-of-type(1) span");
    await page.click(".guestbook__submit");
    await wait(2000);
    await page.locator("#guestbook").screenshot({ path: `${out}/${theme}-${name}-guestbook-posted.png` });
    // Lightbox
    await page.evaluate(() => document.querySelector("#memories")?.scrollIntoView());
    await wait(2200);
    await page.click(".tile--1 .tile__btn");
    await wait(1200);
    await page.screenshot({ path: `${out}/${theme}-${name}-lightbox.png` });
    await page.keyboard.press("Escape");
    // Horizontal overflow check
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) errors.push(`[${name}] horizontal overflow: ${overflow}px`);
    await ctx.close();
  }
}

await browser.close();
console.log(errors.length ? `Errors:\n${errors.join("\n")}` : "No console errors.");
