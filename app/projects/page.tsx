import type { Metadata } from "next";
import Image from "next/image";
import { OPEN_RESEARCH_PROGRAM_ID } from "@/lib/openResearch/client";
import { explorerAddressUrl } from "@/lib/openResearch/format";
import { HIDDEN_PROJECT_IDS } from "@/lib/openResearch/projectUi";
import { fetchProjectMint, listProjects, type ProjectView } from "@/lib/openResearch/read";
import { AddressLink } from "../components/AddressLink";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { ProjectsDirectory, type ProjectListItem } from "./ProjectsDirectory";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "All OpenResearch projects published on the Solana devnet program, with current best scores, baselines, and project token prices.",
};

export default async function ProjectsPage() {
  let projects: ProjectListItem[] = [];
  let error: string | null = null;

  try {
    const rows = (await listProjects()).filter((p) => !HIDDEN_PROJECT_IDS.has(p.id));
    projects = await Promise.all(rows.map(toProjectListItem));
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to read OpenResearch program";
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
                  {count} project{count === 1 ? "" : "s"} listed on Solana devnet ·{" "}
                  <AddressLink address={OPEN_RESEARCH_PROGRAM_ID.toBase58()} />
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
              npx skills add OpenResearchh/skill --skill autoresearch-create
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
            Could not read the OpenResearch Solana program just now.
          </p>
          <p className="mt-2 font-mono text-xs text-[var(--color-fg-dim)]">
            {message}
          </p>
          <p className="mt-6 font-sans text-sm text-[var(--color-fg-muted)]">
            Refresh in a moment, or try the explorer directly:
          </p>
          <a
            href={explorerAddressUrl(OPEN_RESEARCH_PROGRAM_ID)}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-block font-mono text-xs text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-fg)] hover:underline"
          >
            explorer.solana.com →
          </a>
        </div>
      </div>
    </section>
  );
}

async function toProjectListItem(project: ProjectView): Promise<ProjectListItem> {
  const mint = await fetchProjectMint(null, project.id);
  return {
    id: project.id.toString(),
    createdAt: project.createdAt.toISOString(),
    tokenName: project.tokenName,
    tokenSymbol: project.tokenSymbol,
    mint: project.mint.toBase58(),
    protocolHash: project.protocolHash,
    protocolIrysId: project.protocolIrysId,
    baselineAggregateScore: project.baselineAggregateScore.toString(),
    currentBestAggregateScore: project.currentBestAggregateScore.toString(),
    currentBestMiner: project.currentBestMiner.toBase58(),
    totalSupply: (mint?.supply ?? 0n).toString(),
    decimals: mint?.decimals ?? 0,
    basePrice: project.basePrice.toString(),
    slope: project.slope.toString(),
    minerPoolCap: project.minerPoolCap.toString(),
    minerPoolMinted: project.minerPoolMinted.toString(),
  };
}
