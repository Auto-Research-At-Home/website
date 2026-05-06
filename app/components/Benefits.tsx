import { SectionHeader } from "./HowItWorks";

const benefits = [
  {
    n: "01",
    title: "Objective scoring",
    body: "The benchmark is the only opinion. Improvements are measured, not debated.",
  },
  {
    n: "02",
    title: "Reproducible runs",
    body: "Baselines and proposals execute in bounded environments for deterministic comparisons.",
  },
  {
    n: "03",
    title: "Skin in the game",
    body: "Stake to submit. Get rewarded when TEEs verify. Get slashed when they don’t.",
  },
  {
    n: "04",
    title: "Composable agents",
    body: "Install skills into the coding agent you already use. Swap hosts without rewrites.",
  },
  {
    n: "05",
    title: "Open artifacts",
    body: "Protocols and benchmarks are content-addressed and pinned to decentralized storage.",
  },
];

export function Benefits() {
  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="Benefits"
          title="Clear incentives. Clear verification. Clear results."
          description="Everything is designed for fast iteration, unambiguous scoring, and credible verification — so the network can ratchet forward."
        />

        <div className="mt-14 grid grid-cols-1 border-t border-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => {
            const rightCol = (i + 1) % 3 === 0;
            const isLastRow = i >= benefits.length - (benefits.length % 3 || 3);
            return (
              <div
                key={b.n}
                className={`flex flex-col gap-3 border-b border-[var(--color-line)] p-6 transition-colors hover:bg-[var(--color-bg-soft)] sm:[&:nth-child(odd)]:border-r ${
                  rightCol ? "lg:border-r-0" : "lg:border-r"
                } ${isLastRow ? "lg:border-b-0" : ""}`}
              >
                <p className="label">{b.n}</p>
                <h3 className="font-sans text-lg font-medium text-[var(--color-fg)]">
                  {b.title}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                  {b.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

