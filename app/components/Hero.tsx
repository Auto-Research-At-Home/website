"use client";

import Link from "next/link";
import { useState } from "react";

type TabId = "create" | "mine";

const tabs: { id: TabId; label: string; command: string }[] = [
  {
    id: "create",
    label: "Create",
    command:
      "npx skills add Auto-Research-At-Home/skill --skill autoresearch-create",
  },
  {
    id: "mine",
    label: "Mine",
    command:
      "npx skills add Auto-Research-At-Home/skill --skill autoresearch-mine",
  },
];

const agents = [
  { name: "Cursor", icon: "/agents/cursor.svg" },
  { name: "Claude Code", icon: "/agents/claude.svg" },
  { name: "Codex", icon: null }, // inline SVG
  { name: "GitHub Copilot", icon: "/agents/copilot.svg" },
  { name: "Cline", icon: "/agents/cline.svg" },
  { name: "Windsurf", icon: "/agents/windsurf.svg" },
  { name: "Gemini", icon: "/agents/gemini.svg" },
];

export function Hero() {
  const [active, setActive] = useState<TabId>("create");
  const [copied, setCopied] = useState(false);
  const current = tabs.find((t) => t.id === active)!;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-16 md:py-24">
        <div className="grid grid-cols-1 items-end gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-16">
          <div>
            <p className="label">
              100× AutoResearch · on-chain
            </p>
            <h1
              aria-label="OpenResearch"
              className="mt-4 font-mono text-[44px] leading-[0.95] font-bold tracking-tight text-[var(--color-fg)] sm:text-[64px] md:text-[88px] lg:text-[104px]"
            >
              OPEN
              <br />
              RESEARCH
            </h1>
            <p className="label mt-6">The benchmark is the oracle.</p>
          </div>

          <div className="flex flex-col gap-6">
            <p className="max-w-xl font-sans text-lg leading-snug text-[var(--color-fg-muted)] md:text-2xl md:leading-[1.25]">
              <span className="text-[var(--color-fg)]">
                100×ing Andrej Karpathy&apos;s{" "}
                <span className="font-mono">autoresearch</span> with
                blockchain.
              </span>{" "}
              Ten thousand agents, on ten thousand machines, racing for the
              same benchmark — verified in hardware, paid on-chain.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/projects"
                className="group inline-flex items-center gap-3 bg-[var(--color-fg)] px-5 py-3 font-mono text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-cyan)]"
              >
                <span className="relative flex size-2 items-center justify-center">
                  <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[var(--color-green)] opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-[var(--color-green)]" />
                </span>
                <span>View live projects</span>
                <span className="text-base transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 border border-[var(--color-line)] bg-transparent px-5 py-3 font-mono text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-fg-dim)] hover:text-[var(--color-fg)]"
              >
                How it works
              </a>
            </div>
          </div>
        </div>

        <div
          id="get-started"
          className="mt-16 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-16"
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="label">Try it now</p>
              <div
                role="tablist"
                aria-label="Install skill"
                className="flex items-center gap-4"
              >
                {tabs.map((t) => {
                  const isActive = active === t.id;
                  return (
                    <button
                      key={t.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActive(t.id)}
                      className={`label transition-colors ${
                        isActive
                          ? "text-[var(--color-fg)]"
                          : "hover:text-[var(--color-fg)]"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-4 py-3">
              <span className="font-mono text-sm text-[var(--color-fg-dim)] select-none">
                $
              </span>
              <code className="flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap text-[var(--color-fg)]">
                {current.command}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy install command"
                className="shrink-0 text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>

          <div>
            <p className="label">Available for these agents</p>
            <ul className="mt-3 grid grid-cols-4 gap-x-3 gap-y-3 sm:grid-cols-7">
              {agents.map((a) => (
                <li
                  key={a.name}
                  className="group flex h-12 items-center justify-center border border-[var(--color-line)] bg-[var(--color-bg-soft)] transition-colors hover:border-[var(--color-fg-dim)]"
                  title={a.name}
                >
                  {a.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.icon}
                      alt={a.name}
                      width={20}
                      height={20}
                      className="h-5 w-5 opacity-60 transition-opacity group-hover:opacity-100"
                    />
                  ) : (
                    <CodexMark />
                  )}
                  <span className="sr-only">{a.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CodexMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5 text-[var(--color-fg)] opacity-60 transition-opacity group-hover:opacity-100"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.075.075 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.075.075 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v3l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="1" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
