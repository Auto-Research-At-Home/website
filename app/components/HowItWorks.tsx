const steps = [
  {
    role: "Researcher",
    title: "Publishes the protocol",
    body: "Provide a GitHub repository. The agent derives a research protocol, generates a benchmark, runs a baseline in a sandbox, and writes the immutable contract on-chain.",
  },
  {
    role: "Registry",
    title: "Mints a project token",
    body: "A bonding-curve SPL token is initialized. Protocol, repo snapshot, benchmark suite, and baseline score are uploaded to Irys with on-chain retrieval IDs and SHA-256 hashes.",
  },
  {
    role: "Miner",
    title: "Runs the AutoResearch loop",
    body: "Local agent iterates: hypothesize, implement, benchmark, keep only improvements. When a result beats the network best, the miner stakes and submits a proposal.",
  },
  {
    role: "Validator",
    title: "Attests inside a TEE",
    body: "Allowlisted enclaves re-run the benchmark in hardware and sign the result. Valid proposals return the stake and mint rewards. Invalid proposals get slashed.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="How it works"
          title="Four roles. One verifiable benchmark."
          description="OpenResearch separates the people who define problems, the people who improve them, and the machines that verify them — and binds all three with cryptography."
        />

        <ol className="mt-14 grid grid-cols-1 border-t border-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.role}
              className={`group relative flex flex-col gap-3 border-b border-[var(--color-line)] p-6 transition-colors hover:bg-[var(--color-bg-soft)] sm:border-b-0 sm:[&:nth-child(-n+2)]:border-b sm:[&:nth-child(odd)]:border-r lg:border-r lg:[&:last-child]:border-r-0 lg:[&:nth-child(-n+4)]:border-b-0`}
            >
              <p className="label">
                {`0${i + 1} · ${s.role}`}
              </p>
              <h3 className="font-sans text-lg leading-tight font-medium text-[var(--color-fg)]">
                {s.title}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-16">
      <p className="label pt-2">{eyebrow}</p>
      <div>
        <h2 className="font-sans text-3xl leading-tight font-medium tracking-tight text-[var(--color-fg)] md:text-[40px]">
          {title}
        </h2>
        {description && (
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-[var(--color-fg-muted)]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
