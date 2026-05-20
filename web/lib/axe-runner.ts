import axe from "axe-core";
import type { AxeResults, Result, NodeResult } from "axe-core";
import { chromium as playwrightChromium, type Browser } from "playwright-core";

export interface Violation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
  help: string;
  helpUrl: string;
  wcag: string[];
  nodes: Array<{ selector: string; html: string; failureSummary: string }>;
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
  axeVersion?: string;
  viewport?: { width: number; height: number };
  discoveredLinks?: string[];
  timestamp: string;
}

export interface AxeRunOptions {
  collectLinks?: boolean;
}

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

function mapImpact(impact: string | null | undefined): Violation["impact"] {
  const valid = ["minor", "moderate", "serious", "critical"] as const;
  if (impact && valid.includes(impact as Violation["impact"])) {
    return impact as Violation["impact"];
  }
  return "moderate";
}

function extractWcagTags(result: Result): string[] {
  return (result.tags ?? [])
    .filter((tag) => tag.startsWith("wcag") || tag.startsWith("best-practice"))
    .map((tag) => tag.toUpperCase().replace("WCAG", "WCAG "));
}

function mapNode(node: NodeResult): Violation["nodes"][number] {
  return {
    selector: node.target.join(", "),
    html: node.html,
    failureSummary: node.failureSummary ?? "",
  };
}

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const sparticuz = (await import("@sparticuz/chromium")).default;
    sparticuz.setHeadlessMode = true;
    sparticuz.setGraphicsMode = false;
    const executablePath = await sparticuz.executablePath();
    const existing = process.env.LD_LIBRARY_PATH ?? "";
    const ldPath = ["/tmp/aws/lib", "/tmp/al2023/lib", "/tmp", existing]
      .filter(Boolean)
      .join(":");
    process.env.LD_LIBRARY_PATH = ldPath;
    return playwrightChromium.launch({
      args: sparticuz.args,
      executablePath,
      headless: true,
      env: { ...process.env, LD_LIBRARY_PATH: ldPath } as Record<string, string>,
    });
  }
  return playwrightChromium.launch({ headless: true });
}

export async function runAxeAudit(target: string, options?: AxeRunOptions): Promise<AuditResult> {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      viewport: DEFAULT_VIEWPORT,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const response = await page.goto(target, { waitUntil: "networkidle", timeout: 30_000 });
    const contentType = response?.headers()["content-type"];

    await page.addScriptTag({ content: axe.source });

    const evalResult = (await page.evaluate(async () => {
      const a = (globalThis as unknown as { axe: typeof axe }).axe;
      const results = await a.run();
      return { results, version: a.version };
    })) as { results: AxeResults; version: string };

    const { results, version } = evalResult;

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
        const doc = (globalThis as unknown as { document: Document }).document;
        return Array.from(doc.querySelectorAll("a[href]"))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter(Boolean);
      });
    }

    return {
      url: target,
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      incomplete_checks,
      ...(contentType ? { contentType } : {}),
      ...(discoveredLinks ? { discoveredLinks } : {}),
      axeVersion: version,
      viewport: DEFAULT_VIEWPORT,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}
