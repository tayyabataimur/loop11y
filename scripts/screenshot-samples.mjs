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
  { html: "examples/sample-report.html", out: "docs/sample-report.jpg" },
  { html: "examples/sample-diff-report.html", out: "docs/sample-diff-report.jpg" },
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
  await page.evaluate(() => {
    document.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
  });
  await page.screenshot({ path: resolve(repoRoot, t.out), fullPage: true, type: "jpeg", quality: 86 });
  await page.close();
  console.log(`wrote ${t.out}`);
}

await context.close();
await browser.close();
