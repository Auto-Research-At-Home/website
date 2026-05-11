import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";
import { OPEN_RESEARCH_PROGRAM_ID } from "./client";

/** Token Metadata program (Metaplex). Used for derived metadata PDAs. */
export const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export type Numeric = number | bigint;

export function u64Le(value: Numeric): Buffer {
  const out = Buffer.alloc(8);
  out.writeBigUInt64LE(BigInt(value));
  return out;
}

function findPda(seeds: (Buffer | Uint8Array)[]): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(seeds, OPEN_RESEARCH_PROGRAM_ID);
  return pda;
}

export const pdas = {
  config(): PublicKey {
    return findPda([Buffer.from("config")]);
  },

  verifier(verifier: PublicKey): PublicKey {
    return findPda([Buffer.from("verifier"), verifier.toBuffer()]);
  },

  project(projectId: Numeric): PublicKey {
    return findPda([Buffer.from("project"), u64Le(projectId)]);
  },

  mint(projectId: Numeric): PublicKey {
    return findPda([Buffer.from("mint"), u64Le(projectId)]);
  },

  mintAuthority(projectId: Numeric): PublicKey {
    return findPda([Buffer.from("mint_authority"), u64Le(projectId)]);
  },

  solVault(projectId: Numeric): PublicKey {
    return findPda([Buffer.from("sol_vault"), u64Le(projectId)]);
  },

  projectPool(projectId: Numeric): PublicKey {
    return findPda([Buffer.from("pool"), u64Le(projectId)]);
  },

  proposal(proposalId: Numeric): PublicKey {
    return findPda([Buffer.from("proposal"), u64Le(proposalId)]);
  },

  proposalEscrow(proposalId: Numeric): PublicKey {
    return findPda([Buffer.from("proposal_escrow"), u64Le(proposalId)]);
  },

  claimable(projectId: Numeric, account: PublicKey): PublicKey {
    return findPda([
      Buffer.from("claim"),
      u64Le(projectId),
      account.toBuffer(),
    ]);
  },

  tokenMetadata(mint: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      METADATA_PROGRAM_ID,
    );
    return pda;
  },
};
