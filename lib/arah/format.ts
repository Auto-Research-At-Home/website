import { formatUnits } from "viem";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function shortHash(value: string, lead = 10, tail = 6) {
  if (!value || value.length <= lead + tail) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

export function shortAddress(value: string) {
  return shortHash(value, 6, 4);
}

export function score(value: bigint) {
  return Number(formatUnits(value, 18)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

export function delta(current: bigint, baseline: bigint) {
  if (baseline === 0n) return null;
  const c = Number(formatUnits(current, 18));
  const b = Number(formatUnits(baseline, 18));
  if (b === 0) return null;
  const pct = ((c - b) / Math.abs(b)) * 100;
  return pct;
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
