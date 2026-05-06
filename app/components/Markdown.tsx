import type { ReactNode } from "react";

type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "em"; value: string }
  | { kind: "link"; value: string; href: string };

const INLINE_RE =
  /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s)]+)/g;

function tokenizeInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  for (const match of input.matchAll(INLINE_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ kind: "text", value: input.slice(lastIndex, idx) });
    }
    const raw = match[0];
    if (raw.startsWith("`")) {
      tokens.push({ kind: "code", value: raw.slice(1, -1) });
    } else if (raw.startsWith("**") || raw.startsWith("__")) {
      tokens.push({ kind: "strong", value: raw.slice(2, -2) });
    } else if (raw.startsWith("*") || raw.startsWith("_")) {
      tokens.push({ kind: "em", value: raw.slice(1, -1) });
    } else if (raw.startsWith("[")) {
      const end = raw.indexOf("](");
      tokens.push({
        kind: "link",
        value: raw.slice(1, end),
        href: raw.slice(end + 2, -1),
      });
    } else {
      tokens.push({ kind: "link", value: raw, href: raw });
    }
    lastIndex = idx + raw.length;
  }
  if (lastIndex < input.length) {
    tokens.push({ kind: "text", value: input.slice(lastIndex) });
  }
  return tokens;
}

function renderInline(input: string, keyPrefix: string): ReactNode[] {
  return tokenizeInline(input).map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (tok.kind) {
      case "code":
        return (
          <code
            key={key}
            className="rounded bg-[var(--color-bg-soft)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--color-fg)]"
          >
            {tok.value}
          </code>
        );
      case "strong":
        return (
          <strong key={key} className="font-semibold text-[var(--color-fg)]">
            {tok.value}
          </strong>
        );
      case "em":
        return (
          <em key={key} className="italic">
            {tok.value}
          </em>
        );
      case "link":
        return (
          <a
            key={key}
            href={tok.href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[var(--color-fg)] underline underline-offset-4 decoration-[var(--color-brand)] hover:text-[var(--color-brand-bright)] hover:decoration-[var(--color-brand-bright)]"
          >
            {tok.value}
          </a>
        );
      case "text":
      default:
        return <span key={key}>{tok.value}</span>;
    }
  });
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; lang: string; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" }
  | { type: "table"; header: string[]; rows: string[][] };

function parseBlocks(input: string): Block[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Code fence
    const fenceMatch = /^```([\w-]*)\s*$/.exec(line);
    if (fenceMatch) {
      const lang = fenceMatch[1] || "";
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1; // consume closing fence
      blocks.push({ type: "code", lang, text: buf.join("\n") });
      continue;
    }

    // Horizontal rule (---, ***, ___ with optional spaces)
    if (
      /^\s*-{3,}\s*$/.test(line) ||
      /^\s*\*{3,}\s*$/.test(line) ||
      /^\s*_{3,}\s*$/.test(line)
    ) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // Heading
    const hMatch = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (hMatch) {
      blocks.push({
        type: "heading",
        level: hMatch[1].length,
        text: hMatch[2],
      });
      i += 1;
      continue;
    }

    // Blockquote (one or more consecutive `> ` lines)
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: buf.join("\n") });
      continue;
    }

    // Table: header line | --- |
    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length) {
      const sep = lines[i + 1];
      if (/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(sep)) {
        const splitRow = (l: string) =>
          l
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim());

        const header = splitRow(line);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
          rows.push(splitRow(lines[i]));
          i += 1;
        }
        blocks.push({ type: "table", header, rows });
        continue;
      }
    }

    // List (unordered or ordered)
    const ulMatch = /^\s*[-*+]\s+(.*)$/.exec(line);
    const olMatch = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ulMatch || olMatch) {
      const ordered = !!olMatch;
      const items: string[] = [];
      const itemRe = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
      while (i < lines.length && itemRe.test(lines[i])) {
        const m = itemRe.exec(lines[i])!;
        let item = m[1];
        i += 1;
        // Continuation lines (indented)
        while (
          i < lines.length &&
          lines[i].trim() !== "" &&
          /^\s+\S/.test(lines[i]) &&
          !itemRe.test(lines[i])
        ) {
          item += " " + lines[i].trim();
          i += 1;
        }
        items.push(item);
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // Paragraph (collect until blank line / structural marker)
    const buf: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: buf.join("\n") });
  }

  return blocks;
}

const HEADING_CLASS: Record<number, string> = {
  1: "mt-10 mb-4 font-mono text-[28px] font-bold tracking-tight text-[var(--color-fg)] first:mt-0",
  2: "mt-10 mb-3 font-mono text-[22px] font-semibold tracking-tight text-[var(--color-fg)] first:mt-0",
  3: "mt-8 mb-3 font-mono text-[18px] font-semibold text-[var(--color-fg)] first:mt-0",
  4: "mt-6 mb-2 font-mono text-base font-semibold text-[var(--color-fg)] first:mt-0",
  5: "mt-6 mb-2 font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] first:mt-0",
  6: "mt-6 mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] first:mt-0",
};

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);

  return (
    <div className="font-sans text-[15px] leading-relaxed text-[var(--color-fg-muted)]">
      {blocks.map((block, i) => {
        const key = `b-${i}`;
        switch (block.type) {
          case "heading": {
            const Tag = `h${block.level}` as
              | "h1"
              | "h2"
              | "h3"
              | "h4"
              | "h5"
              | "h6";
            return (
              <Tag key={key} className={HEADING_CLASS[block.level]}>
                {renderInline(block.text, key)}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={key} className="my-4 first:mt-0">
                {renderInline(block.text, key)}
              </p>
            );
          case "code":
            return (
              <pre
                key={key}
                className="my-5 overflow-x-auto border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-4 font-mono text-[12.5px] leading-relaxed text-[var(--color-fg)]"
              >
                <code>{block.text}</code>
              </pre>
            );
          case "list":
            return block.ordered ? (
              <ol
                key={key}
                className="my-4 ml-5 list-decimal space-y-1.5 marker:text-[var(--color-fg-dim)]"
              >
                {block.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            ) : (
              <ul
                key={key}
                className="my-4 ml-5 list-disc space-y-1.5 marker:text-[var(--color-fg-dim)]"
              >
                {block.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="my-5 border-l-2 border-[var(--color-brand)] pl-4 italic text-[var(--color-fg-dim)]"
              >
                {renderInline(block.text, key)}
              </blockquote>
            );
          case "hr":
            return (
              <hr
                key={key}
                className="my-8 border-0 border-t border-[var(--color-line)]"
              />
            );
          case "table":
            return (
              <div
                key={key}
                className="my-5 overflow-x-auto border border-[var(--color-line)]"
              >
                <table className="w-full border-collapse font-sans text-sm">
                  <thead className="bg-[var(--color-bg-soft)]">
                    <tr>
                      {block.header.map((h, j) => (
                        <th
                          key={`${key}-h-${j}`}
                          className="border-b border-[var(--color-line)] px-3 py-2 text-left font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]"
                        >
                          {renderInline(h, `${key}-h-${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={`${key}-r-${r}`}>
                        {row.map((c, j) => (
                          <td
                            key={`${key}-r-${r}-${j}`}
                            className="border-t border-[var(--color-line)] px-3 py-2 text-[var(--color-fg-muted)]"
                          >
                            {renderInline(c, `${key}-r-${r}-${j}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
