import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/#how", label: "Protocol" },
  { href: "/#faq", label: "Docs" },
  {
    href: "https://github.com/OpenResearchh",
    label: "GitHub ↗",
    external: true,
  },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[rgba(7,9,12,0.72)] backdrop-blur-[14px]">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-mono text-[14px] font-medium tracking-tight"
        >
          <Image
            src="/logos/icon.jpeg"
            alt="OpenResearch"
            width={30}
            height={30}
            className="h-[30px] w-[30px] rounded-full ring-1 ring-[var(--color-line-2)]"
            priority
          />
          <span className="text-[var(--color-fg-dim)]">/</span>
          <span className="text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent)]">
            OpenResearch
          </span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noreferrer noopener" }
                : {})}
              className="font-mono text-[13px] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-sm border border-[var(--color-line-3)] px-3.5 py-2 font-mono text-[13px] text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:bg-[rgb(74_222_188_/_0.05)]"
        >
          <span className="nav-cta-pulse" aria-hidden="true" />
          View live projects
        </Link>
      </div>
    </header>
  );
}
