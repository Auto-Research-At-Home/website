import { formatUnits } from "viem";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function shortHash(value: string, lead = 10, tail = 6) {
  if (!value || value.length <= lead + tail) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

export function shortAddress(value: string) {
  return shortHash(value, 6, 4);
}

/**
 * On-chain aggregate scores use a fixed metric scale: raw `int256` ÷ 10^6
 * for display (1_000_000 raw units = 1.0).
 */
export const AGGREGATE_SCORE_DECIMALS = 6;
export const AGGREGATE_SCORE_SCALE = 1_000_000n;

/**
 * Format a raw aggregate score for UI (applies {@link AGGREGATE_SCORE_DECIMALS}).
 */
export function formatAggregateScore(value: bigint): string {
  const s = formatUnits(value, AGGREGATE_SCORE_DECIMALS);
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

/** `currentBestAggregateScore - baselineAggregateScore` (signed). */
export function aggregateImprovement(
  currentBestAggregateScore: bigint,
  baselineAggregateScore: bigint,
): bigint {
  return currentBestAggregateScore - baselineAggregateScore;
}

/**
 * Percent change vs baseline: ((current - baseline) / |baseline|) × 100.
 * Returns null if baseline is 0.
 */
export function aggregateDeltaPercent(
  currentBestAggregateScore: bigint,
  baselineAggregateScore: bigint,
): number | null {
  if (baselineAggregateScore === 0n) return null;
  const diff =
    currentBestAggregateScore - baselineAggregateScore;
  const denom =
    baselineAggregateScore < 0n
      ? -baselineAggregateScore
      : baselineAggregateScore;
  if (denom === 0n) return null;
  const d = Number(diff);
  const b = Number(denom);
  if (!Number.isFinite(d) || !Number.isFinite(b) || b === 0) return null;
  return (d / b) * 100;
}

/**
 * Format a token balance (raw on-chain bigint with `decimals` precision) into
 * a human-readable string. Uses compact notation (1.2M, 3.4B) for large
 * values, falls back to grouped decimals for small ones.
 */
export function formatTokenAmount(
  value: bigint,
  decimals: number,
  opts?: { compact?: boolean; maxFractionDigits?: number },
) {
  const compact = opts?.compact ?? true;
  const maxFractionDigits = opts?.maxFractionDigits ?? 2;
  const n = Number(formatUnits(value, decimals));

  if (!Number.isFinite(n)) {
    // Extremely large values: fall back to scientific
    return value.toString();
  }

  if (compact && Math.abs(n) >= 10_000) {
    return n.toLocaleString(undefined, {
      notation: "compact",
      maximumFractionDigits: maxFractionDigits,
    });
  }

  if (n === 0) return "0";
  if (Math.abs(n) < 0.0001) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  return n.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

export function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function explorerAddressUrl(address: string) {
  return `https://chainscan-galileo.0g.ai/address/${address}`;
}
