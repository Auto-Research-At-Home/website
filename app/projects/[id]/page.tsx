import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OPEN_RESEARCH_PROGRAM_ID } from "@/lib/openResearch/client";
import {
  aggregateDeltaPercent,
  aggregateImprovement,
  explorerAddressUrl,
  formatAggregateScore,
  formatDate,
  formatSol,
  formatTokenAmount,
  shortAddress,
  shortHash,
  SYSTEM_PROGRAM,
} from "@/lib/openResearch/format";
import { ZERO_HASH_HEX } from "@/lib/openResearch/hash";
import { fetchArtifactByReference, type FetchedArtifact } from "@/lib/openResearch/artifact";
import { irysUrl } from "@/lib/openResearch/irys";
import { isProjectHiddenInUi } from "@/lib/openResearch/projectUi";
import { fetchProject, fetchProjectMint, type ProjectView } from "@/lib/openResearch/read";
import { renderProtocolMarkdown } from "@/lib/openResearch/protocolMarkdown";
import { priceAtSupply } from "@/lib/openResearch/trade";
import { AddressLink } from "../../components/AddressLink";
import { CopyTextButton } from "../../components/CopyTextButton";
import { ProjectHeaderActions } from "../../components/ProjectHeaderActions";
import { Footer } from "../../components/Footer";
import { Markdown } from "../../components/Markdown";
import { Nav } from "../../components/Nav";

export const dynamic = "force-dynamic";
export const revalidate = 30;

type RouteProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { id } = await params;
  const projectId = Number.parseInt(id, 10);
  if (Number.isNaN(projectId)) return { title: "Project · Not found" };

  const project = await fetchProject(null, projectId).catch(() => null);
  if (!project) return { title: `Project #${id}` };

  return {
    title: `${project.tokenName} (${project.tokenSymbol}) · Project #${project.id}`,
    description: `On-chain protocol, benchmark, and current best score for ${project.tokenName} on the OpenResearch Solana program.`,
  };
}

export default async function ProjectViewerPage({ params }: RouteProps) {
  const { id } = await params;
  const projectId = Number.parseInt(id, 10);
  if (!Number.isFinite(projectId) || projectId < 0) notFound();
  if (isProjectHiddenInUi(projectId)) notFound();

  let project: ProjectView | null = null;
  let registryError: string | null = null;
  try {
    project = await fetchProject(null, projectId);
  } catch (e) {
    registryError =
      e instanceof Error ? e.message : "Failed to read OpenResearch program";
  }

  if (!project) {
    if (registryError) {
      return <ErrorPage projectId={projectId} message={registryError} />;
    }
    notFound();
  }

  const [mintInfo, protocolArtifact] = await Promise.all([
    fetchProjectMint(null, project.id),
    fetchArtifactByReference({
      hash: project.protocolHash,
      irysId: project.protocolIrysId,
    }).catch(
      (e): FetchedArtifact => ({
        kind: "error",
        message: e instanceof Error ? e.message : "Irys gateway unreachable",
      }),
    ),
  ]);

  return (
    <>
      <Nav />
      <main>
        <Breadcrumbs id={project.id.toString()} symbol={project.tokenSymbol} />
        <ProjectHeader project={project} totalSupply={mintInfo?.supply ?? 0n} decimals={mintInfo?.decimals ?? 0} />
        <ProjectBody
          project={project}
          totalSupply={mintInfo?.supply ?? 0n}
          decimals={mintInfo?.decimals ?? 0}
          artifact={protocolArtifact}
        />
      </main>
      <Footer />
    </>
  );
}

function Breadcrumbs({ id, symbol }: { id: string; symbol: string }) {
  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-4">
        <nav className="font-mono text-xs text-[var(--color-fg-dim)]">
          <Link
            href="/projects"
            className="underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
          >
            Back to all projects
          </Link>
          <span className="mx-2 text-[var(--color-fg-dim)]">/</span>
          <span className="text-[var(--color-fg-muted)]">
            #{id.padStart(2, "0")} · {symbol}
          </span>
        </nav>
      </div>
    </section>
  );
}

function ProjectHeader({
  project,
  totalSupply,
  decimals,
}: {
  project: ProjectView;
  totalSupply: bigint;
  decimals: number;
}) {
  const isBaseline = project.currentBestMiner.toBase58() === SYSTEM_PROGRAM;
  const improvement = aggregateImprovement(
    project.currentBestAggregateScore,
    project.baselineAggregateScore,
  );
  const d = aggregateDeltaPercent(
    project.currentBestAggregateScore,
    project.baselineAggregateScore,
  );
  const currentPrice = priceAtSupply(project.basePrice, project.slope, totalSupply);

  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-12 md:py-16">
        <p className="label">
          Project #{project.id.toString().padStart(2, "0")}
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-3 md:gap-4">
          <h1 className="min-w-0 flex-1 font-mono text-[40px] leading-[0.95] font-bold tracking-tight text-[var(--color-fg)] md:text-[56px]">
            {project.tokenName}{" "}
            <span className="text-[var(--color-fg-dim)]">
              ({project.tokenSymbol})
            </span>
          </h1>
          <ProjectHeaderActions
            projectId={project.id.toString()}
            mint={project.mint.toBase58()}
            tokenSymbol={project.tokenSymbol}
            decimals={decimals}
            basePrice={project.basePrice.toString()}
            slope={project.slope.toString()}
            totalSupply={totalSupply.toString()}
            className="mt-1 md:mt-2"
          />
        </div>
        <p className="mt-4 max-w-2xl font-sans text-base leading-snug text-[var(--color-fg-muted)] md:text-lg">
          <span className="text-[var(--color-fg)]">
            Immutable benchmark project on Solana devnet.
          </span>{" "}
          Artifacts are fetched from Irys by their on-chain Irys IDs and
          pinned alongside SHA-256 hashes. Beat the network best to earn{" "}
          {project.tokenSymbol} from the miner pool.
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-[var(--color-line)] pt-8 md:grid-cols-4">
          <Stat
            label="Improvement"
            value={formatAggregateScore(improvement)}
            sub={`baseline ${formatAggregateScore(project.baselineAggregateScore)}`}
          />
          <Stat
            label="Delta"
            value={
              isBaseline || d === null
                ? "-"
                : `${d >= 0 ? "+" : ""}${d.toFixed(2)}%`
            }
            sub={isBaseline ? "no proposals yet" : "from network best"}
            valueClassName={
              !isBaseline && d !== null && d >= 0
                ? "text-[var(--color-green)]"
                : undefined
            }
          />
          <Stat
            label="Next price"
            value={`${formatSol(currentPrice)} SOL`}
            sub={`supply ${formatTokenAmount(totalSupply, decimals)} ${project.tokenSymbol}`}
          />
          <Stat
            label="Miner pool"
            value={`${formatTokenAmount(project.minerPoolMinted, decimals)} / ${formatTokenAmount(project.minerPoolCap, decimals)}`}
            sub={`minted / cap · ${project.tokenSymbol}`}
          />
        </dl>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <p
        className={`mt-2 font-mono text-xl text-[var(--color-fg)] ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-1 font-mono text-xs text-[var(--color-fg-dim)]">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function ProjectBody({
  project,
  totalSupply,
  decimals,
  artifact,
}: {
  project: ProjectView;
  totalSupply: bigint;
  decimals: number;
  artifact: FetchedArtifact;
}) {
  return (
    <section>
      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          <ProtocolPanel
            hash={project.protocolHash}
            irysId={project.protocolIrysId}
            artifact={artifact}
          />
          <OnChainCard project={project} totalSupply={totalSupply} decimals={decimals} />
        </div>
      </div>
    </section>
  );
}

function ProtocolPanel({
  hash,
  irysId,
  artifact,
}: {
  hash: string;
  irysId: string | null;
  artifact: FetchedArtifact;
}) {
  const url = irysId ? irysUrl(irysId) : "url" in artifact ? artifact.url : null;
  return (
    <article className="min-w-0">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <div>
          <p className="label">About</p>
          <h2 className="mt-1 font-mono text-2xl font-semibold text-[var(--color-fg)]">
            Statement of Purpose
          </h2>
        </div>
        <p className="font-mono text-xs text-[var(--color-fg-dim)]">
          Irys ·{" "}
          {!url && hash === ZERO_HASH_HEX ? (
            <span>not published</span>
          ) : url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              title={irysId ? `${irysId} · ${hash}` : hash}
              className="underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
            >
              {irysId ? shortAddress(irysId) : shortHash(hash, 10, 6)} ↗
            </a>
          ) : (
            <span title={hash}>{shortHash(hash, 10, 6)}</span>
          )}
        </p>
      </header>

      <div className="mt-6">
        <ArtifactRender artifact={artifact} hash={hash} />
      </div>
    </article>
  );
}

function ArtifactRender({
  artifact,
  hash,
}: {
  artifact: FetchedArtifact;
  hash: string;
}) {
  switch (artifact.kind) {
    case "missing":
      return (
        <Notice
          title="No protocol artifact yet"
          body="This project has no retrievable Irys artifact recorded on-chain yet."
        />
      );
    case "error":
      return (
        <Notice
          tone="error"
          title="Could not load from Irys"
          body={artifact.message}
          footer={
            hash !== ZERO_HASH_HEX && "url" in artifact && artifact.url ? (
              <a
                href={artifact.url}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-xs text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
              >
                Try the gateway directly →
              </a>
            ) : null
          }
        />
      );
    case "binary":
      return (
        <Notice
          title="Binary artifact"
          body={`The artifact is ${formatBytes(artifact.bytes)} of ${
            artifact.contentType || "unknown"
          } content and cannot be rendered inline.`}
          footer={
            <a
              href={artifact.url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-xs text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
            >
              Open in Irys gateway →
            </a>
          }
        />
      );
    case "markdown":
      return <Markdown source={artifact.text} />;
    case "text":
      return (
        <pre className="overflow-x-auto border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-[var(--color-fg)]">
          <code>{artifact.text}</code>
        </pre>
      );
    case "json":
      return <JsonView data={artifact.data} raw={artifact.raw} />;
    default:
      return null;
  }
}

function JsonView({ data, raw }: { data: unknown; raw: string }) {
  const pretty = (() => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  })();

  const md = renderProtocolMarkdown(data);

  return (
    <div className="space-y-6">
      <div className="border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <p className="label mb-4">Rendered from protocol.json</p>
        <Markdown source={md} />
      </div>

      <details className="group border border-[var(--color-line)] bg-[var(--color-bg)]">
        <summary className="cursor-pointer list-none px-4 py-3 font-mono text-xs text-[var(--color-fg-muted)] marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="underline-offset-4 group-open:no-underline hover:underline">
            protocol.json (raw)
          </span>
        </summary>
        <pre className="overflow-x-auto border-t border-[var(--color-line)] p-4 font-mono text-[12px] leading-relaxed text-[var(--color-fg)]">
          <code>{pretty}</code>
        </pre>
      </details>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Notice({
  title,
  body,
  footer,
  tone,
}: {
  title: string;
  body: string;
  footer?: React.ReactNode;
  tone?: "error";
}) {
  return (
    <div
      className={
        "border bg-[var(--color-bg-soft)] px-5 py-6 " +
        (tone === "error"
          ? "border-[var(--color-line)]"
          : "border-dashed border-[var(--color-line)]")
      }
    >
      <p className="label">{title}</p>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
        {body}
      </p>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

function OnChainCard({
  project,
  totalSupply,
  decimals,
}: {
  project: ProjectView;
  totalSupply: bigint;
  decimals: number;
}) {
  const isBaseline = project.currentBestMiner.toBase58() === SYSTEM_PROGRAM;
  const currentPrice = priceAtSupply(project.basePrice, project.slope, totalSupply);

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <MineQuickstart
        mint={project.mint.toBase58()}
        tokenSymbol={project.tokenSymbol}
      />
      <div className="border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
        <div className="border-b border-[var(--color-line)] px-5 py-4">
          <p className="label">On-chain</p>
          <p className="mt-1 font-mono text-base text-[var(--color-fg)]">
            Solana devnet
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--color-fg-dim)]">
            program{" "}
            <AddressLink
              address={OPEN_RESEARCH_PROGRAM_ID.toBase58()}
              className="text-[var(--color-fg-muted)]"
            />
          </p>
        </div>

        <CardSection title="Token">
          <CardRow
            label="Mint"
            ddClassName="flex min-w-0 flex-wrap items-center justify-end gap-2 text-right font-mono text-xs text-[var(--color-fg-muted)]"
          >
            <span className="min-w-0 truncate">
              <AddressLink address={project.mint.toBase58()} />
            </span>
            <CopyTextButton
              text={project.mint.toBase58()}
              label="Copy project token mint"
            />
          </CardRow>
          <CardRow label="Name">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {project.tokenName}
            </span>
          </CardRow>
          <CardRow label="Symbol">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {project.tokenSymbol}
            </span>
          </CardRow>
          <CardRow label="Decimals">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {decimals}
            </span>
          </CardRow>
          <CardRow label="Total supply">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {formatTokenAmount(totalSupply, decimals)}{" "}
              <span className="text-[var(--color-fg-dim)]">
                {project.tokenSymbol}
              </span>
            </span>
          </CardRow>
          <CardRow label="Next price">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {formatSol(currentPrice)} SOL
            </span>
          </CardRow>
          <CardRow label="Miner pool">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {formatTokenAmount(project.minerPoolMinted, decimals)} /{" "}
              {formatTokenAmount(project.minerPoolCap, decimals)}
            </span>
          </CardRow>
        </CardSection>

        <CardSection title="People">
          <CardRow label="Creator">
            <AddressLink address={project.creator.toBase58()} />
          </CardRow>
          <CardRow label="Best miner">
            {isBaseline ? (
              <span className="font-mono text-sm text-[var(--color-fg-dim)]">
                - none yet
              </span>
            ) : (
              <AddressLink address={project.currentBestMiner.toBase58()} />
            )}
          </CardRow>
          <CardRow label="Created">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {formatDate(project.createdAt)}
            </span>
          </CardRow>
        </CardSection>

        <CardSection title="Irys artifacts">
          <HashRow
            label="Protocol"
            hash={project.protocolHash}
            irysId={project.protocolIrysId}
          />
          <HashRow
            label="Repo snapshot"
            hash={project.repoSnapshotHash}
            irysId={project.repoSnapshotIrysId}
          />
          <HashRow
            label="Benchmark"
            hash={project.benchmarkHash}
            irysId={project.benchmarkIrysId}
          />
          <HashRow
            label="Baseline metrics"
            hash={project.baselineMetricsHash}
            irysId={project.baselineMetricsIrysId}
          />
          <HashRow
            label="Best code"
            hash={project.currentBestCodeHash}
            irysId={project.currentBestCodeIrysId}
            empty="no proposals yet"
          />
          <HashRow
            label="Best metrics"
            hash={project.currentBestMetricsHash}
            irysId={project.currentBestMetricsIrysId}
            empty="no proposals yet"
          />
        </CardSection>
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-[var(--color-fg-dim)]">
        The program stores 32-byte Irys IDs for retrieval and 32-byte SHA-256
        hashes for integrity checks.
      </p>
    </aside>
  );
}

function MineQuickstart({
  mint,
  tokenSymbol,
}: {
  mint: string;
  tokenSymbol: string;
}) {
  const install =
    "npx skills add OpenResearchh/skill --skill autoresearch-mine";
  const run = `Start autoresearch mining for ${mint}`;

  return (
    <div className="mb-6 border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
      <div className="border-b border-[var(--color-line)] px-5 py-4">
        <p className="label">Mine in 60 seconds</p>
        <p className="mt-1 font-sans text-sm leading-snug text-[var(--color-fg-muted)]">
          Install the skill, then start mining for {tokenSymbol}. Submit only if
          you beat the best.
        </p>
      </div>

      <div className="space-y-3 px-5 py-4">
        <CommandRow
          n="01"
          label="Install"
          command={install}
          copyLabel="Copy mining skill install command"
        />
        <CommandRow
          n="02"
          label="Run"
          command={run}
          copyLabel={`Copy mining start prompt for ${tokenSymbol}`}
        />
      </div>
    </div>
  );
}

function CommandRow({
  n,
  label,
  command,
  copyLabel,
}: {
  n: string;
  label: string;
  command: string;
  copyLabel: string;
}) {
  return (
    <div>
      <p className="label">{`${n} · ${label}`}</p>
      <div className="mt-2 flex items-center gap-3 border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3">
        <span className="font-mono text-sm text-[var(--color-fg-dim)] select-none">
          $
        </span>
        <code className="flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap text-[var(--color-fg)]">
          {command}
        </code>
        <CopyTextButton text={command} label={copyLabel} variant="icon" />
      </div>
    </div>
  );
}

function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--color-line)] px-5 py-4 last:border-b-0">
      <p className="label mb-3">{title}</p>
      <dl className="space-y-2.5">{children}</dl>
    </div>
  );
}

function CardRow({
  label,
  children,
  ddClassName,
}: {
  label: string;
  children: React.ReactNode;
  ddClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-mono text-xs text-[var(--color-fg-dim)]">{label}</dt>
      <dd
        className={
          ddClassName ??
          "min-w-0 truncate text-right font-mono text-xs text-[var(--color-fg-muted)]"
        }
      >
        {children}
      </dd>
    </div>
  );
}

function HashRow({
  label,
  hash,
  irysId,
  empty,
}: {
  label: string;
  hash: string;
  irysId: string | null;
  empty?: string;
}) {
  const isEmpty = !irysId && (!hash || hash === ZERO_HASH_HEX);
  if (isEmpty) {
    return (
      <CardRow label={label}>
        <span className="text-[var(--color-fg-dim)]">{empty ?? "-"}</span>
      </CardRow>
    );
  }

  return (
    <CardRow label={label}>
      {irysId ? (
        <a
          href={irysUrl(irysId)}
          target="_blank"
          rel="noreferrer noopener"
          title={`${irysId} · ${hash}`}
          className="font-mono text-xs text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
        >
          {shortAddress(irysId)} ↗
        </a>
      ) : (
        <span title={hash}>{shortHash(hash, 8, 4)}</span>
      )}
    </CardRow>
  );
}

function ErrorPage({
  projectId,
  message,
}: {
  projectId: number;
  message: string;
}) {
  return (
    <>
      <Nav />
      <main>
        <Breadcrumbs id={projectId.toString()} symbol="-" />
        <section>
          <div className="container-page py-24">
            <div className="border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-8 py-12">
              <p className="label">Program unavailable</p>
              <p className="mt-3 font-sans text-base text-[var(--color-fg)]">
                Could not read project #{projectId} from OpenResearch.
              </p>
              <p className="mt-2 font-mono text-xs text-[var(--color-fg-dim)]">
                {message}
              </p>
              <a
                href={explorerAddressUrl(OPEN_RESEARCH_PROGRAM_ID)}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-6 inline-block font-mono text-xs text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
              >
                Open Solana Explorer →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
