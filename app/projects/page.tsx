import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PROJECT_REGISTRY_ADDRESS } from "@/lib/arah/chain";
import {
  aggregateDeltaPercent,
  aggregateImprovement,
  explorerAddressUrl,
  formatAggregateScore,
  formatDate,
  formatTokenAmount,
  shortHash,
  ZERO_ADDRESS,
} from "@/lib/arah/format";
import { HIDDEN_PROJECT_IDS } from "@/lib/arah/projectUi";
import { fetchListedProjects, type ListedProject } from "@/lib/arah/registry";
import { AddressLink } from "../components/AddressLink";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";

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
          <ProjectsTable projects={projects} />
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
            Every project here is an immutable benchmark contract on the 0G
            Galileo testnet. Mining a project means beating its current best
            score and earning that project&apos;s token in return.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProjectsTable({ projects }: { projects: ListedProject[] }) {
  return (
    <section>
      <div className="container-page py-12 md:py-16">
        <div className="hidden grid-cols-[60px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,1fr)] gap-6 border-b border-[var(--color-line)] pb-3 md:grid">
          <p className="label">#</p>
          <p className="label">Project</p>
          <p className="label">Improvement</p>
          <p className="label">Δ vs baseline</p>
          <p className="label">Supply</p>
          <p className="label text-right">Buy price</p>
        </div>

        <ul>
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProjectRow({ project }: { project: ListedProject }) {
  const improvement = aggregateImprovement(
    project.currentBestAggregateScore,
    project.baselineAggregateScore,
  );
  const d = aggregateDeltaPercent(
    project.currentBestAggregateScore,
    project.baselineAggregateScore,
  );
  const isBaseline = project.currentBestMiner === ZERO_ADDRESS;

  return (
    <li className="group relative grid cursor-pointer grid-cols-1 gap-3 border-b border-[var(--color-line)] py-6 transition-colors hover:bg-[var(--color-brand-subtle)] md:grid-cols-[60px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,1fr)] md:items-center md:gap-6 md:py-5">
      <Link
        href={`/projects/${project.id}`}
        aria-label={`Open ${project.token.name} (${project.token.symbol})`}
        className="pointer-events-auto absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 font-mono text-sm text-[var(--color-fg-muted)]">
        {String(project.id).padStart(2, "0")}
      </div>

      <div className="pointer-events-none relative z-10 min-w-0">
        <p className="font-mono text-base text-[var(--color-fg)]">
          <Link
            href={`/projects/${project.id}`}
            className="relative z-20 inline pointer-events-auto text-[var(--color-fg)] underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
          >
            {project.token.name}
          </Link>{" "}
          <span className="text-[var(--color-fg-dim)]">
            ({project.token.symbol})
          </span>
        </p>
        <p className="relative z-10 mt-1 font-mono text-xs text-[var(--color-fg-dim)]">
          <AddressLink address={project.token.address} />
          {" · "}
          <span title="Created">{formatDate(project.createdAt)}</span>
          {" · "}
          <span>
            creator <AddressLink address={project.creator} />
          </span>
        </p>
      </div>

      <div className="pointer-events-none relative z-10 font-mono text-sm">
        <p className="text-[var(--color-fg)]">
          {formatAggregateScore(improvement)}
        </p>
        <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
          baseline {formatAggregateScore(project.baselineAggregateScore)}
        </p>
      </div>

      <div className="pointer-events-none relative z-10 font-mono text-sm">
        {isBaseline || d === null ? (
          <span className="text-[var(--color-fg-dim)]">—</span>
        ) : (
          <span
            className={
              d >= 0
                ? "text-[var(--color-green)]"
                : "text-[var(--color-fg-muted)]"
            }
          >
            {d >= 0 ? "+" : ""}
            {d.toFixed(2)}%
          </span>
        )}
        <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
          {isBaseline ? (
            "no proposals yet"
          ) : (
            <>
              miner <AddressLink address={project.currentBestMiner} />
            </>
          )}
        </p>
      </div>

      <div className="pointer-events-none relative z-10 font-mono text-sm text-[var(--color-fg)]">
        {formatTokenAmount(project.token.totalSupply, project.token.decimals)}{" "}
        <span className="text-[var(--color-fg-dim)]">
          {project.token.symbol}
        </span>
        <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
          pool{" "}
          {formatTokenAmount(
            project.token.minerPoolMinted,
            project.token.decimals,
          )}
          /
          {formatTokenAmount(
            project.token.minerPoolCap,
            project.token.decimals,
          )}
        </p>
      </div>

      <div className="pointer-events-none relative z-10 font-mono text-sm text-[var(--color-fg)] md:text-right">
        {project.token.currentPriceDisplay}
        <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
          {shortHash(project.protocolHash, 8, 4)}
        </p>
      </div>
    </li>
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
