import { SectionHeader } from "./HowItWorks";

const domains = [
  {
    name: "ML Efficiency",
    examples: "Attention mechanisms · quantization · kernel fusion",
  },
  {
    name: "Open Source",
    examples: "Numerical routines · parsers · compression codecs",
  },
  {
    name: "Bioinformatics",
    examples: "Sequence alignment · protein folding energy functions",
  },
  {
    name: "Blockchain",
    examples: "ZK proof generation · consensus implementations",
  },
  {
    name: "Compilers",
    examples: "Optimization passes · register allocation · scheduling",
  },
  {
    name: "Your Domain",
    examples: "Anywhere a deterministic benchmark scores code in bounded time.",
  },
];

export function Domains() {
  return (
    <section id="domains" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="Domains"
          title="Anywhere code can be scored, OpenResearch can run."
          description="The protocol is domain-agnostic. The only requirement is a deterministic, reproducible benchmark that runs in bounded time on bounded hardware."
        />

        <div className="mt-14 grid grid-cols-1 border-t border-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d, i) => {
            const isLastRow = i >= domains.length - (domains.length % 3 || 3);
            const rightCol = (i + 1) % 3 === 0;
            return (
              <div
                key={d.name}
                className={`flex flex-col gap-2 border-b border-[var(--color-line)] p-6 transition-colors hover:bg-[var(--color-bg-soft)] sm:[&:nth-child(odd)]:border-r ${
                  rightCol ? "lg:border-r-0" : "lg:border-r"
                } ${isLastRow ? "lg:border-b-0" : ""}`}
              >
                <p className="label">{`0${i + 1}`}</p>
                <h3 className="mt-1 font-sans text-lg font-medium text-[var(--color-fg)]">
                  {d.name}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                  {d.examples}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
