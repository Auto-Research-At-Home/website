"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import {
  useBalance,
  useConnect,
  useConnection,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { projectTokenAbi } from "@/lib/arah/abis";
import { galileo } from "@/lib/arah/chain";
import { formatTokenAmount, shortAddress } from "@/lib/arah/format";
import { switchToGalileoWallet } from "@/lib/arah/switchToGalileoWallet";
import { watchErc20InWallet } from "@/lib/arah/watchErc20InWallet";

type ProjectTradeModalProps = {
  open: boolean;
  onClose: () => void;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  decimals: number;
};

/** Optional logo for “Add token” in MetaMask (absolute HTTPS). */
const TOKEN_ICON_URL = "https://openresearch.xyz/logos/icon.png";

type TradeMode = "buy" | "sell";

export function ProjectTradeModal({
  open,
  onClose,
  tokenAddress,
  tokenSymbol,
  decimals,
}: ProjectTradeModalProps) {
  const [mounted, setMounted] = useState(false);
  const { address, chainId, status } = useConnection();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const [switching, setSwitching] = useState(false);
  const [switchErr, setSwitchErr] = useState<string | null>(null);
  const [tradeMode, setTradeMode] = useState<TradeMode>("buy");
  const [buyEth, setBuyEth] = useState("0.01");
  const [sellTokens, setSellTokens] = useState("");
  const [addTokenBusy, setAddTokenBusy] = useState(false);
  const [addTokenErr, setAddTokenErr] = useState<string | null>(null);

  const { data: nativeBal } = useBalance({
    address,
    chainId: galileo.id,
    query: { enabled: Boolean(address) && chainId === galileo.id },
  });

  const injectedConnector = useMemo(
    () => connectors.find((c) => c.id === "injected"),
    [connectors],
  );

  const {
    data: balance,
    refetch: refetchBalance,
    isLoading: balanceLoading,
  } = useReadContract({
    address: tokenAddress,
    abi: projectTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: open && Boolean(address) },
  });

  const buyWei = useMemo(() => {
    try {
      return parseEther(buyEth || "0");
    } catch {
      return 0n;
    }
  }, [buyEth]);

  const sellAmount = useMemo(() => {
    try {
      return parseUnits(sellTokens || "0", decimals);
    } catch {
      return 0n;
    }
  }, [sellTokens, decimals]);

  const { data: quoteBuyOut } = useReadContract({
    address: tokenAddress,
    abi: projectTokenAbi,
    functionName: "quoteBuy",
    args: [buyWei],
    query: { enabled: open && buyWei > 0n },
  });

  const { data: quoteSellOut } = useReadContract({
    address: tokenAddress,
    abi: projectTokenAbi,
    functionName: "quoteSell",
    args: [sellAmount],
    query: { enabled: open && sellAmount > 0n },
  });

  const {
    mutateAsync: writeContractAsync,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess: txSuccess, isError: txError } =
    useWaitForTransactionReceipt({
      hash: txHash,
      query: { enabled: Boolean(txHash) },
    });

  const invalidateReads = useCallback(async () => {
    await refetchBalance();
  }, [refetchBalance]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!txHash || isConfirming) return;
    if (txSuccess) void invalidateReads();
    if (txSuccess || txError) setTxHash(undefined);
  }, [txHash, isConfirming, txSuccess, txError, invalidateReads]);

  useEffect(() => {
    if (!open) {
      resetWrite();
      setTxHash(undefined);
      setSwitchErr(null);
      setAddTokenErr(null);
    }
  }, [open, resetWrite]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onConnect = () => {
    if (!injectedConnector) return;
    connect({ connector: injectedConnector });
  };

  const onSwitchChain = () => {
    setSwitchErr(null);
    setSwitching(true);
    void (async () => {
      try {
        await switchToGalileoWallet();
      } catch (e) {
        setSwitchErr(e instanceof Error ? e.message : String(e));
      } finally {
        setSwitching(false);
      }
    })();
  };

  const onAddToken = () => {
    setAddTokenErr(null);
    setAddTokenBusy(true);
    void (async () => {
      try {
        await watchErc20InWallet({
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals,
          image: TOKEN_ICON_URL,
        });
      } catch (e) {
        setAddTokenErr(e instanceof Error ? e.message : String(e));
      } finally {
        setAddTokenBusy(false);
      }
    })();
  };

  const busy = isWritePending || isConfirming;

  const onBuy = async () => {
    if (!address || chainId !== galileo.id || buyWei <= 0n) return;
    const hash = await writeContractAsync({
      address: tokenAddress,
      abi: projectTokenAbi,
      functionName: "buy",
      value: buyWei,
      chainId: galileo.id,
    });
    setTxHash(hash);
  };

  const onSell = async () => {
    if (!address || chainId !== galileo.id || sellAmount <= 0n) return;
    const hash = await writeContractAsync({
      address: tokenAddress,
      abi: projectTokenAbi,
      functionName: "sell",
      args: [sellAmount],
      chainId: galileo.id,
    });
    setTxHash(hash);
  };

  const wrongChain = Boolean(address && chainId !== galileo.id);
  const nativeSymbol = nativeBal?.symbol ?? galileo.nativeCurrency.symbol;

  if (!open || !mounted) return null;

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
                Bonding curve on 0G Galileo — pay native {nativeSymbol} to buy;
                sell returns {nativeSymbol}.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-2.5 py-1 font-mono text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-bright)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6">
          <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-4">
            <h3 className="label mb-3 text-[var(--color-fg-muted)]">Wallet</h3>
            {status === "connecting" || status === "reconnecting" ? (
              <p className="font-mono text-xs text-[var(--color-fg-muted)]">
                Connecting…
              </p>
            ) : address ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0 font-mono text-xs">
                    <span className="text-[var(--color-fg-dim)]">Connected · </span>
                    <span className="break-all text-[var(--color-brand-bright)]">
                      {shortAddress(address)}
                    </span>
                  </div>
                  {nativeBal ? (
                    <span className="shrink-0 font-mono text-xs text-[var(--color-fg-dim)]">
                      {nativeSymbol}:{" "}
                      {formatUnits(nativeBal.value, nativeBal.decimals)}
                    </span>
                  ) : null}
                </div>
                {wrongChain ? (
                  <div className="mt-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-3">
                    <p className="font-mono text-xs text-[var(--color-fg-muted)]">
                      Switch to{" "}
                      <strong className="text-[var(--color-fg)]">{galileo.name}</strong>{" "}
                      to trade.
                    </p>
                    <button
                      type="button"
                      onClick={onSwitchChain}
                      disabled={switching}
                      className="mt-3 w-full rounded-md border border-[var(--color-brand)] bg-[var(--color-brand-subtle)] py-2.5 font-mono text-xs font-medium text-[var(--color-brand-bright)] hover:bg-[var(--color-brand-line)] disabled:opacity-50"
                    >
                      {switching ? "Switching…" : "Switch network"}
                    </button>
                    {switchErr ? (
                      <p className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-snug text-[var(--color-fg-muted)]">
                        {switchErr}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 font-mono text-[11px] text-[var(--color-fg-dim)]">
                    Network: {galileo.name}
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="label mb-1 text-[var(--color-fg-dim)]">
                      {tokenSymbol} balance
                    </p>
                    <p className="font-mono text-sm tabular-nums text-[var(--color-fg)]">
                      {balanceLoading
                        ? "…"
                        : `${formatTokenAmount(balance ?? 0n, decimals, {
                            compact: false,
                            maxFractionDigits: 8,
                          })} ${tokenSymbol}`}
                    </p>
                  </div>
                  {address && !wrongChain ? (
                    <button
                      type="button"
                      onClick={onAddToken}
                      disabled={addTokenBusy}
                      className="shrink-0 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 font-mono text-[11px] text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-bright)] disabled:opacity-50"
                    >
                      {addTokenBusy ? "Adding…" : `Add ${tokenSymbol} to wallet`}
                    </button>
                  ) : null}
                </div>
                {addTokenErr ? (
                  <p className="font-mono text-[11px] text-[var(--color-fg-muted)]">
                    {addTokenErr}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={onConnect}
                disabled={!injectedConnector || isConnecting}
                className="w-full rounded-md border border-[var(--color-brand)] bg-[var(--color-brand-subtle)] py-3 font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-brand-bright)] transition-colors hover:bg-[var(--color-brand-line)] disabled:opacity-50"
              >
                {!injectedConnector
                  ? "No injected wallet"
                  : isConnecting
                    ? "Connecting…"
                    : "Connect wallet"}
              </button>
            )}
          </section>

          {/* Swap-style buy / sell */}
          <section className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-soft)]">
            <div className="flex p-1">
              <button
                type="button"
                onClick={() => setTradeMode("buy")}
                className={
                  tradeMode === "buy"
                    ? "flex-1 rounded-lg bg-[var(--color-bg)] py-2.5 font-mono text-xs font-semibold text-[var(--color-fg)] shadow-sm"
                    : "flex-1 rounded-lg py-2.5 font-mono text-xs text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
                }
              >
                Buy with {nativeSymbol}
              </button>
              <button
                type="button"
                onClick={() => setTradeMode("sell")}
                className={
                  tradeMode === "sell"
                    ? "flex-1 rounded-lg bg-[var(--color-bg)] py-2.5 font-mono text-xs font-semibold text-[var(--color-fg)] shadow-sm"
                    : "flex-1 rounded-lg py-2.5 font-mono text-xs text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
                }
              >
                Sell for {nativeSymbol}
              </button>
            </div>

            <div className="space-y-3 border-t border-[var(--color-line)] p-4">
              {tradeMode === "buy" ? (
                <>
                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-[var(--color-fg-dim)]">
                      <span>You pay</span>
                      {nativeBal ? (
                        <span>
                          Balance:{" "}
                          {formatUnits(nativeBal.value, nativeBal.decimals)}{" "}
                          {nativeSymbol}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3">
                      <input
                        value={buyEth}
                        onChange={(e) => setBuyEth(e.target.value)}
                        disabled={!address || wrongChain || busy}
                        className="min-w-0 flex-1 bg-transparent font-mono text-lg tabular-nums text-[var(--color-fg)] outline-none disabled:opacity-50"
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`Amount in ${nativeSymbol}`}
                      />
                      <span className="shrink-0 rounded bg-[var(--color-bg-soft)] px-2 py-1 font-mono text-xs font-medium text-[var(--color-fg-muted)]">
                        {nativeSymbol}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3">
                    <p className="font-mono text-[11px] text-[var(--color-fg-dim)]">
                      You receive
                    </p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-[var(--color-fg)]">
                      {quoteBuyOut !== undefined && buyWei > 0n
                        ? `≈ ${formatTokenAmount(quoteBuyOut, decimals, { compact: false })} ${tokenSymbol}`
                        : "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onBuy()}
                    disabled={!address || wrongChain || busy || buyWei <= 0n}
                    className="w-full rounded-lg border border-[var(--color-green)] bg-[rgb(69_181_165_/_0.14)] py-3 font-mono text-sm font-semibold text-[var(--color-green)] transition-colors hover:bg-[rgb(69_181_165_/_0.22)] disabled:opacity-40"
                  >
                    {busy ? "Confirm in wallet…" : `Buy ${tokenSymbol}`}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-[var(--color-fg-dim)]">
                      <span>You pay</span>
                      {address && !wrongChain && balance != null ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSellTokens(formatUnits(balance, decimals))
                          }
                          className="text-[var(--color-brand)] hover:underline"
                        >
                          Max:{" "}
                          {formatTokenAmount(balance, decimals)} {tokenSymbol}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3">
                      <input
                        value={sellTokens}
                        onChange={(e) => setSellTokens(e.target.value)}
                        disabled={!address || wrongChain || busy}
                        className="min-w-0 flex-1 bg-transparent font-mono text-lg tabular-nums text-[var(--color-fg)] outline-none disabled:opacity-50"
                        inputMode="decimal"
                        placeholder="0"
                        aria-label={`Amount in ${tokenSymbol}`}
                      />
                      <span className="shrink-0 rounded bg-[var(--color-bg-soft)] px-2 py-1 font-mono text-xs font-medium text-[var(--color-fg-muted)]">
                        {tokenSymbol}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-3">
                    <p className="font-mono text-[11px] text-[var(--color-fg-dim)]">
                      You receive
                    </p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-[var(--color-fg)]">
                      {quoteSellOut !== undefined && sellAmount > 0n
                        ? `≈ ${formatEther(quoteSellOut)} ${nativeSymbol}`
                        : "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onSell()}
                    disabled={
                      !address || wrongChain || busy || sellAmount <= 0n
                    }
                    className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] py-3 font-mono text-sm font-semibold text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-bright)] disabled:opacity-40"
                  >
                    {busy ? "Confirm in wallet…" : `Sell ${tokenSymbol}`}
                  </button>
                </>
              )}
            </div>
          </section>

          {writeError ? (
            <p className="rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-3 font-mono text-xs leading-snug text-[var(--color-fg-muted)]">
              {writeError.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
