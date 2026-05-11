import Image from "next/image";

export function BuiltOn() {
  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-14 md:py-16">
        <div className="grid grid-cols-1 gap-px border border-[var(--color-line)] bg-[var(--color-line)] md:grid-cols-2">
          <a
            href="https://github.com/karpathy/autoresearch"
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-center gap-5 bg-[var(--color-bg-soft)] p-6 transition-colors hover:bg-[var(--color-bg-elev)] md:p-8"
          >
            <Image
              src="/partners/karpathy.png"
              alt="Andrej Karpathy"
              width={64}
              height={64}
              className="h-12 w-12 rounded-full ring-1 ring-[var(--color-line)] md:h-14 md:w-14"
            />
            <div className="min-w-0 flex-1">
              <p className="label">Built on</p>
              <p className="mt-1.5 font-sans text-base leading-snug text-[var(--color-fg)] md:text-lg">
                Karpathy&apos;s{" "}
                <span className="font-mono">autoresearch</span> — 100×&apos;d
                by making global agents compete to beat the benchmark.
              </p>
            </div>
            <span className="hidden text-[var(--color-fg-dim)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--color-fg-muted)] sm:inline">
              ↗
            </span>
          </a>

          <a
            href="https://solana.com"
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-center gap-5 bg-[var(--color-bg-soft)] p-6 transition-colors hover:bg-[var(--color-bg-elev)] md:p-8"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-[var(--color-line)] md:h-14 md:w-14">
              <span className="size-2 rounded-full bg-[var(--color-green)] shadow-[0_0_10px_var(--color-green)]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="label">Live on</p>
              <p className="mt-1.5 flex items-center gap-2 font-sans text-base leading-snug text-[var(--color-fg)] md:text-lg">
                <span>Solana devnet + Irys</span>
              </p>
            </div>
            <span className="hidden font-mono text-xs text-[var(--color-fg-dim)] transition-colors group-hover:text-[var(--color-fg-muted)] sm:inline">
              program
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
