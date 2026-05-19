import type { EvaluateResult, IncompleteCheck } from "../../core/types.js";
import type { RepoAuditResult } from "../../tools/scan.js";
import type { CrawlSiteResult } from "../../tools/crawl.js";

const IMPACT_COLOR: Record<string, string> = {
  critical: "#dc2626",
  serious: "#ea580c",
  moderate: "#ca8a04",
  minor: "#65a30d",
};

const GRADE_COLOR: Record<string, string> = {
  A: "#16a34a",
  B: "#65a30d",
  C: "#ca8a04",
  D: "#ea580c",
  F: "#dc2626",
};

function isEvaluateResult(v: unknown): v is EvaluateResult {
  return typeof v === "object" && v !== null && "score" in v && "top_issues" in v;
}

function isRepoAuditResult(v: unknown): v is RepoAuditResult {
  return typeof v === "object" && v !== null && "filesScanned" in v && "fileResults" in v;
}

function isCrawlSiteResult(v: unknown): v is CrawlSiteResult {
  return typeof v === "object" && v !== null && "pagesAudited" in v && "pageResults" in v;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function scoreGaugeSvg(score: number, grade: string): string {
  const radius = 70;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = GRADE_COLOR[grade] ?? "#6b7280";
  return `
<svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Score ${score} out of 100, grade ${grade}">
  <circle cx="90" cy="90" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="${stroke}" />
  <circle cx="90" cy="90" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}"
    stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
    transform="rotate(-90 90 90)" />
  <text x="90" y="92" text-anchor="middle" font-size="44" font-weight="700" fill="#111827" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif">${score}</text>
  <text x="90" y="118" text-anchor="middle" font-size="13" fill="#6b7280" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif">Grade ${escapeHtml(grade)}</text>
</svg>`;
}

function severityBarSvg(critical: number, serious: number, moderate: number, minor: number): string {
  const total = critical + serious + moderate + minor;
  if (total === 0) {
    return `<div class="empty-bar" role="img" aria-label="No violations">No violations</div>`;
  }
  const segments: Array<{ label: string; n: number; color: string }> = [
    { label: "Critical", n: critical, color: IMPACT_COLOR.critical },
    { label: "Serious", n: serious, color: IMPACT_COLOR.serious },
    { label: "Moderate", n: moderate, color: IMPACT_COLOR.moderate },
    { label: "Minor", n: minor, color: IMPACT_COLOR.minor },
  ];
  const width = 600;
  let x = 0;
  const rects = segments
    .map((s) => {
      if (s.n === 0) return "";
      const w = (s.n / total) * width;
      const rect = `<rect x="${x}" y="0" width="${w}" height="28" fill="${s.color}"><title>${s.label}: ${s.n}</title></rect>`;
      x += w;
      return rect;
    })
    .join("");
  const legend = segments
    .filter((s) => s.n > 0)
    .map(
      (s) =>
        `<span class="legend-chip"><span class="legend-dot" style="background:${s.color}"></span>${s.label} <strong>${s.n}</strong></span>`
    )
    .join("");
  return `
<div class="sev-bar-wrap">
  <svg width="100%" viewBox="0 0 ${width} 28" preserveAspectRatio="none" role="img" aria-label="Violation severity distribution">
    ${rects}
  </svg>
  <div class="legend">${legend}</div>
</div>`;
}

function badge(text: string, color: string): string {
  return `<span class="badge" style="background:${color}1a;color:${color};border-color:${color}40">${escapeHtml(text)}</span>`;
}

function wcagBadges(wcag: string): string {
  if (!wcag) return badge("Best practice", "#6b7280");
  return wcag
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => badge(s, "#2563eb"))
    .join(" ");
}

function issueCard(issue: EvaluateResult["top_issues"][number]): string {
  const color = IMPACT_COLOR[issue.impact] ?? "#6b7280";
  return `
<article class="card issue-card">
  <header class="issue-header">
    <div class="issue-rank">#${issue.rank}</div>
    <div class="issue-title">
      <h3>${escapeHtml(issue.headline)}</h3>
      <div class="issue-meta">
        ${badge(issue.impact.toUpperCase(), color)}
        ${wcagBadges(issue.wcag_criterion)}
        <span class="meta-pill">${issue.affected_elements} element${issue.affected_elements === 1 ? "" : "s"}</span>
        ${issue.auto_fixable ? badge("Auto-fixable", "#16a34a") : ""}
      </div>
    </div>
  </header>
  <p class="issue-impact"><strong>Why it matters:</strong> ${escapeHtml(issue.user_impact)}</p>
  <p class="issue-suggestion"><strong>How to fix:</strong> ${escapeHtml(issue.suggestion)}</p>
  <details class="issue-code">
    <summary>Example fix</summary>
    <div class="code-grid">
      <div><div class="code-label">Before</div><pre>${escapeHtml(issue.example_before)}</pre></div>
      <div><div class="code-label">After</div><pre>${escapeHtml(issue.example_after)}</pre></div>
    </div>
  </details>
  <a class="issue-link" href="${escapeHtml(issue.learn_more)}" target="_blank" rel="noopener">Learn more →</a>
</article>`;
}

function incompleteSection(items: IncompleteCheck[]): string {
  if (!items || items.length === 0) return "";
  return `
<section class="section">
  <h2>Needs manual review <span class="section-count">${items.length}</span></h2>
  <p class="section-intro">axe-core couldn't fully evaluate these — a human should verify. (We tell you what the tool can't do.)</p>
  <div class="incomplete-grid">
    ${items
      .map(
        (ic) => `
    <article class="card incomplete-card">
      <h4>${escapeHtml(ic.id)}</h4>
      <p>${escapeHtml(ic.help)}</p>
      <div class="meta-pill">${ic.nodes_count} node${ic.nodes_count === 1 ? "" : "s"}</div>
      ${ic.selectors.length ? `<code class="selectors">${escapeHtml(ic.selectors.join(", "))}</code>` : ""}
      <a href="${escapeHtml(ic.helpUrl)}" target="_blank" rel="noopener">Learn more →</a>
    </article>`
      )
      .join("")}
  </div>
</section>`;
}

function baseStyles(): string {
  return `
:root {
  --bg: #f8fafc;
  --card: #ffffff;
  --border: #e5e7eb;
  --text: #0f172a;
  --muted: #64748b;
  --accent: #6d28d9;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.55;
}
.container { max-width: 1080px; margin: 0 auto; padding: 32px 24px 80px; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 1px solid var(--border); margin-bottom: 32px; }
.brand { font-weight: 700; font-size: 18px; letter-spacing: -0.01em; }
.brand-dot { display:inline-block; width:10px; height:10px; border-radius:50%; background: var(--accent); margin-right: 8px; vertical-align: middle; }
.meta-top { color: var(--muted); font-size: 13px; }
.hero { display: grid; grid-template-columns: auto 1fr; gap: 32px; align-items: center; padding: 28px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
.hero-meta h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.01em; }
.hero-meta .url { color: var(--muted); font-size: 14px; word-break: break-all; }
.hero-stats { display:flex; gap: 20px; margin-top: 16px; flex-wrap: wrap; }
.stat { background:#f1f5f9; padding:10px 14px; border-radius: 10px; font-size: 13px; }
.stat strong { display: block; font-size: 18px; color: var(--text); }
.section { margin-top: 40px; }
.section h2 { font-size: 18px; margin: 0 0 6px; display:flex; align-items:center; gap: 10px; letter-spacing: -0.01em; }
.section-count { background:#ede9fe; color: var(--accent); border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
.section-intro { color: var(--muted); font-size: 14px; margin: 0 0 16px; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; box-shadow: 0 1px 2px rgba(15,23,42,0.03); }
.issue-card + .issue-card { margin-top: 14px; }
.issue-header { display:flex; gap: 14px; align-items:flex-start; }
.issue-rank { background:#0f172a; color:#fff; width: 32px; height: 32px; border-radius: 8px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size: 13px; flex-shrink:0; }
.issue-title h3 { margin: 0 0 6px; font-size: 16px; letter-spacing: -0.01em; }
.issue-meta { display:flex; gap: 6px; flex-wrap: wrap; align-items:center; }
.badge { display:inline-block; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 999px; border: 1px solid; letter-spacing: 0.02em; text-transform: none; }
.meta-pill { font-size: 12px; color: var(--muted); background:#f1f5f9; padding: 3px 8px; border-radius: 999px; }
.issue-impact, .issue-suggestion { font-size: 14px; margin: 12px 0 0; color: #1e293b; }
.issue-code { margin-top: 14px; }
.issue-code summary { cursor: pointer; font-size: 13px; color: var(--accent); font-weight: 600; }
.code-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
.code-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
pre { background:#0f172a; color: #e2e8f0; padding: 12px; border-radius: 8px; overflow:auto; font-size: 12px; margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.issue-link { display:inline-block; margin-top: 12px; font-size: 13px; color: var(--accent); text-decoration: none; font-weight: 600; }
.incomplete-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.incomplete-card h4 { margin: 0 0 6px; font-size: 14px; }
.incomplete-card p { margin: 0 0 10px; font-size: 13px; color: #334155; }
.selectors { display:block; margin-top: 8px; font-size: 11px; color: var(--muted); word-break: break-all; background:#f1f5f9; padding: 6px 8px; border-radius: 6px; }
.empty-bar { color: var(--muted); font-size: 14px; padding: 8px 0; }
.sev-bar-wrap svg { border-radius: 6px; overflow: hidden; }
.legend { display:flex; gap: 14px; flex-wrap: wrap; margin-top: 10px; font-size: 13px; color: #334155; }
.legend-dot { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right: 6px; vertical-align: middle; }
.quick-wins { background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border-color: #bbf7d0; }
.quick-wins h3 { margin: 0 0 8px; font-size: 16px; color:#166534; }
.quick-wins ul { margin: 0; padding-left: 18px; font-size: 14px; color: #15803d; }
.footer { margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--border); font-size: 12px; color: var(--muted); display:flex; gap: 16px; flex-wrap: wrap; justify-content: space-between; }
.footer a { color: var(--muted); }
.page-table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.page-table th, .page-table td { text-align: left; padding: 10px 14px; font-size: 13px; border-bottom: 1px solid var(--border); }
.page-table th { background:#f8fafc; font-weight: 600; color: #334155; }
.page-table tr:last-child td { border-bottom: none; }
.score-pill { font-weight: 700; padding: 2px 8px; border-radius: 6px; color: #fff; font-size: 12px; }
@media (max-width: 640px) {
  .hero { grid-template-columns: 1fr; text-align: center; }
  .code-grid { grid-template-columns: 1fr; }
}
`;
}

function htmlShell(title: string, body: string, footer: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>${baseStyles()}</style>
</head>
<body>
<div class="container">
  <div class="topbar">
    <div class="brand"><span class="brand-dot"></span>Loop11y</div>
    <div class="meta-top">${escapeHtml(title)}</div>
  </div>
  ${body}
  <div class="footer">${footer}</div>
</div>
</body>
</html>
`;
}

function renderEvaluateHtml(result: EvaluateResult): string {
  const sev = result.summary;
  const sevBar = severityBarSvg(sev.critical, sev.serious, sev.moderate, sev.minor);
  const gauge = scoreGaugeSvg(result.score, result.grade);

  const quickWins = result.quick_wins.length
    ? `
<section class="section">
  <article class="card quick-wins">
    <h3>${result.quick_wins.length} quick win${result.quick_wins.length === 1 ? "" : "s"} — patch with one command</h3>
    <ul>${result.quick_wins.map((qw) => `<li><strong>${escapeHtml(qw.violation_id)}</strong> — ${escapeHtml(qw.headline)}</li>`).join("")}</ul>
  </article>
</section>`
    : "";

  const topIssues = result.top_issues.length
    ? `
<section class="section">
  <h2>Top issues <span class="section-count">${result.top_issues.length}</span></h2>
  <p class="section-intro">Ranked by user impact: severity × number of affected elements.</p>
  ${result.top_issues.slice(0, 15).map(issueCard).join("")}
</section>`
    : `
<section class="section">
  <article class="card"><h2 style="margin:0">No violations 🎉</h2><p class="section-intro" style="margin-top:6px">Page passes all axe-core checks at the audited viewport.</p></article>
</section>`;

  const incomplete = incompleteSection(result.incomplete_checks);

  const body = `
<section class="hero">
  <div>${gauge}</div>
  <div class="hero-meta">
    <h1>Accessibility report</h1>
    <div class="url">${escapeHtml(result.url)}</div>
    <div style="margin-top:10px; font-size: 13px; color: var(--muted)">WCAG compliance: <strong style="color:var(--text)">${escapeHtml(result.wcag_level)}</strong></div>
    <div class="hero-stats">
      <div class="stat"><strong>${sev.violations}</strong>Violations</div>
      <div class="stat"><strong>${sev.critical}</strong>Critical</div>
      <div class="stat"><strong>${sev.serious}</strong>Serious</div>
      <div class="stat"><strong>${sev.passed}</strong>Checks passed</div>
      <div class="stat"><strong>${sev.incomplete}</strong>Needs review</div>
    </div>
    <div style="margin-top: 18px;">${sevBar}</div>
  </div>
</section>
${quickWins}
${topIssues}
${incomplete}
`;

  const footer = `
<div>Generated ${escapeHtml(result.timestamp)} · Viewport ${result.viewport ? `${result.viewport.width}×${result.viewport.height}` : "default"} · axe-core ${escapeHtml(result.axe_version ?? "")}</div>
<div>${badge("WCAG 2.2", "#2563eb")} ${badge("EN 301 549", "#2563eb")} ${badge("Section 508", "#2563eb")} <a href="https://github.com/tayyabataimur/loop11y" target="_blank" rel="noopener">loop11y</a></div>
`;

  return htmlShell(`Loop11y · ${result.url}`, body, footer);
}

function renderRepoHtml(result: RepoAuditResult): string {
  const topVio = result.topViolations
    .map(
      (v) => `<tr><td><code>${escapeHtml(v.id)}</code></td><td>${badge(v.impact, IMPACT_COLOR[v.impact] ?? "#6b7280")}</td><td>${v.count}</td></tr>`
    )
    .join("");
  const fileRows = result.fileResults
    .slice(0, 50)
    .map(
      (f) =>
        `<tr><td><code>${escapeHtml(f.relativeFile)}</code></td><td>${escapeHtml(f.framework)}</td><td>${f.violationCount}</td><td>${f.criticalCount}</td><td>${f.seriousCount}</td></tr>`
    )
    .join("");
  const body = `
<section class="hero">
  <div style="font-size: 56px; font-weight: 800; color: var(--accent);">${result.totalViolations}</div>
  <div class="hero-meta">
    <h1>Repository audit</h1>
    <div class="url">${escapeHtml(result.root)}</div>
    <div class="hero-stats">
      <div class="stat"><strong>${result.filesScanned}</strong>Files scanned</div>
      <div class="stat"><strong>${result.criticalViolations}</strong>Critical</div>
      <div class="stat"><strong>${result.frameworks.join(", ") || "—"}</strong>Frameworks</div>
      <div class="stat"><strong>${result.sourceMapping.mappedViolations}/${result.sourceMapping.totalViolationTypes}</strong>Source-mapped</div>
    </div>
  </div>
</section>
<section class="section">
  <h2>Top violations</h2>
  <table class="page-table"><thead><tr><th>Rule</th><th>Impact</th><th>Count</th></tr></thead><tbody>${topVio}</tbody></table>
</section>
<section class="section">
  <h2>Files</h2>
  <table class="page-table"><thead><tr><th>File</th><th>Framework</th><th>Violations</th><th>Critical</th><th>Serious</th></tr></thead><tbody>${fileRows}</tbody></table>
</section>`;
  const footer = `<div>Generated ${escapeHtml(result.timestamp)}</div><div>${badge("WCAG 2.2", "#2563eb")} <a href="https://github.com/tayyabataimur/loop11y" target="_blank" rel="noopener">loop11y</a></div>`;
  return htmlShell(`Loop11y · ${result.root}`, body, footer);
}

function renderCrawlHtml(result: CrawlSiteResult): string {
  const sev = result.topViolations
    .map(
      (v) =>
        `<tr><td><code>${escapeHtml(v.violation_id)}</code></td><td>${badge(v.highest_impact, IMPACT_COLOR[v.highest_impact] ?? "#6b7280")}</td><td>${v.pages}</td><td>${v.total_affected_elements}</td></tr>`
    )
    .join("");
  const pageRows = result.pageResults
    .slice(0, 50)
    .map(
      (p) =>
        `<tr><td><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a></td><td><span class="score-pill" style="background:${GRADE_COLOR[p.grade] ?? "#6b7280"}">${p.score}</span></td><td>${escapeHtml(p.grade)}</td><td>${p.violations}</td><td>${p.critical}</td></tr>`
    )
    .join("");
  const body = `
<section class="hero">
  <div style="font-size: 56px; font-weight: 800; color: ${GRADE_COLOR[result.pageResults[0]?.grade ?? "F"] ?? "#6b7280"};">${result.averageScore}</div>
  <div class="hero-meta">
    <h1>Site crawl report</h1>
    <div class="url">${escapeHtml(result.origin)}</div>
    <div class="hero-stats">
      <div class="stat"><strong>${result.pagesAudited}</strong>Pages audited</div>
      <div class="stat"><strong>${result.pagesSkipped}</strong>Skipped</div>
      <div class="stat"><strong>${result.lowestScore?.score ?? "—"}</strong>Lowest score</div>
      <div class="stat"><strong>${result.highestScore?.score ?? "—"}</strong>Highest score</div>
    </div>
  </div>
</section>
<section class="section">
  <h2>Top violations across pages</h2>
  <table class="page-table"><thead><tr><th>Rule</th><th>Impact</th><th>Pages</th><th>Elements</th></tr></thead><tbody>${sev}</tbody></table>
</section>
<section class="section">
  <h2>Page results</h2>
  <table class="page-table"><thead><tr><th>URL</th><th>Score</th><th>Grade</th><th>Violations</th><th>Critical</th></tr></thead><tbody>${pageRows}</tbody></table>
</section>`;
  const footer = `<div>Generated ${escapeHtml(result.timestamp)}</div><div>${badge("WCAG 2.2", "#2563eb")} <a href="https://github.com/tayyabataimur/loop11y" target="_blank" rel="noopener">loop11y</a></div>`;
  return htmlShell(`Loop11y · ${result.origin}`, body, footer);
}

export function toHtmlReport(value: unknown): string {
  if (isEvaluateResult(value)) return renderEvaluateHtml(value);
  if (isRepoAuditResult(value)) return renderRepoHtml(value);
  if (isCrawlSiteResult(value)) return renderCrawlHtml(value);
  return htmlShell("Loop11y report", `<p>Type not recognized for HTML export.</p>`, "");
}

export function renderBeforeAfterHtml(before: EvaluateResult, after: EvaluateResult): string {
  const delta = after.score - before.score;
  const deltaColor = delta >= 0 ? "#16a34a" : "#dc2626";
  const resolved = before.top_issues.filter((b) => !after.top_issues.some((a) => a.violation_id === b.violation_id));
  const introduced = after.top_issues.filter((a) => !before.top_issues.some((b) => b.violation_id === a.violation_id));

  const body = `
<section class="hero">
  <div style="text-align:center;">
    <div style="font-size: 56px; font-weight: 800; color: ${deltaColor};">${delta >= 0 ? "+" : ""}${delta}</div>
    <div style="color: var(--muted); font-size: 13px;">score delta</div>
  </div>
  <div class="hero-meta">
    <h1>Before → After</h1>
    <div class="url">${escapeHtml(after.url)}</div>
    <div class="hero-stats">
      <div class="stat"><strong>${before.score} → ${after.score}</strong>Score</div>
      <div class="stat"><strong>${before.grade} → ${after.grade}</strong>Grade</div>
      <div class="stat"><strong>${before.summary.violations} → ${after.summary.violations}</strong>Violations</div>
      <div class="stat"><strong>${resolved.length}</strong>Resolved</div>
      <div class="stat"><strong>${introduced.length}</strong>New</div>
    </div>
  </div>
</section>
<section class="section">
  <h2>Resolved <span class="section-count">${resolved.length}</span></h2>
  ${resolved.length === 0 ? `<p class="section-intro">No issues resolved yet.</p>` : resolved.map(issueCard).join("")}
</section>
${introduced.length > 0 ? `
<section class="section">
  <h2>Newly introduced <span class="section-count">${introduced.length}</span></h2>
  ${introduced.map(issueCard).join("")}
</section>` : ""}
<section class="section">
  <h2>Still present <span class="section-count">${after.top_issues.length}</span></h2>
  ${after.top_issues.slice(0, 10).map(issueCard).join("")}
</section>
`;
  const footer = `<div>Generated ${escapeHtml(after.timestamp)} · before ${escapeHtml(before.timestamp)}</div><div>${badge("WCAG 2.2", "#2563eb")} <a href="https://github.com/tayyabataimur/loop11y" target="_blank" rel="noopener">loop11y</a></div>`;
  return htmlShell(`Loop11y · diff · ${after.url}`, body, footer);
}
