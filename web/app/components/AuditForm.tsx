"use client";

import { useState, type FormEvent } from "react";

type Issue = {
  id: string;
  impact?: "critical" | "serious" | "moderate" | "minor";
  description?: string;
  help?: string;
  helpUrl?: string;
  wcag_criterion?: string;
  affected_elements?: number;
  headline?: string;
  violation_id?: string;
};

type Result = {
  url?: string;
  score?: number;
  grade?: string;
  wcag_level?: string;
  summary?: { violations?: number; critical?: number; serious?: number; passed?: number };
  top_issues?: Issue[];
  ai_summary?: string;
};

const GRADE_COLOR: Record<string, string> = {
  A: "#34d399",
  B: "#a3e635",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

function Gauge({ score, grade }: { score: number; grade: string }) {
  const radius = 64;
  const stroke = 12;
  const size = 160;
  const cx = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = GRADE_COLOR[grade] ?? "#a78bfa";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score ${score} of 100, grade ${grade}`}>
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id="gglow"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <circle cx={cx} cy={cx} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={radius} fill="none" stroke="url(#gg)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.22,.61,.36,1)" }}
      />
      <text x={cx} y={cx + 6} textAnchor="middle" fontSize="40" fontWeight="800" fill="#ffffff" letterSpacing="-0.02em">{score}</text>
      <text x={cx} y={cx + 28} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)" letterSpacing="0.16em">SCORE / 100</text>
    </svg>
  );
}

export default function AuditForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Audit failed (${res.status})`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const issues = result?.top_issues ?? [];
  const score = result?.score ?? 0;
  const grade = result?.grade ?? "F";
  const noViolations = !!result && (result.summary?.violations ?? 0) === 0;

  return (
    <>
      <form className="audit-form" onSubmit={onSubmit}>
        <input
          type="url"
          required
          placeholder="https://your-site.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="URL to audit"
          autoComplete="url"
        />
        <button type="submit" disabled={loading || !url}>
          {loading ? <><span className="spin" /> Auditing…</> : <>Audit free →</>}
        </button>
      </form>

      <div className="trust-line">
        <span>No signup</span><span className="dot" />
        <span>No email</span><span className="dot" />
        <span>~10s per page</span><span className="dot" />
        <span>WCAG 2.2 · EN 301 549 · Section 508</span>
      </div>

      {error && <div className="error" role="alert">⚠ {error}</div>}

      {result && (
        <section className="result" aria-live="polite">
          <div className="result-head">
            <div className="result-gauge"><Gauge score={score} grade={grade} /></div>
            <div className="result-meta">
              <div className="result-url">{result.url ?? url}</div>
              <div className="result-grade-row">
                <span className="chip">Grade<strong>{grade}</strong></span>
                <span className="chip">WCAG<strong>{result.wcag_level ?? "—"}</strong></span>
                {typeof result.summary?.violations === "number" && (
                  <span className="chip">{result.summary.violations} violations</span>
                )}
                {typeof result.summary?.critical === "number" && result.summary.critical > 0 && (
                  <span className="chip" style={{ background: "rgba(239,68,68,0.14)", color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }}>
                    {result.summary.critical} critical
                  </span>
                )}
              </div>
            </div>
          </div>

          {noViolations ? (
            <div className="result-empty">
              <strong>No violations 🎉</strong>
              <p style={{ margin: "8px 0 0", color: "var(--fg-muted)" }}>
                Page passes all axe-core checks at the audited viewport. Run the CLI for a deeper crawl + manual-review checklist.
              </p>
            </div>
          ) : (
            <div className="result-issues">
              {issues.slice(0, 5).map((i, idx) => (
                <div key={idx} className="issue">
                  <div className="issue-rank" style={{ background: idx === 0 ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : idx === 1 ? "linear-gradient(135deg,#db2777,#7c3aed)" : "linear-gradient(135deg,#f97316,#db2777)" }}>
                    #{idx + 1}
                  </div>
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
                    <a className="issue-link" href={i.helpUrl} target="_blank" rel="noreferrer">docs →</a>
                  )}
                </div>
              ))}
              {issues.length > 5 && (
                <div style={{ color: "var(--fg-dim)", fontSize: 13, marginTop: 4 }}>
                  + {issues.length - 5} more. Run <code style={{ color: "var(--accent)" }}>npx loop11y audit {result.url ?? url} --html --output report.html</code> for the full visual report.
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
}
