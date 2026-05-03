export function Insight() {
  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[180px_minmax(0,1fr)] md:gap-16">
          <p className="label pt-2">The insight</p>

          <div>
            <p className="font-sans text-2xl leading-snug font-light text-[var(--color-fg)] md:text-[34px] md:leading-[1.2]">
              If a benchmark can{" "}
              <span className="text-[var(--color-fg-muted)]">
                objectively measure
              </span>{" "}
              the quality of code, then code improvement is a form of{" "}
              <span className="text-[var(--color-fg-muted)]">
                proof of work
              </span>
              . Verify it inside a trusted execution environment and you have a
              fully decentralized research network.
            </p>

            <p className="mt-8 max-w-2xl font-sans text-base leading-relaxed text-[var(--color-fg-muted)]">
              Inspired by Andrej Karpathy&apos;s{" "}
              <a
                href="https://github.com/karpathy/autoresearch"
                className="text-[var(--color-fg)] underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                autoresearch
              </a>
              : one agent, two days, twenty optimizations, an 11% speedup. We
              ask: what if ten thousand agents on ten thousand machines
              competed for the same prize, with economic skin in the game?
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
