import type { EvaluateResult } from "../../core/types.js";
import type { RepoAuditResult } from "../../tools/scan.js";
import type { CrawlSiteResult } from "../../tools/crawl.js";
import type { Violation } from "../../lib/axe-runner.js";

interface SarifResult {
  ruleId: string;
  level: "error" | "warning" | "note";
  message: { text: string };
  locations: Array<{
    physicalLocation: { artifactLocation: { uri: string } };
    logicalLocations?: Array<{ name: string; kind: string }>;
  }>;
  properties?: Record<string, unknown>;
}

interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription: { text: string };
  helpUri: string;
  properties?: { tags?: string[]; "security-severity"?: string };
}

const IMPACT_LEVEL: Record<Violation["impact"], "error" | "warning" | "note"> = {
  critical: "error",
  serious: "error",
  moderate: "warning",
  minor: "note",
};

const IMPACT_SECURITY_SEVERITY: Record<Violation["impact"], string> = {
  critical: "9.0",
  serious: "7.0",
  moderate: "5.0",
  minor: "3.0",
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

function ruleFromIssue(id: string, headline: string, impact: Violation["impact"], helpUrl: string, wcag: string): SarifRule {
  return {
    id,
    name: id,
    shortDescription: { text: headline },
    fullDescription: { text: `${headline}${wcag ? ` (${wcag})` : ""}` },
    helpUri: helpUrl,
    properties: {
      tags: ["accessibility", `impact:${impact}`, ...(wcag ? [wcag] : [])],
      "security-severity": IMPACT_SECURITY_SEVERITY[impact],
    },
  };
}

function evaluateToSarif(result: EvaluateResult): unknown {
  const rules = new Map<string, SarifRule>();
  const results: SarifResult[] = [];

  for (const issue of result.top_issues) {
    if (!rules.has(issue.violation_id)) {
      rules.set(issue.violation_id, ruleFromIssue(issue.violation_id, issue.headline, issue.impact, issue.learn_more, issue.wcag_criterion));
    }
    results.push({
      ruleId: issue.violation_id,
      level: IMPACT_LEVEL[issue.impact],
      message: { text: `${issue.headline} — ${issue.suggestion}` },
      locations: [{
        physicalLocation: { artifactLocation: { uri: result.url } },
      }],
      properties: {
        impact: issue.impact,
        affected_elements: issue.affected_elements,
        wcag: issue.wcag_criterion,
      },
    });
  }

  return buildSarif([...rules.values()], results);
}

function repoToSarif(result: RepoAuditResult): unknown {
  const rules = new Map<string, SarifRule>();
  const results: SarifResult[] = [];

  for (const file of result.fileResults) {
    for (const violation of file.violations) {
      if (!rules.has(violation.id)) {
        rules.set(violation.id, {
          id: violation.id,
          name: violation.id,
          shortDescription: { text: violation.id },
          fullDescription: { text: violation.id },
          helpUri: "https://dequeuniversity.com/rules/axe/",
          properties: {
            tags: ["accessibility", `impact:${violation.impact}`],
            "security-severity": IMPACT_SECURITY_SEVERITY[violation.impact],
          },
        });
      }
      const sourceFile = violation.sourceHints[0]?.file ?? file.relativeFile;
      results.push({
        ruleId: violation.id,
        level: IMPACT_LEVEL[violation.impact],
        message: { text: `${violation.id} — ${violation.nodeCount} node(s)` },
        locations: [{
          physicalLocation: { artifactLocation: { uri: sourceFile } },
        }],
        properties: {
          impact: violation.impact,
          nodeCount: violation.nodeCount,
          route: file.route,
        },
      });
    }
  }

  return buildSarif([...rules.values()], results);
}

function crawlToSarif(result: CrawlSiteResult): unknown {
  const rules = new Map<string, SarifRule>();
  const results: SarifResult[] = [];

  for (const page of result.pageResults) {
    for (const id of page.top_issue_ids) {
      if (!rules.has(id)) {
        rules.set(id, {
          id,
          name: id,
          shortDescription: { text: id },
          fullDescription: { text: id },
          helpUri: `https://dequeuniversity.com/rules/axe/4.10/${id}`,
          properties: { tags: ["accessibility"] },
        });
      }
      results.push({
        ruleId: id,
        level: "warning",
        message: { text: `${id} on ${page.url}` },
        locations: [{ physicalLocation: { artifactLocation: { uri: page.url } } }],
        properties: { score: page.score, grade: page.grade },
      });
    }
  }

  return buildSarif([...rules.values()], results);
}

function buildSarif(rules: SarifRule[], results: SarifResult[]): unknown {
  return {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: {
        driver: {
          name: "loop11y",
          informationUri: "https://github.com/tayyabataimur/loop11y",
          rules,
        },
      },
      results,
    }],
  };
}

export function toSarifReport(value: unknown): string {
  let sarif: unknown;
  if (isEvaluateResult(value)) sarif = evaluateToSarif(value);
  else if (isRepoAuditResult(value)) sarif = repoToSarif(value);
  else if (isCrawlSiteResult(value)) sarif = crawlToSarif(value);
  else sarif = buildSarif([], []);
  return `${JSON.stringify(sarif, null, 2)}\n`;
}
