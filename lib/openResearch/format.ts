import { LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import { SOLANA_CLUSTER } from "./client";

export const SYSTEM_PROGRAM = "11111111111111111111111111111111";

export function shortHash(value: string, lead = 10, tail = 6) {
  if (!value || value.length <= lead + tail) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

export function shortAddress(value: string) {
  return shortHash(value, 6, 4);
}

export function pubkeyStr(pk: PublicKey | string | null | undefined): string {
  if (!pk) return "";
  return typeof pk === "string" ? pk : pk.toBase58();
}

/* ---------- Aggregate score ---------- */

export const AGGREGATE_SCORE_DECIMALS = 6;
export const AGGREGATE_SCORE_SCALE = 1_000_000n;

export function formatAggregateScore(value: bigint): string {
  const sign = value < 0n ? -1n : 1n;
  const abs = value < 0n ? -value : value;
  const whole = abs / AGGREGATE_SCORE_SCALE;
  const frac = abs % AGGREGATE_SCORE_SCALE;
  const fracStr = frac
    .toString()
    .padStart(AGGREGATE_SCORE_DECIMALS, "0")
    .replace(/0+$/, "");
  const n = Number(`${sign === -1n ? "-" : ""}${whole}.${fracStr || "0"}`);
  if (!Number.isFinite(n)) return value.toString();
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

export function aggregateImprovement(
  currentBest: bigint,
  baseline: bigint,
): bigint {
  return currentBest - baseline;
}

export function aggregateDeltaPercent(
  currentBest: bigint,
  baseline: bigint,
): number | null {
  if (baseline === 0n) return null;
  const denom = baseline < 0n ? -baseline : baseline;
  if (denom === 0n) return null;
  const d = Number(currentBest - baseline);
  const b = Number(denom);
  if (!Number.isFinite(d) || !Number.isFinite(b) || b === 0) return null;
  return (d / b) * 100;
}

/* ---------- SOL / lamports ---------- */

export function formatSol(lamports: bigint, maxFractionDigits = 6): string {
  const n = Number(lamports) / LAMPORTS_PER_SOL;
  if (!Number.isFinite(n)) return `${lamports} lamports`;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

export function lamportsFromSolString(s: string): bigint {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0n;
  return BigInt(Math.round(n * LAMPORTS_PER_SOL));
}

/* ---------- SPL token amounts ---------- */

export function formatTokenAmount(
  value: bigint,
  decimals: number,
  opts?: { compact?: boolean; maxFractionDigits?: number },
): string {
  const compact = opts?.compact ?? true;
  const maxFractionDigits = opts?.maxFractionDigits ?? 2;
  const divisor = 10n ** BigInt(decimals);
  const whole = value / (divisor === 0n ? 1n : divisor);
  const fracN = decimals === 0 ? 0 : Number(value % divisor) / Number(divisor);
  const n = Number(whole) + fracN;

  if (!Number.isFinite(n)) return value.toString();
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
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/* ---------- Solana explorer ---------- */

export function explorerAddressUrl(address: string | PublicKey): string {
  const a = pubkeyStr(address);
  return `https://explorer.solana.com/address/${a}?cluster=${SOLANA_CLUSTER}`;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_CLUSTER}`;
}
