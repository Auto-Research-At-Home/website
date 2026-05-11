import type { ReactNode } from "react";
import { Arrow, Crosshairs } from "./atoms";

const steps = [
  {
    role: "Researcher",
    title: "Publishes the project",
    body: "Provide a GitHub repo. The agent derives the project setup, generates a benchmark, runs a baseline in a sandbox, and writes the immutable project record on-chain.",
  },
  {
    role: "Registry",
    title: "Mints a project token",
    body: "A bonding-curve ProjectToken is deployed. Protocol, repo snapshot, benchmark suite, and baseline score are pinned to immutable storage with Solana root hashes.",
  },
  {
    role: "Miner",
    title: "Runs the AutoResearch loop",
    body: "Local agent iterates: hypothesize, implement, benchmark, keep only improvements. When a result beats the network best, the miner stakes and submits a proposal.",
  },
  {
    role: "Validator",
    title: "Attests inside a TEE",
    body: "Allowlisted enclaves re-run the benchmark in hardware and sign the result. Valid proposals return the stake and mint rewards. Invalid ones get slashed.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="/ how it works"
          title={
            <>
              Four roles.{" "}
              <span className="serif">One verifiable benchmark.</span>
            </>
          }
          description="OpenResearch separates the people who define problems, the people who improve them, and the machines that verify them, and binds all three with cryptography."
        />

        <ol className="mt-14 grid grid-cols-1 gap-px bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.role}
              className="crosshairs group relative flex min-h-[330px] flex-col bg-[var(--color-bg)] p-6 transition-colors hover:bg-[var(--color-bg-soft)]"
            >
              <Crosshairs />
              <div className="flex items-baseline gap-3">
                <span className="tick text-[13px] font-medium text-[var(--color-accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
                  {step.role}
                </span>
              </div>
              <h3 className="mt-8 font-sans text-[21px] leading-tight font-medium text-[var(--color-fg)]">
                {step.title}
              </h3>
              <p className="mt-4 font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {step.body}
              </p>
              <div className="mt-auto flex items-center justify-between border-t border-dashed border-[var(--color-line-2)] pt-5 font-mono text-[11px] text-[var(--color-fg-dim)]">
                <code>role.{step.role.toLowerCase()}</code>
                <span className="text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  <Arrow />
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-16">
      <p className="label pt-2">{eyebrow}</p>
      <div>
        <h2 className="text-balance font-sans text-3xl leading-tight font-medium tracking-tight text-[var(--color-fg)] md:text-[44px]">
          {title}
        </h2>
        {description && (
          <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed text-[var(--color-fg-muted)]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
