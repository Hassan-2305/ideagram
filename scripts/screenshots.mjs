// Visual QA: signs in a throwaway user and captures key pages at desktop and
// mobile widths in both themes. Usage: node scripts/screenshots.mjs [baseUrl] [outDir]
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = process.argv[3] ?? "screenshots";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PAGES = (process.env.PAGES ?? "/,/discover,/idea/ed_paper-form-camera-pipeline,/lab,/remix,/hackathon,/gym,/vault,/build,/profile").split(",");

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const errors = [];

async function session(viewport, theme) {
  const ctx = await browser.newContext({ viewport, colorScheme: theme, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${theme} ${viewport.width}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${theme} ${viewport.width} console: ${m.text()}`));
  return { ctx, page };
}

const email = `qa-${Date.now()}@example.com`;
for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  for (const theme of (process.env.THEMES ?? "dark,light").split(",")) {
    const { ctx, page } = await session(viewport, theme);
    // anonymous landing
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/${name}-${theme}-landing.png`, fullPage: process.env.FULL === "1" });
    // sign up / in
    const res = await page.request.post(BASE + "/api/auth/signup", { data: { name: "Quinn QA", email: `${name}-${theme}-${email}`, password: "password123" } });
    if (!res.ok()) errors.push(`signup failed ${res.status()}`);
    for (const p of PAGES) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      const slug = p === "/" ? "home" : p.replace(/\//g, "_").replace(/^_/, "");
      await page.screenshot({ path: `${OUT}/${name}-${theme}-${slug}.png`, fullPage: process.env.FULL === "1" });
    }
    await ctx.close();
  }
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no page errors");
