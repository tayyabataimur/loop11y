# Loop11y — Web Demo

Public site. Paste a URL → accessibility report.

## Deploy to Vercel

1. Vercel → New Project → import `tayyabataimur/loop11y`.
2. **Root Directory:** `web`.
3. **Env var:** `A11Y_API_URL=https://a11y-api.fly.dev` (Production + Preview).
4. Deploy. Main branch = production; PRs = preview URLs.

## Local dev

```sh
cd web
npm install
cp .env.example .env.local
npm run dev
```
