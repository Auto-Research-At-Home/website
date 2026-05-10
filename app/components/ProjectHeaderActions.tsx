"use client";

import { useState } from "react";
import { CopyTextButton } from "./CopyTextButton";
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

  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}
      >
        <CopyTextButton
          variant="label"
          text={mint}
          label="Copy project token mint for mining"
          idleLabel="Mine"
          className="!normal-case"
        />
        <button
          type="button"
          onClick={() => setTradeOpen(true)}
          className="shrink-0 cursor-pointer rounded border border-[var(--color-line)] bg-[var(--color-bg)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-brand-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-bright)]"
        >
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
