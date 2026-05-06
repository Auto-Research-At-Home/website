import Image from "next/image";

export function Footer() {
  return (
    <footer>
      <div className="container-page flex flex-col gap-10 py-14 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logos/icon.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <p className="font-mono text-base text-[var(--color-fg)]">
              OpenResearch
            </p>
          </div>
          <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
            Decentralized, agent-driven research. Code improvement is the work.
            The benchmark is the oracle.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <FooterCol
            title="Protocol"
            links={[
              { href: "#how", label: "How it works" },
              { href: "#architecture", label: "Architecture" },
              { href: "#token", label: "Token flow" },
            ]}
          />
          <FooterCol
            title="Build"
            links={[
              { href: "#get-started", label: "Skills" },
              {
                href: "https://github.com/OpenResearchh",
                label: "GitHub",
              },
              { href: "https://x.com/OpenResearchh", label: "Twitter" },
              { href: "#domains", label: "Domains" },
            ]}
          />
          <FooterCol
            title="Network"
            links={[
              { href: "https://0g.ai", label: "0G Galileo" },
              { href: "#architecture", label: "Validators" },
              { href: "#", label: "Status" },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-[var(--color-line)]">
        <div className="container-page flex flex-col gap-3 py-6 font-mono text-xs text-[var(--color-fg-dim)] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} OpenResearch · Jupiter Innovations Lab Inc.</p>
          <p>The benchmark is the oracle.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="label">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="font-sans text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
              {...(l.href.startsWith("http")
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
