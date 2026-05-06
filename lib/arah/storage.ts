const STORAGE_GATEWAY_DEFAULT =
  "https://indexer-storage-testnet-turbo.0g.ai";

export const STORAGE_GATEWAY =
  process.env.NEXT_PUBLIC_ZEROG_STORAGE_GATEWAY ?? STORAGE_GATEWAY_DEFAULT;

export const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export function storageFileUrl(rootHash: string) {
  return `${STORAGE_GATEWAY}/file?root=${rootHash}`;
}

export type FetchedArtifact =
  | {
      kind: "json";
      data: unknown;
      raw: string;
      contentType: string;
      bytes: number;
    }
  | {
      kind: "markdown";
      text: string;
      contentType: string;
      bytes: number;
    }
  | {
      kind: "text";
      text: string;
      contentType: string;
      bytes: number;
    }
  | {
      kind: "binary";
      bytes: number;
      contentType: string;
    }
  | {
      kind: "missing";
      message: string;
    }
  | {
      kind: "error";
      message: string;
      status?: number;
    };

const MAX_INLINE_BYTES = 512 * 1024; // 512 KB cap on inline render

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
  // Reject if a meaningful portion of the buffer is control bytes outside
  // the usual whitespace set. Tolerates BOM, tabs, newlines, etc.
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
    ) {
      continue;
    }
    bad += 1;
  }
  return bad / Math.max(sample.length, 1) < 0.02;
}

export async function fetchArtifact(
  rootHash: string,
  init?: { signal?: AbortSignal },
): Promise<FetchedArtifact> {
  if (!rootHash || rootHash === ZERO_HASH) {
    return {
      kind: "missing",
      message: "No artifact hash recorded on-chain.",
    };
  }

  let res: Response;
  try {
    res = await fetch(storageFileUrl(rootHash), {
      cache: "no-store",
      signal: init?.signal,
    });
  } catch (e) {
    return {
      kind: "error",
      message:
        e instanceof Error ? e.message : "Failed to reach 0G Storage gateway",
    };
  }

  if (!res.ok) {
    return {
      kind: "error",
      status: res.status,
      message: `Gateway returned ${res.status} ${res.statusText}`.trim(),
    };
  }

  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  const buffer = await res.arrayBuffer();
  const bytes = buffer.byteLength;

  if (bytes > MAX_INLINE_BYTES) {
    return { kind: "binary", bytes, contentType };
  }

  // Try text decoding first; fall back to binary if it isn't printable.
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const printable = isPrintable(text);

  if (!printable) {
    return { kind: "binary", bytes, contentType };
  }

  // Hint by content-type, otherwise sniff.
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
      };
    } catch {
      // fall through to text/markdown handling
    }
  }

  if (looksMdHeader || looksLikeMarkdown(text)) {
    return {
      kind: "markdown",
      text,
      contentType: contentType || "text/markdown",
      bytes,
    };
  }

  return {
    kind: "text",
    text,
    contentType: contentType || "text/plain",
    bytes,
  };
}
