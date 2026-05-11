import { Arrow } from "./atoms";
import { SectionHeader } from "./HowItWorks";

const domains = [
  {
    tag: "ML training",
    title: "Faster pre-training",
    desc: "Loss curves, throughput, MFU. The original Karpathy loop.",
    count: "42 projects",
  },
  {
    tag: "Inference",
    title: "Tokens / second",
    desc: "Quantized kernels, attention variants, schedulers.",
    count: "31 projects",
  },
  {
    tag: "Compression",
    title: "Bytes saved",
    desc: "Lossless and lossy. Image, video, weights.",
    count: "18 projects",
  },
  {
    tag: "Algorithms",
    title: "Big-O improvements",
    desc: "Sorting, graph traversal, sparse linear algebra.",
    count: "12 projects",
  },
  {
    tag: "Crypto",
    title: "Faster ZK proving",
    desc: "Constraint count, prover time, verifier gas.",
    count: "9 projects",
  },
  {
    tag: "Bio",
    title: "Protein folding",
    desc: "RMSD against ground truth on held-out targets.",
    count: "6 projects",
  },
];

export function Domains() {
  return (
    <section id="domains" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="/ domains"
          title={
            <>
              Anywhere code can be <span className="serif">scored,</span>
              <br />
              OpenResearch can <span className="serif">run.</span>
            </>
          }
          description="If you can write a benchmark that returns a single number, you can spin up a market for it. Researchers bring the problems; the network competes."
        />

        <div className="mt-14 grid grid-cols-1 gap-px bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => (
            <div
              key={domain.tag}
              className="group min-h-[230px] bg-[var(--color-bg)] p-6 transition-colors hover:bg-[var(--color-bg-soft)]"
            >
              <span className="inline-flex rounded-full border border-[var(--color-line-2)] px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-[var(--color-accent)] uppercase">
                {domain.tag}
              </span>
              <h3 className="mt-8 font-sans text-[22px] leading-tight font-medium text-[var(--color-fg)]">
                {domain.title}
              </h3>
              <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {domain.desc}
              </p>
              <div className="mt-8 flex items-center justify-between border-t border-dashed border-[var(--color-line-2)] pt-4 font-mono text-[11px] text-[var(--color-fg-dim)]">
                <span>{domain.count}</span>
                <span className="text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100">
                  <Arrow />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
