import { NextResponse } from "next/server";
import { evaluateUrl, type EvaluateResult } from "../../../lib/evaluate";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_PAGES = 5;

function normalizeUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

function pickSameOriginLinks(seed: URL, links: string[], limit: number): string[] {
  const seen = new Set<string>([seed.toString()]);
  const out: string[] = [];
  for (const href of links) {
    try {
      const u = new URL(href, seed);
      if (u.origin !== seed.origin) continue;
      u.hash = "";
      const key = u.toString();
      if (seen.has(key)) continue;
      const path = u.pathname.toLowerCase();
      if (/\.(pdf|zip|jpg|jpeg|png|gif|svg|webp|mp4|webm|mp3|css|js|ico)$/.test(path)) continue;
      seen.add(key);
      out.push(key);
      if (out.length >= limit) break;
    } catch {
      // skip malformed
    }
  }
  return out;
}

type PageResult =
  | { url: string; ok: true; score: number; grade: string; wcag_level: string; summary: EvaluateResult["summary"]; top_issues: EvaluateResult["top_issues"] }
  | { url: string; ok: false; error: string };

export async function POST(req: Request) {
  let body: { url?: string; max_pages?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const seed = normalizeUrl(body.url);
  if (!seed) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });

  const requested = typeof body.max_pages === "number" ? body.max_pages : 5;
  const max = Math.max(1, Math.min(MAX_PAGES, requested));

  const started = Date.now();
  const budgetMs = 55_000;

  const pages: PageResult[] = [];
  let first: EvaluateResult;
  try {
    first = await evaluateUrl(seed.toString(), { collectLinks: true });
  } catch (err) {
    return NextResponse.json({ error: `Seed audit failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
  pages.push({
    url: first.url,
    ok: true,
    score: first.score,
    grade: first.grade,
    wcag_level: first.wcag_level,
    summary: first.summary,
    top_issues: first.top_issues,
  });

  const queue = pickSameOriginLinks(seed, first.discovered_links ?? [], max - 1);

  for (const next of queue) {
    if (Date.now() - started > budgetMs) {
      pages.push({ url: next, ok: false, error: "Time budget exceeded — increase max_pages limit or retry" });
      break;
    }
    try {
      const r = await evaluateUrl(next);
      pages.push({
        url: r.url,
        ok: true,
        score: r.score,
        grade: r.grade,
        wcag_level: r.wcag_level,
        summary: r.summary,
        top_issues: r.top_issues,
      });
    } catch (err) {
      pages.push({ url: next, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const okPages = pages.filter((p): p is Extract<PageResult, { ok: true }> => p.ok);
  const totalViolations = okPages.reduce((sum, p) => sum + p.summary.violations, 0);
  const avgScore = okPages.length ? Math.round(okPages.reduce((s, p) => s + p.score, 0) / okPages.length) : 0;
  const worst = okPages.reduce<{ url: string; score: number } | null>(
    (acc, p) => (acc === null || p.score < acc.score ? { url: p.url, score: p.score } : acc),
    null,
  );
  const violationIds = new Set<string>();
  for (const p of okPages) for (const i of p.top_issues) violationIds.add(i.violation_id);

  return NextResponse.json({
    origin: seed.origin,
    seed: seed.toString(),
    requested_pages: max,
    audited_pages: okPages.length,
    elapsed_ms: Date.now() - started,
    aggregate: {
      avg_score: avgScore,
      worst_page: worst,
      total_violations: totalViolations,
      unique_violation_ids: Array.from(violationIds),
      by_impact: {
        critical: okPages.reduce((s, p) => s + p.summary.critical, 0),
        serious: okPages.reduce((s, p) => s + p.summary.serious, 0),
        moderate: okPages.reduce((s, p) => s + p.summary.moderate, 0),
        minor: okPages.reduce((s, p) => s + p.summary.minor, 0),
      },
    },
    pages,
  });
}
