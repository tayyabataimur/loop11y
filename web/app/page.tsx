import AuditForm from "./components/AuditForm";

const GITHUB = "https://github.com/tayyabataimur/loop11y";
const NPM = "https://www.npmjs.com/package/loop11y";
const SKILL = "https://github.com/tayyabataimur/loop11y-skill";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <SampleReports />
        <InstallPaths />
        <Stakes />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="wrap nav-inner">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          Loop11y
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How to use</a>
          <a href="#report">Sample report</a>
          <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
          <a className="nav-cta" href="#audit">Audit a URL</a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero" id="audit">
      <div className="wrap">
        <span className="hero-eyebrow">
          <span className="tag">NEW</span> Visual-first reports · WCAG 2.2 · open source
        </span>
        <h1>
          Accessibility audits<br />
          your team will <span className="highlight">actually fix.</span>
        </h1>
        <p className="hero-sub">
          Paste a URL. Get a visible-first WCAG 2.2 audit with score, ranked issues,
          and patch-ready fixes — in about ten seconds. CLI, MCP server, Agent Skill,
          and GitHub Action included.
        </p>
        <AuditForm />
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <div className="trust-strip">
      <div className="wrap trust-strip-inner">
        <span className="trust-strip-item">Powered by axe-core 4.10</span>
        <span className="trust-strip-item">WCAG 2.2 AA</span>
        <span className="trust-strip-item">EN 301 549</span>
        <span className="trust-strip-item">Section 508</span>
        <span className="trust-strip-item">European Accessibility Act</span>
        <span className="trust-strip-item">MIT licensed</span>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section className="block" id="features">
      <div className="wrap">
        <span className="section-eyebrow">What you get</span>
        <h2 className="section-title">Not another rule dump. A fix plan.</h2>
        <p className="section-sub">
          Loop11y ranks visible failures first — colour contrast, theme, font, tap targets —
          then explains user impact in plain language and ships patch-ready code.
        </p>
        <div className="grid grid-3">
          <Feature
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></svg>}
            title="Visible-first ranking"
            body="Contrast, theme, font, and tap-target failures are what users notice. We rank them above semantic-only issues so the fix list reflects perceived quality."
          />
          <Feature
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7l4 4 8-8" /><path d="M4 17l4 4 8-8" /></svg>}
            title="Auto-fix that is honest"
            body="Mechanical fixes (lang attribute, button names, alt-empty for decorative) apply automatically. Anything that needs judgement (alt copy, contrast colour) goes to assisted mode. We never invent meaning."
          />
          <Feature
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l3-9 4 18 3-9h4" /></svg>}
            title="Before / after diff"
            body="One command renders side-by-side resolved, new, and still-present issues so reviewers see the delta in seconds — not a wall of JSON."
          />
          <Feature
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
            title="Self-contained HTML report"
            body="Single file, inline CSS + SVG. Email it, commit it, attach to a Jira ticket. Score gauge, severity bar, WCAG badges, manual-review section."
          />
          <Feature
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 3v18" /></svg>}
            title="Repo-wide source mapping"
            body="audit:repo scans React, Vue, Svelte, Angular, and plain HTML; maps every violation back to the source file with a confidence score."
          />
          <Feature
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" /></svg>}
            title="Pratfall-honest"
            body="Every report includes a 'needs manual review' section listing what axe-core could not decide. We tell you what the tool cannot catch — not the opposite."
          />
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="feature">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function SampleReports() {
  return (
    <section className="block" id="report">
      <div className="wrap">
        <span className="section-eyebrow">The report</span>
        <h2 className="section-title">Generate it for your site in one command.</h2>
        <p className="section-sub">
          The same report you see below is what powers this page — generated locally, no SaaS storage.
        </p>
        <div className="sample-grid">
          <a href="https://htmlpreview.github.io/?https://github.com/tayyabataimur/loop11y/blob/main/examples/sample-report.html" target="_blank" rel="noreferrer" className="sample-card" aria-label="Open sample audit report">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sample-report.jpg" alt="Loop11y audit report: score gauge, severity bar, three top-issue cards with WCAG badges" loading="lazy" />
          </a>
          <a href="https://htmlpreview.github.io/?https://github.com/tayyabataimur/loop11y/blob/main/examples/sample-diff-report.html" target="_blank" rel="noreferrer" className="sample-card" aria-label="Open sample before/after diff report">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sample-diff-report.jpg" alt="Loop11y before/after diff: +32 score delta, resolved issues, newly introduced issues" loading="lazy" />
          </a>
        </div>
      </div>
    </section>
  );
}

function InstallPaths() {
  const paths = [
    {
      name: "Agent Skill",
      blurb: "One-line install for Claude Code, Cursor, Cline, Codex, Aider, and 50+ other agents.",
      code: <><span className="prompt">$</span> npx skills add tayyabataimur/loop11y-skill -g -a <span className="arg">claude-code</span></>,
      cta: { href: SKILL, label: "skill repo →" },
    },
    {
      name: "CLI",
      blurb: "No setup. Runs locally, no SaaS storage. JSON, Markdown, SARIF, or HTML output.",
      code: <><span className="prompt">$</span> npx -y loop11y audit https://your-site.com --html --output report.html</>,
      cta: { href: NPM, label: "npm package →" },
    },
    {
      name: "MCP server",
      blurb: "stdio + HTTP transport. Works with Claude Desktop, Claude Code, Cursor, Cline, and any MCP-compatible agent.",
      code: <><span className="prompt">$</span> npx -y loop11y                  <span style={{ color: "var(--fg-dim)" }}># starts MCP server on stdio</span></>,
      cta: { href: `${GITHUB}#1-mcp-server-claude-cursor-cline-copilot`, label: "MCP setup →" },
    },
    {
      name: "GitHub Action",
      blurb: "Gate PRs by accessibility score. Posts a Markdown report as a PR comment.",
      code: <><span className="prompt"># .github/workflows/a11y.yml</span>{"\n"}uses: tayyabataimur/loop11y@v0.1.0{"\n"}with: {`{ url: 'https://your-preview.vercel.app', fail-under: 90 }`}</>,
      cta: { href: `${GITHUB}#5-github-action`, label: "action docs →" },
    },
    {
      name: "HTTP API",
      blurb: "OpenAPI-spec backend. Build a custom GPT, Chat bot, or in-house dashboard.",
      code: <><span className="prompt">$</span> curl -X POST https://a11y-api.fly.dev/api/evaluate -d {`'{"url":"https://your-site.com"}'`}</>,
      cta: { href: `${GITHUB}#4-http-api--openapi--chatgpt-gpt-action`, label: "OpenAPI spec →" },
    },
  ];
  return (
    <section className="block" id="how">
      <div className="wrap">
        <span className="section-eyebrow">How to use it</span>
        <h2 className="section-title">Five surfaces. One open-source engine.</h2>
        <p className="section-sub">
          Same toolset everywhere — pick the surface that matches where you work. All five run the same axe-core 4.10 audit pipeline, no vendor lock-in.
        </p>
        <div className="paths">
          {paths.map((p, i) => (
            <article key={p.name} className="path">
              <div className="path-head">
                <div className="path-num">{i + 1}</div>
                <div className="path-body">
                  <strong>{p.name}</strong>
                  <span>{p.blurb}</span>
                </div>
                <a className="path-cta" href={p.cta.href} target="_blank" rel="noreferrer">{p.cta.label}</a>
              </div>
              <pre className="code"><code>{p.code}</code></pre>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stakes() {
  return (
    <section className="block">
      <div className="wrap">
        <span className="section-eyebrow">Why it matters</span>
        <h2 className="section-title">The accessibility deadline already passed.</h2>
        <p className="section-sub">
          The European Accessibility Act took effect on 28 June 2025. Most public-facing products
          sold in the EU now need to meet WCAG 2.2 AA. Audits stopped being optional.
        </p>
        <div className="stakes-grid">
          <Stake num="1 in 4" label="adults in the EU live with a disability that affects digital use (Eurostat)." />
          <Stake num="€20k+" label="per-violation administrative fines under the EAA in member states like Germany and France." />
          <Stake num="71%" label="of users with disabilities will leave a site they cannot use (WebAIM 2024)." />
          <Stake num="96.3%" label="of the world's top 1,000,000 homepages had at least one WCAG failure last audit (WebAIM Million 2024)." />
        </div>
      </div>
    </section>
  );
}

function Stake({ num, label }: { num: string; label: string }) {
  return (
    <div className="stake">
      <div className="stake-num">{num}</div>
      <div className="stake-label">{label}</div>
    </div>
  );
}

function CTA() {
  return (
    <section className="block">
      <div className="wrap" style={{ textAlign: "center" }}>
        <span className="section-eyebrow">Get started</span>
        <h2 className="section-title" style={{ margin: "8px auto 12px" }}>Audit your site now.</h2>
        <p className="section-sub" style={{ margin: "0 auto" }}>
          Free, no signup, runs in your browser tab. Install the CLI to gate PRs and generate diffs.
        </p>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <a className="btn btn-primary" href="#audit">↑ Audit a URL</a>
          <a className="btn btn-ghost" href={GITHUB} target="_blank" rel="noreferrer">★ Star on GitHub</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div>
          <div className="brand" style={{ marginBottom: 10 }}>
            <span className="brand-mark" aria-hidden="true" />
            Loop11y
          </div>
          <div style={{ color: "var(--fg-dim)" }}>
            Open-source accessibility for humans and AI agents. MIT licensed.
          </div>
          <div style={{ color: "var(--fg-dim)", marginTop: 8, fontSize: 12 }}>
            Built by <a href="https://github.com/tayyabataimur" style={{ color: "var(--fg-muted)" }}>@tayyabataimur</a>.
            Audit engine runs on <a href="https://playwright.dev" style={{ color: "var(--fg-muted)" }}>Playwright</a> +{" "}
            <a href="https://github.com/dequelabs/axe-core" style={{ color: "var(--fg-muted)" }}>axe-core</a>.
          </div>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how">How to use</a>
            <a href="#report">Sample report</a>
            <a href="#audit">Audit a URL</a>
          </div>
          <div>
            <h4>Install</h4>
            <a href={NPM} target="_blank" rel="noreferrer">npm</a>
            <a href={SKILL} target="_blank" rel="noreferrer">Agent Skill</a>
            <a href={`${GITHUB}#5-github-action`} target="_blank" rel="noreferrer">GitHub Action</a>
            <a href={`${GITHUB}/blob/main/deploy/openapi.yaml`} target="_blank" rel="noreferrer">OpenAPI</a>
          </div>
          <div>
            <h4>Open source</h4>
            <a href={GITHUB} target="_blank" rel="noreferrer">GitHub</a>
            <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer">Issues</a>
            <a href={`${GITHUB}/blob/main/CHANGELOG.md`} target="_blank" rel="noreferrer">Changelog</a>
            <a href={`${GITHUB}/blob/main/LICENSE`} target="_blank" rel="noreferrer">MIT License</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
