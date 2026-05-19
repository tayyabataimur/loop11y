import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://loop11y.tayyaba.dev";

export const metadata: Metadata = {
  title: "Loop11y — Accessibility audits, remediation, and CI gates for any web product",
  description:
    "Paste a URL. Get a visible-first WCAG 2.2 audit with score, ranked issues, and patch-ready fixes. Open-source CLI, MCP server, Agent Skill, and GitHub Action.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  applicationName: "Loop11y",
  authors: [{ name: "Tayyaba Taimur", url: "https://github.com/tayyabataimur" }],
  keywords: [
    "accessibility",
    "a11y",
    "WCAG 2.2",
    "axe-core",
    "screen reader",
    "EN 301 549",
    "Section 508",
    "European Accessibility Act",
    "MCP",
    "Claude Code",
    "Cursor",
    "GitHub Action",
    "accessibility audit",
    "accessibility remediation",
  ],
  openGraph: {
    title: "Loop11y — accessibility, in one paste",
    description:
      "Visible-first WCAG audits with patch-ready fixes. CLI, MCP, Agent Skill, GitHub Action — all open source.",
    url: SITE_URL,
    siteName: "Loop11y",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loop11y — accessibility, in one paste",
    description: "Visible-first WCAG audits with patch-ready fixes.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
