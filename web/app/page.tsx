import AuditForm from "./components/AuditForm";

const GITHUB = "https://github.com/tayyabataimur/loop11y";
const NPM = "https://www.npmjs.com/package/loop11y";
const SKILL = "https://github.com/tayyabataimur/loop11y-skill";
const ISSUE_NO = "001";
const ISSUE_DATE = "Spring 2026";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <TheLoop />
        <Features />
        <SampleReports />
        <InstallPaths />
        <AgentHandoff />
        <Stakes />
        <BigCTA />
      </main>
      <Footer />
    </>
  );
}

function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="wrap nav-inner">
        <div className="nav-left">
          <span className="brand-mark" aria-hidden="true">L</span>
          <span className="brand-word">Loop<em>11y</em></span>
        </div>
        <div className="nav-mid">
          <a href="#loop">The Loop</a>
          <a href="#report">Report</a>
          <a href="#agent">Agent</a>
          <a href="#how">Install</a>
          <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
        </div>
        <div className="nav-right">
          <a className="nav-cta" href="#audit">Run audit ↗</a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero" id="audit">
      <div className="wrap">
        <div className="hero-meta">
          <span className="mono">Issue №{ISSUE_NO} · {ISSUE_DATE}</span>
          <span className="mono">Open source · MIT · v0.1</span>
        </div>
        <h1>
          <span className="it">Audit. Insight.</span><br />
          <span className="underline">Fix.</span> <span className="accent">Ship.</span>
        </h1>
        <div className="hero-sub">
          <p>
            Most a11y tools stop at the report. Loop11y hands the report,
            the plain-English insight, <em>and</em> the patch — straight to your
            AI agent. Ten seconds in. Merged PR out.
          </p>
          <aside className="hero-marginalia">
            Drops into <em>Claude Code</em>, <em>Cursor</em>, <em>Cline</em>, <em>Copilot</em>,
            <em>Aider</em>, <em>Codex</em>. Same engine in CLI, MCP, GitHub Action, and CI.
            Reach the 1-in-4 users you've been losing.
          </aside>
        </div>

        <div className="audit-block">
          <div className="audit-label">▸ Run an audit</div>
          <AuditForm />
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [
    "Claude Code", "Cursor", "Cline", "GitHub Copilot", "Aider", "Codex",
    "WCAG 2.2 AA", "EN 301 549", "Section 508",
    "European Accessibility Act 2025", "axe-core 4.10", "MCP Protocol",
    "Claude Code", "Cursor", "Cline", "GitHub Copilot", "Aider", "Codex",
    "WCAG 2.2 AA", "EN 301 549", "Section 508",
    "European Accessibility Act 2025", "axe-core 4.10", "MCP Protocol",
  ];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {items.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
}

function TheLoop() {
  const steps = [
    { n: "01", verb: "Audit", body: "Visible-first WCAG 2.2 against any URL, repo, or local file." },
    { n: "02", verb: "Explain", body: "Plain-English user-impact for each violation — no rule-ID soup." },
    { n: "03", verb: "Rank", body: "Contrast / font / theme / tap-target before semantic-only rules." },
    { n: "04", verb: "Patch", body: "Mechanical fixes auto-apply. Judgement calls go to your agent." },
    { n: "05", verb: "Verify", body: "Re-audit, side-by-side diff, score delta. Ship the PR." },
  ];
  return (
    <section className="block" id="loop">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">Chapter <strong>01</strong> The Loop</div>
          <div>
            <h2>Audit is step one of <em>five.</em></h2>
            <p className="section-sub">Every accessibility tool stops at the report. We close the loop end-to-end so accessibility becomes a merged PR, not a backlog ticket.</p>
          </div>
        </div>
        <div className="loop-grid">
          {steps.map((s) => (
            <div key={s.n} className="loop-step">
              <div className="loop-step-num">{s.n}</div>
              <h3 className="loop-step-verb">{s.verb}</h3>
              <p className="loop-step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const feats = [
    {
      n: "F.01",
      title: <>Plain-English <em>insight</em></>,
      body: "Every violation comes with a one-line user-impact line — what your blind, low-vision, motor-impaired, or cognitively-impaired user actually experiences. Not 'aria-required-attr failed.'",
    },
    {
      n: "F.02",
      title: <>Visible-first <em>ranking</em></>,
      body: "Contrast, theme, font, and tap-target failures are what users notice. Ranked above semantic-only rules so your fix list mirrors perceived quality, not axe rule IDs.",
    },
    {
      n: "F.03",
      title: <>Patch-ready for <em>your agent</em></>,
      body: "Each issue ships with a before/after code snippet your AI agent can apply directly. Claude Code, Cursor, Cline, Copilot — all speak Loop11y via MCP. Audit → diff → commit.",
    },
    {
      n: "F.04",
      title: <>Mechanical <em>auto-fix</em></>,
      body: "Lang attribute, button names, decorative alt-empty, ARIA required-attr — all patched automatically. Judgement calls (alt copy, contrast colour) go to assisted mode. We never invent meaning.",
    },
    {
      n: "F.05",
      title: <>Repo-wide <em>source mapping</em></>,
      body: "audit:repo scans React, Vue, Svelte, Angular, and plain HTML; maps every violation back to the exact source file with a confidence score so your agent can diff in one shot.",
    },
    {
      n: "F.06",
      title: <>Verified, then <em>shipped</em></>,
      body: "Run audit → apply diff → re-audit. The loop closes itself. Gate PRs at a score threshold; merge confidently knowing the fix didn't regress somewhere else.",
    },
  ];
  return (
    <section className="block" id="features">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">Chapter <strong>02</strong> Features</div>
          <div>
            <h2>Not a report. A <em>fix loop.</em></h2>
            <p className="section-sub">Detection is a rounding error. The hard part is turning violations into shipped code without inventing what a tool cannot decide. Loop11y owns the entire arc — audit, explain, rank, patch, verify — and hands each step to your agent.</p>
          </div>
        </div>
        <div className="feat-grid">
          {feats.map((f) => (
            <article key={f.n} className="feat">
              <div className="feat-num">{f.n}</div>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-body">{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SampleReports() {
  return (
    <section className="block" id="report">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">Chapter <strong>03</strong> The Report</div>
          <div>
            <h2>Generated locally. Shared <em>anywhere.</em></h2>
            <p className="section-sub">A single self-contained HTML file. No JS runtime, no SaaS storage. The same report you see below is what you generate for your site.</p>
          </div>
        </div>
        <div className="samples">
          <figure>
            <a href="https://htmlpreview.github.io/?https://github.com/tayyabataimur/loop11y/blob/main/examples/sample-report.html" target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sample-report.jpg" alt="Loop11y audit report: score gauge, severity bar, three top-issue cards with WCAG badges" loading="lazy" />
            </a>
            <figcaption>
              <span>FIG. A · Audit report</span>
              <a href="https://htmlpreview.github.io/?https://github.com/tayyabataimur/loop11y/blob/main/examples/sample-report.html" target="_blank" rel="noreferrer">Open live ↗</a>
            </figcaption>
          </figure>
          <figure>
            <a href="https://htmlpreview.github.io/?https://github.com/tayyabataimur/loop11y/blob/main/examples/sample-diff-report.html" target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sample-diff-report.jpg" alt="Loop11y before/after diff: +32 score delta, resolved issues, newly introduced issues" loading="lazy" />
            </a>
            <figcaption>
              <span>FIG. B · Before / after diff</span>
              <a href="https://htmlpreview.github.io/?https://github.com/tayyabataimur/loop11y/blob/main/examples/sample-diff-report.html" target="_blank" rel="noreferrer">Open live ↗</a>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function InstallPaths() {
  const paths = [
    {
      title: "Agent Skill",
      blurb: (<>One-line install for Claude Code, Cursor, Cline, Codex, Aider, and <a href="https://skills.sh" target="_blank" rel="noreferrer">50+ other agents</a>. Guided prompting on top of the MCP server.</>),
      code: (
        <><span className="prompt">$</span> npx skills add tayyabataimur/loop11y-skill -g -a <span className="arg">claude-code</span></>
      ),
    },
    {
      title: "CLI",
      blurb: (<>Runs locally — no SaaS, no telemetry. JSON, Markdown, SARIF, or single-file HTML output. <a href={NPM} target="_blank" rel="noreferrer">npm package</a>.</>),
      code: (
        <><span className="prompt">$</span> npx -y loop11y audit https://your-site.com --html --output <span className="arg">report.html</span></>
      ),
    },
    {
      title: "MCP server",
      blurb: (<>stdio + streamable-HTTP transport. Works with Claude Desktop, Claude Code, Cursor, Cline, and any MCP-compatible agent.</>),
      code: (
        <><span className="prompt">$</span> npx -y loop11y    <span className="comment"># starts MCP server on stdio</span></>
      ),
    },
    {
      title: "GitHub Action",
      blurb: (<>Gate PRs on accessibility score. Posts a Markdown report as a PR comment and fails the check below your threshold.</>),
      code: (
        <>
          <span className="comment"># .github/workflows/a11y.yml</span>{"\n"}
          uses: tayyabataimur/loop11y@<span className="arg">v0.1.0</span>{"\n"}
          with: {`{ url: https://preview.app, fail-under: 90 }`}
        </>
      ),
    },
    {
      title: "HTTP API",
      blurb: (<>OpenAPI-spec backend. Build a custom GPT, chat bot, or in-house dashboard. Self-host via Docker or Fly.</>),
      code: (
        <><span className="prompt">$</span> curl -X POST localhost:3000/api/evaluate -d {`'{ "url": "https://your-site.com" }'`}</>
      ),
    },
  ];
  return (
    <section className="block" id="how">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">Chapter <strong>04</strong> Surfaces</div>
          <div>
            <h2>Five surfaces. One <em>open-source engine.</em></h2>
            <p className="section-sub">Pick the surface that matches where you work. All five run the same axe-core 4.10 audit pipeline. No vendor lock-in, no per-seat pricing.</p>
          </div>
        </div>
        <div className="paths">
          {paths.map((p, i) => (
            <article key={p.title} className="path">
              <div className="path-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="path-head">
                <strong>{p.title}</strong>
                <span>{p.blurb}</span>
              </div>
              <pre className="path-code"><code>{p.code}</code></pre>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentHandoff() {
  return (
    <section className="block" id="agent">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">Chapter <strong>05</strong> Agent</div>
          <div>
            <h2>Hand the report to your <em>AI agent.</em></h2>
            <p className="section-sub">Loop11y exposes its audit, remediation, and verify tools over MCP. Your agent calls them like any other function. Paste a prompt; ship a PR.</p>
          </div>
        </div>
        <div className="handoff-grid">
          <article className="handoff">
            <div className="handoff-label">Prompt · Claude Code / Cursor / Cline</div>
            <pre className="handoff-code"><code><span className="prompt">▸</span> Audit <span className="arg">https://staging.acme.com</span>, rank the top 5 visible issues, and open a PR that fixes the auto-fixable ones. Re-audit and confirm the score moved.</code></pre>
            <div className="handoff-foot">→ Agent calls <code>evaluate</code>, then <code>remediate</code>, then <code>verify</code>. You review the diff.</div>
          </article>
          <article className="handoff">
            <div className="handoff-label">CI gate · GitHub Action</div>
            <pre className="handoff-code"><code><span className="comment"># Block merge if accessibility regresses</span>{"\n"}uses: tayyabataimur/loop11y@<span className="arg">v0.1.0</span>{"\n"}with: {"{ url: preview-url, fail-under: 90 }"}</code></pre>
            <div className="handoff-foot">→ PR comment with the visual report. Status fails below threshold.</div>
          </article>
          <article className="handoff">
            <div className="handoff-label">Programmatic · Harness SDK</div>
            <pre className="handoff-code"><code><span className="prompt">›</span> const r = await loop11y.evaluate({"{"} url {"}"});{"\n"}<span className="prompt">›</span> if (r.score &lt; 90) await loop11y.remediate({"{"} mode: <span className="arg">"fix"</span> {"}"});</code></pre>
            <div className="handoff-foot">→ Drop into your in-house dashboard, on-call bot, or release pipeline.</div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Stakes() {
  return (
    <section className="block" id="stakes">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">Chapter <strong>06</strong> Stakes</div>
          <div>
            <h2>Reach the users you've been <em>losing.</em></h2>
            <p className="section-sub">Accessibility isn't a compliance checkbox — it's the difference between a customer who can buy and one who bounces. The European Accessibility Act took effect 28 June 2025 and made that math explicit. Fix the loop and the addressable market grows.</p>
          </div>
        </div>
        <div className="stakes">
          <Stake num="+25" suffix="%" label="addressable market unlocked by reaching disabled users (Eurostat 1-in-4)." />
          <Stake num="71" suffix="%" label="of disabled users abandon a site they cannot use (WebAIM 2024)." />
          <Stake num="€20k" suffix="+ /breach" label="administrative fines under EAA in DE and FR. Class action exposure on top." />
          <Stake num="96" suffix=".3%" label="of the world's top 1M homepages had a WCAG failure last audit (WebAIM Million)." />
        </div>
      </div>
    </section>
  );
}

function Stake({ num, suffix, label }: { num: string; suffix: string; label: string }) {
  return (
    <div className="stake">
      <div className="stake-num">{num}<small>{suffix}</small></div>
      <div className="stake-label">{label}</div>
    </div>
  );
}

function BigCTA() {
  return (
    <section className="bigcta">
      <div className="wrap">
        <h2 className="bigcta-title">
          Audit. Then <em>ship</em> the fix.
        </h2>
        <p className="section-sub" style={{ margin: "20px auto 0", maxWidth: "52ch" }}>
          One paste runs the audit. One MCP call lets your agent open the PR. One re-run verifies the score moved. That's the loop.
        </p>
        <div className="bigcta-row">
          <a className="btn btn-primary" href="#audit">↑ Run audit</a>
          <a className="btn btn-ghost" href="#agent">Hand to agent ↗</a>
          <a className="btn btn-ghost" href={GITHUB} target="_blank" rel="noreferrer">★ Star on GitHub</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-cols">
          <div>
            <h4>The product</h4>
            <p className="footer-blurb">
              Open-source accessibility for humans and AI agents.
              Built by <a href="https://tayyaba.dev" target="_blank" rel="noreferrer">Tayyaba Taimur</a>.
              Engine: <a href="https://playwright.dev" target="_blank" rel="noreferrer">Playwright</a> + <a href="https://github.com/dequelabs/axe-core" target="_blank" rel="noreferrer">axe-core</a>.
            </p>
          </div>
          <div>
            <h4>Install</h4>
            <a href={NPM} target="_blank" rel="noreferrer">npm</a>
            <a href={SKILL} target="_blank" rel="noreferrer">Agent Skill</a>
            <a href={`${GITHUB}#github-action`} target="_blank" rel="noreferrer">GH Action</a>
            <a href={`${GITHUB}/blob/main/deploy/openapi.yaml`} target="_blank" rel="noreferrer">OpenAPI</a>
          </div>
          <div>
            <h4>Source</h4>
            <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer">Issues</a>
            <a href={`${GITHUB}/blob/main/CHANGELOG.md`} target="_blank" rel="noreferrer">Changelog</a>
            <a href={`${GITHUB}/blob/main/LICENSE`} target="_blank" rel="noreferrer">MIT</a>
          </div>
          <div>
            <h4>Standards</h4>
            <a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noreferrer">WCAG 2.2</a>
            <a href="https://www.etsi.org/standards" target="_blank" rel="noreferrer">EN 301 549</a>
            <a href="https://www.section508.gov/" target="_blank" rel="noreferrer">Section 508</a>
            <a href="https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/union-equality-strategy-rights-persons-disabilities-2021-2030/european-accessibility-act_en" target="_blank" rel="noreferrer">EAA</a>
          </div>
        </div>
        <p className="footer-word">Loop<span className="accent">11y</span></p>
        <div className="footer-meta">
          <span>© 2026 Tayyaba Taimur · MIT licensed</span>
          <span>loop11y.tayyaba.dev · Issue №{ISSUE_NO}</span>
        </div>
      </div>
    </footer>
  );
}
