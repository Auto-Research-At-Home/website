"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  aggregateDeltaPercent,
  aggregateImprovement,
  formatDate,
  formatAggregateScore,
  formatSol,
  formatTokenAmount,
  shortAddress,
  shortHash,
  SYSTEM_PROGRAM,
} from "@/lib/openResearch/format";
import { priceAtSupply } from "@/lib/openResearch/trade";
import { AddressLink } from "../components/AddressLink";
import { Arrow } from "../components/atoms";
import { CopyTextButton } from "../components/CopyTextButton";

export type ProjectListItem = {
  id: string;
  createdAt: string;
  tokenName: string;
  tokenSymbol: string;
  mint: string;
  protocolHash: string;
  protocolIrysId: string | null;
  baselineAggregateScore: string;
  currentBestAggregateScore: string;
  currentBestMiner: string;
  totalSupply: string;
  decimals: number;
  basePrice: string;
  slope: string;
  minerPoolCap: string;
  minerPoolMinted: string;
};

type SortId = "newest" | "improvement" | "price";
type FilterId = "all" | "accepted" | "baseline" | "open-pool" | "minted";

const MINE_INSTALL_CMD =
  "npx skills add OpenResearchh/skill --skill autoresearch-mine";

const registryFilters: { id: FilterId; label: string }[] = [
  { id: "all", label: "all" },
  { id: "accepted", label: "accepted best" },
  { id: "baseline", label: "baseline only" },
  { id: "open-pool", label: "open pool" },
  { id: "minted", label: "minted supply" },
];

function bi(value: string): bigint {
  return BigInt(value);
}

function currentPrice(project: ProjectListItem): bigint {
  return priceAtSupply(
    bi(project.basePrice),
    bi(project.slope),
    bi(project.totalSupply),
  );
}

function projectStatus(project: ProjectListItem) {
  if (project.currentBestMiner === SYSTEM_PROGRAM) return "submitted";
  const minted = bi(project.minerPoolMinted);
  const cap = bi(project.minerPoolCap);
  if (cap > 0n && minted * 100n >= cap * 80n) return "winning";
  return "iterating";
}

function improvementValue(project: ProjectListItem) {
  return aggregateImprovement(
    bi(project.currentBestAggregateScore),
    bi(project.baselineAggregateScore),
  );
}

export function ProjectsDirectory({ projects }: { projects: ProjectListItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortId>("improvement");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = projects.filter((project) => {
      if (filter === "accepted" && project.currentBestMiner === SYSTEM_PROGRAM) {
        return false;
      }
      if (filter === "baseline" && project.currentBestMiner !== SYSTEM_PROGRAM) {
        return false;
      }
      if (
        filter === "open-pool" &&
        BigInt(project.minerPoolCap) <= BigInt(project.minerPoolMinted)
      ) {
        return false;
      }
      if (filter === "minted" && BigInt(project.totalSupply) <= 0n) {
        return false;
      }
      if (!q) return true;
      return (
        project.tokenName.toLowerCase().includes(q) ||
        project.tokenSymbol.toLowerCase().includes(q) ||
        project.mint.toLowerCase().includes(q) ||
        project.currentBestMiner.toLowerCase().includes(q) ||
        project.protocolHash.toLowerCase().includes(q)
      );
    });

    return [...out].sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === "price") {
        const ap = currentPrice(a);
        const bp = currentPrice(b);
        if (ap < bp) return -1;
        if (ap > bp) return 1;
        return 0;
      }
      const ai = improvementValue(a);
      const biValue = improvementValue(b);
      if (biValue > ai) return 1;
      if (biValue < ai) return -1;
      return 0;
    });
  }, [projects, query, filter, sort]);

  return (
    <>
      <section className="border-b border-[var(--color-line)]">
        <div className="container-page py-16 md:py-20">
          <div className="flex flex-col gap-4">
            <p className="label">/ projects</p>
            <h2 className="font-sans text-3xl leading-tight font-medium tracking-tight text-[var(--color-fg)] md:text-[44px]">
              All active benchmarks
            </h2>
            <p className="max-w-2xl font-sans text-base leading-relaxed text-[var(--color-fg-muted)]">
              {projects.length} project{projects.length === 1 ? "" : "s"}.
              Click any row for the deep dive.
            </p>
          </div>

          <ProjectsToolbar
            filter={filter}
            setFilter={setFilter}
            query={query}
            setQuery={setQuery}
            sort={sort}
            setSort={setSort}
          />

          {filtered.length === 0 ? (
            <div className="mt-8 border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] px-8 py-14 text-center">
              <p className="label">No matches</p>
              <p className="mt-4 font-sans text-base text-[var(--color-fg-muted)]">
                Try a different search, or clear filters.
              </p>
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
              <table className="w-full min-w-[1040px] border-collapse">
                <thead className="bg-[var(--color-bg)]">
                  <tr className="border-b border-[var(--color-line)]">
                    {[
                      "Project",
                      "Token",
                      "Baseline",
                      "Best",
                      "Delta",
                      "Baseline to best",
                      "Supply",
                      "Pool",
                      "Status",
                      "",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--color-fg-dim)] uppercase"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-[var(--color-line)]">
        <div className="container-page grid grid-cols-1 gap-10 py-16 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <RegistrySnapshot projects={projects} />
          <TopMiners projects={projects} />
        </div>
      </section>
    </>
  );
}

function ProjectsToolbar({
  filter,
  setFilter,
  query,
  setQuery,
  sort,
  setSort,
}: {
  filter: FilterId;
  setFilter: (value: FilterId) => void;
  query: string;
  setQuery: (value: string) => void;
  sort: SortId;
  setSort: (value: SortId) => void;
}) {
  return (
    <div className="mt-8 grid gap-4 border-y border-[var(--color-line)] py-5 lg:grid-cols-[1fr_310px_220px] lg:items-center">
      <div className="flex flex-wrap gap-2">
        {registryFilters.map((item) => {
          const active = filter === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                active
                  ? "border-[rgb(74_222_188_/_0.45)] bg-[rgb(74_222_188_/_0.08)] text-[var(--color-accent)]"
                  : "border-[var(--color-line-2)] text-[var(--color-fg-muted)] hover:border-[var(--color-line-3)] hover:text-[var(--color-fg)]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="$ search project, miner, cid..."
        className="rounded-[var(--radius-sm)] border border-[var(--color-line-2)] bg-[var(--color-bg)] px-4 py-3 font-mono text-[12px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none"
      />

      <label className="flex items-center gap-2">
        <span className="label-muted shrink-0">sort</span>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortId)}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line-2)] bg-[var(--color-bg)] px-3 py-3 font-mono text-[12px] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none"
        >
          <option value="improvement">Best improvement</option>
          <option value="newest">Newest</option>
          <option value="price">Cheapest next price</option>
        </select>
      </label>
    </div>
  );
}

function ProjectRow({ project }: { project: ProjectListItem }) {
  const baseline = bi(project.baselineAggregateScore);
  const currentBest = bi(project.currentBestAggregateScore);
  const improvement = aggregateImprovement(currentBest, baseline);
  const delta = aggregateDeltaPercent(currentBest, baseline);
  const status = projectStatus(project);
  const minerPoolCap = bi(project.minerPoolCap);
  const minerPoolMinted = bi(project.minerPoolMinted);
  const poolPercent =
    minerPoolCap > 0n ? Number((minerPoolMinted * 10000n) / minerPoolCap) / 100 : 0;

  return (
    <tr
      className="border-b border-[var(--color-line)] transition-colors last:border-b-0 hover:bg-[rgb(74_222_188_/_0.055)]"
    >
      <td className="px-4 py-4">
        <Link
          href={`/projects/${project.id}`}
          className="font-mono text-sm text-[var(--color-fg)] underline-offset-4 hover:text-[var(--color-accent)] hover:underline"
        >
          {project.tokenName}
        </Link>
        <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-[var(--color-fg-dim)]">
          <span>{project.tokenSymbol}</span>
          <span>cid · {shortHash(project.protocolHash, 6, 4)}</span>
        </div>
      </td>
      <td className="px-4 py-4 font-mono text-xs text-[var(--color-fg-muted)]">
        <span className="block text-[var(--color-fg)]">{project.tokenSymbol}</span>
        <span className="mt-1 block">
          <AddressLink address={project.mint} />
        </span>
      </td>
      <td className="tick px-4 py-4 text-sm text-[var(--color-fg-muted)]">
        {formatAggregateScore(baseline)}
      </td>
      <td className="tick px-4 py-4 text-sm text-[var(--color-fg)]">
        {formatAggregateScore(currentBest)}
      </td>
      <td className="tick px-4 py-4 text-sm">
        {delta === null ? (
          <span className="text-[var(--color-fg-dim)]">-</span>
        ) : (
          <span
            className={
              delta >= 0
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-rose)]"
            }
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(2)}%
          </span>
        )}
        <div className="mt-1 font-mono text-[10px] text-[var(--color-fg-dim)]">
          {formatAggregateScore(improvement)}
        </div>
      </td>
      <td className="px-4 py-4">
        <Sparkline baseline={baseline} current={currentBest} />
      </td>
      <td className="px-4 py-4 font-mono text-xs text-[var(--color-fg-muted)]">
        {formatTokenAmount(bi(project.totalSupply), project.decimals)}{" "}
        {project.tokenSymbol}
      </td>
      <td className="px-4 py-4">
        <div className="font-mono text-xs text-[var(--color-fg)]">
          {formatSol(currentPrice(project))} SOL
        </div>
        <div className="mt-2 h-1.5 w-24 rounded-full bg-[rgb(255_255_255_/_0.08)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)]"
            style={{ width: `${Math.max(4, Math.min(100, poolPercent))}%` }}
          />
        </div>
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase ${
            status === "winning"
              ? "border-[rgb(74_222_188_/_0.45)] bg-[rgb(74_222_188_/_0.08)] text-[var(--color-accent)]"
              : status === "iterating"
                ? "border-[rgb(96_165_250_/_0.42)] bg-[rgb(96_165_250_/_0.08)] text-[var(--color-cyan)]"
                : "border-[var(--color-line-2)] bg-[rgb(255_255_255_/_0.03)] text-[var(--color-fg-muted)]"
          }`}
        >
          {status}
        </span>
      </td>
      <td className="px-4 py-4 text-right text-[var(--color-fg-dim)]">
        <Link
          href={`/projects/${project.id}`}
          aria-label={`Open ${project.tokenName}`}
          className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--color-line-2)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          <Arrow />
        </Link>
      </td>
    </tr>
  );
}

function Sparkline({
  baseline,
  current,
}: {
  baseline: bigint;
  current: bigint;
}) {
  const w = 92;
  const h = 28;
  const b = Number(baseline);
  const c = Number(current);
  const safeB = Number.isFinite(b) ? b : 1;
  const safeC = Number.isFinite(c) ? c : safeB;
  const min = Math.min(safeB, safeC);
  const max = Math.max(safeB, safeC);
  const y = (value: number) => h - 2 - ((value - min) / (max - min || 1)) * (h - 4);
  const points = [
    [2, y(safeB)],
    [w - 2, y(safeC)],
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24">
      <path
        d={`M ${points.map((point) => point.join(",")).join(" L ")}`}
        fill="none"
        stroke="rgba(74,222,188,0.85)"
        strokeWidth="1.4"
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="2"
        fill="var(--color-accent)"
      />
    </svg>
  );
}

function RegistrySnapshot({ projects }: { projects: ProjectListItem[] }) {
  const rows = useMemo(() => makeSnapshotRows(projects), [projects]);

  return (
    <div>
      <p className="label">/ registry</p>
      <h2 className="mt-4 font-sans text-3xl font-medium tracking-tight text-[var(--color-fg)]">
        Current registry state
      </h2>
      <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
        Real project rows from the Solana program, sorted by publish date. This
        is a state snapshot, not a simulated event stream.
      </p>

      <div className="mt-8 border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
          <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">
            / registry snapshot
          </span>
          <span className="or-tag">
            <span className="dot" />
            on-chain data
          </span>
        </div>
        {rows.map((item) => (
          <div
            key={item.id}
            className="grid gap-2 border-b border-[var(--color-line)] px-4 py-3 last:border-b-0 md:grid-cols-[112px_1fr_112px_128px] md:items-center"
          >
            <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">
              {item.date}
            </span>
            <span className="font-sans text-sm text-[var(--color-fg-muted)]">
              {item.message}
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] text-[var(--color-accent)] uppercase">
              {item.status}
            </span>
            <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">
              {item.miner}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function makeSnapshotRows(projects: ProjectListItem[]) {
  return [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((project) => {
    const status = projectStatus(project);
    const miner = project.currentBestMiner === SYSTEM_PROGRAM
      ? "baseline"
      : shortAddress(project.currentBestMiner);
    return {
      id: project.id,
      date: formatDate(new Date(project.createdAt)),
      status,
      miner,
      message:
        status === "submitted"
          ? `${project.tokenName} published with baseline ${formatAggregateScore(bi(project.baselineAggregateScore))}`
          : `Miner ${miner} advanced ${project.tokenName} to ${formatAggregateScore(bi(project.currentBestAggregateScore))}`,
    };
  });
}

function TopMiners({ projects }: { projects: ProjectListItem[] }) {
  const miners = useMemo(() => {
    const byMiner = new Map<
      string,
      { miner: string; projects: ProjectListItem[]; points: bigint }
    >();

    for (const project of projects) {
      if (project.currentBestMiner === SYSTEM_PROGRAM) continue;
      const current = byMiner.get(project.currentBestMiner) ?? {
        miner: project.currentBestMiner,
        projects: [],
        points: 0n,
      };
      current.projects.push(project);
      current.points += improvementValue(project);
      byMiner.set(project.currentBestMiner, current);
    }

    return [...byMiner.values()]
      .sort((a, b) => {
        if (b.points > a.points) return 1;
        if (b.points < a.points) return -1;
        return 0;
      })
      .slice(0, 8);
  }, [projects]);

  return (
    <div>
      <p className="label">/ leaderboard</p>
      <h2 className="mt-4 font-sans text-3xl font-medium tracking-tight text-[var(--color-fg)]">
        Top miners
      </h2>
      <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
        Real current-best miners, aggregated across listed projects.
      </p>

      <div className="mt-8 border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
          <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">
            / top miners
          </span>
          <span className="or-tag">
            <span className="dot" />
            by score
          </span>
        </div>
        {miners.length === 0 ? (
          <div className="p-5">
            <p className="font-sans text-sm text-[var(--color-fg-muted)]">
              No accepted miner proposals yet.
            </p>
            <div className="mt-4 flex items-center gap-3 border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3">
              <span className="font-mono text-sm text-[var(--color-fg-dim)] select-none">
                $
              </span>
              <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] text-[var(--color-fg)]">
                {MINE_INSTALL_CMD}
              </code>
              <CopyTextButton
                text={MINE_INSTALL_CMD}
                label="Copy mining skill install command"
                variant="icon"
              />
            </div>
          </div>
        ) : (
          miners.map((row, i) => (
            <div
              key={row.miner}
              className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 last:border-b-0"
            >
              <span className="tick text-sm text-[var(--color-accent)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <AddressLink address={row.miner} />
                <small className="mt-1 block truncate font-mono text-[11px] text-[var(--color-fg-dim)]">
                  {row.projects.length} project{row.projects.length === 1 ? "" : "s"}
                </small>
              </span>
              <span className="tick text-sm text-[var(--color-fg)]">
                {formatAggregateScore(row.points)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
