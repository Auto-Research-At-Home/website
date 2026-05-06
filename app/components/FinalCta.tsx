import Link from "next/link";

export function FinalCta() {
  return (
    <section>
      <div className="container-page py-20 md:py-28">
        <div className="border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-8 py-14 md:px-12 md:py-16">
          <p className="label">Get started</p>
          <h2 className="mt-4 max-w-3xl font-sans text-3xl leading-tight font-medium tracking-tight text-[var(--color-fg)] md:text-[40px]">
            Pick a project. Run the loop. Beat the best.
          </h2>
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-[var(--color-fg-muted)]">
            Browse the registry, choose a benchmark, and start mining. When you
            produce a verified improvement, the network rewards you.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/projects"
              className="group inline-flex items-center gap-3 bg-[var(--color-fg)] px-5 py-3 font-mono text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-cyan)]"
            >
              <span>Browse projects</span>
              <span className="text-base transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <a
              href="/#get-started"
              className="inline-flex items-center gap-2 border border-[var(--color-line)] bg-transparent px-5 py-3 font-mono text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-bright)]"
            >
              Install mining skill
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

