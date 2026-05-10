import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";
import { Buffer } from "buffer";
import { SOLANA_RPC_URL } from "./client";
import { bytesToHexNoPrefix, sha256Bytes32 } from "./hash";

export type IrysWallet = {
  publicKey: { toBase58(): string } | null;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: <T>(tx: T) => Promise<T>;
  signAllTransactions?: <T>(txs: T[]) => Promise<T[]>;
};

export type ArtifactType =
  | "protocol"
  | "repo_snapshot"
  | "benchmark"
  | "code"
  | "metrics";

export type IrysTag = { name: string; value: string };

export type IrysUploadResult = {
  irysId: string;
  irysIdBytes: number[];
  url: string;
  hashBytes: number[];
  hashHex: string;
};

const IRYS_GATEWAY = "https://gateway.irys.xyz";

let cachedUploader: Awaited<ReturnType<typeof buildUploader>> | null = null;
let cachedWalletKey: string | null = null;

export function isZeroIrysIdBytes(bytes: number[] | Uint8Array): boolean {
  return bytes.length === 32 && Array.from(bytes).every((b) => b === 0);
}

export function irysIdToBytes32(irysId: string): number[] {
  const normalized = irysId.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const bytes = Buffer.from(padded, "base64");
  if (bytes.length !== 32) {
    throw new Error(`Expected Irys id to decode to 32 bytes, got ${bytes.length}`);
  }
  return Array.from(bytes);
}

export function bytes32ToIrysId(bytes: number[] | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  if (arr.length !== 32) {
    throw new Error(`Expected 32 bytes for Irys id, got ${arr.length}`);
  }
  return Buffer.from(arr)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function irysIdFromBytes32(
  bytes: number[] | Uint8Array | null | undefined,
): string | null {
  if (!bytes || isZeroIrysIdBytes(bytes)) return null;
  return bytes32ToIrysId(bytes);
}

async function buildUploader(wallet: IrysWallet) {
  return WebUploader(WebSolana)
    .withProvider(wallet)
    .withRpc(SOLANA_RPC_URL)
    .devnet();
}

export async function getIrysUploader(wallet: IrysWallet) {
  const key = wallet.publicKey?.toBase58() ?? null;
  if (cachedUploader && cachedWalletKey === key) return cachedUploader;
  const uploader = await buildUploader(wallet);
  cachedUploader = uploader;
  cachedWalletKey = key;
  return uploader;
}

/**
 * Upload bytes to Irys (devnet). The upload id is stored on-chain as a
 * 32-byte base64url payload; hash tags remain useful for old data and audits.
 */
export async function uploadArtifactToIrys(
  wallet: IrysWallet,
  bytes: Uint8Array,
  contentType: string,
  artifactType: ArtifactType,
  extraTags: IrysTag[] = [],
): Promise<IrysUploadResult> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const hashBytes = await sha256Bytes32(bytes);
  const hashHex = bytesToHexNoPrefix(hashBytes);

  const irys = await getIrysUploader(wallet);

  const buffer = Buffer.from(bytes);
  const price = await irys.getPrice(buffer.length);
  const balance = await irys.getBalance();
  if (price.gt(balance)) {
    await irys.fund(price.minus(balance));
  }

  const tags: IrysTag[] = [
    { name: "app", value: "open-research" },
    { name: "artifact_type", value: artifactType },
    { name: "Content-Type", value: contentType },
    { name: "hash", value: hashHex },
    ...extraTags,
  ];

  const receipt = await irys.upload(buffer, { tags });

  return {
    irysId: receipt.id,
    irysIdBytes: irysIdToBytes32(receipt.id),
    url: `${IRYS_GATEWAY}/${receipt.id}`,
    hashBytes,
    hashHex,
  };
}

/** Public gateway URL for an Irys transaction id. */
export function irysUrl(irysId: string): string {
  return `${IRYS_GATEWAY}/${irysId}`;
}

/**
 * Find the most recent Irys transaction whose `hash` tag matches the supplied
 * 32-byte hash. Returns null if nothing is indexed (yet) for that hash.
 *
 * This is a compatibility fallback for older data. Current program accounts
 * store the 32-byte Irys id directly.
 */
const IRYS_GRAPHQL = "https://uploader.irys.xyz/graphql";

type IrysGraphQLResp = {
  data?: {
    transactions?: {
      edges?: Array<{ node: { id: string; address?: string; timestamp?: number } }>;
    };
  };
};

const lookupCache = new Map<string, string | null>();

export async function findIrysIdByHash(hashHex: string): Promise<string | null> {
  if (!hashHex) return null;
  if (lookupCache.has(hashHex)) return lookupCache.get(hashHex) ?? null;

  const query = {
    query: `
      query ByHash($hash: String!) {
        transactions(tags: [{ name: "hash", values: [$hash] }, { name: "app", values: ["open-research"] }], first: 1, order: DESC) {
          edges { node { id timestamp } }
        }
      }
    `,
    variables: { hash: hashHex },
  };

  try {
    const res = await fetch(IRYS_GRAPHQL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(query),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as IrysGraphQLResp;
    const id = json.data?.transactions?.edges?.[0]?.node?.id ?? null;
    lookupCache.set(hashHex, id);
    return id;
  } catch {
    return null;
  }
}

/** Convenience: hash → public gateway URL (or null if not indexed). */
export async function resolveIrysUrlByHash(
  hashHex: string,
): Promise<string | null> {
  const id = await findIrysIdByHash(hashHex);
  return id ? irysUrl(id) : null;
}
