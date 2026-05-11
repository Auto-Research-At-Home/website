import Link from "next/link";
import { Arrow, Crosshairs } from "./atoms";
import { CopyTextButton } from "./CopyTextButton";

const cards = [
  {
    label: "/ for researchers",
    title: (
      <>
        Publish a project.
        <br />
        Mint a market.
      </>
    ),
    body: "You define the problem. The project setup does the rest: sandboxed baseline, on-chain registry, bonding-curve token. Fund the work that improves it.",
    command: "npx skills add OpenResearchh/skill --skill autoresearch-create",
    cta: "Publish a project",
    href: "/#get-started",
  },
  {
    label: "/ for miners",
    title: (
      <>
        Beat the benchmark.
        <br />
        Earn the reward.
      </>
    ),
    body: "Run the AutoResearch agent locally. It iterates code, runs the suite, and only submits real improvements. Stake on submissions. Get slashed if you cheat.",
    command: "npx skills add OpenResearchh/skill --skill autoresearch-mine",
    cta: "Get the miner CLI",
    href: "/projects",
  },
];

export function FinalCta() {
  return (
    <section id="start" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <div className="grid grid-cols-1 gap-px bg-[var(--color-line)] lg:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.label}
              className="crosshairs relative bg-[var(--color-bg-soft)] p-6 md:p-10"
            >
              <Crosshairs />
              <p className="label">{card.label}</p>
              <h2 className="mt-5 font-sans text-3xl leading-tight font-medium tracking-tight text-[var(--color-fg)] md:text-[44px]">
                {card.title}
              </h2>
              <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-[var(--color-fg-muted)]">
                {card.body}
              </p>
              <div className="mt-8 flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-line-2)] bg-[rgb(0_0_0_/_0.35)] px-4 py-3">
                <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] text-[var(--color-fg)] md:text-[13px]">
                  <span className="text-[var(--color-fg-dim)]">$ </span>
                  {card.command}
                </code>
                <CopyTextButton
                  text={card.command}
                  label={`Copy ${card.label.replace("/ for ", "")} install command`}
                  variant="icon"
                  className="border-[var(--color-line-2)] bg-transparent"
                />
              </div>
              <Link
                href={card.href}
                className="group mt-8 inline-flex items-center gap-3 rounded-sm bg-[var(--color-fg)] px-5 py-3 font-mono text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
              >
                <span className="size-2 rounded-full bg-[var(--color-accent)] group-hover:bg-[var(--color-bg)]" />
                {card.cta}
                <Arrow />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
