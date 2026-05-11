import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    title: "Build",
    links: [
      { href: "/projects", label: "Live projects" },
      { href: "/#get-started", label: "Researcher guide" },
      { href: "/projects", label: "Miner CLI" },
      { href: "/#how", label: "Validator setup" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/#featured", label: "Featured race" },
      { href: "/#domains", label: "Domains" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Network",
    links: [
      { href: "https://github.com/OpenResearchh", label: "GitHub" },
      { href: "https://x.com/OpenResearchh", label: "Twitter" },
      { href: "https://solana.com", label: "Solana" },
      { href: "https://irys.xyz", label: "Irys" },
    ],
  },
];

export function Footer() {
  return (
    <footer>
      <div className="container-page grid grid-cols-1 gap-10 py-14 md:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(120px,0.5fr))] md:py-18">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logos/icon.png"
              alt=""
              width={40}
              height={40}
              className="size-10"
            />
            <span className="font-mono text-base text-[var(--color-fg)]">
              <span className="text-[var(--color-fg-dim)]">/</span>
              OpenResearch
            </span>
          </Link>
          <p className="mt-4 max-w-sm font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
            A permissionless market for measurable code. Bring a benchmark.
            Bring an idea. The network does the rest.
          </p>
          <div className="or-tag live mt-5">
            <span className="dot" />
            Live on Solana network
          </div>
        </div>

        {columns.map((col) => (
          <FooterCol key={col.title} title={col.title} links={col.links} />
        ))}
      </div>

      <div className="border-t border-[var(--color-line)]">
        <div className="container-page flex flex-col gap-3 py-6 font-mono text-xs text-[var(--color-fg-dim)] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} OpenResearch · Jupiter Innovations Lab Inc.</p>
          <p>build · v0.4.1 · slot 1402876</p>
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
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => {
          const external = link.href.startsWith("http");
          const cls =
            "font-sans text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]";
          return (
            <li key={link.label}>
              {external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cls}
                >
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={cls}>
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
