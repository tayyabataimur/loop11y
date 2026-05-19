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
        <Features />
        <SampleReports />
        <InstallPaths />
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
          <a href="#how">How to use</a>
          <a href="#report">Report</a>
          <a href="#stakes">Why now</a>
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
          <span className="it">Accessibility,</span><br />
          in one <span className="underline">paste.</span>
        </h1>
        <div className="hero-sub">
          <p>
            Paste a URL. Get a visible-first WCAG 2.2 audit with ranked issues
            and patch-ready fixes — in about ten seconds. No signup. No email.
          </p>
          <aside className="hero-marginalia">
            Built on axe-core 4.10 + Playwright. Same engine drives the <em>CLI</em>,
            the <em>MCP server</em>, the <em>Agent Skill</em>, and the <em>GitHub Action</em>.
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
    "WCAG 2.2 AA", "EN 301 549", "Section 508",
    "European Accessibility Act 2025", "axe-core 4.10",
    "MCP Protocol", "Open Source · MIT", "WCAG 2.2 AA", "EN 301 549",
    "Section 508", "European Accessibility Act 2025", "axe-core 4.10",
    "MCP Protocol", "Open Source · MIT",
  ];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {items.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
}

function Features() {
  const feats = [
    {
      n: "F.01",
      title: <>Visible-first <em>ranking</em></>,
      body: "Contrast, theme, font, and tap-target failures are what users actually notice. We rank them above semantic-only issues so the fix list reflects perceived quality, not rule fatigue.",
    },
    {
      n: "F.02",
      title: <>Honest <em>auto-fix</em></>,
      body: "Mechanical fixes (lang attribute, button names, decorative alt-empty) apply automatically. Anything that needs judgement goes to assisted mode. We never invent alt text.",
    },
    {
      n: "F.03",
      title: <>Before / after <em>diff</em></>,
      body: "One command renders side-by-side resolved, newly-introduced, and still-present issues so reviewers see the delta in seconds — not a wall of JSON.",
    },
    {
      n: "F.04",
      title: <>Self-contained <em>HTML</em></>,
      body: "Single file, inline CSS + SVG. Email it, commit it, attach it to a Jira ticket. Score gauge, severity bar, WCAG badges, manual-review section, all in one click.",
    },
    {
      n: "F.05",
      title: <>Repo-wide <em>source mapping</em></>,
      body: "audit:repo scans React, Vue, Svelte, Angular, and plain HTML; maps every violation back to the source file with a confidence score for one-shot diffs.",
    },
    {
      n: "F.06",
      title: <>Pratfall-<em>honest</em></>,
      body: "Every report includes a manual-review section listing what axe-core could not decide. We tell you what the tool cannot catch — not the opposite.",
    },
  ];
  return (
    <section className="block" id="features">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">Chapter <strong>01</strong> Features</div>
          <div>
            <h2>Not another rule dump. A <em>fix plan.</em></h2>
            <p className="section-sub">Most accessibility tools stop at detection. Loop11y closes the loop: explain, rank, patch, verify.</p>
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
          <div className="section-num">Chapter <strong>02</strong> The Report</div>
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
          <div className="section-num">Chapter <strong>03</strong> Surfaces</div>
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

function Stakes() {
  return (
    <section className="block" id="stakes">
      <div className="wrap">
        <div className="section-head">
          <div className="section-num">Chapter <strong>04</strong> Stakes</div>
          <div>
            <h2>The deadline already <em>passed.</em></h2>
            <p className="section-sub">The European Accessibility Act took effect on 28 June 2025. Most public-facing products sold in the EU now need to meet WCAG 2.2 AA. Audits stopped being optional.</p>
          </div>
        </div>
        <div className="stakes">
          <Stake num="1" suffix="in 4" label="adults in the EU live with a disability that affects digital use (Eurostat)." />
          <Stake num="€20k" suffix="+ per breach" label="administrative fines under EAA in DE and FR." />
          <Stake num="71" suffix="%" label="of disabled users leave a site they cannot use (WebAIM 2024)." />
          <Stake num="96" suffix=".3%" label="of the world's top 1M homepages had a WCAG failure last audit." />
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
          Audit your <em>site,</em><br />now.
        </h2>
        <div className="bigcta-row">
          <a className="btn btn-primary" href="#audit">↑ Run audit</a>
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
