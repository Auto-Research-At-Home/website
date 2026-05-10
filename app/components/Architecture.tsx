import { OPEN_RESEARCH_PROGRAM_ID } from "@/lib/openResearch/client";
import { explorerAddressUrl, shortAddress } from "@/lib/openResearch/format";
import { pdas } from "@/lib/openResearch/pdas";
import { SectionHeader } from "./HowItWorks";

const layers = [
  {
    n: "L1",
    name: "Agent Skills",
    detail:
      "Portable skills installed into any host coding agent — Claude Code, Cursor, Codex.",
  },
  {
    n: "L2",
    name: "Protocol Generator",
    detail:
      "Reads a real GitHub repo, derives a protocol, proposes a benchmark contract.",
  },
  {
    n: "L3",
    name: "Sandbox Runner",
    detail:
      "Runs the repo + benchmark in Docker / Firecracker for a reproducible baseline.",
  },
  {
    n: "L4",
    name: "Project Token",
    detail:
      "Bonding-curve ProjectToken per project. Buyers signal demand, miners earn supply.",
  },
  {
    n: "L5",
    name: "Protocol Registry",
    detail:
      "Solana program accounts for projects, current best scores, Irys retrieval IDs, and artifact hashes.",
  },
  {
    n: "L6",
    name: "AutoResearch Loop",
    detail:
      "Local agent loop iterating on code; only commits that beat the current best survive.",
  },
  {
    n: "L7",
    name: "Proposal Submission",
    detail:
      "Stake + code hash + benchmark proof packaged into a single transaction.",
  },
  {
    n: "L8",
    name: "TEE Validators",
    detail:
      "Allowlisted enclaves rerun benchmarks and sign attestations on-chain.",
  },
];

export function Architecture() {
  return (
    <section
      id="architecture"
      className="border-b border-[var(--color-line)]"
    >
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="Architecture"
          title="Eight layers, one verifiable pipeline."
          description="Every step is observable. Every artifact is content-addressable. The benchmark is the only opinion that matters."
        />

        <div className="mt-14 border-t border-[var(--color-line)]">
          {layers.map((l) => (
            <div
              key={l.n}
              className="grid grid-cols-[60px_1fr] items-baseline gap-6 border-b border-[var(--color-line)] py-5 transition-colors hover:bg-[var(--color-bg-soft)] md:grid-cols-[80px_220px_1fr] md:gap-10 md:px-2"
            >
              <span className="label">{l.n}</span>
              <h3 className="font-sans text-base font-medium text-[var(--color-fg)] md:text-lg">
                {l.name}
              </h3>
              <p className="col-span-2 font-sans text-sm leading-relaxed text-[var(--color-fg-muted)] md:col-span-1">
                {l.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid grid-cols-1 border-t border-[var(--color-line)] sm:grid-cols-3">
          <DeployRow label="Cluster" value="Solana devnet" />
          <DeployRow
            label="Program"
            value={shortAddress(OPEN_RESEARCH_PROGRAM_ID.toBase58())}
            href={explorerAddressUrl(OPEN_RESEARCH_PROGRAM_ID)}
            title={OPEN_RESEARCH_PROGRAM_ID.toBase58()}
            mono
          />
          <DeployRow
            label="Config PDA"
            value={shortAddress(pdas.config().toBase58())}
            href={explorerAddressUrl(pdas.config())}
            title={pdas.config().toBase58()}
            mono
          />
        </div>
      </div>
    </section>
  );
}

function DeployRow({
  label,
  value,
  mono,
  href,
  title,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
  title?: string;
}) {
  const valueClass = `mt-2 text-[var(--color-fg)] ${
    mono ? "font-mono text-sm" : "font-sans text-base"
  }`;

  return (
    <div className="border-b border-[var(--color-line)] p-6 sm:[&:not(:last-child)]:border-r">
      <p className="label">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          title={title ?? `View ${value} on Solana Explorer`}
          className={`${valueClass} block underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline`}
        >
          {value}
        </a>
      ) : (
        <p className={valueClass}>{value}</p>
      )}
    </div>
  );
}
