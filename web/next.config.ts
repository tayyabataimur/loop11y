import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  outputFileTracingIncludes: {
    "/api/audit": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/@sparticuz/chromium/bin/*",
    ],
    "/api/crawl": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/@sparticuz/chromium/bin/*",
    ],
  },
};

export default config;
