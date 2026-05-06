import type { Metadata } from "next";
import Image from "next/image";
import { PROJECT_REGISTRY_ADDRESS } from "@/lib/arah/chain";
import { explorerAddressUrl } from "@/lib/arah/format";
import { HIDDEN_PROJECT_IDS } from "@/lib/arah/projectUi";
import { fetchListedProjects, type ListedProject } from "@/lib/arah/registry";
import { AddressLink } from "../components/AddressLink";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { ProjectsDirectory } from "./ProjectsDirectory";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "All OpenResearch projects published on the 0G Galileo on-chain registry, with current best scores, baselines, and project token prices.",
};

export default async function ProjectsPage() {
  let projects: ListedProject[] = [];
  let error: string | null = null;

  try {
    projects = await fetchListedProjects();
    projects = projects.filter((p) => !HIDDEN_PROJECT_IDS.has(p.id));
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to read on-chain registry";
  }

  return (
    <>
      <Nav />
      <main>
        <Header count={projects.length} error={error} />
        {error ? (
          <ErrorState message={error} />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ProjectsDirectory projects={projects} />
        )}
      </main>
      <Footer />
    </>
  );
}

function Header({ count, error }: { count: number; error: string | null }) {
  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-16 md:py-20">
        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
          <div>
            <Image
              src="/logos/icon.png"
              alt=""
              width={144}
              height={144}
              className="-ml-2 h-20 w-20 md:h-28 md:w-28"
              priority
            />
            <p className="label mt-5">Registry</p>
            <h1 className="mt-3 font-mono text-[40px] leading-[0.95] font-bold tracking-tight md:text-[64px]">
              PROJECTS
            </h1>
            <p className="label mt-4">
              {error ? (
                "Network unreachable"
              ) : (
                <>
                  {count} project{count === 1 ? "" : "s"} listed on 0G Galileo ·{" "}
                  <AddressLink address={PROJECT_REGISTRY_ADDRESS} />
                </>
              )}
            </p>
          </div>

          <p className="font-sans text-base leading-snug text-[var(--color-fg-muted)] md:text-lg">
            Choose a benchmark. Mine an improvement. Earn the project token.
          </p>
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section>
      <div className="container-page py-24 md:py-32">
        <div className="border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] px-8 py-16 text-center">
          <p className="label">Empty</p>
          <p className="mt-4 font-sans text-xl text-[var(--color-fg)]">
            No projects on the registry yet.
          </p>
          <p className="mt-2 font-sans text-sm text-[var(--color-fg-muted)]">
            Be the first to publish — install the create skill, point it at a
            GitHub repo, and run the baseline.
          </p>
          <pre className="mx-auto mt-6 inline-block border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 font-mono text-[12.5px] text-[var(--color-fg)]">
            <code>
              <span className="text-[var(--color-fg-dim)]">$ </span>
              npx skills add Auto-Research-At-Home/skill --skill autoresearch-create
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section>
      <div className="container-page py-24">
        <div className="border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-8 py-12">
          <p className="label">Registry unavailable</p>
          <p className="mt-3 font-sans text-base text-[var(--color-fg)]">
            Could not read the on-chain registry just now.
          </p>
          <p className="mt-2 font-mono text-xs text-[var(--color-fg-dim)]">
            {message}
          </p>
          <p className="mt-6 font-sans text-sm text-[var(--color-fg-muted)]">
            Refresh in a moment, or try the explorer directly:
          </p>
          <a
            href={explorerAddressUrl(PROJECT_REGISTRY_ADDRESS)}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-block font-mono text-xs text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline"
          >
            chainscan-galileo.0g.ai →
          </a>
        </div>
      </div>
    </section>
  );
}
