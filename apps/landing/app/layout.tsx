import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Provenance — A vetted shelf of working AI agents",
  description:
    "Demo, vet, and buy pre-built AI agents in under ten minutes. Every agent ships with a provenance record: who trained it, what it shipped, what it costs to run.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://agent-that-sells-agents.prin7r.com",
  ),
  openGraph: {
    type: "website",
    title: "Provenance — A vetted shelf of working AI agents",
    description:
      "Each agent ships with a provenance record. Demo, vet, buy in ten minutes.",
    url: "/",
    siteName: "Provenance",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
