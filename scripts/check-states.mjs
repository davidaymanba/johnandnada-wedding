// Checks reduced-motion intro + countdown states with a mocked clock. Run with the dev server up.
import { chromium } from "playwright";
const b = await chromium.launch();
const errs = [];
// Reduced motion: intro → quick door → knock → content visible
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://localhost:3210/");
await p.waitForSelector('.intro[data-phase="door"]', { timeout: 15000 });
await p.click(".door__btn", { force: true });
await p.waitForTimeout(1500);
console.log("reduced: intro gone =", (await p.$(".intro")) === null, "| verse visible =", await p.isVisible(".verse__text"));
await p.screenshot({ path: "docs/qa/reduced-motion-verse.png" });
// Countdown states
for (const [label, now] of [["before", "2026-11-10T12:00:00+02:00"], ["today-before", "2026-11-11T15:00:00+02:00"], ["today", "2026-11-11T20:00:00+02:00"], ["after", "2026-11-13T10:00:00+02:00"]]) {
  await p.goto(`http://localhost:3210/?skip&now=${encodeURIComponent(now)}#countdown`);
  await p.waitForTimeout(1500);
  const title = await p.textContent("#countdown-title");
  const clock = await p.$(".countdown__clock");
  console.log(label.padEnd(13), "|", title, "| clock:", Boolean(clock), "| pct:", await p.textContent(".journey__pct"));
}
await b.close();
console.log(errs.length ? errs : "no page errors");
