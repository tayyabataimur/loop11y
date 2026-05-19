import type { EvaluateResult, IncompleteCheck } from "../../core/types.js";
import type { RepoAuditResult } from "../../tools/scan.js";
import type { CrawlSiteResult } from "../../tools/crawl.js";

const IMPACT_COLOR: Record<string, string> = {
  critical: "#b34a30",
  serious:  "#c66a2a",
  moderate: "#b8932a",
  minor:    "#687a1a",
};

const GRADE_COLOR: Record<string, string> = {
  A: "#a8e000",
  B: "#c7ff2a",
  C: "#d6a51c",
  D: "#c66a2a",
  F: "#b34a30",
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

function severityBarSvg(critical: number, serious: number, moderate: number, minor: number): string {
  const total = critical + serious + moderate + minor;
  if (total === 0) return `<div class="empty-bar">No violations</div>`;
  const segments = [
    { label: "Critical", n: critical, color: IMPACT_COLOR.critical },
    { label: "Serious",  n: serious,  color: IMPACT_COLOR.serious },
    { label: "Moderate", n: moderate, color: IMPACT_COLOR.moderate },
    { label: "Minor",    n: minor,    color: IMPACT_COLOR.minor },
  ];
  const width = 600;
  let x = 0;
  const rects = segments.map((s) => {
    if (s.n === 0) return "";
    const w = (s.n / total) * width;
    const rect = `<rect x="${x}" y="0" width="${w}" height="14" fill="${s.color}"><title>${s.label}: ${s.n}</title></rect>`;
    x += w;
    return rect;
  }).join("");
  const legend = segments.filter((s) => s.n > 0).map((s) =>
    `<span class="legend-chip"><span class="legend-dot" style="background:${s.color}"></span>${s.label} <strong>${s.n}</strong></span>`
  ).join("");
  return `
<div class="sev-bar">
  <svg width="100%" viewBox="0 0 ${width} 14" preserveAspectRatio="none" aria-label="Violation severity distribution">${rects}</svg>
  <div class="legend">${legend}</div>
</div>`;
}

const VISUAL_RULE_PRIORITY: Record<string, number> = {
  "color-contrast": 100, "color-contrast-enhanced": 99,
  "link-in-text-block": 95, "target-size": 92,
  "focus-order-semantics": 80, "focus-visible": 80,
  "text-resize": 75, "css-orientation-lock": 70,
};
function visualPriority(id: string): number { return VISUAL_RULE_PRIORITY[id] ?? 0; }

function visualHint(issue: EvaluateResult["top_issues"][number]): string {
  if (issue.violation_id === "color-contrast" || issue.violation_id === "color-contrast-enhanced") {
    return `<span class="hint"><span class="sw sw-bad">Aa</span><span class="sw-arrow">→</span><span class="sw sw-good">Aa</span></span>`;
  }
  if (issue.violation_id === "target-size") {
    return `<span class="hint"><span class="dot dot-sm"></span><span class="sw-arrow">→</span><span class="dot dot-lg"></span></span>`;
  }
  if (issue.violation_id === "link-in-text-block") {
    return `<span class="hint"><span class="lk-sample">underlined link</span></span>`;
  }
  return "";
}

function chip(label: string, value?: string, tone: "default" | "ink" | "lime" = "default"): string {
  const cls = tone === "ink" ? "chip chip-ink" : tone === "lime" ? "chip chip-lime" : "chip";
  return `<span class="${cls}">${escapeHtml(label)}${value ? `<strong>${escapeHtml(value)}</strong>` : ""}</span>`;
}

function issueRow(issue: EvaluateResult["top_issues"][number], n: number): string {
  const sev = issue.impact;
  const hint = visualHint(issue);
  return `
<article class="issue">
  <div class="issue-num">№${n}</div>
  <div class="issue-body">
    <h3 class="issue-title">${escapeHtml(issue.headline)}</h3>
    <div class="issue-meta">
      <span class="tag tag-${sev}">${escapeHtml(sev.toUpperCase())}</span>
      ${issue.wcag_criterion ? `<span class="tag tag-wcag">${escapeHtml(issue.wcag_criterion)}</span>` : ""}
      <span class="tag tag-count">${issue.affected_elements} el</span>
      ${issue.auto_fixable ? `<span class="tag tag-auto">Auto-fix</span>` : ""}
    </div>
  </div>
  <div class="issue-aside">${hint}</div>
</article>`;
}

function incompleteSection(items: IncompleteCheck[]): string {
  if (!items || items.length === 0) return "";
  return `
<section class="block">
  <div class="block-head">
    <span class="block-num">Ch.<strong>02</strong></span>
    <h2>Needs manual <em>review</em></h2>
  </div>
  <p class="block-sub">axe-core couldn't fully evaluate these. A human should verify. We tell you what the tool cannot decide — not the opposite.</p>
  <div class="incomplete-grid">
    ${items.map((ic) => `
    <article class="incomplete">
      <div class="incomplete-rule">${escapeHtml(ic.id)}</div>
      <p class="incomplete-help">${escapeHtml(ic.help)}</p>
      <div class="incomplete-meta">${ic.nodes_count} node${ic.nodes_count === 1 ? "" : "s"} · <a href="${escapeHtml(ic.helpUrl)}" target="_blank" rel="noopener">docs ↗</a></div>
      ${ic.selectors.length ? `<code class="incomplete-sel">${escapeHtml(ic.selectors.join(", "))}</code>` : ""}
    </article>`).join("")}
  </div>
</section>`;
}

function baseStyles(): string {
  return `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --cream: #ebe3cd;
  --cream-elev: #e3d9bf;
  --paper: #f2ead3;
  --ink: #141210;
  --ink-soft: #3a342b;
  --ink-mute: #6f6859;
  --ink-faint: #9e9583;
  --rule: #1d1a16;
  --rule-soft: rgba(20,18,16,0.18);
  --lime: #c7ff2a;
  --rust: #b34a30;
  --display: "Instrument Serif", "Times New Roman", serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
body {
  background: var(--cream);
  background-image:
    radial-gradient(2px 2px at 16% 22%, rgba(20,18,16,0.06) 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 84% 68%, rgba(20,18,16,0.04) 50%, transparent 51%);
  background-size: 420px 420px, 360px 360px;
  color: var(--ink);
  font-family: var(--display);
  line-height: 1.55; font-size: 17px;
}
::selection { background: var(--lime); color: var(--ink); }
a { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }

.page { max-width: 1100px; margin: 0 auto; padding: 28px 32px 36px; }

/* top bar */
.top {
  display:flex; align-items:center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid var(--rule);
  margin-bottom: 28px;
}
.brand { display:flex; align-items:center; gap: 10px; }
.brand-mark {
  width: 26px; height: 26px; background: var(--ink); border-radius: 2px;
  display:flex; align-items:center; justify-content:center;
  color: var(--lime); font-family: var(--display); font-style: italic; font-size: 18px; line-height: 1;
}
.brand-word { font-family: var(--display); font-size: 22px; line-height: 1; letter-spacing: -0.02em; }
.brand-word em { font-style: italic; color: var(--rust); }
.top-meta { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-mute); }

/* hero strip */
.hero-strip {
  display:flex; justify-content: space-between; align-items: baseline;
  border-bottom: 1px solid var(--rule); padding-bottom: 12px; margin-bottom: 22px;
}
.hero-strip .mono { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-mute); }

.hero {
  display: grid; grid-template-columns: 1fr 280px; gap: 36px; align-items: end;
  padding-bottom: 24px; border-bottom: 2px solid var(--ink); margin-bottom: 32px;
}
.hero h1 {
  font-family: var(--display); font-size: clamp(48px, 8vw, 96px);
  line-height: 0.92; letter-spacing: -0.03em; margin: 0; font-weight: 400;
}
.hero h1 .it { font-style: italic; color: var(--ink); }
.hero h1 .accent { color: var(--rust); font-style: italic; }
.hero-url { font-family: var(--mono); font-size: 13px; color: var(--ink-soft); margin-top: 14px; word-break: break-all; }
.hero-side { text-align: right; }
.score-num {
  font-family: var(--display); font-style: italic; font-size: 140px; line-height: 0.85;
  letter-spacing: -0.05em; color: var(--ink);
}
.score-meta { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-mute); margin-top: 4px; }
.grade-line { margin-top: 18px; display:flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }

/* chips */
.chip {
  font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 2px;
  background: var(--paper); border: 1px solid var(--rule-soft); color: var(--ink-soft); font-weight: 500;
}
.chip strong { margin-left: 6px; color: var(--ink); font-weight: 600; }
.chip-ink { background: var(--ink); color: var(--cream); border-color: var(--ink); }
.chip-ink strong { color: var(--lime); }
.chip-lime { background: var(--lime); color: var(--ink); border-color: var(--ink); }

.sev-bar { margin-top: 20px; }
.sev-bar svg { display:block; }
.legend { display:flex; gap: 14px; flex-wrap: wrap; margin-top: 8px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-mute); }
.legend-dot { display:inline-block; width: 8px; height: 8px; margin-right: 6px; vertical-align: middle; border-radius: 1px; }
.legend strong { color: var(--ink); margin-left: 4px; }
.empty-bar { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-mute); }

/* sections */
.block { padding-top: 28px; }
.block-head { display:flex; align-items: baseline; gap: 18px; margin-bottom: 12px; }
.block-num { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--rust); }
.block-num strong { color: var(--ink); font-family: var(--display); font-style: italic; font-size: 22px; margin-left: 4px; }
.block h2 { font-family: var(--display); font-size: clamp(28px, 4vw, 42px); line-height: 1; letter-spacing: -0.02em; font-weight: 400; margin: 0; }
.block h2 em { color: var(--rust); font-style: italic; }
.block-sub { font-family: var(--display); font-size: 17px; color: var(--ink-soft); margin: 6px 0 22px; max-width: 60ch; }

/* issues */
.issues { border-top: 1px solid var(--rule); }
.issue { display:grid; grid-template-columns: 70px 1fr auto; gap: 22px; padding: 18px 0; border-bottom: 1px solid var(--rule-soft); align-items: center; }
.issue-num { font-family: var(--display); font-style: italic; font-size: 44px; line-height: 1; color: var(--ink); }
.issue-title { font-family: var(--display); font-size: 22px; line-height: 1.2; margin: 0; font-weight: 400; }
.issue-meta { display:flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
.tag { padding: 3px 8px; border-radius: 2px; font-weight: 600; }
.tag-critical { background: var(--rust); color: var(--paper); }
.tag-serious  { background: #c66a2a; color: var(--paper); }
.tag-moderate { background: #d6a51c; color: var(--ink); }
.tag-minor    { background: #a3b428; color: var(--ink); }
.tag-wcag { background: var(--paper); border: 1px solid var(--rule-soft); color: var(--ink-soft); }
.tag-count { background: transparent; color: var(--ink-mute); padding-left: 0; }
.tag-auto { background: var(--lime); color: var(--ink); }

.issue-aside { text-align: right; min-width: 120px; }
.hint { display:inline-flex; align-items:center; gap: 8px; padding: 6px 10px; border: 1px solid var(--rule); border-radius: 2px; background: var(--paper); }
.sw { display:inline-flex; align-items:center; justify-content:center; width: 36px; height: 24px; border-radius: 2px; font-family: var(--display); font-weight: 400; font-size: 14px; }
.sw-bad  { background: var(--paper); color: var(--ink-faint); border: 1px solid var(--rule-soft); }
.sw-good { background: var(--ink); color: var(--lime); }
.sw-arrow { color: var(--ink-mute); font-family: var(--mono); font-size: 12px; }
.dot { display:inline-block; background: var(--rust); border-radius: 50%; }
.dot-sm { width: 10px; height: 10px; }
.dot-lg { width: 24px; height: 24px; }
.lk-sample { font-family: var(--display); font-style: italic; text-decoration: underline; color: var(--rust); font-size: 14px; }

/* incomplete */
.incomplete-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.incomplete { padding: 16px; background: var(--paper); border: 1px solid var(--rule); border-radius: 2px; }
.incomplete-rule { font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--rust); }
.incomplete-help { font-family: var(--display); font-size: 16px; line-height: 1.4; margin: 8px 0 12px; }
.incomplete-meta { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-mute); }
.incomplete-meta a { color: var(--rust); }
.incomplete-sel { display:block; margin-top: 8px; font-family: var(--mono); font-size: 10px; color: var(--ink-mute); word-break: break-all; }

/* tables (repo/crawl) */
.tbl { width:100%; border-collapse: collapse; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
.tbl th, .tbl td { text-align: left; padding: 10px 12px; font-size: 13.5px; border-bottom: 1px solid var(--rule-soft); }
.tbl th { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--rust); background: var(--paper); }
.tbl tr:last-child td { border-bottom: none; }
.tbl code { font-family: var(--mono); font-size: 12px; color: var(--ink); }

/* footer */
.foot { margin-top: 36px; padding: 22px 24px; background: var(--ink); color: var(--cream); border-radius: 2px;
  display:flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: center;
  font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
}
.foot a { color: var(--lime); text-decoration: underline; }
.foot-word { font-family: var(--display); font-style: italic; font-size: 28px; letter-spacing: -0.02em; color: var(--cream); text-transform: none; letter-spacing: -0.01em; }
.foot-word .accent { color: var(--lime); }

@media (max-width: 720px) {
  .hero { grid-template-columns: 1fr; align-items: start; }
  .hero-side { text-align: left; }
  .grade-line { justify-content: flex-start; }
  .score-num { font-size: 96px; }
  .issue { grid-template-columns: 50px 1fr; }
  .issue-aside { grid-column: 1 / -1; text-align: left; }
}
`;
}

function htmlShell(title: string, issueTitle: string, body: string, footer: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>${baseStyles()}</style>
</head>
<body>
<div class="page">
  <div class="top">
    <div class="brand"><span class="brand-mark">L</span><span class="brand-word">Loop<em>11y</em></span></div>
    <div class="top-meta">${escapeHtml(issueTitle)}</div>
  </div>
  ${body}
  <div class="foot">${footer}</div>
</div>
</body>
</html>
`;
}

function renderEvaluateHtml(result: EvaluateResult): string {
  const sev = result.summary;
  const reranked = [...result.top_issues].sort((a, b) => {
    const va = visualPriority(a.violation_id);
    const vb = visualPriority(b.violation_id);
    if (va !== vb) return vb - va;
    return a.rank - b.rank;
  });

  const hostname = (() => { try { return new URL(result.url).hostname; } catch { return result.url; } })();
  const dateLine = new Date(result.timestamp).toUTCString().replace(/ GMT$/, " · UTC");

  const body = `
<section class="hero-strip">
  <span class="mono">Accessibility Audit · Issue ${escapeHtml((new Date(result.timestamp)).toISOString().slice(0,10))}</span>
  <span class="mono">${escapeHtml(dateLine)}</span>
</section>

<section class="hero">
  <div>
    <h1><span class="it">A report for</span><br/><span class="accent">${escapeHtml(hostname)}.</span></h1>
    <div class="hero-url">${escapeHtml(result.url)}</div>
  </div>
  <div class="hero-side">
    <div class="score-num" style="color:${GRADE_COLOR[result.grade] ?? "var(--ink)"}">${result.score}</div>
    <div class="score-meta">Score / 100 · Grade ${escapeHtml(result.grade)}</div>
    <div class="grade-line">
      ${chip("WCAG", result.wcag_level, "ink")}
      ${chip(`${sev.violations} violations`)}
      ${chip(`${sev.passed} passing`)}
      ${sev.auto_fixable_count > 0 ? chip(`${sev.auto_fixable_count} auto-fix`, undefined, "lime") : ""}
    </div>
    ${severityBarSvg(sev.critical, sev.serious, sev.moderate, sev.minor)}
  </div>
</section>

${reranked.length > 0 ? `
<section class="block">
  <div class="block-head">
    <span class="block-num">Ch.<strong>01</strong></span>
    <h2>Top issues, <em>visible-first.</em></h2>
  </div>
  <p class="block-sub">Contrast, theme, font, and tap-target failures are what your users notice first — we rank them above semantic-only rules.</p>
  <div class="issues">
    ${reranked.slice(0, 3).map((iss, i) => issueRow(iss, i + 1)).join("")}
  </div>
</section>` : `
<section class="block">
  <h2 style="font-style: italic;">No violations.</h2>
  <p class="block-sub">Page passes all axe-core checks at the audited viewport.</p>
</section>`}

${incompleteSection(result.incomplete_checks ?? [])}
`;

  const footer = `
<span>Generated ${escapeHtml(dateLine)} · Viewport ${result.viewport ? `${result.viewport.width}×${result.viewport.height}` : "default"} · axe-core ${escapeHtml(result.axe_version ?? "")}</span>
<span class="foot-word">Loop<span class="accent">11y</span></span>
<span><a href="https://loop11y.tayyaba.dev" target="_blank" rel="noopener">loop11y.tayyaba.dev</a></span>
`;
  return htmlShell(`Loop11y · ${result.url}`, `Issue №${(new Date(result.timestamp)).getTime().toString(36).slice(-5).toUpperCase()}`, body, footer);
}

function renderRepoHtml(result: RepoAuditResult): string {
  const topVio = result.topViolations.map((v) =>
    `<tr><td><code>${escapeHtml(v.id)}</code></td><td><span class="tag tag-${v.impact}">${escapeHtml(v.impact)}</span></td><td>${v.count}</td></tr>`
  ).join("");
  const fileRows = result.fileResults.slice(0, 50).map((f) =>
    `<tr><td><code>${escapeHtml(f.relativeFile)}</code></td><td>${escapeHtml(f.framework)}</td><td>${f.violationCount}</td><td>${f.criticalCount}</td><td>${f.seriousCount}</td></tr>`
  ).join("");
  const body = `
<section class="hero-strip">
  <span class="mono">Repository Audit</span>
  <span class="mono">${escapeHtml(result.timestamp.slice(0,19).replace("T"," "))} · UTC</span>
</section>
<section class="hero">
  <div>
    <h1><span class="it">Repo:</span><br/><span class="accent">${escapeHtml(result.root.split("/").pop() || result.root)}.</span></h1>
    <div class="hero-url">${escapeHtml(result.root)}</div>
  </div>
  <div class="hero-side">
    <div class="score-num" style="color:${result.criticalViolations > 0 ? GRADE_COLOR.F : GRADE_COLOR.A}">${result.totalViolations}</div>
    <div class="score-meta">Total violations</div>
    <div class="grade-line">
      ${chip("Files", String(result.filesScanned), "ink")}
      ${chip(`${result.criticalViolations} critical`)}
      ${chip(`${result.frameworks.length || 0} frameworks`)}
    </div>
  </div>
</section>
<section class="block">
  <div class="block-head"><span class="block-num">Ch.<strong>01</strong></span><h2>Top <em>violations</em></h2></div>
  <table class="tbl"><thead><tr><th>Rule</th><th>Impact</th><th>Count</th></tr></thead><tbody>${topVio}</tbody></table>
</section>
<section class="block">
  <div class="block-head"><span class="block-num">Ch.<strong>02</strong></span><h2>Files</h2></div>
  <table class="tbl"><thead><tr><th>File</th><th>Framework</th><th>Violations</th><th>Critical</th><th>Serious</th></tr></thead><tbody>${fileRows}</tbody></table>
</section>`;
  const footer = `<span>Generated ${escapeHtml(result.timestamp)}</span><span class="foot-word">Loop<span class="accent">11y</span></span><span><a href="https://loop11y.tayyaba.dev">loop11y.tayyaba.dev</a></span>`;
  return htmlShell(`Loop11y · ${result.root}`, "Repository Audit", body, footer);
}

function renderCrawlHtml(result: CrawlSiteResult): string {
  const topVio = result.topViolations.map((v) =>
    `<tr><td><code>${escapeHtml(v.violation_id)}</code></td><td><span class="tag tag-${v.highest_impact}">${escapeHtml(v.highest_impact)}</span></td><td>${v.pages}</td><td>${v.total_affected_elements}</td></tr>`
  ).join("");
  const pageRows = result.pageResults.slice(0, 50).map((p) =>
    `<tr><td><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a></td><td>${p.score}</td><td>${escapeHtml(p.grade)}</td><td>${p.violations}</td><td>${p.critical}</td></tr>`
  ).join("");
  let originHost = result.origin;
  try { originHost = new URL(result.origin).hostname; } catch {}
  const body = `
<section class="hero-strip">
  <span class="mono">Site Crawl</span>
  <span class="mono">${escapeHtml(result.timestamp.slice(0,19).replace("T"," "))} · UTC</span>
</section>
<section class="hero">
  <div>
    <h1><span class="it">Crawl of</span><br/><span class="accent">${escapeHtml(originHost)}.</span></h1>
    <div class="hero-url">${escapeHtml(result.origin)}</div>
  </div>
  <div class="hero-side">
    <div class="score-num">${result.averageScore}</div>
    <div class="score-meta">Avg score · ${result.pagesAudited} pages</div>
    <div class="grade-line">
      ${chip("Audited", String(result.pagesAudited), "ink")}
      ${chip(`${result.pagesSkipped} skipped`)}
      ${chip(`${result.topViolations.length} rules hit`)}
    </div>
  </div>
</section>
<section class="block">
  <div class="block-head"><span class="block-num">Ch.<strong>01</strong></span><h2>Top violations <em>across pages</em></h2></div>
  <table class="tbl"><thead><tr><th>Rule</th><th>Impact</th><th>Pages</th><th>Elements</th></tr></thead><tbody>${topVio}</tbody></table>
</section>
<section class="block">
  <div class="block-head"><span class="block-num">Ch.<strong>02</strong></span><h2>Page results</h2></div>
  <table class="tbl"><thead><tr><th>URL</th><th>Score</th><th>Grade</th><th>Violations</th><th>Critical</th></tr></thead><tbody>${pageRows}</tbody></table>
</section>`;
  const footer = `<span>Generated ${escapeHtml(result.timestamp)}</span><span class="foot-word">Loop<span class="accent">11y</span></span><span><a href="https://loop11y.tayyaba.dev">loop11y.tayyaba.dev</a></span>`;
  return htmlShell(`Loop11y · ${result.origin}`, "Site Crawl", body, footer);
}

export function toHtmlReport(value: unknown): string {
  if (isEvaluateResult(value)) return renderEvaluateHtml(value);
  if (isRepoAuditResult(value)) return renderRepoHtml(value);
  if (isCrawlSiteResult(value)) return renderCrawlHtml(value);
  return htmlShell("Loop11y report", "Unknown report", `<p>Type not recognized for HTML export.</p>`, "—");
}

export function renderBeforeAfterHtml(before: EvaluateResult, after: EvaluateResult): string {
  const delta = after.score - before.score;
  const deltaColor = delta >= 0 ? GRADE_COLOR.A : GRADE_COLOR.F;
  const resolved = before.top_issues.filter((b) => !after.top_issues.some((a) => a.violation_id === b.violation_id));
  const introduced = after.top_issues.filter((a) => !before.top_issues.some((b) => b.violation_id === a.violation_id));
  const stillPresent = after.top_issues.filter((a) => before.top_issues.some((b) => b.violation_id === a.violation_id));
  const hostname = (() => { try { return new URL(after.url).hostname; } catch { return after.url; } })();
  const body = `
<section class="hero-strip">
  <span class="mono">Before → After</span>
  <span class="mono">${escapeHtml(after.timestamp.slice(0,19).replace("T"," "))} · UTC</span>
</section>
<section class="hero">
  <div>
    <h1><span class="it">Δ score for</span><br/><span class="accent">${escapeHtml(hostname)}.</span></h1>
    <div class="hero-url">${escapeHtml(after.url)}</div>
  </div>
  <div class="hero-side">
    <div class="score-num" style="color:${deltaColor}">${delta >= 0 ? "+" : ""}${delta}</div>
    <div class="score-meta">Score delta</div>
    <div class="grade-line">
      ${chip("Was", String(before.score))}
      ${chip("Now", String(after.score), "ink")}
      ${chip("Grade", `${before.grade}→${after.grade}`, "lime")}
    </div>
  </div>
</section>
<section class="block">
  <div class="block-head"><span class="block-num">Ch.<strong>01</strong></span><h2>Resolved <em>(${resolved.length})</em></h2></div>
  ${resolved.length === 0 ? `<p class="block-sub">No issues resolved yet.</p>` : `<div class="issues">${resolved.slice(0, 3).map((iss, i) => issueRow(iss, i + 1)).join("")}</div>`}
</section>
${introduced.length > 0 ? `
<section class="block">
  <div class="block-head"><span class="block-num">Ch.<strong>02</strong></span><h2>Newly <em>introduced</em></h2></div>
  <div class="issues">${introduced.slice(0, 2).map((iss, i) => issueRow(iss, i + 1)).join("")}</div>
</section>` : ""}
${stillPresent.length > 0 ? `
<section class="block">
  <div class="block-head"><span class="block-num">Ch.<strong>03</strong></span><h2>Still <em>present</em></h2></div>
  <div class="issues">${stillPresent.slice(0, 2).map((iss, i) => issueRow(iss, i + 1)).join("")}</div>
</section>` : ""}
`;
  const footer = `<span>Now: ${escapeHtml(after.timestamp)} · Was: ${escapeHtml(before.timestamp)}</span><span class="foot-word">Loop<span class="accent">11y</span></span><span><a href="https://loop11y.tayyaba.dev">loop11y.tayyaba.dev</a></span>`;
  return htmlShell(`Loop11y · diff · ${after.url}`, "Before → After", body, footer);
}
