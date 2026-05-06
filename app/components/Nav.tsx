import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/#how", label: "Protocol" },
  { href: "/#architecture", label: "Docs" },
  { href: "https://github.com/OpenResearchh", label: "Github" },
];

export function Nav() {
  return (
    <header className="border-b border-[var(--color-line)]">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-mono text-[14px] tracking-tight"
        >
          <Image
            src="/logos/icon.jpeg"
            alt="OpenResearch"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full ring-1 ring-[var(--color-brand-line)]"
            priority
          />
          <span className="text-[var(--color-fg-muted)]">/</span>
          <span className="text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-brand-bright)]">
            OpenResearch
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-7 sm:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                {...(link.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer noopener" }
                  : {})}
                className="font-mono text-[13px] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-brand-bright)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link
            href="/projects"
            className="inline-flex items-center gap-2 border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-4 py-2 font-mono text-[12.5px] text-[var(--color-fg)] transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand-bright)]"
          >
            Start mining <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
