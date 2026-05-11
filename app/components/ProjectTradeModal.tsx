"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getConnection, type AnchorWalletLike } from "@/lib/openResearch/client";
import {
  explorerTxUrl,
  formatSol,
  formatTokenAmount,
  lamportsFromSolString,
  shortAddress,
} from "@/lib/openResearch/format";
import { fetchUserProjectTokenBalance } from "@/lib/openResearch/read";
import {
  buyProjectTokens,
  quoteBuyForLamports,
  quoteSellTokens,
  sellProjectTokens,
} from "@/lib/openResearch/trade";

type ProjectTradeModalProps = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  mint: string;
  tokenSymbol: string;
  decimals: number;
  basePrice: string;
  slope: string;
  totalSupply: string;
};

type TradeMode = "buy" | "sell";

function parseWholeTokens(value: string): bigint {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return 0n;
  return BigInt(trimmed);
}

function buildAnchorWallet(wallet: ReturnType<typeof useWallet>): AnchorWalletLike | null {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    return null;
  }
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction as <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>,
    signAllTransactions: wallet.signAllTransactions as <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>,
  };
}

export function ProjectTradeModal({
  open,
  onClose,
  projectId,
  mint,
  tokenSymbol,
  decimals,
  basePrice,
  slope,
  totalSupply,
}: ProjectTradeModalProps) {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [tradeMode, setTradeMode] = useState<TradeMode>("buy");
  const [buySol, setBuySol] = useState("0.01");
  const [sellTokens, setSellTokens] = useState("");
  const [solBalance, setSolBalance] = useState<bigint | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anchorWallet = useMemo(() => buildAnchorWallet(wallet), [wallet]);
  const connection = useMemo(() => getConnection(), []);

  const lamportsIn = useMemo(() => lamportsFromSolString(buySol), [buySol]);
  const sellAmount = useMemo(() => parseWholeTokens(sellTokens), [sellTokens]);
  const projectKey = useMemo(() => BigInt(projectId), [projectId]);
  const supply = useMemo(() => BigInt(totalSupply), [totalSupply]);
  const curveBase = useMemo(() => BigInt(basePrice), [basePrice]);
  const curveSlope = useMemo(() => BigInt(slope), [slope]);

  const buyQuote = useMemo(
    () => quoteBuyForLamports(curveBase, curveSlope, supply, lamportsIn),
    [curveBase, curveSlope, supply, lamportsIn],
  );
  const sellQuote = useMemo(
    () => quoteSellTokens(curveBase, curveSlope, supply, sellAmount),
    [curveBase, curveSlope, supply, sellAmount],
  );

  const refreshBalances = useCallback(async () => {
    if (!wallet.publicKey) {
      setSolBalance(null);
      setTokenBalance(null);
      return;
    }

    const [lamports, token] = await Promise.all([
      connection.getBalance(wallet.publicKey, "confirmed"),
      fetchUserProjectTokenBalance(null, projectKey, wallet.publicKey, decimals),
    ]);
    setSolBalance(BigInt(lamports));
    setTokenBalance(token.amount);
  }, [connection, decimals, projectKey, wallet.publicKey]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    void refreshBalances().catch(() => undefined);
  }, [open, refreshBalances]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setTxSig(null);
      setBusy(false);
    }
  }, [open]);

  const onBuy = async () => {
    if (!anchorWallet || lamportsIn <= 0n) return;
    setBusy(true);
    setError(null);
    setTxSig(null);
    try {
      const sig = await buyProjectTokens(anchorWallet, projectKey, lamportsIn);
      setTxSig(sig);
      await refreshBalances();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onSell = async () => {
    if (!anchorWallet || sellAmount <= 0n) return;
    setBusy(true);
    setError(null);
    setTxSig(null);
    try {
      const sig = await sellProjectTokens(anchorWallet, projectKey, sellAmount);
      setTxSig(sig);
      await refreshBalances();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open || !mounted) return null;

  const walletReady = Boolean(anchorWallet);
  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgb(0 0 0 / 0.92)" }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pointer-events-auto max-h-[92vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] shadow-2xl ring-1 ring-[rgb(255_255_255_/_0.06)] backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-bg)]/95 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="trade-modal-title"
                className="font-mono text-base font-semibold tracking-tight text-[var(--color-fg)] sm:text-lg"
              >
                Trade {tokenSymbol}
              </h2>
              <p className="mt-1.5 max-w-md font-mono text-xs leading-snug text-[var(--color-fg-muted)]">
                Bonding curve on Solana devnet. Project tokens are SPL tokens
                with {decimals} decimals.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-2.5 py-1 font-mono text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-bright)]"
              aria-label="Close"
            >
              x
            </button>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6">
          <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-4">
            <h3 className="label mb-3 text-[var(--color-fg-muted)]">Wallet</h3>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {wallet.publicKey ? (
                <div className="min-w-0 font-mono text-xs">
                  <span className="text-[var(--color-fg-dim)]">Connected · </span>
                  <span className="break-all text-[var(--color-brand-bright)]">
                    {shortAddress(wallet.publicKey.toBase58())}
                  </span>
                </div>
              ) : (
                <p className="font-mono text-xs text-[var(--color-fg-muted)]">
                  Connect a Solana wallet to trade.
                </p>
              )}
              <WalletMultiButton />
            </div>

            {wallet.publicKey ? (
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--color-line)] pt-4">
                <BalanceStat
                  label="SOL"
                  value={solBalance === null ? "..." : `${formatSol(solBalance)} SOL`}
                />
                <BalanceStat
                  label={`${tokenSymbol} balance`}
                  value={
                    tokenBalance === null
                      ? "..."
                      : `${formatTokenAmount(tokenBalance, decimals, {
                          compact: false,
                        })} ${tokenSymbol}`
                  }
                />
              </div>
            ) : null}

            {wallet.publicKey && !walletReady ? (
              <p className="mt-3 font-mono text-[11px] leading-snug text-[var(--color-fg-muted)]">
                This wallet adapter does not expose the transaction signing
                methods required by Anchor.
              </p>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
            <div className="flex p-1">
              <ModeButton active={tradeMode === "buy"} onClick={() => setTradeMode("buy")}>
                Buy with SOL
              </ModeButton>
              <ModeButton active={tradeMode === "sell"} onClick={() => setTradeMode("sell")}>
                Sell for SOL
              </ModeButton>
            </div>

            <div className="space-y-3 border-t border-[var(--color-line)] p-4">
              {tradeMode === "buy" ? (
                <>
                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-[var(--color-fg-dim)]">
                      <span>You pay</span>
                      {solBalance !== null ? <span>{formatSol(solBalance)} SOL</span> : null}
                    </div>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3">
                      <input
                        value={buySol}
                        onChange={(e) => setBuySol(e.target.value)}
                        disabled={!walletReady || busy}
                        className="min-w-0 flex-1 bg-transparent font-mono text-lg tabular-nums text-[var(--color-fg)] outline-none disabled:opacity-50"
                        inputMode="decimal"
                        placeholder="0"
                        aria-label="Amount in SOL"
                      />
                      <span className="shrink-0 rounded bg-[var(--color-bg-soft)] px-2 py-1 font-mono text-xs font-medium text-[var(--color-fg-muted)]">
                        SOL
                      </span>
                    </div>
                  </div>
                  <QuoteBox
                    label="You receive"
                    value={
                      lamportsIn > 0n
                        ? `~ ${formatTokenAmount(buyQuote.tokens, decimals, {
                            compact: false,
                          })} ${tokenSymbol}`
                        : "-"
                    }
                    sub={
                      buyQuote.lamportsSpent > 0n
                        ? `${formatSol(buyQuote.lamportsSpent)} SOL spent by curve`
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => void onBuy()}
                    disabled={!walletReady || busy || lamportsIn <= 0n}
                    className="w-full rounded-lg border border-[var(--color-green)] bg-[rgb(69_181_165_/_0.14)] py-3 font-mono text-sm font-semibold text-[var(--color-green)] transition-colors hover:bg-[rgb(69_181_165_/_0.22)] disabled:opacity-40"
                  >
                    {busy ? "Confirming..." : `Buy ${tokenSymbol}`}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-[var(--color-fg-dim)]">
                      <span>You pay</span>
                      {tokenBalance !== null ? (
                        <button
                          type="button"
                          onClick={() => setSellTokens(tokenBalance.toString())}
                          className="text-[var(--color-brand)] hover:underline"
                        >
                          Max: {formatTokenAmount(tokenBalance, decimals)} {tokenSymbol}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3">
                      <input
                        value={sellTokens}
                        onChange={(e) => setSellTokens(e.target.value.replace(/[^\d]/g, ""))}
                        disabled={!walletReady || busy}
                        className="min-w-0 flex-1 bg-transparent font-mono text-lg tabular-nums text-[var(--color-fg)] outline-none disabled:opacity-50"
                        inputMode="numeric"
                        placeholder="0"
                        aria-label={`Amount in ${tokenSymbol}`}
                      />
                      <span className="shrink-0 rounded bg-[var(--color-bg-soft)] px-2 py-1 font-mono text-xs font-medium text-[var(--color-fg-muted)]">
                        {tokenSymbol}
                      </span>
                    </div>
                  </div>
                  <QuoteBox
                    label="You receive"
                    value={sellAmount > 0n ? `~ ${formatSol(sellQuote)} SOL` : "-"}
                  />
                  <button
                    type="button"
                    onClick={() => void onSell()}
                    disabled={!walletReady || busy || sellAmount <= 0n}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] py-3 font-mono text-sm font-semibold text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-bright)] disabled:opacity-40"
                  >
                    {busy ? "Confirming..." : `Sell ${tokenSymbol}`}
                  </button>
                </>
              )}
            </div>
          </section>

          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-3 font-mono text-[11px] leading-snug text-[var(--color-fg-muted)]">
            <p>
              Mint: <span className="text-[var(--color-fg)]">{shortAddress(mint)}</span>
            </p>
            <p className="mt-1">
              Curve supply: {formatTokenAmount(supply, decimals, { compact: false })}{" "}
              {tokenSymbol}. 1 SOL = {LAMPORTS_PER_SOL.toLocaleString()} lamports.
            </p>
          </div>

          {txSig ? (
            <a
              href={explorerTxUrl(txSig)}
              target="_blank"
              rel="noreferrer noopener"
              className="block rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-3 font-mono text-xs text-[var(--color-brand-bright)] underline-offset-4 hover:underline"
            >
              Transaction {shortAddress(txSig)} on explorer
            </a>
          ) : null}

          {error ? (
            <p className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-3 font-mono text-xs leading-snug text-[var(--color-fg-muted)]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function BalanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label mb-1 text-[var(--color-fg-dim)]">{label}</p>
      <p className="font-mono text-sm tabular-nums text-[var(--color-fg)]">
        {value}
      </p>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-lg bg-[var(--color-bg)] py-2.5 font-mono text-xs font-semibold text-[var(--color-fg)] shadow-sm"
          : "flex-1 rounded-lg py-2.5 font-mono text-xs text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
      }
    >
      {children}
    </button>
  );
}

function QuoteBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3">
      <p className="font-mono text-[11px] text-[var(--color-fg-dim)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm tabular-nums text-[var(--color-fg)]">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 font-mono text-[11px] text-[var(--color-fg-dim)]">
          {sub}
        </p>
      ) : null}
    </div>
  );
}
