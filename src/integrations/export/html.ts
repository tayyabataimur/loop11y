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
  const stroke = 13;
  const size = 180;
  const cx = size / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference * (1 - pct);
  const color = GRADE_COLOR[grade] ?? "#94a3b8";
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Score ${score} out of 100, grade ${grade}" class="gauge">
  <defs>
    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${color}" stop-opacity="1" />
    </linearGradient>
    <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="${cx}" cy="${cx}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${stroke}" />
  <circle cx="${cx}" cy="${cx}" r="${radius}" fill="none" stroke="url(#gaugeGrad)" stroke-width="${stroke}"
    stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
    transform="rotate(-90 ${cx} ${cx})" filter="url(#gaugeGlow)" />
  <text x="${cx}" y="${cx + 6}" text-anchor="middle" font-size="44" font-weight="800" fill="#ffffff" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" letter-spacing="-0.03em">${score}</text>
  <text x="${cx}" y="${cx + 28}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.7)" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" letter-spacing="0.12em">SCORE / 100</text>
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

const VISUAL_RULE_PRIORITY: Record<string, number> = {
  "color-contrast": 100,
  "color-contrast-enhanced": 99,
  "link-in-text-block": 95,
  "target-size": 92,
  "focus-order-semantics": 80,
  "focus-visible": 80,
  "text-resize": 75,
  "css-orientation-lock": 70,
};

function visualPriority(id: string): number {
  return VISUAL_RULE_PRIORITY[id] ?? 0;
}

function visualHint(issue: EvaluateResult["top_issues"][number]): string {
  if (issue.violation_id === "color-contrast" || issue.violation_id === "color-contrast-enhanced") {
    return `
<div class="visual-hint contrast-hint">
  <span class="swatch swatch-bad" title="Fails contrast"><span class="swatch-fg">Aa</span></span>
  <span class="swatch-arrow">→</span>
  <span class="swatch swatch-good" title="Passes contrast"><span class="swatch-fg">Aa</span></span>
</div>`;
  }
  if (issue.violation_id === "target-size") {
    return `<div class="visual-hint"><span class="target-dot small"></span><span class="swatch-arrow">→</span><span class="target-dot big"></span><span class="hint-label">44×44 px min</span></div>`;
  }
  if (issue.violation_id === "link-in-text-block") {
    return `<div class="visual-hint"><span class="link-sample">Underlined link</span><span class="hint-label">contrast ≥ 3:1 vs surrounding text</span></div>`;
  }
  return "";
}

function rankPalette(rank: number): string {
  const palettes = [
    "linear-gradient(135deg, #7c3aed, #4f46e5)",
    "linear-gradient(135deg, #db2777, #7c3aed)",
    "linear-gradient(135deg, #f97316, #db2777)",
    "linear-gradient(135deg, #06b6d4, #4f46e5)",
    "linear-gradient(135deg, #10b981, #06b6d4)",
  ];
  return palettes[(rank - 1) % palettes.length];
}

function issueCard(issue: EvaluateResult["top_issues"][number]): string {
  const color = IMPACT_COLOR[issue.impact] ?? "#6b7280";
  const hint = visualHint(issue);
  return `
<article class="card issue-card">
  <header class="issue-header">
    <div class="issue-rank" style="background:${rankPalette(issue.rank)};">#${issue.rank}</div>
    <div class="issue-title">
      <h3>${escapeHtml(issue.headline)}</h3>
      ${badge(issue.impact.toUpperCase(), color)}
      ${wcagBadges(issue.wcag_criterion)}
      <span class="meta-pill">${issue.affected_elements} el</span>
      ${issue.auto_fixable ? badge("Auto-fix", "#16a34a") : ""}
    </div>
    ${hint ? `<div class="issue-hint">${hint}</div>` : ""}
  </header>
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
  --bg: #f6f7fb;
  --card: #ffffff;
  --border: #eaecf3;
  --text: #0b1020;
  --muted: #5d6478;
  --accent: #7c3aed;
  --accent-2: #4f46e5;
  --hero-from: #0b0d17;
  --hero-via: #1c1338;
  --hero-to: #2a1265;
}
* { box-sizing: border-box; }
html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
body {
  margin: 0;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(124,58,237,0.10), transparent 60%),
    radial-gradient(900px 500px at -10% 10%, rgba(79,70,229,0.08), transparent 60%),
    var(--bg);
  color: var(--text);
  line-height: 1.55;
  font-feature-settings: "ss01", "cv01", "cv11";
}
.container { max-width: 1120px; margin: 0 auto; padding: 20px 24px 32px; }

.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.brand { display:flex; align-items:center; gap: 10px; font-weight: 700; font-size: 16px; letter-spacing: -0.01em; color: var(--text); }
.brand-mark {
  width: 28px; height: 28px; border-radius: 8px;
  background: conic-gradient(from 200deg at 50% 50%, #7c3aed, #4f46e5, #06b6d4, #7c3aed);
  box-shadow: 0 4px 12px rgba(124,58,237,0.35), inset 0 0 0 1px rgba(255,255,255,0.4);
}
.meta-top { color: var(--muted); font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600; }

.hero {
  position: relative;
  display: grid; grid-template-columns: 200px 1fr; gap: 28px; align-items: center;
  padding: 22px 28px;
  background: linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 55%, var(--hero-to) 100%);
  color: #f8fafc;
  border-radius: 24px;
  box-shadow: 0 30px 60px -20px rgba(20, 12, 60, 0.45), 0 2px 4px rgba(15,23,42,0.06);
  overflow: hidden;
  isolation: isolate;
}
.hero::before {
  content: ""; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(600px 240px at 90% 0%, rgba(124,58,237,0.45), transparent 60%),
    radial-gradient(500px 240px at 0% 100%, rgba(6,182,212,0.18), transparent 60%);
  z-index: -1;
}
.hero::after {
  content:""; position:absolute; inset:0; pointer-events:none;
  background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 32px 32px; mask-image: radial-gradient(closest-side at 70% 50%, #000, transparent 80%);
  z-index: -1; opacity: 0.5;
}
.hero-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.65); font-weight: 600; margin-bottom: 8px; }
.hero-meta h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.02em; font-weight: 700; line-height: 1.15; }
.hero-meta .url { color: rgba(255,255,255,0.7); font-size: 14px; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.hero-grade-row { display:flex; gap: 8px; align-items:center; margin-top: 10px; flex-wrap: wrap; }
.grade-chip { font-weight: 700; padding: 6px 12px; border-radius: 999px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.16); color: #fff; }
.grade-chip strong { color: #fff; }
.hero-stats { display:grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 8px; margin-top: 14px; }
.stat { background: rgba(255,255,255,0.06); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); padding: 8px 10px; border-radius: 10px; }
.stat-num { display:block; font-size: 18px; font-weight: 700; color: #ffffff; line-height: 1.1; letter-spacing: -0.02em; }
.stat-label { display:block; font-size: 10px; color: rgba(255,255,255,0.65); margin-top: 2px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; }

.section { margin-top: 18px; }
.section h2 { font-size: 15px; margin: 0 0 4px; display:flex; align-items:center; gap: 8px; letter-spacing: -0.01em; font-weight: 700; }
.section-count { background:#ede9fe; color: var(--accent); border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 700; }
.section-intro { color: var(--muted); font-size: 12px; margin: 0 0 10px; }

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(11,16,32,0.04), 0 6px 24px -12px rgba(11,16,32,0.08);
}
.issue-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
.issue-card + .issue-card { margin-top: 8px; }
.issue-header { display:flex; gap: 12px; align-items:center; }
.issue-title { display:flex; flex-wrap: wrap; align-items: center; gap: 8px; flex: 1 1 auto; min-width: 0; }
.issue-rank {
  width: 28px; height: 28px; border-radius: 8px;
  background: linear-gradient(135deg, #1f1147, #4f46e5);
  color:#fff; display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size: 11px; flex-shrink:0;
  box-shadow: 0 4px 10px -4px rgba(79,70,229,0.55);
}
.issue-title h3 { margin: 0; font-size: 14px; letter-spacing: -0.01em; font-weight: 700; }
.issue-meta { display:flex; gap: 5px; flex-wrap: wrap; align-items:center; }
.issue-meta { display:flex; gap: 6px; flex-wrap: wrap; align-items:center; }
.badge { display:inline-flex; align-items:center; font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 999px; border: 1px solid; letter-spacing: 0.02em; }
.meta-pill { font-size: 11px; color: var(--muted); background:#f1f3fa; padding: 4px 9px; border-radius: 999px; font-weight: 600; border: 1px solid var(--border); }
.issue-impact, .issue-suggestion { font-size: 14px; margin: 12px 0 0; color: #1e2240; }
.issue-impact strong, .issue-suggestion strong { color: var(--text); }
.issue-code { margin-top: 14px; }
.issue-code summary { cursor: pointer; font-size: 13px; color: var(--accent); font-weight: 700; }
.code-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
.code-label { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; font-weight: 700; }
pre {
  background:#0b1020; color: #e3e7f5; padding: 14px; border-radius: 12px; overflow:auto;
  font-size: 12.5px; margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  border: 1px solid #1a2040;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}
.issue-link { display:inline-block; margin-top: 14px; font-size: 13px; color: var(--accent); text-decoration: none; font-weight: 700; }
.issue-hint { margin-left: auto; flex-shrink: 0; }
.visual-hint { display:flex; align-items:center; gap: 8px; padding: 6px 10px; border-radius: 12px; background: #f1f3fa; border: 1px solid var(--border); }
.swatch { display:inline-flex; align-items:center; justify-content:center; width: 44px; height: 28px; border-radius: 6px; font-weight: 700; font-size: 13px; }
.swatch-bad { background: #ffffff; color: #cbd5e1; border: 1px solid #e2e8f0; }
.swatch-good { background: #0b1020; color: #ffffff; }
.swatch-arrow { color: var(--muted); font-weight: 700; font-size: 14px; }
.target-dot { display:inline-block; border-radius: 50%; background: var(--accent); opacity: 0.8; }
.target-dot.small { width: 12px; height: 12px; }
.target-dot.big { width: 26px; height: 26px; }
.hint-label { font-size: 11px; color: var(--muted); font-weight: 600; }
.link-sample { font-size: 13px; color: var(--accent); text-decoration: underline; font-weight: 600; }
.issue-suggestion-compact { font-size: 13.5px; color: #1e2240; margin: 10px 0 12px; }
.link-arrow { display:inline-block; margin-left: 4px; transition: transform 0.15s ease; }
details[open] .link-arrow { transform: rotate(90deg); }
.issue-code summary { list-style: none; }
.issue-code summary::-webkit-details-marker { display: none; }
.issue-code summary { display:inline-flex; align-items:center; padding: 3px 9px; border-radius: 999px; background:#ede9fe; color: var(--accent); font-size: 11px; margin-top: 6px; }

.incomplete-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.incomplete-card { background: linear-gradient(180deg, #fffbf2 0%, #ffffff 100%); border-color: #fde68a; }
.incomplete-card h4 { margin: 0 0 6px; font-size: 14.5px; color:#854d0e; font-weight: 700; }
.incomplete-card p { margin: 0 0 10px; font-size: 13px; color: #44391a; }
.selectors { display:block; margin-top: 8px; font-size: 11px; color: #6b5e2a; word-break: break-all; background:#fef9c3; padding: 7px 9px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

.empty-bar { color: rgba(255,255,255,0.6); font-size: 13px; padding: 8px 0; }
.sev-bar-wrap { margin-top: 16px; }
.sev-bar-wrap svg { border-radius: 999px; overflow: hidden; }
.legend { display:flex; gap: 14px; flex-wrap: wrap; margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.78); font-weight: 600; }
.legend-dot { display:inline-block; width:9px; height:9px; border-radius:3px; margin-right: 6px; vertical-align: middle; }

.quick-wins {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%);
  border-color: #a7f3d0;
}
.quick-wins h3 { margin: 0 0 10px; font-size: 16px; color:#065f46; display:flex; align-items:center; gap:8px; font-weight: 700; }
.quick-wins .qw-icon { width: 20px; height: 20px; border-radius: 6px; background: #10b981; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size: 13px; font-weight: 800; }
.quick-wins ul { margin: 0; padding-left: 18px; font-size: 14px; color: #047857; }
.quick-wins ul li { margin-bottom: 4px; }

.footer {
  margin-top: 18px; padding: 12px 16px; border-top: 1px solid var(--border);
  background: linear-gradient(180deg, transparent, rgba(124,58,237,0.04));
  border-radius: 16px;
  font-size: 12px; color: var(--muted);
  display:flex; gap: 16px; flex-wrap: wrap; justify-content: space-between; align-items:center;
}
.footer a { color: var(--accent); font-weight: 600; text-decoration: none; }
.footer .stack-badges { display:flex; gap: 6px; flex-wrap: wrap; }

.page-table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.page-table th, .page-table td { text-align: left; padding: 12px 14px; font-size: 13px; border-bottom: 1px solid var(--border); }
.page-table th { background:#f8f9fd; font-weight: 700; color: #2a2e44; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; }
.page-table tr:last-child td { border-bottom: none; }
.score-pill { font-weight: 700; padding: 3px 10px; border-radius: 999px; color: #fff; font-size: 12px; }

@media (max-width: 720px) {
  .hero { grid-template-columns: 1fr; text-align: center; padding: 28px 22px; }
  .hero-stats { grid-template-columns: repeat(2, 1fr); }
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
    <div class="brand"><span class="brand-mark"></span>Loop11y</div>
    <div class="meta-top">Accessibility · WCAG 2.2</div>
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

  const reranked = [...result.top_issues].sort((a, b) => {
    const va = visualPriority(a.violation_id);
    const vb = visualPriority(b.violation_id);
    if (va !== vb) return vb - va;
    return a.rank - b.rank;
  }).map((iss, i) => ({ ...iss, rank: i + 1 }));

  const topIssues = reranked.length
    ? `
<section class="section">
  <h2>Top issues to fix <span class="section-count">${reranked.length}</span></h2>
  <p class="section-intro">Visible-first: contrast, theme, font, and tap targets ranked before semantic-only failures.</p>
  ${reranked.slice(0, 3).map(issueCard).join("")}
</section>`
    : `
<section class="section">
  <article class="card"><h2 style="margin:0">No violations 🎉</h2><p class="section-intro" style="margin-top:6px">Page passes all axe-core checks at the audited viewport.</p></article>
</section>`;

  const incomplete = "";
  const quickWins = "";

  const body = `
<section class="hero">
  <div>${gauge}</div>
  <div class="hero-meta">
    <div class="hero-eyebrow">Accessibility report</div>
    <h1>${escapeHtml(new URL(result.url).hostname || result.url)}</h1>
    <div class="url">${escapeHtml(result.url)}</div>
    <div class="hero-grade-row">
      <span class="grade-chip">Grade <strong>${escapeHtml(result.grade)}</strong></span>
      <span class="grade-chip">WCAG <strong>${escapeHtml(result.wcag_level)}</strong></span>
      <span class="grade-chip">${sev.violations} violations</span>
      <span class="grade-chip">${sev.passed} passing</span>
      <span class="grade-chip">${sev.auto_fixable_count} auto-fixable</span>
    </div>
    ${sevBar}
  </div>
</section>
${quickWins}
${topIssues}
${incomplete}
`;

  const footer = `
<div>Generated ${escapeHtml(new Date(result.timestamp).toUTCString())} · Viewport ${result.viewport ? `${result.viewport.width}×${result.viewport.height}` : "default"} · axe-core ${escapeHtml(result.axe_version ?? "")}</div>
<div class="stack-badges">${badge("WCAG 2.2", "#2563eb")} ${badge("EN 301 549", "#2563eb")} ${badge("Section 508", "#2563eb")} <a href="https://github.com/tayyabataimur/loop11y" target="_blank" rel="noopener">loop11y →</a></div>
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
  <div style="text-align:center;">
    <div style="font-size: 88px; font-weight: 800; color:#fff; letter-spacing:-0.04em; line-height:1;">${result.totalViolations}</div>
    <div style="margin-top:6px; font-size:12px; color:rgba(255,255,255,0.65); letter-spacing:0.12em; text-transform:uppercase; font-weight:600;">Violations</div>
  </div>
  <div class="hero-meta">
    <div class="hero-eyebrow">Repository audit</div>
    <h1>${escapeHtml(result.root.split("/").pop() || result.root)}</h1>
    <div class="url">${escapeHtml(result.root)}</div>
    <div class="hero-stats">
      <div class="stat"><span class="stat-num">${result.filesScanned}</span><span class="stat-label">Files scanned</span></div>
      <div class="stat"><span class="stat-num">${result.criticalViolations}</span><span class="stat-label">Critical</span></div>
      <div class="stat"><span class="stat-num">${result.frameworks.length || "—"}</span><span class="stat-label">Frameworks</span></div>
      <div class="stat"><span class="stat-num">${result.sourceMapping.mappedViolations}/${result.sourceMapping.totalViolationTypes}</span><span class="stat-label">Source-mapped</span></div>
      <div class="stat"><span class="stat-num">${result.filesSkipped}</span><span class="stat-label">Skipped</span></div>
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
  <div style="text-align:center;">
    <div style="font-size: 88px; font-weight: 800; color:#fff; letter-spacing:-0.04em; line-height:1;">${result.averageScore}</div>
    <div style="margin-top:6px; font-size:12px; color:rgba(255,255,255,0.65); letter-spacing:0.12em; text-transform:uppercase; font-weight:600;">Avg score</div>
  </div>
  <div class="hero-meta">
    <div class="hero-eyebrow">Site crawl</div>
    <h1>${escapeHtml(new URL(result.origin).hostname)}</h1>
    <div class="url">${escapeHtml(result.origin)}</div>
    <div class="hero-stats">
      <div class="stat"><span class="stat-num">${result.pagesAudited}</span><span class="stat-label">Pages audited</span></div>
      <div class="stat"><span class="stat-num">${result.pagesSkipped}</span><span class="stat-label">Skipped</span></div>
      <div class="stat"><span class="stat-num">${result.lowestScore?.score ?? "—"}</span><span class="stat-label">Lowest</span></div>
      <div class="stat"><span class="stat-num">${result.highestScore?.score ?? "—"}</span><span class="stat-label">Highest</span></div>
      <div class="stat"><span class="stat-num">${result.topViolations.length}</span><span class="stat-label">Rules hit</span></div>
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
  const stillPresent = after.top_issues.filter((a) => before.top_issues.some((b) => b.violation_id === a.violation_id));

  const body = `
<section class="hero">
  <div style="text-align:center;">
    <div style="font-size: 96px; font-weight: 800; color:${deltaColor}; letter-spacing:-0.05em; line-height:1; text-shadow: 0 0 32px ${deltaColor}66;">${delta >= 0 ? "+" : ""}${delta}</div>
    <div style="margin-top:6px; font-size:12px; color:rgba(255,255,255,0.65); letter-spacing:0.12em; text-transform:uppercase; font-weight:600;">Score delta</div>
  </div>
  <div class="hero-meta">
    <div class="hero-eyebrow">Before → After</div>
    <h1>${escapeHtml(new URL(after.url).hostname || after.url)}</h1>
    <div class="url">${escapeHtml(after.url)}</div>
    <div class="hero-grade-row">
      <span class="grade-chip">Score <strong>${before.score} → ${after.score}</strong></span>
      <span class="grade-chip">Grade <strong>${before.grade} → ${after.grade}</strong></span>
      <span class="grade-chip">${before.summary.violations} → ${after.summary.violations} violations</span>
    </div>
    <div class="hero-stats">
      <div class="stat"><span class="stat-num" style="color:#34d399;">${resolved.length}</span><span class="stat-label">Resolved</span></div>
      <div class="stat"><span class="stat-num" style="color:#f87171;">${introduced.length}</span><span class="stat-label">New</span></div>
      <div class="stat"><span class="stat-num">${stillPresent.length}</span><span class="stat-label">Still present</span></div>
      <div class="stat"><span class="stat-num">${after.summary.passed}</span><span class="stat-label">Now passing</span></div>
      <div class="stat"><span class="stat-num">${after.summary.incomplete}</span><span class="stat-label">Manual</span></div>
    </div>
  </div>
</section>
<section class="section">
  <h2>Resolved <span class="section-count">${resolved.length}</span></h2>
  ${resolved.length === 0 ? `<p class="section-intro">No issues resolved yet.</p>` : resolved.slice(0, 3).map(issueCard).join("")}
</section>
${introduced.length > 0 ? `
<section class="section">
  <h2>Newly introduced <span class="section-count">${introduced.length}</span></h2>
  ${introduced.slice(0, 2).map(issueCard).join("")}
</section>` : ""}
`;
  const footer = `<div>Generated ${escapeHtml(after.timestamp)} · before ${escapeHtml(before.timestamp)}</div><div>${badge("WCAG 2.2", "#2563eb")} <a href="https://github.com/tayyabataimur/loop11y" target="_blank" rel="noopener">loop11y</a></div>`;
  return htmlShell(`Loop11y · diff · ${after.url}`, body, footer);
}
