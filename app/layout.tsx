import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookieToInitialState } from "wagmi";
import { wagmiConfig } from "@/lib/arah/wagmi";
import { Web3Provider } from "./web3-provider";
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
  preload: false,
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookie = (await headers()).get("cookie") ?? undefined;
  const initialState = cookieToInitialState(wagmiConfig, cookie);

  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased">
        <Web3Provider initialState={initialState}>{children}</Web3Provider>
      </body>
    </html>
  );
}
