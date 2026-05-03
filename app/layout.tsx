import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://openresearch.xyz"),
  title: {
    default: "OpenResearch — The benchmark is the oracle",
    template: "%s · OpenResearch",
  },
  description:
    "A decentralized, agent-driven research protocol. Code improvement is proof of work — measured by deterministic benchmarks, attested in hardware, rewarded on-chain.",
  keywords: [
    "OpenResearch",
    "AutoResearch",
    "decentralized science",
    "DeSci",
    "benchmarks",
    "TEE",
    "0G",
    "agent skills",
  ],
  openGraph: {
    title: "OpenResearch — The benchmark is the oracle",
    description:
      "Decentralized, agent-driven scientific research powered by competitive benchmarking and cryptographic attestation.",
    type: "website",
    url: "/",
    images: ["/logos/icon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenResearch",
    description:
      "Code improvement as proof of work. Benchmarks as the oracle.",
    images: ["/logos/icon.png"],
  },
  icons: {
    icon: "/logos/icon.png",
    apple: "/logos/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
