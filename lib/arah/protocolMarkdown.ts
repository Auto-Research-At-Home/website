import { readFileSync } from "node:fs";
import { join } from "node:path";
import nunjucks from "nunjucks";

const TEMPLATE_PATH = join(process.cwd(), "lib/arah/protocol.md.njk");

/** Keys shown in the hero block; the body loop skips these to avoid duplication. */
const EXCLUDED_FROM_BODY = new Set([
  "title",
  "name",
  "project_name",
  "projectName",
  "description",
  "statement_of_purpose",
  "statementOfPurpose",
  "summary",
  "purpose",
]);

let templateSource: string | null = null;

function getTemplate(): string {
  if (!templateSource) {
    templateSource = readFileSync(TEMPLATE_PATH, "utf8");
  }
  return templateSource;
}

function humanKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatLeaf(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/**
 * Turn nested JSON into markdown (headings + bullets). Used as the Nunjucks
 * `nested_md` filter — same role as recursive {% include %} blocks in Jinja2.
 */
function nestedMd(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return "_empty_";
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return "—";
    if (t.includes("\n")) {
      return "\n\n```\n" + value + "\n```\n";
    }
    return t;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return formatLeaf(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "_empty_";
    return value
      .map((item, i) => {
        if (item !== null && typeof item === "object") {
          const body = nestedMd(item, depth + 1).trim();
          return `${i + 1}. ${body.replace(/\n/g, "\n   ")}`;
        }
        return `- ${nestedMd(item)}`;
      })
      .join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    return entries
      .map(([k, v]) => {
        const label = humanKey(k);
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          return `**${label}**\n\n${nestedMd(v, depth + 1).trim()}`;
        }
        if (Array.isArray(v)) {
          return `**${label}**\n\n${nestedMd(v)}`;
        }
        return `- **${label}:** ${nestedMd(v)}`;
      })
      .join("\n\n");
  }
  return String(value);
}

const env = new nunjucks.Environment(undefined, {
  autoescape: false,
});

// @types/nunjucks lags runtime: addTest exists on Environment in nunjucks 3.x.
(env as nunjucks.Environment & { addTest: (n: string, fn: (...a: unknown[]) => boolean) => void }).addTest(
  "array",
  Array.isArray as (...a: unknown[]) => boolean,
);

env.addFilter("human_key", humanKey);
env.addFilter("nested_md", nestedMd);
env.addFilter("format_leaf", formatLeaf);

/**
 * Renders protocol `protocol.json` as Markdown using a Jinja2-like Nunjucks
 * template, for display with the site's Markdown React renderer.
 *
 * **Why Nunjucks?** It is the closest npm sibling to Jinja2 (Mozilla, same
 * conceptual model: `{% %}`, `{{ }}`, filters, `dictsort`). Port your Python
 * template by copying it into `protocol.md.njk` and tweaking minor syntax diffs.
 */
export function renderProtocolMarkdown(protocol: unknown): string {
  if (protocol === null || protocol === undefined) {
    return "```json\nnull\n```";
  }
  if (Array.isArray(protocol)) {
    return "```json\n" + JSON.stringify(protocol, null, 2) + "\n```";
  }
  if (typeof protocol !== "object") {
    return "```\n" + String(protocol) + "\n```";
  }

  return env.renderString(getTemplate(), {
    protocol,
    excluded: Array.from(EXCLUDED_FROM_BODY),
  });
}
