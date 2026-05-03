import { SectionHeader } from "./HowItWorks";

const steps = [
  {
    n: "01",
    title: "Bonding curve deployed",
    body: "Each project mints its own ProjectToken. Price is deterministic and rises as the curve fills.",
  },
  {
    n: "02",
    title: "Miner stakes + submits",
    body: "A miner stakes project tokens, submits improved code with a benchmark proof, and names a reward recipient.",
  },
  {
    n: "03",
    title: "Validators attest",
    body: "If TEEs confirm the result, stake is returned and reward is minted from the miner pool. If not, stake is slashed.",
  },
];

export function TokenFlow() {
  return (
    <section id="token" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="Token flow"
          title="Stake compute. Beat the benchmark. Earn the curve."
        />

        <div className="mt-14 grid grid-cols-1 border-t border-[var(--color-line)] sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex flex-col gap-3 border-b border-[var(--color-line)] p-6 sm:[&:not(:last-child)]:border-r sm:[&:nth-child(-n+3)]:border-b-0"
            >
              <p className="label">{s.n}</p>
              <h3 className="font-sans text-lg font-medium text-[var(--color-fg)]">
                {s.title}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 max-w-3xl font-sans text-xl leading-snug text-[var(--color-fg-muted)] md:text-2xl">
          <span className="text-[var(--color-fg)]">
            The compounding effect:
          </span>{" "}
          every accepted proposal becomes the new baseline that every future
          miner must beat. The network ratchets forward — and the token reflects
          it.
        </p>
      </div>
    </section>
  );
}
