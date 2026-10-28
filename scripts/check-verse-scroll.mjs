// Scroll a little below the opening verse on a phone and confirm the words are still on screen.
import { chromium, devices } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3210/?skip");
await p.waitForTimeout(4500);
for (const y of [0, 200, 400]) {
  await p.mouse.wheel(0, y ? 200 : 0);
  await p.waitForTimeout(1200);
  const op = await p.evaluate(() => getComputedStyle(document.querySelector(".verse__inner")).opacity);
  await p.screenshot({ path: `docs/qa/verse-scroll-${y}.png` });
  console.log(`scrolled ${y}px → verse opacity ${op}`);
}
await b.close();
