import { BN } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  type Account as TokenAccount,
  type Mint,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  getConnection,
  getOpenResearchProgram,
  type AnchorWalletLike,
  type OpenResearchProgram,
} from "./client";
import { bytesToHex } from "./hash";
import { irysIdFromBytes32 } from "./irys";
import { pdas } from "./pdas";

export type Hex = `0x${string}`;

/* ---------- Normalized read types ---------- */

export type GlobalConfigView = {
  authority: PublicKey;
  nextProjectId: bigint;
  nextProposalId: bigint;
  verifierCount: bigint;
};

export type ProjectView = {
  pda: PublicKey;
  id: bigint;
  creator: PublicKey;
  createdAt: Date;
  protocolHash: Hex;
  protocolIrysId: string | null;
  repoSnapshotHash: Hex;
  repoSnapshotIrysId: string | null;
  benchmarkHash: Hex;
  benchmarkIrysId: string | null;
  baselineAggregateScore: bigint;
  baselineMetricsHash: Hex;
  baselineMetricsIrysId: string | null;
  currentBestCodeHash: Hex;
  currentBestCodeIrysId: string | null;
  currentBestAggregateScore: bigint;
  currentBestMetricsHash: Hex;
  currentBestMetricsIrysId: string | null;
  currentBestMiner: PublicKey;
  mint: PublicKey;
  basePrice: bigint;
  slope: bigint;
  minerPoolCap: bigint;
  minerPoolMinted: bigint;
  tokenName: string;
  tokenSymbol: string;
};

export type ProposalStatus =
  | "pending"
  | "inReview"
  | "approved"
  | "rejected"
  | "expired";

export type ProposalView = {
  pda: PublicKey;
  id: bigint;
  projectId: bigint;
  miner: PublicKey;
  rewardRecipient: PublicKey;
  codeHash: Hex;
  codeIrysId: string | null;
  benchmarkLogHash: Hex;
  benchmarkLogIrysId: string | null;
  metricsHash: Hex;
  metricsIrysId: string | null;
  claimedAggregateScore: bigint;
  verifiedAggregateScore: bigint;
  stake: bigint;
  submittedAt: Date;
  reviewLockUntil: Date;
  reviewer: PublicKey;
  status: ProposalStatus;
};

/* ---------- Conversions ---------- */

function bnToBig(v: BN | bigint | number): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  // Anchor BN: signed for i64, unsigned for u64
  return BigInt(v.toString());
}

function bytes32ToHex(arr: number[]): Hex {
  return bytesToHex(arr) as Hex;
}

function statusFromAnchor(s: unknown): ProposalStatus {
  if (s && typeof s === "object") {
    const k = Object.keys(s as Record<string, unknown>)[0];
    if (k) return k as ProposalStatus;
  }
  return "pending";
}

function normalizeProject(pda: PublicKey, raw: any): ProjectView {
  return {
    pda,
    id: bnToBig(raw.id),
    creator: raw.creator,
    createdAt: new Date(Number(bnToBig(raw.createdAt)) * 1000),
    protocolHash: bytes32ToHex(raw.protocolHash),
    protocolIrysId: irysIdFromBytes32(raw.protocolIrysId),
    repoSnapshotHash: bytes32ToHex(raw.repoSnapshotHash),
    repoSnapshotIrysId: irysIdFromBytes32(raw.repoSnapshotIrysId),
    benchmarkHash: bytes32ToHex(raw.benchmarkHash),
    benchmarkIrysId: irysIdFromBytes32(raw.benchmarkIrysId),
    baselineAggregateScore: bnToBig(raw.baselineAggregateScore),
    baselineMetricsHash: bytes32ToHex(raw.baselineMetricsHash),
    baselineMetricsIrysId: irysIdFromBytes32(raw.baselineMetricsIrysId),
    currentBestCodeHash: bytes32ToHex(raw.currentBestCodeHash),
    currentBestCodeIrysId: irysIdFromBytes32(raw.currentBestCodeIrysId),
    currentBestAggregateScore: bnToBig(raw.currentBestAggregateScore),
    currentBestMetricsHash: bytes32ToHex(raw.currentBestMetricsHash),
    currentBestMetricsIrysId: irysIdFromBytes32(raw.currentBestMetricsIrysId),
    currentBestMiner: raw.currentBestMiner,
    mint: raw.mint,
    basePrice: bnToBig(raw.basePrice),
    slope: bnToBig(raw.slope),
    minerPoolCap: bnToBig(raw.minerPoolCap),
    minerPoolMinted: bnToBig(raw.minerPoolMinted),
    tokenName: raw.tokenName,
    tokenSymbol: raw.tokenSymbol,
  };
}

function normalizeProposal(pda: PublicKey, raw: any): ProposalView {
  return {
    pda,
    id: bnToBig(raw.id),
    projectId: bnToBig(raw.projectId),
    miner: raw.miner,
    rewardRecipient: raw.rewardRecipient,
    codeHash: bytes32ToHex(raw.codeHash),
    codeIrysId: irysIdFromBytes32(raw.codeIrysId),
    benchmarkLogHash: bytes32ToHex(raw.benchmarkLogHash),
    benchmarkLogIrysId: irysIdFromBytes32(raw.benchmarkLogIrysId),
    metricsHash: bytes32ToHex(raw.metricsHash),
    metricsIrysId: irysIdFromBytes32(raw.metricsIrysId),
    claimedAggregateScore: bnToBig(raw.claimedAggregateScore),
    verifiedAggregateScore: bnToBig(raw.verifiedAggregateScore),
    stake: bnToBig(raw.stake),
    submittedAt: new Date(Number(bnToBig(raw.submittedAt)) * 1000),
    reviewLockUntil: new Date(Number(bnToBig(raw.reviewLockUntil)) * 1000),
    reviewer: raw.reviewer,
    status: statusFromAnchor(raw.status),
  };
}

/* ---------- Reads ---------- */

function programOrFresh(
  walletOrProgram?: AnchorWalletLike | OpenResearchProgram | null,
): OpenResearchProgram {
  if (
    walletOrProgram &&
    typeof (walletOrProgram as OpenResearchProgram).account === "object"
  ) {
    return walletOrProgram as OpenResearchProgram;
  }
  return getOpenResearchProgram(walletOrProgram as AnchorWalletLike | null);
}

export async function fetchConfig(
  wallet?: AnchorWalletLike | OpenResearchProgram | null,
): Promise<GlobalConfigView | null> {
  const program = programOrFresh(wallet);
  const pda = pdas.config();
  try {
    const raw: any = await program.account.globalConfig.fetch(pda);
    return {
      authority: raw.authority,
      nextProjectId: bnToBig(raw.nextProjectId),
      nextProposalId: bnToBig(raw.nextProposalId),
      verifierCount: bnToBig(raw.verifierCount),
    };
  } catch {
    return null;
  }
}

export async function fetchProject(
  wallet: AnchorWalletLike | OpenResearchProgram | null | undefined,
  projectId: bigint | number,
): Promise<ProjectView | null> {
  const program = programOrFresh(wallet);
  const pda = pdas.project(projectId);
  try {
    const raw: any = await program.account.project.fetch(pda);
    return normalizeProject(pda, raw);
  } catch {
    return null;
  }
}

export async function listProjects(
  wallet?: AnchorWalletLike | OpenResearchProgram | null,
): Promise<ProjectView[]> {
  const program = programOrFresh(wallet);

  // Preferred path: program.account.project.all()
  try {
    const rows = await program.account.project.all();
    const out = rows.map((r) => normalizeProject(r.publicKey, r.account as any));
    out.sort((a, b) => Number(a.id - b.id));
    return out;
  } catch {
    // Fallback: enumerate by id from config.nextProjectId
    const cfg = await fetchConfig(program);
    if (!cfg) return [];
    const n = Number(cfg.nextProjectId);
    const ids = Array.from({ length: n }, (_, i) => i);
    const results = await Promise.all(ids.map((id) => fetchProject(program, id)));
    return results.filter((p): p is ProjectView => p !== null);
  }
}

export async function fetchProposal(
  wallet: AnchorWalletLike | OpenResearchProgram | null | undefined,
  proposalId: bigint | number,
): Promise<ProposalView | null> {
  const program = programOrFresh(wallet);
  const pda = pdas.proposal(proposalId);
  try {
    const raw: any = await program.account.proposal.fetch(pda);
    return normalizeProposal(pda, raw);
  } catch {
    return null;
  }
}

export async function listProposals(
  wallet?: AnchorWalletLike | OpenResearchProgram | null,
): Promise<ProposalView[]> {
  const program = programOrFresh(wallet);
  try {
    const rows = await program.account.proposal.all();
    const out = rows.map((r) =>
      normalizeProposal(r.publicKey, r.account as any),
    );
    out.sort((a, b) => Number(a.id - b.id));
    return out;
  } catch {
    const cfg = await fetchConfig(program);
    if (!cfg) return [];
    const n = Number(cfg.nextProposalId);
    const ids = Array.from({ length: n }, (_, i) => i);
    const results = await Promise.all(
      ids.map((id) => fetchProposal(program, id)),
    );
    return results.filter((p): p is ProposalView => p !== null);
  }
}

/* ---------- SPL token reads ---------- */

export type ProjectMintInfo = {
  mint: PublicKey;
  decimals: number;
  /** raw on-chain supply. Decimals are 0 for project tokens. */
  supply: bigint;
  raw: Mint;
};

export async function fetchProjectMint(
  _wallet: AnchorWalletLike | null | undefined,
  projectId: bigint | number,
): Promise<ProjectMintInfo | null> {
  const connection = getConnection();
  const mintPda = pdas.mint(projectId);
  try {
    const m = await getMint(connection, mintPda);
    return {
      mint: mintPda,
      decimals: m.decimals,
      supply: BigInt(m.supply.toString()),
      raw: m,
    };
  } catch {
    return null;
  }
}

export type UserTokenBalance = {
  ata: PublicKey;
  exists: boolean;
  amount: bigint;
  decimals: number;
};

export async function fetchUserProjectTokenBalance(
  _wallet: AnchorWalletLike | null | undefined,
  projectId: bigint | number,
  owner: PublicKey,
  decimalsHint = 0,
): Promise<UserTokenBalance> {
  const connection = getConnection();
  const mintPda = pdas.mint(projectId);
  const ata = getAssociatedTokenAddressSync(
    mintPda,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  try {
    const acc: TokenAccount = await getAccount(connection, ata);
    return {
      ata,
      exists: true,
      amount: BigInt(acc.amount.toString()),
      decimals: decimalsHint,
    };
  } catch {
    return { ata, exists: false, amount: 0n, decimals: decimalsHint };
  }
}
