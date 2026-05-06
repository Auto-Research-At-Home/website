import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECT_REGISTRY_ADDRESS } from "@/lib/arah/chain";
import {
  aggregateDeltaPercent,
  aggregateImprovement,
  formatAggregateScore,
  formatDate,
  formatTokenAmount,
  shortAddress,
  shortHash,
  ZERO_ADDRESS,
} from "@/lib/arah/format";
import { fetchProject, type ListedProject } from "@/lib/arah/registry";
import { isProjectHiddenInUi } from "@/lib/arah/projectUi";
import {
  fetchArtifact,
  storageFileUrl,
  ZERO_HASH,
  type FetchedArtifact,
} from "@/lib/arah/storage";
import { renderProtocolMarkdown } from "@/lib/arah/protocolMarkdown";
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

  const project = await fetchProject(projectId).catch(() => null);
  if (!project) return { title: `Project #${id}` };

  return {
    title: `${project.token.name} (${project.token.symbol}) · Project #${project.id}`,
    description: `On-chain protocol, benchmark, and current best score for ${project.token.name} on the 0G Galileo registry.`,
  };
}

export default async function ProjectViewerPage({ params }: RouteProps) {
  const { id } = await params;
  const projectId = Number.parseInt(id, 10);
  if (!Number.isFinite(projectId) || projectId < 0) notFound();
  if (isProjectHiddenInUi(projectId)) notFound();

  let project: ListedProject | null = null;
  let registryError: string | null = null;
  try {
    project = await fetchProject(projectId);
  } catch (e) {
    registryError =
      e instanceof Error ? e.message : "Failed to read on-chain registry";
  }

  if (!project) {
    if (registryError) {
      return <ErrorPage projectId={projectId} message={registryError} />;
    }
    notFound();
  }

  const protocolArtifact = await fetchArtifact(project.protocolHash).catch(
    (e): FetchedArtifact => ({
      kind: "error",
      message: e instanceof Error ? e.message : "Storage gateway unreachable",
    }),
  );

  return (
    <>
      <Nav />
      <main>
        <Breadcrumbs id={project.id} symbol={project.token.symbol} />
        <ProjectHeader project={project} />
        <ProjectBody project={project} artifact={protocolArtifact} />
      </main>
      <Footer />
    </>
  );
}

function Breadcrumbs({ id, symbol }: { id: number; symbol: string }) {
  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-4">
        <nav className="font-mono text-xs text-[var(--color-fg-dim)]">
          <Link
            href="/projects"
            className="underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
          >
            ← All projects
          </Link>
          <span className="mx-2 text-[var(--color-fg-dim)]">/</span>
          <span className="text-[var(--color-fg-muted)]">
            #{String(id).padStart(2, "0")} · {symbol}
          </span>
        </nav>
      </div>
    </section>
  );
}

function ProjectHeader({ project }: { project: ListedProject }) {
  const isBaseline = project.currentBestMiner === ZERO_ADDRESS;
  const improvement = aggregateImprovement(
    project.currentBestAggregateScore,
    project.baselineAggregateScore,
  );
  const d = aggregateDeltaPercent(
    project.currentBestAggregateScore,
    project.baselineAggregateScore,
  );

  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="container-page py-12 md:py-16">
        <p className="label">
          Project #{String(project.id).padStart(2, "0")}
        </p>
        <div className="mt-3 flex flex-wrap items-start gap-3 md:gap-4">
          <h1 className="min-w-0 flex-1 font-mono text-[40px] leading-[0.95] font-bold tracking-tight text-[var(--color-fg)] md:text-[56px]">
            {project.token.name}{" "}
            <span className="text-[var(--color-fg-dim)]">
              ({project.token.symbol})
            </span>
          </h1>
          <ProjectHeaderActions
            tokenAddress={project.token.address}
            tokenSymbol={project.token.symbol}
            decimals={project.token.decimals}
            className="mt-1 md:mt-2"
          />
        </div>
        <p className="mt-4 max-w-2xl font-sans text-base leading-snug text-[var(--color-fg-muted)] md:text-lg">
          Immutable benchmark contract on 0G Galileo. The protocol below is
          fetched live from 0G Storage by its on-chain root hash. Mining this
          project means beating the current best score and earning{" "}
          {project.token.symbol} from the miner pool.
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-[var(--color-line)] pt-8 md:grid-cols-4">
          <Stat
            label="Improvement"
            value={formatAggregateScore(improvement)}
            sub={`baseline ${formatAggregateScore(project.baselineAggregateScore)}`}
          />
          <Stat
            label="Δ vs baseline"
            value={
              isBaseline || d === null
                ? "—"
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
            label="Buy price"
            value={project.token.currentPriceDisplay}
            sub={`supply ${formatTokenAmount(
              project.token.totalSupply,
              project.token.decimals,
            )} ${project.token.symbol}`}
          />
          <Stat
            label="Miner pool"
            value={`${formatTokenAmount(
              project.token.minerPoolMinted,
              project.token.decimals,
            )} / ${formatTokenAmount(
              project.token.minerPoolCap,
              project.token.decimals,
            )}`}
            sub={`minted / cap · ${project.token.symbol}`}
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
  artifact,
}: {
  project: ListedProject;
  artifact: FetchedArtifact;
}) {
  return (
    <section>
      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          <ProtocolPanel hash={project.protocolHash} artifact={artifact} />
          <OnChainCard project={project} />
        </div>
      </div>
    </section>
  );
}

function ProtocolPanel({
  hash,
  artifact,
}: {
  hash: string;
  artifact: FetchedArtifact;
}) {
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
          0G Storage ·{" "}
          {hash === ZERO_HASH ? (
            <span>not published</span>
          ) : (
            <a
              href={storageFileUrl(hash)}
              target="_blank"
              rel="noreferrer noopener"
              title={hash}
              className="underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
            >
              {shortHash(hash, 10, 6)} ↗
            </a>
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
          body="This project has not published a protocol root hash on-chain. The Statement of Purpose will appear here once the creator uploads it to 0G Storage."
        />
      );
    case "error":
      return (
        <Notice
          tone="error"
          title="Could not load from 0G Storage"
          body={artifact.message}
          footer={
            hash !== ZERO_HASH ? (
              <a
                href={storageFileUrl(hash)}
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
          body={`The artifact at this root is ${formatBytes(artifact.bytes)} of ${
            artifact.contentType || "unknown"
          } content and cannot be rendered inline.`}
          footer={
            <a
              href={storageFileUrl(hash)}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono text-xs text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
            >
              Download from 0G Storage →
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

function OnChainCard({ project }: { project: ListedProject }) {
  const isBaseline = project.currentBestMiner === ZERO_ADDRESS;

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
        <div className="border-b border-[var(--color-line)] px-5 py-4">
          <p className="label">On-chain</p>
          <p className="mt-1 font-mono text-base text-[var(--color-fg)]">
            0G Galileo · 16602
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--color-fg-dim)]">
            registry{" "}
            <AddressLink
              address={PROJECT_REGISTRY_ADDRESS}
              className="text-[var(--color-fg-muted)]"
            />
          </p>
        </div>

        <CardSection title="Token">
          <CardRow
            label="Address"
            ddClassName="flex min-w-0 flex-wrap items-center justify-end gap-2 text-right font-mono text-xs text-[var(--color-fg-muted)]"
          >
            <span className="min-w-0 truncate">
              <AddressLink address={project.token.address} />
            </span>
            <CopyTextButton
              text={project.token.address}
              label="Copy project token contract address"
            />
          </CardRow>
          <CardRow label="Name">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {project.token.name}
            </span>
          </CardRow>
          <CardRow label="Symbol">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {project.token.symbol}
            </span>
          </CardRow>
          <CardRow label="Decimals">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {project.token.decimals}
            </span>
          </CardRow>
          <CardRow label="Total supply">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {formatTokenAmount(
                project.token.totalSupply,
                project.token.decimals,
              )}{" "}
              <span className="text-[var(--color-fg-dim)]">
                {project.token.symbol}
              </span>
            </span>
          </CardRow>
          <CardRow label="Buy price">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {project.token.currentPriceDisplay}
            </span>
          </CardRow>
          <CardRow label="Miner pool">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {formatTokenAmount(
                project.token.minerPoolMinted,
                project.token.decimals,
              )}{" "}
              /{" "}
              {formatTokenAmount(
                project.token.minerPoolCap,
                project.token.decimals,
              )}
            </span>
          </CardRow>
        </CardSection>

        <CardSection title="People">
          <CardRow label="Creator">
            <AddressLink address={project.creator} />
          </CardRow>
          <CardRow label="Best miner">
            {isBaseline ? (
              <span className="font-mono text-sm text-[var(--color-fg-dim)]">
                — none yet
              </span>
            ) : (
              <AddressLink address={project.currentBestMiner} />
            )}
          </CardRow>
          <CardRow label="Created">
            <span className="font-mono text-sm text-[var(--color-fg)]">
              {formatDate(project.createdAt)}
            </span>
          </CardRow>
        </CardSection>

        <CardSection title="0G Storage roots">
          <HashRow label="Protocol" hash={project.protocolHash} />
          <HashRow label="Repo snapshot" hash={project.repoSnapshotHash} />
          <HashRow label="Benchmark" hash={project.benchmarkHash} />
          <HashRow
            label="Baseline metrics"
            hash={project.baselineMetricsHash}
          />
          <HashRow
            label="Best code"
            hash={project.currentBestCodeHash}
            empty="no proposals yet"
          />
          <HashRow
            label="Best metrics"
            hash={project.currentBestMetricsHash}
            empty="no proposals yet"
          />
        </CardSection>
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-[var(--color-fg-dim)]">
        Hashes are 0G Storage Merkle roots. Click any hash to fetch the file
        through the public 0G indexer gateway.
      </p>
    </aside>
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
  /** Overrides default `truncate` on `<dd>` when layout needs flex (e.g. copy button). */
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
  empty,
}: {
  label: string;
  hash: string;
  empty?: string;
}) {
  const isEmpty = !hash || hash === ZERO_HASH;
  return (
    <CardRow label={label}>
      {isEmpty ? (
        <span className="text-[var(--color-fg-dim)]">{empty ?? "—"}</span>
      ) : (
        <a
          href={storageFileUrl(hash)}
          target="_blank"
          rel="noreferrer noopener"
          title={hash}
          className="font-mono text-xs text-[var(--color-fg-muted)] underline-offset-4 hover:text-[var(--color-brand-bright)] hover:underline"
        >
          {shortAddress(hash)} ↗
        </a>
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
        <Breadcrumbs id={projectId} symbol="—" />
        <section>
          <div className="container-page py-24">
            <div className="border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-8 py-12">
              <p className="label">Registry unavailable</p>
              <p className="mt-3 font-sans text-base text-[var(--color-fg)]">
                Could not read project #{projectId} from the on-chain registry.
              </p>
              <p className="mt-2 font-mono text-xs text-[var(--color-fg-dim)]">
                {message}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
