// Responsive audit: walks the page on every common screen, flags layout problems, and
// builds one contact sheet per screen. Output → docs/qa/responsive/
// Usage: node scripts/responsive.mjs [baseUrl] [--only=name,name] [--theme=light] [--no-shots]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3210";
const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",");
const theme = process.argv.find((a) => a.startsWith("--theme="))?.split("=")[1] ?? "dark";
const shots = !process.argv.includes("--no-shots");
const out = path.join(root, "docs/qa/responsive");

const phone = { isMobile: true, hasTouch: true };
const screens = [
  { name: "android-320", viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, ...phone },
  { name: "android-360", viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, ...phone },
  { name: "iphone-se", viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, ...phone },
  { name: "iphone-15", viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, ...phone },
  { name: "pixel-412", viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, ...phone },
  { name: "iphone-max", viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, ...phone },
  { name: "phone-land", viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, ...phone },
  { name: "ipad-mini", viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, ...phone },
  { name: "ipad-air", viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, ...phone },
  { name: "ipad-land", viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, ...phone },
  { name: "ipad-pro", viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2, ...phone },
  { name: "laptop-1280", viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  { name: "laptop-1366", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
  { name: "laptop-1440", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  { name: "desktop-1920", viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
].filter((s) => !only || only.includes(s.name));

/** Runs in the page: everything that spills sideways, is too small to tap, or too small to read. */
function inspect() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const desc = (el) => {
    const c = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    const sec = el.closest("section,footer")?.id ?? (el.closest(".intro") ? "intro" : "page");
    return `${sec}> ${el.tagName.toLowerCase()}${c ? "." + c : ""}`;
  };
  const visible = (el, r) => {
    if (!r.width || !r.height || r.bottom < 0 || r.top > vh) return false;
    for (let p = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false;
    }
    return true;
  };
  const clippedInside = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(hidden|clip)/.test(cs.overflowX) || cs.clipPath !== "none") {
        const pr = p.getBoundingClientRect();
        if (pr.right <= vw + 1 && pr.left >= -1) return true;
      }
    }
    return false;
  };
  const res = { overflowX: document.documentElement.scrollWidth - vw, wide: [], small: [], tiny: [], cut: [], tall: [] };
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("svg") && el.tagName !== "svg") continue;
    const r = el.getBoundingClientRect();
    if (!visible(el, r)) continue;
    if ((r.right > vw + 1 || r.left < -1) && !clippedInside(el)) res.wide.push(`${desc(el)} [${Math.round(r.left)}→${Math.round(r.right)}]`);
    if (el.matches("a[href],button,input:not([type=radio]):not([tabindex='-1']),textarea,label.chip") && (r.width < 40 || r.height < 40))
      res.small.push(`${desc(el)} ${Math.round(r.width)}×${Math.round(r.height)} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)}"`);
    if (el.matches(".frame, .hero-photo, .arch, .lightbox img") && r.height > vh + 1)
      res.tall.push(`${desc(el)} ${Math.round(r.width)}×${Math.round(r.height)} (screen ${vh})`);
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText) {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.fontSize) < 11.5) res.tiny.push(`${desc(el)} ${cs.fontSize} "${el.textContent.trim().slice(0, 24)}"`);
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflowX !== "visible" && el.clientWidth > 0)
        res.cut.push(`${desc(el)} "${el.textContent.trim().slice(0, 30)}"`);
    }
  }
  return res;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const report = [];

for (const s of screens) {
  const { name, ...opts } = s;
  const dir = path.join(out, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript((t) => localStorage.setItem("nj-theme", t), theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${base}/?skip`, { waitUntil: "networkidle" });
  await wait(1500);

  const found = { wide: new Set(), small: new Set(), tiny: new Set(), cut: new Set(), tall: new Set() };
  let overflowX = 0;
  const step = Math.round(s.viewport.height * 0.85);
  const frames = [];
  for (let y = 0, i = 0; ; y += step, i++) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await wait(1300);
    const r = await page.evaluate(inspect);
    overflowX = Math.max(overflowX, r.overflowX);
    for (const k of Object.keys(found)) r[k].forEach((x) => found[k].add(x));
    if (shots) {
      const f = path.join(dir, `s${String(i).padStart(2, "0")}.png`);
      await page.screenshot({ path: f });
      frames.push(f);
    }
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    if (y + s.viewport.height >= h || i > 80) break;
  }
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await ctx.close();

  if (shots && frames.length) {
    // Contact sheet: frames left→right, top→bottom, each scaled to a fixed width.
    const w = s.viewport.width <= 500 ? 260 : s.viewport.width <= 900 ? 340 : 420;
    const scaled = await Promise.all(frames.map((f) => sharp(f).resize({ width: w }).png().toBuffer({ resolveWithObject: true })));
    const h = Math.max(...scaled.map((x) => x.info.height));
    const cols = Math.min(frames.length, Math.max(1, Math.floor(2600 / (w + 12))));
    const rows = Math.ceil(frames.length / cols);
    await sharp({ create: { width: cols * (w + 12) + 12, height: rows * (h + 12) + 12, channels: 3, background: "#888" } })
      .composite(scaled.map((x, i) => ({ input: x.data, left: 12 + (i % cols) * (w + 12), top: 12 + Math.floor(i / cols) * (h + 12) })))
      .png()
      .toFile(path.join(out, `${name}.png`));
  }
  report.push({ name, height, overflowX, ...Object.fromEntries(Object.entries(found).map(([k, v]) => [k, [...v]])), errors });
  console.log(`${name}: height ${height}px, overflowX ${overflowX}px, wide ${found.wide.size}, small ${found.small.size}, tiny ${found.tiny.size}, cut ${found.cut.size}, tall ${found.tall.size}, errors ${errors.length}`);
}

await browser.close();
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
