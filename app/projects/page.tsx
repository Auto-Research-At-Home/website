import type { Metadata } from "next";
import { OPEN_RESEARCH_PROGRAM_ID, SOLANA_CLUSTER } from "@/lib/openResearch/client";
import {
  DEFAULT_PRIMARY_METRIC,
  explorerAddressUrl,
  formatAggregateScore,
  metricValueFromAggregateScore,
  primaryMetricFromProtocol,
  SYSTEM_PROGRAM,
  type PrimaryMetric,
} from "@/lib/openResearch/format";
import { fetchArtifactByReference } from "@/lib/openResearch/artifact";
import { HIDDEN_PROJECT_IDS } from "@/lib/openResearch/projectUi";
import {
  fetchProjectMint,
  listProjects,
  listProposals,
  type ProjectView,
  type ProposalView,
} from "@/lib/openResearch/read";
import { AddressLink } from "../components/AddressLink";
import { Arrow } from "../components/atoms";
import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import {
  ProjectsDirectory,
  type ProjectListItem,
  type RegistryEvent,
} from "./ProjectsDirectory";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "All OpenResearch projects published on the Solana devnet program, with current best scores, baselines, and project token prices.",
};

export default async function ProjectsPage() {
  let projects: ProjectListItem[] = [];
  let events: RegistryEvent[] = [];
  let error: string | null = null;

  try {
    const [allProjects, allProposals] = await Promise.all([
      listProjects(),
      listProposals().catch(() => [] as ProposalView[]),
    ]);
    const rows = allProjects.filter((p) => !HIDDEN_PROJECT_IDS.has(p.id));
    projects = await Promise.all(rows.map(toProjectListItem));
    const metricsByProjectId = new Map<string, PrimaryMetric>(
      projects.map((p) => [
        p.id,
        { name: p.primaryMetricName, direction: p.primaryMetricDirection },
      ]),
    );
    events = buildRegistryEvents(rows, allProposals, metricsByProjectId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to read OpenResearch program";
  }

  return (
    <>
      <Nav />
      <main>
        {error ? (
          <ErrorState message={error} />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ProjectsDirectory projects={projects} events={events} />
        )}
        <NetworkSummary projects={projects} error={error} />
      </main>
      <Footer />
    </>
  );
}

function buildRegistryEvents(
  projects: ProjectView[],
  proposals: ProposalView[],
  metricsByProjectId: Map<string, PrimaryMetric>,
): RegistryEvent[] {
  const projectById = new Map<string, ProjectView>();
  for (const project of projects) {
    projectById.set(project.id.toString(), project);
  }

  const metricFor = (projectId: string): PrimaryMetric =>
    metricsByProjectId.get(projectId) ?? DEFAULT_PRIMARY_METRIC;

  const out: RegistryEvent[] = [];

  for (const project of projects) {
    const metric = metricFor(project.id.toString());
    const baselineMetric = metricValueFromAggregateScore(
      project.baselineAggregateScore,
      project.baselineAggregateScore,
      metric,
    );
    out.push({
      id: `project-${project.id}`,
      projectId: project.id.toString(),
      tokenName: project.tokenName,
      tokenSymbol: project.tokenSymbol,
      date: project.createdAt.toISOString(),
      kind: "created",
      message: `${project.tokenName} published with baseline ${formatAggregateScore(baselineMetric)}`,
      actor: project.creator.toBase58(),
      score: baselineMetric.toString(),
    });
  }

  for (const proposal of proposals) {
    const project = projectById.get(proposal.projectId.toString());
    if (!project) continue;
    const miner = proposal.miner.toBase58();
    const aggregate =
      proposal.verifiedAggregateScore !== 0n
        ? proposal.verifiedAggregateScore
        : proposal.claimedAggregateScore;
    const metric = metricFor(project.id.toString());
    const score = metricValueFromAggregateScore(
      aggregate,
      project.baselineAggregateScore,
      metric,
    );
    const tokenName = project.tokenName;

    const scoreText = formatAggregateScore(score);
    let message: string;
    switch (proposal.status) {
      case "approved":
        message = `Miner advanced ${tokenName} to ${scoreText}`;
        break;
      case "rejected":
        message = `Proposal #${proposal.id} on ${tokenName} rejected`;
        break;
      case "expired":
        message = `Proposal #${proposal.id} on ${tokenName} expired`;
        break;
      case "inReview":
        message = `Proposal #${proposal.id} on ${tokenName} entered review at ${scoreText}`;
        break;
      case "pending":
      default:
        message = `Miner submitted proposal #${proposal.id} on ${tokenName} at ${scoreText}`;
        break;
    }

    out.push({
      id: `proposal-${proposal.id}`,
      projectId: proposal.projectId.toString(),
      tokenName,
      tokenSymbol: project.tokenSymbol,
      date: proposal.submittedAt.toISOString(),
      kind: proposal.status,
      message,
      actor: miner,
      score: score.toString(),
    });
  }

  return out
    .filter((event) => !HIDDEN_PROJECT_IDS.has(BigInt(event.projectId)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function NetworkSummary({
  projects,
  error,
}: {
  projects: ProjectListItem[];
  error: string | null;
}) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-bg-soft)]">
      <div className="hero-grid-bg" />
      <div className="container-page relative py-16 md:py-20">
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div>
            <p className="label">/ network · live</p>
            <h2 className="mt-5 text-balance font-sans text-[40px] leading-[1] font-medium tracking-tight text-[var(--color-fg)] md:text-[56px]">
              Live projects,{" "}
              <span className="serif">live miners.</span>
            </h2>
            <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-[var(--color-fg-muted)]">
              {error ? (
                "Network unreachable"
              ) : (
                <>
                  Every active benchmark on the {SOLANA_CLUSTER} registry, with
                  live score, token, and bonding-curve state. Program:{" "}
                  <AddressLink address={OPEN_RESEARCH_PROGRAM_ID.toBase58()} />
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/#get-started"
              className="group inline-flex items-center gap-3 rounded-sm bg-[var(--color-fg)] px-5 py-3 font-mono text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
            >
              <span className="size-2 rounded-full bg-[var(--color-accent)] group-hover:bg-[var(--color-bg)]" />
              Publish a project
              <Arrow />
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-3 rounded-sm border border-[var(--color-line-2)] px-5 py-3 font-mono text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-3)] hover:text-[var(--color-fg)]"
            >
              Back to overview
            </a>
          </div>
        </div>

        <NetStats projects={projects} />
      </div>
    </section>
  );
}

function NetStats({ projects }: { projects: ProjectListItem[] }) {
  const acceptedBests = projects.filter(
    (project) => project.currentBestMiner !== SYSTEM_PROGRAM,
  ).length;
  const openPools = projects.filter(
    (project) => BigInt(project.minerPoolCap) > BigInt(project.minerPoolMinted),
  ).length;
  const mintedProjects = projects.filter(
    (project) => BigInt(project.totalSupply) > 0n,
  ).length;
  const latest = [...projects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  const stats = [
    { label: "Registry projects", value: projects.length.toLocaleString() },
    { label: "Accepted bests", value: acceptedBests.toLocaleString(), up: acceptedBests > 0 },
    { label: "Open reward pools", value: openPools.toLocaleString() },
    { label: "Minted tokens", value: mintedProjects.toLocaleString() },
    { label: "Latest project", value: latest ? latest.tokenSymbol : "-" },
    { label: "Cluster", value: SOLANA_CLUSTER },
  ];

  return (
    <div className="mt-12 grid grid-cols-2 border border-[var(--color-line)] bg-[var(--color-bg-soft)] md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`net-stat group relative min-h-[112px] border-[var(--color-line)] px-5 py-5 transition-colors hover:bg-[rgb(255_255_255_/_0.02)] ${
            i % 2 === 0 ? "border-r" : ""
          } ${i < 4 ? "border-b xl:border-b-0" : ""} md:border-r md:[&:nth-child(3n)]:border-r-0 xl:[&:nth-child(3n)]:border-r xl:last:border-r-0`}
        >
          <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-[var(--color-fg-muted)] uppercase">
            {stat.label}
          </span>
          <span
            className={`tick mt-3 block text-[26px] font-medium tracking-tight ${
              stat.up ? "text-[var(--color-accent)]" : "text-[var(--color-fg)]"
            }`}
          >
            {stat.value}
          </span>
          <span className="net-stat-bar" aria-hidden="true" />
        </div>
      ))}
    </div>
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
  const [mint, artifact] = await Promise.all([
    fetchProjectMint(null, project.id),
    fetchArtifactByReference({
      hash: project.protocolHash,
      irysId: project.protocolIrysId,
    }).catch(() => null),
  ]);
  const primaryMetric =
    artifact?.kind === "json"
      ? primaryMetricFromProtocol(artifact.data)
      : DEFAULT_PRIMARY_METRIC;

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
    primaryMetricName: primaryMetric.name,
    primaryMetricDirection: primaryMetric.direction,
  };
}
