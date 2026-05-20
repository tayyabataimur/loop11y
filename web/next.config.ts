import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core", "axe-core"],
  outputFileTracingIncludes: {
    "/api/audit": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/@sparticuz/chromium/bin/*",
      "./node_modules/axe-core/axe.js",
      "./node_modules/axe-core/axe.min.js",
    ],
    "/api/crawl": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/@sparticuz/chromium/bin/*",
      "./node_modules/axe-core/axe.js",
      "./node_modules/axe-core/axe.min.js",
    ],
  },
};

export default config;
