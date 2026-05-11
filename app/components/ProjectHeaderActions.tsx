"use client";

import { useCallback, useState } from "react";
import { ProjectTradeModal } from "./ProjectTradeModal";

type ProjectHeaderActionsProps = {
  projectId: string;
  mint: string;
  tokenSymbol: string;
  decimals: number;
  basePrice: string;
  slope: string;
  totalSupply: string;
  className?: string;
};

export function ProjectHeaderActions({
  projectId,
  mint,
  tokenSymbol,
  decimals,
  basePrice,
  slope,
  totalSupply,
  className,
}: ProjectHeaderActionsProps) {
  const [tradeOpen, setTradeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyMint = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, [mint]);

  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}
      >
        <button
          type="button"
          onClick={copyMint}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 font-mono text-[12px] text-[var(--color-brand-muted)] transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand-bright)]"
          title="Copy project token mint for mining"
        >
          {copied ? <CheckIcon /> : <MineIcon />}
          {copied ? "Copied" : "Mine"}
        </button>
        <button
          type="button"
          onClick={() => setTradeOpen(true)}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 font-mono text-[12px] text-[var(--color-brand-muted)] transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand-bright)]"
        >
          <TradeIcon />
          Trade
        </button>
      </div>
      <ProjectTradeModal
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        projectId={projectId}
        mint={mint}
        tokenSymbol={tokenSymbol}
        decimals={decimals}
        basePrice={basePrice}
        slope={slope}
        totalSupply={totalSupply}
      />
    </>
  );
}

function MineIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4l6 6-10 10H4v-6L14 4z" />
      <path d="M13 5l6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function TradeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 7h11l-3-3" />
      <path d="M17 17H6l3 3" />
      <path d="M18 7l-3 3" />
      <path d="M6 17l3-3" />
    </svg>
  );
}
