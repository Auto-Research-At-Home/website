import { findIrysIdByHash, irysUrl } from "./irys";
import { ZERO_HASH_HEX } from "./hash";

export type FetchedArtifact =
  | { kind: "json"; data: unknown; raw: string; contentType: string; bytes: number; url: string; irysId: string }
  | { kind: "markdown"; text: string; contentType: string; bytes: number; url: string; irysId: string }
  | { kind: "text"; text: string; contentType: string; bytes: number; url: string; irysId: string }
  | { kind: "binary"; bytes: number; contentType: string; url: string; irysId: string }
  | { kind: "missing"; message: string }
  | { kind: "error"; message: string; status?: number; url?: string };

const MAX_INLINE_BYTES = 512 * 1024;

function looksLikeMarkdown(text: string) {
  const lines = text.split(/\r?\n/, 200);
  const heuristics = [
    /^#{1,6}\s+\S/m,
    /^\s*[-*+]\s+\S/m,
    /^\s*\d+\.\s+\S/m,
    /^\s*```/m,
    /^\s*>\s+\S/m,
    /\[[^\]]+\]\([^)]+\)/,
    /\*\*\S/,
    /^\s*\|.+\|\s*$/m,
  ];
  return heuristics.some((re) => re.test(lines.join("\n")));
}

function isPrintable(text: string) {
  const sample = text.slice(0, 4096);
  let bad = 0;
  for (const ch of sample) {
    const code = ch.charCodeAt(0);
    if (
      code === 0x09 ||
      code === 0x0a ||
      code === 0x0d ||
      code === 0xfeff ||
      (code >= 0x20 && code !== 0x7f)
    ) continue;
    bad += 1;
  }
  return bad / Math.max(sample.length, 1) < 0.02;
}

async function fetchAndClassifyArtifact(
  irysId: string,
  init?: { signal?: AbortSignal },
): Promise<FetchedArtifact> {
  const url = irysUrl(irysId);
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", signal: init?.signal });
  } catch (e) {
    return {
      kind: "error",
      url,
      message: e instanceof Error ? e.message : "Failed to reach Irys gateway",
    };
  }

  if (!res.ok) {
    return {
      kind: "error",
      url,
      status: res.status,
      message: `Gateway returned ${res.status} ${res.statusText}`.trim(),
    };
  }

  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  const buffer = await res.arrayBuffer();
  const bytes = buffer.byteLength;

  if (bytes > MAX_INLINE_BYTES) {
    return { kind: "binary", bytes, contentType, url, irysId };
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (!isPrintable(text)) {
    return { kind: "binary", bytes, contentType, url, irysId };
  }

  const looksJsonHeader =
    contentType.includes("application/json") || contentType.includes("+json");
  const looksMdHeader =
    contentType.includes("text/markdown") ||
    contentType.includes("text/x-markdown");

  const trimmed = text.trim();
  const startsLikeJson = trimmed.startsWith("{") || trimmed.startsWith("[");

  if (looksJsonHeader || startsLikeJson) {
    try {
      const data = JSON.parse(trimmed);
      return {
        kind: "json",
        data,
        raw: trimmed,
        contentType: contentType || "application/json",
        bytes,
        url,
        irysId,
      };
    } catch {
      // fall through
    }
  }

  if (looksMdHeader || looksLikeMarkdown(text)) {
    return {
      kind: "markdown",
      text,
      contentType: contentType || "text/markdown",
      bytes,
      url,
      irysId,
    };
  }

  return {
    kind: "text",
    text,
    contentType: contentType || "text/plain",
    bytes,
    url,
    irysId,
  };
}

/** Fetch and classify an artifact directly by its on-chain Irys id. */
export async function fetchArtifactByIrysId(
  irysId: string | null | undefined,
  init?: { signal?: AbortSignal },
): Promise<FetchedArtifact> {
  if (!irysId) {
    return { kind: "missing", message: "No Irys id recorded on-chain." };
  }
  return fetchAndClassifyArtifact(irysId, init);
}

/**
 * Resolve a 32-byte content hash (hex, with or without 0x prefix) to an
 * Irys upload via the GraphQL tag index, then fetch and classify the bytes.
 * Prefer `fetchArtifactByReference` for current accounts that store Irys ids.
 */
export async function fetchArtifactByHash(
  hashHex: string,
  init?: { signal?: AbortSignal },
): Promise<FetchedArtifact> {
  if (!hashHex || hashHex === ZERO_HASH_HEX) {
    return { kind: "missing", message: "No artifact hash recorded on-chain." };
  }
  const lookup = hashHex.startsWith("0x") ? hashHex.slice(2) : hashHex;
  const irysId = await findIrysIdByHash(lookup);
  if (!irysId) {
    return {
      kind: "missing",
      message:
        "No Irys upload indexed for this hash yet. Tagged uploads can take a few seconds to appear.",
    };
  }

  return fetchAndClassifyArtifact(irysId, init);
}

export async function fetchArtifactByReference(
  artifact: { hash?: string | null; irysId?: string | null },
  init?: { signal?: AbortSignal },
): Promise<FetchedArtifact> {
  if (artifact.irysId) return fetchArtifactByIrysId(artifact.irysId, init);
  if (artifact.hash) return fetchArtifactByHash(artifact.hash, init);
  return {
    kind: "missing",
    message: "No artifact hash or Irys id recorded on-chain.",
  };
}
