import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { AxeResults, Result, NodeResult } from "axe-core";
import { readFileSync } from "fs";
import { createRequire } from "module";
import type { AuthConfig } from "../core/auth.js";

export interface Violation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
  help: string;
  helpUrl: string;
  wcag: string[];
  nodes: Array<{
    selector: string;
    html: string;
    failureSummary: string;
  }>;
}

export interface IncompleteCheck {
  id: string;
  help: string;
  helpUrl: string;
  nodes_count: number;
  selectors: string[];
}

export interface AuditResult {
  url: string;
  violations: Violation[];
  passes: number;
  incomplete: number;
  incomplete_checks: IncompleteCheck[];
  contentType?: string;
  discoveredLinks?: string[];
  timestamp: string;
}

export interface AxeRunOptions {
  collectLinks?: boolean;
}

function extractWcagTags(result: Result): string[] {
  return (result.tags ?? [])
    .filter((tag) => tag.startsWith("wcag") || tag.startsWith("best-practice"))
    .map((tag) => tag.toUpperCase().replace("WCAG", "WCAG "));
}

function mapImpact(impact: string | null | undefined): Violation["impact"] {
  const valid = ["minor", "moderate", "serious", "critical"] as const;
  if (impact && valid.includes(impact as Violation["impact"])) {
    return impact as Violation["impact"];
  }
  return "moderate";
}

function mapNode(node: NodeResult): Violation["nodes"][number] {
  return {
    selector: node.target.join(", "),
    html: node.html,
    failureSummary: node.failureSummary ?? "",
  };
}

export async function runAxeAudit(target: string, auth?: AuthConfig, options?: AxeRunOptions): Promise<AuditResult> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      ...(auth?.storageState ? { storageState: auth.storageState } : {}),
      ...(auth?.headers ? { extraHTTPHeaders: auth.headers } : {}),
      ...(auth?.basicAuth ? { httpCredentials: auth.basicAuth } : {}),
    });
    page = await context.newPage();

    const isAbsoluteUrl =
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("file://") ||
      target.startsWith("data:");
    const url = isAbsoluteUrl ? target : `file://${target}`;

    const response = await page.goto(url, { waitUntil: "networkidle" });
    const contentType = response?.headers()["content-type"];

    // Inject axe-core from local node_modules — no CDN dependency, works offline
    const require = createRequire(import.meta.url);
    const axePath = require.resolve("axe-core");
    const axeSource = readFileSync(axePath, "utf-8");
    await page.addScriptTag({ content: axeSource });

    const results = await page.evaluate(async () => {
      // axe is available globally after the script tag injection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (globalThis as any).axe.run();
    }) as AxeResults;

    const violations: Violation[] = results.violations.map((v: Result) => ({
      id: v.id,
      impact: mapImpact(v.impact),
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      wcag: extractWcagTags(v),
      nodes: v.nodes.map(mapNode),
    }));

    const incomplete_checks: IncompleteCheck[] = results.incomplete.map((r: Result) => ({
      id: r.id,
      help: r.help,
      helpUrl: r.helpUrl,
      nodes_count: r.nodes.length,
      selectors: r.nodes.slice(0, 5).map((n) => n.target.join(", ")),
    }));

    let discoveredLinks: string[] | undefined;
    if (options?.collectLinks) {
      discoveredLinks = await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc: any = (globalThis as any).document;
        if (!doc) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Array.from(doc.querySelectorAll("a[href]")).map((a: any) => a.href).filter((h: string) => !!h);
      });
    }

    return {
      url,
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      incomplete_checks,
      ...(contentType ? { contentType } : {}),
      ...(discoveredLinks ? { discoveredLinks } : {}),
      timestamp: new Date().toISOString(),
    };
  } finally {
    await page?.close();
    await context?.close();
    await browser?.close();
  }
}

export async function runAxeAuditHtml(html: string, auth?: AuthConfig): Promise<AuditResult> {
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  return runAxeAudit(dataUrl, auth);
}
