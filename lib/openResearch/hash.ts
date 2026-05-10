/** 32 bytes, all zero — sentinel for "not set". */
export const ZERO_HASH_BYTES: number[] = new Array(32).fill(0);

export const ZERO_HASH_HEX =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export function bytesToHex(bytes: number[] | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  let out = "0x";
  for (const b of arr) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Parse a 0x-prefixed hex string into a length-32 number array. */
export function hex32ToBytes(hex: string): number[] {
  const clean = hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
  if (clean.length !== 64) {
    throw new Error(`hex32ToBytes: expected 64 hex chars, got ${clean.length}`);
  }
  const out: number[] = new Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Returns the SHA-256 of the input bytes as a length-32 number array. */
export async function sha256Bytes32(
  bytes: Uint8Array | ArrayBuffer,
): Promise<number[]> {
  const buf =
    bytes instanceof ArrayBuffer ? bytes : new Uint8Array(bytes).slice().buffer;
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest));
}

export function isZeroHashBytes(bytes: number[]): boolean {
  return bytes.length === 32 && bytes.every((b) => b === 0);
}

export function bytesToHexNoPrefix(bytes: number[] | Uint8Array): string {
  return bytesToHex(bytes).slice(2);
}
