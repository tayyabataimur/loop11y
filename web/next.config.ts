import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  outputFileTracingIncludes: {
    "/api/audit": ["./node_modules/@sparticuz/chromium/**"],
    "/api/crawl": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default config;
