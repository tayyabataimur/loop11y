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

export default function AuditForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
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
          {loading ? <><span className="spin" /> Auditing</> : <>Run audit ↗</>}
        </button>
      </form>

      <div className="trust-line">
        <span>· No signup</span>
        <span>· ~10s / page</span>
        <span>· WCAG 2.2 · EN 301 549 · Section 508</span>
      </div>

      {error && <div className="error" role="alert">⚠ {error}</div>}

      {result && (
        <section className="result" aria-live="polite">
          <div className="result-head">
            <div><Gauge score={score} grade={grade} /></div>
            <div className="result-meta">
              <div className="mono">Report №{Date.now().toString(36).slice(-5).toUpperCase()}</div>
              <div className="result-url">{result.url ?? url}</div>
              <div className="result-grade-row">
                <span className="chip">Grade <strong>{grade}</strong></span>
                <span className="chip">WCAG <strong>{result.wcag_level ?? "—"}</strong></span>
                {typeof result.summary?.violations === "number" && (
                  <span className="chip">{result.summary.violations} violations</span>
                )}
                {typeof result.summary?.critical === "number" && result.summary.critical > 0 && (
                  <span className="chip bad">{result.summary.critical} critical</span>
                )}
              </div>
            </div>
          </div>

          {noViolations ? (
            <div className="result-empty">
              <strong>No violations.</strong>
              <p style={{ fontFamily: "var(--display)", fontSize: 17, marginTop: 10, color: "var(--cream-deep)" }}>
                Page passes all axe-core checks at the audited viewport. Run the CLI for a full crawl + manual-review checklist.
              </p>
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
    </>
  );
}
