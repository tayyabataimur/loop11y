#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const outDir = resolve(repoRoot, "docs");
mkdirSync(outDir, { recursive: true });

const targets = [
  { html: "examples/sample-report.html", out: ["docs/sample-report.jpg", "web/public/sample-report.jpg"] },
  { html: "examples/sample-diff-report.html", out: ["docs/sample-diff-report.jpg", "web/public/sample-diff-report.jpg"] },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 1.5,
  reducedMotion: "reduce",
});

for (const t of targets) {
  const page = await context.newPage();
  const url = pathToFileURL(resolve(repoRoot, t.html)).toString();
  await page.goto(url, { waitUntil: "networkidle" });
  // Keep <details> closed for the compact marketing shot.
  const contentHeight = await page.evaluate(() => {
    const container = document.querySelector(".container");
    return container ? container.getBoundingClientRect().height + 48 : document.documentElement.scrollHeight;
  });
  await page.setViewportSize({ width: 1200, height: Math.min(Math.ceil(contentHeight), 1600) });
  const primary = t.out[0];
  await page.screenshot({ path: resolve(repoRoot, primary), fullPage: true, type: "jpeg", quality: 86 });
  for (const extra of t.out.slice(1)) {
    const { copyFileSync, mkdirSync } = await import("node:fs");
    mkdirSync(dirname(resolve(repoRoot, extra)), { recursive: true });
    copyFileSync(resolve(repoRoot, primary), resolve(repoRoot, extra));
  }
  await page.close();
  for (const p of t.out) console.log(`wrote ${p}`);
}

await context.close();
await browser.close();
