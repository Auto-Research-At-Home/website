"use client";

import { useState } from "react";
import { CopyTextButton } from "./CopyTextButton";
import { ProjectTradeModal } from "./ProjectTradeModal";

type ProjectHeaderActionsProps = {
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  decimals: number;
  className?: string;
};

export function ProjectHeaderActions({
  tokenAddress,
  tokenSymbol,
  decimals,
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
          text={tokenAddress}
          label="Copy project token contract address for mining"
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
        tokenAddress={tokenAddress}
        tokenSymbol={tokenSymbol}
        decimals={decimals}
      />
    </>
  );
}
