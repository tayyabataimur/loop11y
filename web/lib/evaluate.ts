import { runAxeAudit, type Violation, type IncompleteCheck, type AxeRunOptions } from "./axe-runner";

type Grade = "A" | "B" | "C" | "D" | "F";
type WcagLevel = "AAA" | "AA" | "A" | "Partial A" | "Non-compliant";

interface IssueSuggestion {
  rank: number;
  violation_id: string;
  impact: Violation["impact"];
  wcag_criterion: string;
  affected_elements: number;
  headline: string;
  user_impact: string;
  suggestion: string;
  example_before: string;
  example_after: string;
  auto_fixable: boolean;
  learn_more: string;
}

export interface EvaluateResult {
  url: string;
  timestamp: string;
  score: number;
  grade: Grade;
  wcag_level: WcagLevel;
  summary: {
    total_checks: number;
    passed: number;
    violations: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    auto_fixable_count: number;
    incomplete: number;
  };
  top_issues: IssueSuggestion[];
  quick_wins: IssueSuggestion[];
  incomplete_checks: IncompleteCheck[];
  content_type?: string;
  axe_version?: string;
  viewport?: { width: number; height: number };
  discovered_links?: string[];
  ai_summary: string;
}

const AUTO_FIXABLE = new Set(["html-has-lang"]);

const IMPACT_DEDUCTION: Record<Violation["impact"], { base: number; perNode: number; cap: number }> = {
  critical: { base: 15, perNode: 1.5, cap: 25 },
  serious: { base: 10, perNode: 1.0, cap: 18 },
  moderate: { base: 5, perNode: 0.5, cap: 10 },
  minor: { base: 2, perNode: 0.2, cap: 4 },
};

const VIOLATION_GUIDANCE: Record<string, {
  headline: (n: number) => string;
  user_impact: string;
  suggestion: string;
  example_before: string;
  example_after: string;
}> = {
  "image-alt": {
    headline: (n) => `${n} image${n > 1 ? "s are" : " is"} missing alternative text`,
    user_impact: "Screen reader users hear nothing or the filename when encountering these images.",
    suggestion: "Add an alt attribute to every img element. Use descriptive text or alt=\"\" for decorative images.",
    example_before: '<img src="team.jpg">',
    example_after: '<img src="team.jpg" alt="Five engineers at a whiteboard">',
  },
  "button-name": {
    headline: (n) => `${n} button${n > 1 ? "s have" : " has"} no accessible name`,
    user_impact: "Screen reader users hear 'button' with no indication of what it does.",
    suggestion: "Add aria-label to icon-only buttons, or visible text describing the action.",
    example_before: '<button><svg aria-hidden="true">...</svg></button>',
    example_after: '<button aria-label="Close dialog"><svg aria-hidden="true">...</svg></button>',
  },
  "link-name": {
    headline: (n) => `${n} link${n > 1 ? "s have" : " has"} no accessible name`,
    user_impact: "Screen reader users cannot determine where a link goes.",
    suggestion: "Every link needs a descriptive accessible name. Avoid 'click here' or 'read more'.",
    example_before: '<a href="/about"><img src="arrow.svg"></a>',
    example_after: '<a href="/about" aria-label="Learn more about us"><img src="arrow.svg" alt=""></a>',
  },
  label: {
    headline: (n) => `${n} form field${n > 1 ? "s are" : " is"} missing a label`,
    user_impact: "Screen reader users cannot identify what information a field expects.",
    suggestion: "Associate a label with every input via htmlFor/for matching the input id, or use aria-label.",
    example_before: '<input type="email" placeholder="Email">',
    example_after: '<label for="email">Email</label>\n<input id="email" type="email">',
  },
  "color-contrast": {
    headline: (n) => `${n} element${n > 1 ? "s have" : " has"} insufficient colour contrast`,
    user_impact: "Users with low vision or colour blindness cannot read this text.",
    suggestion: "Increase contrast: 4.5:1 for normal text, 3:1 for large text (WCAG AA).",
    example_before: "color: #9CA3AF; /* 2.85:1 on white */",
    example_after: "color: #6B7280; /* 4.62:1 on white */",
  },
  "html-has-lang": {
    headline: () => "Page is missing a language declaration",
    user_impact: "Screen readers cannot select the correct pronunciation engine.",
    suggestion: "Add a lang attribute to <html> with a BCP 47 tag.",
    example_before: "<html>",
    example_after: '<html lang="en">',
  },
  "heading-order": {
    headline: () => "Heading levels are out of order",
    user_impact: "Screen reader users navigate by headings; skipped levels break structure.",
    suggestion: "Headings must descend sequentially h1 → h2 → h3. Use CSS for visual size.",
    example_before: "<h1>Title</h1><h3>Section</h3>",
    example_after: "<h1>Title</h1><h2>Section</h2>",
  },
  "aria-required-attr": {
    headline: (n) => `${n} ARIA element${n > 1 ? "s are" : " is"} missing required attributes`,
    user_impact: "Assistive tech cannot interpret these elements correctly.",
    suggestion: "Include all required ARIA attributes for the role used.",
    example_before: '<div role="checkbox">Subscribe</div>',
    example_after: '<div role="checkbox" aria-checked="false">Subscribe</div>',
  },
  "landmark-one-main": {
    headline: () => "Page is missing a main landmark",
    user_impact: "Users cannot skip to main content via landmark navigation.",
    suggestion: "Wrap primary content in a <main> element (exactly one per page).",
    example_before: '<div class="content">...</div>',
    example_after: "<main>...</main>",
  },
  region: {
    headline: (n) => `${n} content area${n > 1 ? "s are" : " is"} not inside a landmark region`,
    user_impact: "Landmark navigation cannot reach this content.",
    suggestion: "Wrap content in <header>, <nav>, <main>, <aside>, or <footer>.",
    example_before: "<div>Content</div>",
    example_after: "<main>Content</main>",
  },
};

function calculateScore(violations: Violation[]): number {
  let deduction = 0;
  for (const v of violations) {
    const d = IMPACT_DEDUCTION[v.impact];
    const nodeDeduction = Math.min(v.nodes.length * d.perNode, d.cap - d.base);
    deduction += Math.min(d.base + nodeDeduction, d.cap);
  }
  return Math.max(0, Math.round(100 - deduction));
}

function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 55) return "C";
  if (score >= 35) return "D";
  return "F";
}

function deriveWcagLevel(violations: Violation[]): WcagLevel {
  if (violations.length === 0) return "AAA";
  const tags = new Set(violations.flatMap((v) => v.wcag));
  const hasA = [...tags].some((t) => t.includes("2A") && !t.includes("2AA") && !t.includes("2AAA"));
  const hasAA = [...tags].some((t) => t.includes("2AA") && !t.includes("2AAA"));
  if (hasA) return "Non-compliant";
  if (violations.some((v) => v.wcag.some((t) => /WCAG\s+\d+\.\d+\.\d+/.test(t)))) {
    return hasAA ? "A" : "AA";
  }
  return "Partial A";
}

function generateSuggestion(v: Violation, rank: number): IssueSuggestion {
  const g = VIOLATION_GUIDANCE[v.id];
  const headline = g
    ? g.headline(v.nodes.length)
    : `${v.nodes.length} element${v.nodes.length > 1 ? "s" : ""} ${v.description.toLowerCase()}`;
  const example_before = v.nodes[0]?.html
    ? v.nodes.slice(0, 3).map((n) => n.html).join("\n")
    : g?.example_before ?? "<!-- See failing elements -->";
  return {
    rank,
    violation_id: v.id,
    impact: v.impact,
    wcag_criterion: v.wcag.filter((t) => /WCAG\s+\d/.test(t)).join(", ") || v.wcag.join(", "),
    affected_elements: v.nodes.length,
    headline,
    user_impact: g?.user_impact ?? "Affects users relying on assistive technologies.",
    suggestion: g?.suggestion ?? `See ${v.helpUrl} for guidance.`,
    example_before,
    example_after: g?.example_after ?? `<!-- See ${v.helpUrl} -->`,
    auto_fixable: AUTO_FIXABLE.has(v.id),
    learn_more: v.helpUrl,
  };
}

function rankViolations(violations: Violation[]): Violation[] {
  const w: Record<Violation["impact"], number> = { critical: 40, serious: 25, moderate: 10, minor: 3 };
  return [...violations].sort((a, b) => w[b.impact] * b.nodes.length - w[a.impact] * a.nodes.length);
}

function buildAiSummary(r: Omit<EvaluateResult, "ai_summary">): string {
  if (r.summary.violations === 0) {
    return `Accessibility evaluation for ${r.url}\nScore: ${r.score}/100 (Grade ${r.grade}) — ${r.wcag_level}\n\nNo violations found.`;
  }
  const lines = [
    `Accessibility evaluation for ${r.url}`,
    `Score: ${r.score}/100 (Grade ${r.grade}) — WCAG compliance: ${r.wcag_level}`,
    "",
    `Found ${r.summary.violations} violations: ${r.summary.critical} critical, ${r.summary.serious} serious, ${r.summary.moderate} moderate, ${r.summary.minor} minor.`,
    "",
    "Top issues:",
    ...r.top_issues.slice(0, 5).map((i) => `  ${i.rank}. [${i.impact.toUpperCase()}] ${i.headline}`),
  ];
  return lines.join("\n");
}

export async function evaluateUrl(url: string, options?: AxeRunOptions): Promise<EvaluateResult> {
  const audit = await runAxeAudit(url, options);
  const score = calculateScore(audit.violations);
  const grade = scoreToGrade(score);
  const wcag_level = deriveWcagLevel(audit.violations);
  const ranked = rankViolations(audit.violations);
  const top_issues = ranked.map((v, i) => generateSuggestion(v, i + 1));
  const quick_wins = top_issues.filter((s) => s.auto_fixable);
  const summary = {
    total_checks: audit.violations.length + audit.passes,
    passed: audit.passes,
    violations: audit.violations.length,
    critical: audit.violations.filter((v) => v.impact === "critical").length,
    serious: audit.violations.filter((v) => v.impact === "serious").length,
    moderate: audit.violations.filter((v) => v.impact === "moderate").length,
    minor: audit.violations.filter((v) => v.impact === "minor").length,
    auto_fixable_count: audit.violations.filter((v) => AUTO_FIXABLE.has(v.id)).length,
    incomplete: audit.incomplete,
  };
  const partial: Omit<EvaluateResult, "ai_summary"> = {
    url: audit.url,
    timestamp: audit.timestamp,
    score,
    grade,
    wcag_level,
    summary,
    top_issues,
    quick_wins,
    incomplete_checks: audit.incomplete_checks,
    ...(audit.contentType ? { content_type: audit.contentType } : {}),
    ...(audit.axeVersion ? { axe_version: audit.axeVersion } : {}),
    ...(audit.viewport ? { viewport: audit.viewport } : {}),
    ...(audit.discoveredLinks ? { discovered_links: audit.discoveredLinks } : {}),
  };
  return { ...partial, ai_summary: buildAiSummary(partial) };
}
