import type { ReactNode, SVGProps } from "react";
import { Arrow, Crosshairs } from "./atoms";

type RoleAccent = {
  text: string;
  border: string;
  bg: string;
  glow: string;
};

const accents: Record<string, RoleAccent> = {
  researcher: {
    text: "var(--color-cyan)",
    border: "rgb(96 165 250 / 0.45)",
    bg: "rgb(96 165 250 / 0.08)",
    glow: "rgb(96 165 250 / 0.22)",
  },
  registry: {
    text: "var(--color-amber)",
    border: "rgb(245 191 80 / 0.45)",
    bg: "rgb(245 191 80 / 0.08)",
    glow: "rgb(245 191 80 / 0.22)",
  },
  miner: {
    text: "var(--color-accent)",
    border: "rgb(74 222 188 / 0.45)",
    bg: "rgb(74 222 188 / 0.08)",
    glow: "rgb(74 222 188 / 0.22)",
  },
  validator: {
    text: "var(--color-rose)",
    border: "rgb(248 113 113 / 0.45)",
    bg: "rgb(248 113 113 / 0.08)",
    glow: "rgb(248 113 113 / 0.22)",
  },
};

const steps: {
  role: keyof typeof accents;
  title: string;
  body: string;
  io: { in: string; out: string };
  Icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
}[] = [
  {
    role: "researcher",
    title: "Publishes the project",
    body: "Provide a GitHub repo. The agent derives the project setup, generates a benchmark, runs a baseline in a sandbox, and writes the immutable project record on-chain.",
    io: { in: "github repo", out: "on-chain project" },
    Icon: ResearcherIcon,
  },
  {
    role: "registry",
    title: "Mints a project token",
    body: "A bonding-curve ProjectToken is deployed. Protocol, repo snapshot, benchmark suite, and baseline score are pinned to immutable storage with Solana root hashes.",
    io: { in: "project record", out: "bonding curve" },
    Icon: RegistryIcon,
  },
  {
    role: "miner",
    title: "Runs the AutoResearch loop",
    body: "Local agent iterates: hypothesize, implement, benchmark, keep only improvements. When a result beats the network best, the miner stakes and submits a proposal.",
    io: { in: "hypothesis", out: "new best" },
    Icon: MinerIcon,
  },
  {
    role: "validator",
    title: "Attests inside a TEE",
    body: "Allowlisted enclaves re-run the benchmark in hardware and sign the result. Valid proposals return the stake and mint rewards. Invalid ones get slashed.",
    io: { in: "proposal", out: "signed attestation" },
    Icon: ValidatorIcon,
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

        <div className="relative mt-16">
          <FlowSpine />
          <ol className="role-grid relative grid grid-cols-1 gap-px bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const accent = accents[step.role];
              return (
                <li
                  key={step.role}
                  className="role-card crosshairs group relative flex min-h-[360px] flex-col overflow-hidden bg-[var(--color-bg)] p-6 transition-colors hover:bg-[var(--color-bg-soft)]"
                  style={
                    {
                      "--accent": accent.text,
                      "--accent-border": accent.border,
                      "--accent-bg": accent.bg,
                      "--accent-glow": accent.glow,
                      "--card-delay": `${i * 90}ms`,
                    } as React.CSSProperties
                  }
                >
                  <Crosshairs />
                  <span className="role-card-accent" aria-hidden="true" />
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <span className="tick text-[13px] font-medium" style={{ color: accent.text }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--color-fg-dim)] uppercase">
                        {step.role}
                      </span>
                    </div>
                    <span
                      className="role-icon grid size-9 place-items-center rounded-full border"
                      style={{
                        borderColor: accent.border,
                        background: accent.bg,
                        color: accent.text,
                      }}
                    >
                      <step.Icon className="size-4" />
                    </span>
                  </div>

                  <h3 className="mt-7 font-sans text-[21px] leading-tight font-medium text-[var(--color-fg)]">
                    {step.title}
                  </h3>
                  <p className="mt-4 font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                    {step.body}
                  </p>

                  <div className="role-io mt-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.08em] text-[var(--color-fg-dim)] uppercase">
                    <span className="rounded-sm border border-[var(--color-line-2)] bg-[rgb(255_255_255_/_0.02)] px-2 py-1">
                      {step.io.in}
                    </span>
                    <span className="role-io-arrow" aria-hidden="true">
                      <svg width="22" height="8" viewBox="0 0 22 8" fill="none">
                        <path
                          d="M1 4 H19 M14 1 L19 4 L14 7"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span
                      className="rounded-sm border px-2 py-1"
                      style={{
                        borderColor: accent.border,
                        background: accent.bg,
                        color: accent.text,
                      }}
                    >
                      {step.io.out}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-dashed border-[var(--color-line-2)] pt-5 font-mono text-[11px] text-[var(--color-fg-dim)]">
                    <code>role.{step.role}</code>
                    <span
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: accent.text }}
                    >
                      <Arrow />
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function FlowSpine() {
  return (
    <div
      className="pointer-events-none absolute top-[68px] left-0 hidden h-px w-full lg:block"
      aria-hidden="true"
    >
      <div className="relative h-px w-full overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgb(74_222_188_/_0.18)_15%,rgb(74_222_188_/_0.18)_85%,transparent_100%)]" />
        <span className="flow-spine-dot" />
      </div>
    </div>
  );
}

function ResearcherIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function RegistryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
      <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
  );
}

function MinerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ValidatorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
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
