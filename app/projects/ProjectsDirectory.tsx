"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ListedProject } from "@/lib/arah/registry";
import {
  aggregateDeltaPercent,
  aggregateImprovement,
  formatAggregateScore,
  formatDate,
  formatTokenAmount,
  shortHash,
  ZERO_ADDRESS,
} from "@/lib/arah/format";
import { CopyTextButton } from "../components/CopyTextButton";
import { AddressLink } from "../components/AddressLink";

type SortId = "newest" | "improvement" | "price";

const MINE_INSTALL_CMD =
  "npx skills add Auto-Research-At-Home/skill --skill autoresearch-mine";

export function ProjectsDirectory({ projects }: { projects: ListedProject[] }) {
  const [query, setQuery] = useState("");
  const [onlyWithProposals, setOnlyWithProposals] = useState(false);
  const [sort, setSort] = useState<SortId>("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = projects.filter((p) => {
      if (onlyWithProposals && p.currentBestMiner === ZERO_ADDRESS) return false;
      if (!q) return true;
      return (
        p.token.name.toLowerCase().includes(q) ||
        p.token.symbol.toLowerCase().includes(q) ||
        p.token.address.toLowerCase().includes(q)
      );
    });

    const sorted = [...out].sort((a, b) => {
      if (sort === "newest") return b.createdAt.getTime() - a.createdAt.getTime();

      if (sort === "improvement") {
        const ai = aggregateImprovement(
          a.currentBestAggregateScore,
          a.baselineAggregateScore,
        );
        const bi = aggregateImprovement(
          b.currentBestAggregateScore,
          b.baselineAggregateScore,
        );
        if (bi > ai) return 1;
        if (bi < ai) return -1;
        return 0;
      }

      // sort === "price"
      if (a.token.currentPriceWei < b.token.currentPriceWei) return -1;
      if (a.token.currentPriceWei > b.token.currentPriceWei) return 1;
      return 0;
    });

    return sorted;
  }, [projects, query, onlyWithProposals, sort]);

  return (
    <section>
      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
          <GettingStarted />
          <Controls
            query={query}
            setQuery={setQuery}
            onlyWithProposals={onlyWithProposals}
            setOnlyWithProposals={setOnlyWithProposals}
            sort={sort}
            setSort={setSort}
          />
        </div>

        <div className="mt-10 hidden grid-cols-[60px_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,1fr)] gap-6 border-b border-[var(--color-line)] pb-3 md:grid">
          <p className="label">#</p>
          <p className="label">Project</p>
          <p className="label">Improvement</p>
          <p className="label">Δ vs baseline</p>
          <p className="label">Supply</p>
          <p className="label text-right">Buy price</p>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] px-8 py-14 text-center">
            <p className="label">No matches</p>
            <p className="mt-4 font-sans text-base text-[var(--color-fg-muted)]">
              Try a different search, or clear filters.
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function GettingStarted() {
  return (
    <div className="border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6 md:p-8">
      <p className="label">Getting started</p>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
        Install the mining skill once. Then open a project page to start mining
        for that token address.
      </p>

      <div className="mt-4 flex items-center gap-3 border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3">
        <span className="font-mono text-sm text-[var(--color-fg-dim)] select-none">
          $
        </span>
        <code className="flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap text-[var(--color-fg)]">
          {MINE_INSTALL_CMD}
        </code>
        <CopyTextButton
          text={MINE_INSTALL_CMD}
          label="Copy mining skill install command"
          variant="icon"
        />
      </div>
    </div>
  );
}

function Controls({
  query,
  setQuery,
  onlyWithProposals,
  setOnlyWithProposals,
  sort,
  setSort,
}: {
  query: string;
  setQuery: (v: string) => void;
  onlyWithProposals: boolean;
  setOnlyWithProposals: (v: boolean) => void;
  sort: SortId;
  setSort: (v: SortId) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="label">Search</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, symbol, or token address…"
          className="mt-2 w-full border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 font-mono text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-line)]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-[var(--color-fg-muted)]">
          <input
            type="checkbox"
            checked={onlyWithProposals}
            onChange={(e) => setOnlyWithProposals(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          Has proposals
        </label>

        <div className="flex items-center gap-2">
          <p className="label">Sort</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 font-mono text-xs text-[var(--color-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-line)]"
          >
            <option value="newest">Newest</option>
            <option value="improvement">Best improvement</option>
            <option value="price">Cheapest buy price</option>
          </select>
        </div>
      </div>
    </div>
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
          {isBaseline ? "no proposals yet" : "from network best"}
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

