import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/#how", label: "Protocol" },
  { href: "/#architecture", label: "Docs" },
  { href: "https://github.com/Auto-Research-At-Home", label: "Github" },
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

        <nav className="flex items-center gap-7">
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
      </div>
    </header>
  );
}
