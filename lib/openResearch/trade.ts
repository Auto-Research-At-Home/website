import { BN } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import {
  OPEN_RESEARCH_PROGRAM_ID,
  getOpenResearchProgram,
  type AnchorWalletLike,
} from "./client";
import { pdas } from "./pdas";

function anchorNumToBigint(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (value && typeof value === "object" && "toString" in value) {
    return BigInt(value.toString());
  }
  throw new Error("Unexpected numeric value from Project account");
}

async function assertProjectAccount(
  program: ReturnType<typeof getOpenResearchProgram>,
  projectId: bigint | number,
) {
  const project = pdas.project(projectId);
  try {
    const raw: any = await program.account.project.fetch(project);
    const actualId = anchorNumToBigint(raw.id);
    if (actualId !== BigInt(projectId)) {
      throw new Error(
        `Project PDA ${project.toBase58()} deserialized, but contains id ${actualId.toString()} instead of ${projectId.toString()}.`,
      );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Project ${projectId.toString()} could not be read at PDA ${project.toBase58()} for program ${OPEN_RESEARCH_PROGRAM_ID.toBase58()}. Check NEXT_PUBLIC_OPEN_RESEARCH_PROGRAM_ID, the committed IDL, and that this project exists on the selected cluster. Underlying error: ${message}`,
    );
  }
}

/**
 * Buy project tokens with SOL via the on-chain bonding curve.
 * The buyer ATA is created via `init_if_needed` in the program.
 */
export async function buyProjectTokens(
  wallet: AnchorWalletLike,
  projectId: bigint | number,
  lamportsIn: bigint | number,
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const program = getOpenResearchProgram(wallet);
  await assertProjectAccount(program, projectId);
  const mint = pdas.mint(projectId);
  const buyerTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return program.methods
    .buy(new BN(projectId.toString()), new BN(lamportsIn.toString()))
    .accounts({
      buyer: wallet.publicKey,
      project: pdas.project(projectId),
      mint,
      mintAuthority: pdas.mintAuthority(projectId),
      solVault: pdas.solVault(projectId),
      buyerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

/**
 * Sell project tokens for SOL. Caller must already own a token account with
 * sufficient balance.
 */
export async function sellProjectTokens(
  wallet: AnchorWalletLike,
  projectId: bigint | number,
  amount: bigint | number,
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const program = getOpenResearchProgram(wallet);
  await assertProjectAccount(program, projectId);
  const mint = pdas.mint(projectId);
  const sellerTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return program.methods
    .sell(new BN(projectId.toString()), new BN(amount.toString()))
    .accounts({
      seller: wallet.publicKey,
      project: pdas.project(projectId),
      mint,
      solVault: pdas.solVault(projectId),
      sellerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .rpc();
}

/* ---------- Local bonding-curve quotes ---------- */

/**
 * Linear curve price for the *next* token to be minted, in lamports per token.
 * `priceAt(s) = base_price + slope * s`.
 *
 * These quotes are best-effort UI hints. The on-chain program is the source
 * of truth for the actual fill.
 */
export function priceAtSupply(
  basePrice: bigint,
  slope: bigint,
  supply: bigint,
): bigint {
  return basePrice + slope * supply;
}

/**
 * Cost in lamports to mint `n` tokens starting at `supply` for a linear curve:
 *   sum_{i=0..n-1} (base + slope*(supply+i))
 *   = n*base + slope*(n*supply + n*(n-1)/2)
 */
export function quoteBuyTokens(
  basePrice: bigint,
  slope: bigint,
  supply: bigint,
  tokens: bigint,
): bigint {
  if (tokens <= 0n) return 0n;
  const triangular = (tokens * (tokens - 1n)) / 2n;
  return tokens * basePrice + slope * (tokens * supply + triangular);
}

/**
 * Largest integer number of tokens you can buy for `lamports_in` lamports
 * starting from the given supply, using a linear bonding curve.
 *
 * Solves: tokens*base + slope*(tokens*supply + tokens*(tokens-1)/2) ≤ lamports_in
 * Quadratic in `tokens`. Solved with bigint binary search.
 */
export function quoteBuyForLamports(
  basePrice: bigint,
  slope: bigint,
  supply: bigint,
  lamportsIn: bigint,
): { tokens: bigint; lamportsSpent: bigint } {
  if (lamportsIn <= 0n) return { tokens: 0n, lamportsSpent: 0n };

  // Upper bound: when slope=0, tokens = lamportsIn / basePrice.
  // Otherwise, ignoring basePrice and supply, tokens^2 * slope/2 ≤ lamportsIn,
  // so tokens ≤ sqrt(2 * lamportsIn / slope) + 1. Take a generous bound.
  let hi = 1n;
  if (basePrice > 0n) {
    hi = lamportsIn / basePrice + 1n;
  }
  if (slope > 0n) {
    // bigint sqrt of (2 * lamportsIn / slope)
    const arg = (2n * lamportsIn) / slope + 1n;
    const sq = bigintSqrt(arg) + 1n;
    if (sq > hi) hi = sq;
  }
  if (hi < 1n) hi = 1n;

  let lo = 0n;
  while (lo < hi) {
    const mid = (lo + hi + 1n) / 2n;
    const cost = quoteBuyTokens(basePrice, slope, supply, mid);
    if (cost <= lamportsIn) lo = mid;
    else hi = mid - 1n;
  }
  return { tokens: lo, lamportsSpent: quoteBuyTokens(basePrice, slope, supply, lo) };
}

/**
 * Refund in lamports for selling `tokens` from current supply on a linear
 * curve. Sum of priceAt(supply-1) .. priceAt(supply-tokens).
 */
export function quoteSellTokens(
  basePrice: bigint,
  slope: bigint,
  supply: bigint,
  tokens: bigint,
): bigint {
  if (tokens <= 0n || supply <= 0n) return 0n;
  const n = tokens > supply ? supply : tokens;
  const startIdx = supply - n;
  const triangular = (n * (n - 1n)) / 2n;
  // sum of (base + slope*(startIdx+i)) for i=0..n-1
  return n * basePrice + slope * (n * startIdx + triangular);
}

function bigintSqrt(n: bigint): bigint {
  if (n < 0n) throw new Error("sqrt of negative");
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}
