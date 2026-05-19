import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({
  weight: ["400"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = "https://loop11y.tayyaba.dev";

export const metadata: Metadata = {
  title: "Loop11y — Accessibility, in one paste",
  description:
    "Paste a URL. Get a visible-first WCAG 2.2 audit with ranked issues and patch-ready fixes. Open-source CLI, MCP server, Agent Skill, and GitHub Action.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  applicationName: "Loop11y",
  authors: [{ name: "Tayyaba Taimur", url: "https://tayyaba.dev" }],
  keywords: [
    "accessibility", "a11y", "WCAG 2.2", "axe-core", "EN 301 549",
    "Section 508", "European Accessibility Act", "MCP", "Claude Code",
    "Cursor", "GitHub Action", "accessibility audit",
  ],
  openGraph: {
    title: "Loop11y — accessibility, in one paste",
    description: "Visible-first WCAG audits with patch-ready fixes.",
    url: SITE_URL,
    siteName: "Loop11y",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loop11y — accessibility, in one paste",
    description: "Visible-first WCAG audits with patch-ready fixes.",
  },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
