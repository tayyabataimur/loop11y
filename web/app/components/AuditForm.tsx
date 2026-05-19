"use client";

import { useState, type FormEvent } from "react";

type Issue = {
  id?: string;
  violation_id?: string;
  impact?: "critical" | "serious" | "moderate" | "minor";
  description?: string;
  help?: string;
  helpUrl?: string;
  wcag_criterion?: string;
  affected_elements?: number;
  headline?: string;
};

type Summary = { violations?: number; critical?: number; serious?: number; moderate?: number; minor?: number; passed?: number; total_checks?: number };

type SingleResult = {
  url?: string;
  score?: number;
  grade?: string;
  wcag_level?: string;
  summary?: Summary;
  top_issues?: Issue[];
  axe_version?: string;
  viewport?: { width: number; height: number };
};

type CrawlPage =
  | { url: string; ok: true; score: number; grade: string; wcag_level: string; summary: Summary; top_issues: Issue[] }
  | { url: string; ok: false; error: string };

type CrawlResult = {
  origin: string;
  seed: string;
  audited_pages: number;
  requested_pages: number;
  elapsed_ms: number;
  aggregate: {
    avg_score: number;
    worst_page: { url: string; score: number } | null;
    total_violations: number;
    unique_violation_ids: string[];
    by_impact: { critical: number; serious: number; moderate: number; minor: number };
  };
  pages: CrawlPage[];
};

const GRADE_COLOR: Record<string, string> = {
  A: "#c7ff2a", B: "#c7ff2a", C: "#ffcd1e", D: "#ff8c28", F: "#b34a30",
};

function Gauge({ score, grade }: { score: number; grade: string }) {
  const radius = 64;
  const stroke = 10;
  const size = 160;
  const cx = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = GRADE_COLOR[grade] ?? "#c7ff2a";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score ${score} of 100`}>
      <circle cx={cx} cy={cx} r={radius} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="butt" strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.22,.61,.36,1)" }}
      />
      <text x={cx} y={cx + 10} textAnchor="middle" fontSize="56" fontFamily="var(--display)" fontStyle="italic" fill="#f2ead3" letterSpacing="-0.04em">{score}</text>
    </svg>
  );
}

function gradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 55) return "C";
  if (score >= 35) return "D";
  return "F";
}

export default function AuditForm() {
  const [url, setUrl] = useState("");
  const [crawl, setCrawl] = useState(false);
  const [maxPages, setMaxPages] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [single, setSingle] = useState<SingleResult | null>(null);
  const [crawlData, setCrawlData] = useState<CrawlResult | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null); setSingle(null); setCrawlData(null);
    const endpoint = crawl ? "/api/crawl" : "/api/audit";
    const payload = crawl ? { url, max_pages: maxPages } : { url };
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Audit failed (${res.status})`);
      if (crawl) setCrawlData(data);
      else setSingle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const issues = single?.top_issues ?? [];
  const score = single?.score ?? 0;
  const grade = single?.grade ?? "F";
  const noViolations = !!single && (single.summary?.violations ?? 0) === 0;

  return (
    <>
      <form className="audit-form" onSubmit={onSubmit}>
        <span className="prefix" aria-hidden="true">https://</span>
        <input
          type="text"
          inputMode="url"
          required
          placeholder="your-site.com"
          value={url.replace(/^https?:\/\//, "")}
          onChange={(e) => setUrl(`https://${e.target.value.replace(/^https?:\/\//, "")}`)}
          aria-label="URL to audit"
          autoComplete="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit" disabled={loading || !url}>
          {loading ? <><span className="spin" /> {crawl ? "Crawling" : "Auditing"}</> : <>{crawl ? `Crawl ${maxPages} pages ↗` : "Run audit ↗"}</>}
        </button>
      </form>

      <div className="audit-options">
        <label className="audit-toggle">
          <input
            type="checkbox"
            checked={crawl}
            onChange={(e) => setCrawl(e.target.checked)}
          />
          <span>Crawl same-origin pages</span>
        </label>
        {crawl && (
          <label className="audit-pages">
            <span>Pages</span>
            <select value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))}>
              {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="trust-line">
        <span>· No signup</span>
        <span>· ~10s / page</span>
        <span>· WCAG 2.2 · EN 301 549 · Section 508</span>
      </div>

      {error && <div className="error" role="alert">⚠ {error}</div>}

      {single && (
        <section className="result" aria-live="polite">
          <div className="result-head">
            <div><Gauge score={score} grade={grade} /></div>
            <div className="result-meta">
              <div className="mono">Report №{Date.now().toString(36).slice(-5).toUpperCase()}</div>
              <div className="result-url">{single.url ?? url}</div>
              <div className="result-grade-row">
                <span className="chip">Grade <strong>{grade}</strong></span>
                <span className="chip">WCAG <strong>{single.wcag_level ?? "—"}</strong></span>
                {typeof single.summary?.violations === "number" && (
                  <span className="chip">{single.summary.violations} violations</span>
                )}
                {typeof single.summary?.critical === "number" && single.summary.critical > 0 && (
                  <span className="chip bad">{single.summary.critical} critical</span>
                )}
                {typeof single.summary?.passed === "number" && (
                  <span className="chip">{single.summary.passed} passed</span>
                )}
              </div>
            </div>
          </div>

          {noViolations ? (
            <div className="result-empty">
              <div className="result-empty-badge" aria-hidden="true">✓</div>
              <div>
                <strong>Clean run. Zero axe-core violations.</strong>
                <p style={{ fontFamily: "var(--display)", fontSize: 17, marginTop: 10, color: "var(--cream-deep)" }}>
                  {single.summary?.passed ?? 0} checks passed at {single.viewport?.width ?? 1280}×{single.viewport?.height ?? 800}
                  {single.axe_version ? ` · axe-core ${single.axe_version}` : ""}.
                </p>
                <ul className="result-empty-list">
                  <li>Automated checks catch ~30% of WCAG. Run manual screen-reader + keyboard tests for the rest.</li>
                  <li>Re-run with <em>Crawl same-origin pages</em> to spot regressions on inner pages.</li>
                  <li>Wire <code>loop11y</code> into CI to keep this score green: <code>npx loop11y audit {single.url ?? url} --fail-under 90</code></li>
                </ul>
                <div className="result-empty-actions">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => { setCrawl(true); setMaxPages(5); }}
                  >
                    → Crawl 5 pages
                  </button>
                  <a
                    className="chip"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${single.url ?? url} scored ${single.score}/100 on Loop11y accessibility audit — zero axe-core violations.`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Share result ↗
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="result-issues">
              {issues.slice(0, 5).map((i, idx) => (
                <div key={idx} className="issue">
                  <div className="issue-rank">№{idx + 1}</div>
                  <div>
                    <div className="issue-title">{i.headline ?? i.help ?? i.id}</div>
                    <div className="issue-meta">
                      {i.impact && <span className={`tag-sev ${i.impact}`}>{i.impact}</span>}
                      {i.wcag_criterion && <span className="tag-wcag">{i.wcag_criterion}</span>}
                      {typeof i.affected_elements === "number" && (
                        <span className="tag-count">{i.affected_elements} el</span>
                      )}
                    </div>
                  </div>
                  {i.helpUrl && (
                    <a className="issue-link" href={i.helpUrl} target="_blank" rel="noreferrer">docs ↗</a>
                  )}
                </div>
              ))}
              {issues.length > 5 && (
                <div className="mono-md" style={{ color: "var(--ink-faint)", marginTop: 10 }}>
                  + {issues.length - 5} more · run <span style={{ color: "var(--lime)" }}>npx loop11y audit … --html</span> for the full visual report
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {crawlData && (
        <section className="result" aria-live="polite">
          <div className="result-head">
            <div><Gauge score={crawlData.aggregate.avg_score} grade={gradeFromScore(crawlData.aggregate.avg_score)} /></div>
            <div className="result-meta">
              <div className="mono">Crawl №{Date.now().toString(36).slice(-5).toUpperCase()}</div>
              <div className="result-url">{crawlData.origin}</div>
              <div className="result-grade-row">
                <span className="chip">{crawlData.audited_pages} / {crawlData.requested_pages} pages</span>
                <span className="chip">Avg score <strong>{crawlData.aggregate.avg_score}</strong></span>
                <span className="chip">{crawlData.aggregate.total_violations} total violations</span>
                {crawlData.aggregate.by_impact.critical > 0 && (
                  <span className="chip bad">{crawlData.aggregate.by_impact.critical} critical</span>
                )}
                <span className="chip">{(crawlData.elapsed_ms / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </div>

          <div className="crawl-pages">
            {crawlData.pages.map((p, idx) => (
              <div key={idx} className={`crawl-page ${p.ok ? "" : "crawl-page-err"}`}>
                <div className="crawl-page-rank">№{idx + 1}</div>
                <div className="crawl-page-body">
                  <div className="crawl-page-url" title={p.url}>{p.url}</div>
                  {p.ok ? (
                    <div className="issue-meta">
                      <span className="chip">Score <strong>{p.score}</strong></span>
                      <span className="chip">Grade {p.grade}</span>
                      <span className="chip">{p.summary.violations ?? 0} viol</span>
                      {(p.summary.critical ?? 0) > 0 && (
                        <span className="chip bad">{p.summary.critical} critical</span>
                      )}
                    </div>
                  ) : (
                    <div className="issue-meta"><span className="chip bad">failed</span> <span style={{ color: "var(--ink-faint)" }}>{p.error}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {crawlData.aggregate.worst_page && (
            <div className="mono-md" style={{ color: "var(--ink-faint)", marginTop: 12 }}>
              Worst page: <span style={{ color: "var(--lime)" }}>{crawlData.aggregate.worst_page.url}</span> ({crawlData.aggregate.worst_page.score}/100)
            </div>
          )}
        </section>
      )}
    </>
  );
}
