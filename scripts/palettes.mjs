// Renders Home and Explore in every palette for side-by-side review.
// Usage: node scripts/palettes.mjs [baseUrl] [outDir]
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "screenshots/palettes";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + "/gym", { waitUntil: "networkidle" });
await page.request.post(BASE + "/api/auth/signup", { data: { name: "Riley", email: `pal-${Date.now()}@example.com`, password: "password123" } });
await page.goto(BASE + "/gym", { waitUntil: "networkidle" });
for (const palette of ["ocean", "ember", "rose", "graphite", "aurora"]) {
  for (const theme of (process.env.THEMES ?? "dark").split(",")) {
    await page.evaluate(([p, t]) => {
      localStorage.setItem("ig.palette", p);
      localStorage.setItem("ig.theme", t);
    }, [palette, theme]);
    for (const [path, name] of [["/", "home"], ["/discover", "explore"]]) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.screenshot({ path: `${OUT}/${palette}-${theme}-${name}.png` });
    }
  }
}
await browser.close();
console.log("done");
