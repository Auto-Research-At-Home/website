import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, type Transaction, type VersionedTransaction } from "@solana/web3.js";
import idl from "@/idl/open_research.json";
import type { OpenResearch } from "@/idl/open_research";

export const SOLANA_CLUSTER =
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet";

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export const OPEN_RESEARCH_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_OPEN_RESEARCH_PROGRAM_ID ??
    "ACfzPQJkUJ74bdnmvV6FmB8Me3s1cPA3ayWjt2vHRsv3",
);

export type AnchorWalletLike = {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
};

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, "confirmed");
}

const READ_ONLY_PUBKEY = new PublicKey("11111111111111111111111111111111");

function readOnlyWallet(): AnchorWalletLike {
  return {
    publicKey: READ_ONLY_PUBKEY,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T) {
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]) {
      return txs;
    },
  };
}

export function getProvider(wallet?: AnchorWalletLike | null): AnchorProvider {
  const connection = getConnection();
  const w = wallet ?? readOnlyWallet();
  return new AnchorProvider(connection, w, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export type OpenResearchProgram = Program<OpenResearch>;

function programIdl(): Idl & OpenResearch {
  return {
    ...(idl as unknown as Idl & OpenResearch),
    address: OPEN_RESEARCH_PROGRAM_ID.toBase58(),
  } as Idl & OpenResearch;
}

export function getOpenResearchProgram(
  wallet?: AnchorWalletLike | null,
): OpenResearchProgram {
  const provider = getProvider(wallet);
  return new Program<OpenResearch>(programIdl(), provider);
}
