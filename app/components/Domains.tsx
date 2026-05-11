import type { SVGProps } from "react";
import { Arrow } from "./atoms";
import { SectionHeader } from "./HowItWorks";

type DomainAccent = {
  text: string;
  border: string;
  bg: string;
  glow: string;
};

const accents = {
  cyan: {
    text: "var(--color-cyan)",
    border: "rgb(96 165 250 / 0.45)",
    bg: "rgb(96 165 250 / 0.08)",
    glow: "rgb(96 165 250 / 0.22)",
  },
  green: {
    text: "var(--color-accent)",
    border: "rgb(74 222 188 / 0.45)",
    bg: "rgb(74 222 188 / 0.08)",
    glow: "rgb(74 222 188 / 0.22)",
  },
  amber: {
    text: "var(--color-amber)",
    border: "rgb(245 191 80 / 0.45)",
    bg: "rgb(245 191 80 / 0.08)",
    glow: "rgb(245 191 80 / 0.22)",
  },
  violet: {
    text: "#C084FC",
    border: "rgb(192 132 252 / 0.45)",
    bg: "rgb(192 132 252 / 0.08)",
    glow: "rgb(192 132 252 / 0.22)",
  },
  rose: {
    text: "var(--color-rose)",
    border: "rgb(248 113 113 / 0.45)",
    bg: "rgb(248 113 113 / 0.08)",
    glow: "rgb(248 113 113 / 0.22)",
  },
  teal: {
    text: "#5EEAD4",
    border: "rgb(94 234 212 / 0.45)",
    bg: "rgb(94 234 212 / 0.08)",
    glow: "rgb(94 234 212 / 0.22)",
  },
} as const satisfies Record<string, DomainAccent>;

type Domain = {
  tag: string;
  title: string;
  desc: string;
  count: string;
  metric: string;
  accent: DomainAccent;
  Icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode;
  Viz: (props: { color: string }) => React.ReactNode;
  gifQuery: string;
};

const domains: Domain[] = [
  {
    tag: "ML training",
    title: "Faster pre-training",
    desc: "Loss curves, throughput, MFU. The original Karpathy loop.",
    count: "42 projects",
    metric: "↓ loss · ↑ MFU",
    accent: accents.cyan,
    Icon: TrainingIcon,
    Viz: LossCurveViz,
    gifQuery: "neural network training",
  },
  {
    tag: "Inference",
    title: "Tokens / second",
    desc: "Quantized kernels, attention variants, schedulers.",
    count: "31 projects",
    metric: "↑ tok / sec",
    accent: accents.green,
    Icon: InferenceIcon,
    Viz: ThroughputViz,
    gifQuery: "LLM",
  },
  {
    tag: "Compression",
    title: "Bytes saved",
    desc: "Lossless and lossy. Image, video, weights.",
    count: "18 projects",
    metric: "↓ bytes",
    accent: accents.amber,
    Icon: CompressionIcon,
    Viz: CompressionViz,
    gifQuery: "File COMPRESSION",
  },
  {
    tag: "Algorithms",
    title: "Big-O improvements",
    desc: "Sorting, graph traversal, sparse linear algebra.",
    count: "12 projects",
    metric: "↓ complexity",
    accent: accents.violet,
    Icon: AlgorithmsIcon,
    Viz: BigOViz,
    gifQuery: "algebra visualisation",
  },
  {
    tag: "Crypto",
    title: "Faster ZK proving",
    desc: "Constraint count, prover time, verifier gas.",
    count: "9 projects",
    metric: "↓ prover time",
    accent: accents.rose,
    Icon: CryptoIcon,
    Viz: ZkViz,
    gifQuery: "coded data numbers encryption",
  },
  {
    tag: "Bio",
    title: "Protein folding",
    desc: "RMSD against ground truth on held-out targets.",
    count: "6 projects",
    metric: "↓ RMSD",
    accent: accents.teal,
    Icon: BioIcon,
    Viz: ProteinViz,
    gifQuery: "dna code code matrix",
  },
];

async function fetchDomainGif(query: string): Promise<string | null> {
  try {
    const url = `https://g.tenor.com/v1/search?q=${encodeURIComponent(
      query,
    )}&key=LIVDSRZULELA&limit=1&media_filter=minimal&contentfilter=high`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: Array<{
        media?: Array<{
          mediumgif?: { url?: string };
          gif?: { url?: string };
          tinygif?: { url?: string };
        }>;
      }>;
    };
    const media = json?.results?.[0]?.media?.[0];
    return (
      media?.mediumgif?.url ??
      media?.gif?.url ??
      media?.tinygif?.url ??
      null
    );
  } catch {
    return null;
  }
}

export async function Domains() {
  const gifUrls = await Promise.all(
    domains.map((domain) => fetchDomainGif(domain.gifQuery)),
  );
  return (
    <section id="domains" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="/ domains"
          title={
            <>
              Anywhere code can be <span className="serif">scored,</span>
              <br />
              OpenResearch can <span className="serif">run.</span>
            </>
          }
          description="If you can write a benchmark that returns a single number, you can spin up a market for it. Researchers bring the problems; the network competes."
        />

        <div className="mt-14 grid grid-cols-1 gap-px bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain, i) => {
            const gifUrl = gifUrls[i];
            return (
              <div
                key={domain.tag}
                className="domain-card group relative min-h-[270px] overflow-hidden bg-[var(--color-bg)] p-6 transition-colors hover:bg-[var(--color-bg-soft)]"
                style={
                  {
                    "--accent": domain.accent.text,
                    "--accent-border": domain.accent.border,
                    "--accent-bg": domain.accent.bg,
                    "--accent-glow": domain.accent.glow,
                    "--card-delay": `${i * 60}ms`,
                  } as React.CSSProperties
                }
              >
                {gifUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gifUrl}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="domain-gif pointer-events-none absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="domain-gif-veil pointer-events-none absolute inset-0" aria-hidden="true" />
                  </>
                )}
                <span className="domain-card-accent" aria-hidden="true" />
                <domain.Viz color={domain.accent.text} />

                <div className="domain-card-content relative z-[2]">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase"
                      style={{
                        borderColor: domain.accent.border,
                        background: domain.accent.bg,
                        color: domain.accent.text,
                      }}
                    >
                      {domain.tag}
                    </span>
                    <span
                      className="domain-icon grid size-9 place-items-center rounded-full border"
                      style={{
                        borderColor: domain.accent.border,
                        background: domain.accent.bg,
                        color: domain.accent.text,
                      }}
                    >
                      <domain.Icon className="size-4" />
                    </span>
                  </div>

                  <h3 className="mt-7 font-sans text-[22px] leading-tight font-medium text-[var(--color-fg)]">
                    {domain.title}
                  </h3>
                  <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                    {domain.desc}
                  </p>

                  <span
                    className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] uppercase"
                    style={{ color: domain.accent.text }}
                  >
                    <span
                      className="inline-block size-1.5 rounded-full"
                      style={{ background: domain.accent.text }}
                    />
                    {domain.metric}
                  </span>

                  <div className="mt-6 flex items-center justify-between border-t border-dashed border-[var(--color-line-2)] pt-4 font-mono text-[11px] text-[var(--color-fg-muted)]">
                    <span>{domain.count}</span>
                    <span
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: domain.accent.text }}
                    >
                      <Arrow />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LossCurveViz({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 40"
      className="domain-viz pointer-events-none absolute right-4 bottom-16 h-8 w-28 opacity-30 transition-opacity duration-300 group-hover:opacity-90"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M2 6 C 22 6, 36 18, 56 26 S 100 36, 118 36" />
      <circle cx="118" cy="36" r="2" fill={color} />
    </svg>
  );
}

function ThroughputViz({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 40"
      className="domain-viz pointer-events-none absolute right-4 bottom-16 h-8 w-28 opacity-30 transition-opacity duration-300 group-hover:opacity-90"
      fill={color}
    >
      {[6, 14, 22, 30, 38, 46, 54, 62, 70, 78, 86, 94].map((x, idx) => {
        const h = 8 + ((idx * 3) % 24);
        return (
          <rect
            key={x}
            x={x}
            y={36 - h}
            width="5"
            height={h}
            rx="1"
            opacity={0.4 + (idx % 5) * 0.12}
          />
        );
      })}
    </svg>
  );
}

function CompressionViz({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 40"
      className="domain-viz pointer-events-none absolute right-4 bottom-16 h-8 w-28 opacity-30 transition-opacity duration-300 group-hover:opacity-90"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M2 12 H118" strokeDasharray="3 3" opacity="0.55" />
      <path d="M2 28 H80" />
      <path d="M2 36 H56" opacity="0.7" />
    </svg>
  );
}

function BigOViz({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 40"
      className="domain-viz pointer-events-none absolute right-4 bottom-16 h-8 w-28 opacity-30 transition-opacity duration-300 group-hover:opacity-90"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M2 36 C 30 36, 50 30, 70 18 S 110 2, 118 2" />
      <path d="M2 36 L 118 36" opacity="0.3" />
    </svg>
  );
}

function ZkViz({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 40"
      className="domain-viz pointer-events-none absolute right-4 bottom-16 h-8 w-28 opacity-30 transition-opacity duration-300 group-hover:opacity-90"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <path d="M60 4 L 100 20 L 60 36 L 20 20 Z" />
      <path d="M60 4 L 60 36 M 20 20 L 100 20" opacity="0.5" />
    </svg>
  );
}

function ProteinViz({ color }: { color: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 40"
      className="domain-viz pointer-events-none absolute right-4 bottom-16 h-8 w-28 opacity-30 transition-opacity duration-300 group-hover:opacity-90"
      fill="none"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      <path d="M4 20 Q 18 4, 32 20 T 60 20 T 88 20 T 116 20" />
      {[10, 26, 42, 58, 74, 90, 106].map((cx) => (
        <circle key={cx} cx={cx} cy="20" r="1.6" fill={color} />
      ))}
    </svg>
  );
}

function TrainingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 19 L 10 11 L 14 14 L 20 6" />
      <path d="M20 12 V 6 H 14" />
    </svg>
  );
}

function InferenceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 12 H 13" />
      <path d="M10 8 L 14 12 L 10 16" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  );
}

function CompressionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 9 L 8 9 L 8 5" />
      <path d="M20 9 L 16 9 L 16 5" />
      <path d="M4 15 L 8 15 L 8 19" />
      <path d="M20 15 L 16 15 L 16 19" />
    </svg>
  );
}

function AlgorithmsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="14" r="2" />
      <circle cx="6" cy="20" r="2" />
      <circle cx="18" cy="20" r="2" />
      <path d="M6 8 V 18 M 18 8 V 18 M 8 6 H 16 M 8 14 H 16 M 8 20 H 16" opacity="0.6" />
    </svg>
  );
}

function CryptoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="1" />
      <path d="M8 11 V 8 a 4 4 0 0 1 8 0 V 11" />
    </svg>
  );
}

function BioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 4 C 14 4, 14 20, 20 20" />
      <path d="M20 4 C 14 4, 14 20, 8 20" />
      <path d="M10 7 H 18 M 10 17 H 18 M 12 11 H 16 M 12 14 H 16" opacity="0.6" />
    </svg>
  );
}
