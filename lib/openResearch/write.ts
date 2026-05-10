import { BN } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  getOpenResearchProgram,
  type AnchorWalletLike,
} from "./client";
import { hex32ToBytes } from "./hash";
import {
  uploadArtifactToIrys,
  type IrysUploadResult,
  type IrysWallet,
} from "./irys";
import { METADATA_PROGRAM_ID, pdas } from "./pdas";
import { fetchConfig, fetchProposal } from "./read";

export type CreateProjectForm = {
  protocolBytes: Uint8Array;
  protocolContentType?: string;
  repoSnapshotBytes: Uint8Array;
  repoSnapshotContentType?: string;
  benchmarkBytes: Uint8Array;
  benchmarkContentType?: string;
  baselineMetricsBytes: Uint8Array;
  baselineMetricsContentType?: string;

  baselineAggregateScore: bigint;
  tokenName: string;
  tokenSymbol: string;
  basePrice: bigint;
  slope: bigint;
  minerPoolCap: bigint;
};

export type CreateProjectResult = {
  txSignature: string;
  projectId: bigint;
  artifacts: {
    protocol: IrysUploadResult;
    repoSnapshot: IrysUploadResult;
    benchmark: IrysUploadResult;
    baselineMetrics: IrysUploadResult;
  };
};

/**
 * createProject: upload all four artifacts to Irys, hash each, then call
 * `create_project` on the program.
 *
 * NOTE: the wallet object is used both for signing the Solana transaction
 * (Anchor) and for funding/signing the Irys uploads. The wallet adapter
 * returned by useWallet() satisfies both shapes.
 */
export async function createProject(
  wallet: AnchorWalletLike & IrysWallet,
  form: CreateProjectForm,
): Promise<CreateProjectResult> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const [protocol, repoSnapshot, benchmark, baselineMetrics] = await Promise.all([
    uploadArtifactToIrys(
      wallet,
      form.protocolBytes,
      form.protocolContentType ?? "application/json",
      "protocol",
    ),
    uploadArtifactToIrys(
      wallet,
      form.repoSnapshotBytes,
      form.repoSnapshotContentType ?? "application/octet-stream",
      "repo_snapshot",
    ),
    uploadArtifactToIrys(
      wallet,
      form.benchmarkBytes,
      form.benchmarkContentType ?? "application/octet-stream",
      "benchmark",
    ),
    uploadArtifactToIrys(
      wallet,
      form.baselineMetricsBytes,
      form.baselineMetricsContentType ?? "application/json",
      "metrics",
    ),
  ]);

  const program = getOpenResearchProgram(wallet);
  const cfg = await fetchConfig(program);
  if (!cfg) throw new Error("Program is not initialized (no GlobalConfig).");

  const projectId = cfg.nextProjectId;
  const mint = pdas.mint(projectId);

  const txSignature = await program.methods
    .createProject({
      protocolHash: protocol.hashBytes,
      protocolIrysId: protocol.irysIdBytes,
      repoSnapshotHash: repoSnapshot.hashBytes,
      repoSnapshotIrysId: repoSnapshot.irysIdBytes,
      benchmarkHash: benchmark.hashBytes,
      benchmarkIrysId: benchmark.irysIdBytes,
      baselineAggregateScore: new BN(form.baselineAggregateScore.toString()),
      baselineMetricsHash: baselineMetrics.hashBytes,
      baselineMetricsIrysId: baselineMetrics.irysIdBytes,
      tokenName: form.tokenName,
      tokenSymbol: form.tokenSymbol,
      basePrice: new BN(form.basePrice.toString()),
      slope: new BN(form.slope.toString()),
      minerPoolCap: new BN(form.minerPoolCap.toString()),
    } as any)
    .accounts({
      creator: wallet.publicKey,
      config: pdas.config(),
      project: pdas.project(projectId),
      mint,
      mintAuthority: pdas.mintAuthority(projectId),
      solVault: pdas.solVault(projectId),
      projectPool: pdas.projectPool(projectId),
      tokenMetadata: pdas.tokenMetadata(mint),
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      metadataProgram: METADATA_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    } as any)
    .rpc();

  return {
    txSignature,
    projectId,
    artifacts: { protocol, repoSnapshot, benchmark, baselineMetrics },
  };
}

export type SubmitProposalArtifacts = {
  codeBytes: Uint8Array;
  codeContentType?: string;
  benchmarkLogBytes: Uint8Array;
  benchmarkLogContentType?: string;
};

export type SubmitProposalResult = {
  txSignature: string;
  proposalId: bigint;
  code: IrysUploadResult;
  benchmarkLog: IrysUploadResult;
};

export async function submitProposal(
  wallet: AnchorWalletLike & IrysWallet,
  projectId: bigint | number,
  artifacts: SubmitProposalArtifacts,
  claimedScore: bigint,
  stake: bigint,
  rewardRecipient: PublicKey,
): Promise<SubmitProposalResult> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const [code, benchmarkLog] = await Promise.all([
    uploadArtifactToIrys(
      wallet,
      artifacts.codeBytes,
      artifacts.codeContentType ?? "application/octet-stream",
      "code",
    ),
    uploadArtifactToIrys(
      wallet,
      artifacts.benchmarkLogBytes,
      artifacts.benchmarkLogContentType ?? "application/octet-stream",
      "benchmark",
    ),
  ]);

  const program = getOpenResearchProgram(wallet);
  const cfg = await fetchConfig(program);
  if (!cfg) throw new Error("Program is not initialized (no GlobalConfig).");
  const proposalId = cfg.nextProposalId;

  const mint = pdas.mint(projectId);
  const minerTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const txSignature = await program.methods
    .submit(
      new BN(projectId.toString()),
      code.hashBytes,
      code.irysIdBytes,
      benchmarkLog.hashBytes,
      benchmarkLog.irysIdBytes,
      new BN(claimedScore.toString()),
      new BN(stake.toString()),
      rewardRecipient,
    )
    .accounts({
      miner: wallet.publicKey,
      config: pdas.config(),
      project: pdas.project(projectId),
      mint,
      mintAuthority: pdas.mintAuthority(projectId),
      proposal: pdas.proposal(proposalId),
      proposalEscrow: pdas.proposalEscrow(proposalId),
      minerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    } as any)
    .rpc();

  return { txSignature, proposalId, code, benchmarkLog };
}

export async function claimReview(
  wallet: AnchorWalletLike,
  proposalId: bigint | number,
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  const program = getOpenResearchProgram(wallet);
  return program.methods
    .claimReview(new BN(proposalId.toString()))
    .accounts({
      verifier: wallet.publicKey,
      verifierEntry: pdas.verifier(wallet.publicKey),
      proposal: pdas.proposal(proposalId),
    } as any)
    .rpc();
}

export type ApproveResult = {
  txSignature: string;
  metrics: IrysUploadResult;
};

export async function approveProposal(
  wallet: AnchorWalletLike & IrysWallet,
  proposalId: bigint | number,
  verifiedScore: bigint,
  metricsBytes: Uint8Array,
  metricsContentType = "application/json",
): Promise<ApproveResult> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const metrics = await uploadArtifactToIrys(
    wallet,
    metricsBytes,
    metricsContentType,
    "metrics",
  );

  const program = getOpenResearchProgram(wallet);
  const proposal = await fetchProposal(program, proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

  const mint = pdas.mint(proposal.projectId);
  const minerTokenAccount = getAssociatedTokenAddressSync(
    mint,
    proposal.miner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const rewardRecipientTokenAccount = getAssociatedTokenAddressSync(
    mint,
    proposal.rewardRecipient,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const txSignature = await program.methods
    .approve(
      new BN(proposalId.toString()),
      new BN(verifiedScore.toString()),
      metrics.hashBytes,
      metrics.irysIdBytes,
    )
    .accounts({
      verifier: wallet.publicKey,
      verifierEntry: pdas.verifier(wallet.publicKey),
      proposal: pdas.proposal(proposalId),
      project: pdas.project(proposal.projectId),
      mint,
      mintAuthority: pdas.mintAuthority(proposal.projectId),
      proposalEscrow: pdas.proposalEscrow(proposalId),
      minerTokenAccount,
      rewardRecipientTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .rpc();

  return { txSignature, metrics };
}

export type RejectResult = {
  txSignature: string;
  metrics: IrysUploadResult;
};

export async function rejectProposal(
  wallet: AnchorWalletLike & IrysWallet,
  proposalId: bigint | number,
  metricsBytes: Uint8Array,
  metricsContentType = "application/json",
): Promise<RejectResult> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const metrics = await uploadArtifactToIrys(
    wallet,
    metricsBytes,
    metricsContentType,
    "metrics",
  );

  const program = getOpenResearchProgram(wallet);
  const proposal = await fetchProposal(program, proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

  const mint = pdas.mint(proposal.projectId);

  const txSignature = await program.methods
    .reject(new BN(proposalId.toString()), metrics.hashBytes, metrics.irysIdBytes)
    .accounts({
      verifier: wallet.publicKey,
      verifierEntry: pdas.verifier(wallet.publicKey),
      proposal: pdas.proposal(proposalId),
      project: pdas.project(proposal.projectId),
      mint,
      mintAuthority: pdas.mintAuthority(proposal.projectId),
      proposalEscrow: pdas.proposalEscrow(proposalId),
      projectPool: pdas.projectPool(proposal.projectId),
      claimable: pdas.claimable(proposal.projectId, wallet.publicKey),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return { txSignature, metrics };
}

export async function expireProposal(
  wallet: AnchorWalletLike,
  proposalId: bigint | number,
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const program = getOpenResearchProgram(wallet);
  const proposal = await fetchProposal(program, proposalId);
  if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

  const mint = pdas.mint(proposal.projectId);

  return program.methods
    .expire(new BN(proposalId.toString()))
    .accounts({
      cranker: wallet.publicKey,
      proposal: pdas.proposal(proposalId),
      project: pdas.project(proposal.projectId),
      mint,
      mintAuthority: pdas.mintAuthority(proposal.projectId),
      proposalEscrow: pdas.proposalEscrow(proposalId),
      projectPool: pdas.projectPool(proposal.projectId),
      claimable: pdas.claimable(proposal.projectId, wallet.publicKey),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();
}

export async function claimReward(
  wallet: AnchorWalletLike,
  projectId: bigint | number,
): Promise<string> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const program = getOpenResearchProgram(wallet);
  const mint = pdas.mint(projectId);
  const claimerTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  return program.methods
    .claimReward(new BN(projectId.toString()))
    .accounts({
      claimer: wallet.publicKey,
      project: pdas.project(projectId),
      mint,
      mintAuthority: pdas.mintAuthority(projectId),
      projectPool: pdas.projectPool(projectId),
      claimable: pdas.claimable(projectId, wallet.publicKey),
      claimerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .rpc();
}

/**
 * Convenience: turn a hex-string artifact hash from the UI into the byte
 * array shape Anchor expects when manually crafting transactions.
 */
export function hashStringToBytes(hex: string): number[] {
  return hex32ToBytes(hex);
}
