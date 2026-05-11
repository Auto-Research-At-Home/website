import { SectionHeader } from "./HowItWorks";

const stats = [
  {
    label: "karpathy · solo",
    value: "11",
    unit: "%",
    caption: "speedup, 1 agent, 2 days",
  },
  {
    label: "openresearch · network",
    value: "26.4",
    unit: "%",
    caption: "speedup, 3,287 miners, live now",
    accent: true,
  },
  {
    label: "target · 12 mo",
    value: "100",
    unit: "x",
    caption: "research throughput",
  },
];

export function Insight() {
  return (
    <section id="insight" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="/ the insight"
          title={
            <>
              If a benchmark can{" "}
              <span className="serif">objectively measure</span> the quality of
              code, then code improvement is a form of{" "}
              <span className="serif">proof of work.</span>
            </>
          }
          description={
            <>
              OpenResearch is a closed-loop, AI-based discovery tool inspired by
              Andrej Karpathy&apos;s autoresearch experiment: one agent, two
              days, twenty optimizations, an 11% speedup. We ask what happens
              when ten thousand agents race for the same prize with economic
              skin in the game.
            </>
          }
        />

        <div className="mt-14 grid grid-cols-1 items-stretch border border-[var(--color-line)] md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="bg-[var(--color-bg-soft)] p-6 md:p-8"
            >
              <p className="label-muted">{stat.label}</p>
              <p
                className={`tick mt-6 text-[56px] leading-none font-medium tracking-tight md:text-[72px] ${
                  stat.accent
                    ? "text-[var(--color-accent)] drop-shadow-[0_0_26px_rgb(74_222_188_/_0.22)]"
                    : "text-[var(--color-fg)]"
                }`}
              >
                {stat.value}
                <span className="text-[0.48em] text-[var(--color-fg-dim)]">
                  {stat.unit}
                </span>
              </p>
              <p className="mt-3 font-sans text-sm text-[var(--color-fg-muted)]">
                {stat.caption}
              </p>
            </div>
          )).flatMap((node, i) =>
            i === stats.length - 1
              ? [node]
              : [
                  node,
                  <div
                    key={`arrow-${i}`}
                    className="hidden min-w-16 place-items-center border-x border-[var(--color-line)] bg-[var(--color-bg)] font-sans text-2xl text-[var(--color-fg-dim)] md:grid"
                  >
                    {i === 0 ? "→" : "⇢"}
                  </div>,
                ],
          )}
        </div>
      </div>
    </section>
  );
}
