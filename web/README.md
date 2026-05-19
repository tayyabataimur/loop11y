# Loop11y — Web Demo

Public site. Paste a URL → accessibility report. Runs entirely on Vercel — no external API.

## Deploy to Vercel

1. Vercel → New Project → import `tayyabataimur/loop11y`.
2. **Root Directory:** `web`.
3. Deploy. Main = production; PRs = preview URLs.

`/api/audit` runs Playwright + Chromium inside the Vercel Function via `@sparticuz/chromium`. Function is configured for 1769 MB memory / 60s max duration in `vercel.json`. No env vars required.

## Local dev

```sh
cd web
npm install
npm run dev
```

Locally, `playwright-core` uses the system Chromium that `@sparticuz/chromium` ships only when running on Vercel/Lambda; otherwise it uses a locally installed Chromium. Easiest way to get one:

```sh
npx playwright install chromium
```

## Architecture note

The web app does NOT depend on the root `loop11y` package or the Fly-hosted API. CLI (`npx loop11y`) and MCP servers use the root project's full Playwright install; the web demo uses the slim Lambda-compatible build.
