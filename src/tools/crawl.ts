import { z } from "zod";
import { evaluateUrl } from "../core/evaluate-service.js";
import { authConfigSchema, type AuthConfig } from "../core/auth.js";

export const crawlSiteSchema = z.object({
  url: z.string().optional().describe("Starting URL to crawl. Use for same-origin link discovery."),
  sitemap: z.string().optional().describe("Optional sitemap.xml URL to seed the crawl queue."),
  routes: z.array(z.string()).optional().describe("Explicit list of route paths/URLs to seed the crawl queue."),
  includePatterns: z.array(z.string()).optional().describe("Regex patterns; only URLs matching at least one are enqueued."),
  excludePatterns: z.array(z.string()).optional().describe("Regex patterns; URLs matching any are skipped."),
  autoSitemap: z.boolean().optional().default(true).describe("When url provided, try /sitemap.xml, /sitemap_index.xml and robots.txt Sitemap directive before falling back to link discovery."),
  maxPages: z.number().int().min(1).max(200).default(20).describe("Maximum pages to audit."),
  auth: authConfigSchema.optional(),
});

export type CrawlSiteInput = z.input<typeof crawlSiteSchema>;
type CrawlSiteParsed = z.infer<typeof crawlSiteSchema>;

export interface CrawlPageResult {
  url: string;
  score: number;
  grade: string;
  wcag_level: string;
  violations: number;
  critical: number;
  serious: number;
  top_issue_ids: string[];
}

export interface CrawlSkippedPage {
  url: string;
  reason: string;
}

export interface CrawlAggregateViolation {
  violation_id: string;
  pages: number;
  total_affected_elements: number;
  highest_impact: string;
}

export interface CrawlSiteResult {
  startUrl?: string;
  sitemap?: string;
  discoveredSitemap?: string;
  origin: string;
  pagesDiscovered: number;
  pagesEnqueued: number;
  pagesAudited: number;
  pagesSkipped: number;
  skippedPages: CrawlSkippedPage[];
  averageScore: number;
  lowestScore?: { url: string; score: number };
  highestScore?: { url: string; score: number };
  topViolations: CrawlAggregateViolation[];
  pageResults: CrawlPageResult[];
  timestamp: string;
}

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
  "gclid", "fbclid", "msclkid", "yclid", "dclid",
  "mc_cid", "mc_eid", "_hsenc", "_hsmi", "hsCtaTracking",
  "ref", "ref_src", "ref_url", "referrer", "source",
  "igshid", "vero_conv", "vero_id",
]);

const NON_HTML_EXTENSIONS = new Set([
  ".css", ".js", ".mjs", ".cjs", ".json", ".webmanifest", ".map",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico", ".bmp",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".mp4", ".webm", ".mov", ".mp3", ".wav", ".ogg",
  ".pdf", ".zip", ".tar", ".gz", ".rar",
  ".xml", ".txt", ".csv", ".rss", ".atom",
]);

function urlExtension(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const dot = path.lastIndexOf(".");
    const slash = path.lastIndexOf("/");
    if (dot > slash) return path.slice(dot).toLowerCase();
    return "";
  } catch {
    return "";
  }
}

function hasNonHtmlExtension(url: string): boolean {
  const ext = urlExtension(url);
  if (!ext) return false;
  if (ext === ".html" || ext === ".htm" || ext === ".xhtml") return false;
  return NON_HTML_EXTENSIONS.has(ext);
}

function isHtmlContentType(ct: string | undefined): boolean {
  if (!ct) return true;
  const lower = ct.toLowerCase();
  return lower.includes("text/html") || lower.includes("application/xhtml");
}

function ensureHttpUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Crawl only supports http/https URLs: ${value}`);
  }
  return url;
}

function stripTrackingParams(url: URL): void {
  const keep: Array<[string, string]> = [];
  for (const [k, v] of url.searchParams.entries()) {
    if (TRACKING_PARAMS.has(k.toLowerCase())) continue;
    keep.push([k, v]);
  }
  // Rebuild deterministically sorted to dedupe query-order variants
  keep.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  url.search = "";
  for (const [k, v] of keep) url.searchParams.append(k, v);
}

function normalizeUrlForCrawl(raw: string, origin: string): string | null {
  try {
    const url = new URL(raw, origin);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.origin !== origin) return null;
    url.hash = "";
    stripTrackingParams(url);
    return url.toString().replace(/\/$/, "") || url.origin;
  } catch {
    return null;
  }
}

function compilePatterns(patterns: string[] | undefined): RegExp[] {
  if (!patterns) return [];
  return patterns.map((p) => new RegExp(p));
}

function passesPatterns(url: string, include: RegExp[], exclude: RegExp[]): boolean {
  if (exclude.some((r) => r.test(url))) return false;
  if (include.length > 0 && !include.some((r) => r.test(url))) return false;
  return true;
}

function extractUrlsFromSitemap(xml: string, origin: string): string[] {
  const urls = new Set<string>();
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
    const normalized = normalizeUrlForCrawl(match[1].trim(), origin);
    if (normalized) urls.add(normalized);
  }
  return [...urls];
}

function buildFetchHeaders(auth?: AuthConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "user-agent": "Loop11y/0.1 crawler",
    accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.8",
    ...(auth?.headers ?? {}),
  };
  if (auth?.basicAuth) {
    headers.authorization = `Basic ${Buffer.from(`${auth.basicAuth.username}:${auth.basicAuth.password}`).toString("base64")}`;
  }
  return headers;
}

async function fetchText(url: string, auth?: AuthConfig): Promise<string> {
  const response = await fetch(url, {
    headers: buildFetchHeaders(auth),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function checkContentTypeIsHtml(url: string, auth?: AuthConfig): Promise<{ ok: boolean; contentType?: string }> {
  try {
    const head = await fetch(url, { method: "HEAD", headers: buildFetchHeaders(auth) });
    if (head.ok || head.status === 405) {
      const ct = head.headers.get("content-type") ?? undefined;
      if (head.status === 405) return { ok: true };
      return { ok: isHtmlContentType(ct), ...(ct ? { contentType: ct } : {}) };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

async function tryFetchText(url: string, auth?: AuthConfig): Promise<string | null> {
  try {
    return await fetchText(url, auth);
  } catch {
    return null;
  }
}

async function discoverSitemapUrls(origin: string, auth?: AuthConfig): Promise<string[]> {
  const urls = new Set<string>();
  const candidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];

  const robots = await tryFetchText(`${origin}/robots.txt`, auth);
  if (robots) {
    for (const match of robots.matchAll(/^\s*Sitemap:\s*(\S+)/gim)) {
      candidates.push(match[1].trim());
    }
  }

  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const xml = await tryFetchText(candidate, auth);
    if (!xml) continue;
    // sitemap index: recurse one level
    if (/<sitemapindex/i.test(xml)) {
      for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
        const child = match[1].trim();
        if (seen.has(child)) continue;
        seen.add(child);
        const childXml = await tryFetchText(child, auth);
        if (childXml) {
          for (const u of extractUrlsFromSitemap(childXml, origin)) urls.add(u);
        }
      }
    } else {
      for (const u of extractUrlsFromSitemap(xml, origin)) urls.add(u);
    }
  }

  return [...urls];
}

async function seedQueue(input: CrawlSiteParsed, origin: string): Promise<{ urls: string[]; sitemapFound?: string }> {
  const urls = new Set<string>();
  let sitemapFound: string | undefined;

  if (input.sitemap) {
    const xml = await fetchText(input.sitemap, input.auth);
    for (const url of extractUrlsFromSitemap(xml, origin)) urls.add(url);
    sitemapFound = input.sitemap;
  } else if (input.url && input.autoSitemap !== false) {
    const discovered = await discoverSitemapUrls(origin, input.auth);
    if (discovered.length > 0) {
      for (const u of discovered) urls.add(u);
      sitemapFound = `${origin}/sitemap.xml`;
    }
  }

  if (input.url) {
    const normalized = normalizeUrlForCrawl(input.url, origin);
    if (normalized) urls.add(normalized);
  }

  if (input.routes) {
    for (const route of input.routes) {
      const normalized = normalizeUrlForCrawl(route, origin);
      if (normalized) urls.add(normalized);
    }
  }

  return { urls: [...urls], ...(sitemapFound ? { sitemapFound } : {}) };
}

export async function crawlSite(rawInput: CrawlSiteInput): Promise<CrawlSiteResult> {
  const input: CrawlSiteParsed = crawlSiteSchema.parse(rawInput);
  if (!input.url && !input.sitemap && !(input.routes && input.routes.length > 0)) {
    throw new Error("Provide url, sitemap, or routes to crawl.");
  }

  const anchor = ensureHttpUrl(input.url ?? input.sitemap ?? input.routes![0]);
  const origin = anchor.origin;
  const seed = await seedQueue(input, origin);
  const includeRegex = compilePatterns(input.includePatterns);
  const excludeRegex = compilePatterns(input.excludePatterns);
  const queue = seed.urls.filter((u) => passesPatterns(u, includeRegex, excludeRegex));
  const visited = new Set<string>();
  const pageResults: CrawlPageResult[] = [];
  const skippedPages: CrawlSkippedPage[] = [];
  const violationMap = new Map<string, CrawlAggregateViolation>();

  while (queue.length > 0 && pageResults.length < input.maxPages) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (!passesPatterns(current, includeRegex, excludeRegex)) {
      skippedPages.push({ url: current, reason: "pattern-filter" });
      continue;
    }

    if (hasNonHtmlExtension(current)) {
      skippedPages.push({ url: current, reason: "non-html-extension" });
      continue;
    }

    const ctCheck = await checkContentTypeIsHtml(current, input.auth);
    if (!ctCheck.ok) {
      skippedPages.push({ url: current, reason: `non-html-content-type${ctCheck.contentType ? `:${ctCheck.contentType}` : ""}` });
      continue;
    }

    try {
      const evaluation = await evaluateUrl({
        url: current,
        include_html_snippets: false,
        ...(input.auth ? { auth: input.auth } : {}),
        axe: { collectLinks: true },
      });

      if (evaluation.content_type && !isHtmlContentType(evaluation.content_type)) {
        skippedPages.push({ url: current, reason: `non-html-content-type:${evaluation.content_type}` });
        continue;
      }

      const pageResult: CrawlPageResult = {
        url: current,
        score: evaluation.score,
        grade: evaluation.grade,
        wcag_level: evaluation.wcag_level,
        violations: evaluation.summary.violations,
        critical: evaluation.summary.critical,
        serious: evaluation.summary.serious,
        top_issue_ids: evaluation.top_issues.slice(0, 5).map((issue) => issue.violation_id),
      };
      pageResults.push(pageResult);

      for (const issue of evaluation.top_issues) {
        const existing = violationMap.get(issue.violation_id);
        if (existing) {
          existing.pages += 1;
          existing.total_affected_elements += issue.affected_elements;
        } else {
          violationMap.set(issue.violation_id, {
            violation_id: issue.violation_id,
            pages: 1,
            total_affected_elements: issue.affected_elements,
            highest_impact: issue.impact,
          });
        }
      }

      const discovered = evaluation.discovered_links ?? [];
      for (const raw of discovered) {
        const normalized = normalizeUrlForCrawl(raw, origin);
        if (!normalized) continue;
        if (!passesPatterns(normalized, includeRegex, excludeRegex)) continue;
        if (visited.has(normalized) || queue.includes(normalized)) continue;
        if (queue.length + pageResults.length >= input.maxPages * 3) break;
        queue.push(normalized);
      }
    } catch (err) {
      skippedPages.push({ url: current, reason: `audit-error:${err instanceof Error ? err.message : String(err)}` });
    }
  }

  pageResults.sort((a, b) => a.score - b.score);
  const averageScore = pageResults.length > 0
    ? Math.round(pageResults.reduce((sum, page) => sum + page.score, 0) / pageResults.length)
    : 0;

  const topViolations = [...violationMap.values()]
    .sort((a, b) => {
      if (b.pages !== a.pages) return b.pages - a.pages;
      return b.total_affected_elements - a.total_affected_elements;
    })
    .slice(0, 15);

  const lowest = pageResults[0];
  const highest = [...pageResults].sort((a, b) => b.score - a.score)[0];

  return {
    ...(input.url ? { startUrl: input.url } : {}),
    ...(input.sitemap ? { sitemap: input.sitemap } : {}),
    ...(seed.sitemapFound && !input.sitemap ? { discoveredSitemap: seed.sitemapFound } : {}),
    origin,
    pagesDiscovered: visited.size + queue.length,
    pagesEnqueued: visited.size,
    pagesAudited: pageResults.length,
    pagesSkipped: skippedPages.length,
    skippedPages,
    averageScore,
    ...(lowest ? { lowestScore: { url: lowest.url, score: lowest.score } } : {}),
    ...(highest ? { highestScore: { url: highest.url, score: highest.score } } : {}),
    topViolations,
    pageResults,
    timestamp: new Date().toISOString(),
  };
}
