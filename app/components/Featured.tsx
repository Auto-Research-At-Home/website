import Image from "next/image";
import Link from "next/link";
import { Arrow, Crosshairs } from "./atoms";
import { SectionHeader } from "./HowItWorks";

const metrics = [
  { label: "baseline loss", value: "0.4218" },
  { label: "current best", value: "0.3104", accent: true },
  { label: "improvement", value: "26.4%" },
  {
    label: "reward pool",
    value: (
      <>
        1,240 <span className="text-[0.58em] text-[var(--color-fg-dim)]">SOL</span>
      </>
    ),
  },
];

export function Featured() {
  return (
    <section id="featured" className="border-b border-[var(--color-line)]">
      <div className="container-page py-20 md:py-28">
        <SectionHeader
          eyebrow="/ featured project"
          title={
            <>
              Karpathy&apos;s{" "}
              <code className="serif rounded-[3px] bg-[rgb(74_222_188_/_0.08)] px-2 font-serif text-[0.95em]">
                llm.c
              </code>{" "}
              racing on chain.
            </>
          }
          description="The flagship project. Andrej's hand-tuned C implementation of GPT-2 training, exposed as a verifiable benchmark. Miners are competing to drop the loss curve faster on identical hardware."
        />

        <div className="crosshairs relative mt-14 grid grid-cols-1 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-bg-soft)] lg:grid-cols-[minmax(0,0.9fr)_minmax(440px,1.1fr)]">
          <Crosshairs />
          <div className="flex min-h-[620px] flex-col p-6 md:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="or-tag live">
                <span className="dot" />
                active · race #142
              </span>
              <span className="or-tag">
                <span className="dot" />
                cid · bafy...x4q
              </span>
              <span className="or-tag">
                <span className="dot" />
                contract · SoLa...92fe
              </span>
            </div>

            <div className="mt-10 flex items-start gap-5">
              <Image
                src="/partners/karpathy.png"
                alt="Andrej Karpathy"
                width={64}
                height={64}
                className="hidden size-16 rounded-full object-cover ring-1 ring-[var(--color-line-2)] sm:block"
              />
              <div>
                <h3 className="max-w-xl font-sans text-3xl leading-tight font-medium tracking-tight text-[var(--color-fg)] md:text-[40px]">
                  Train GPT-2 (124M) faster than the baseline.
                </h3>
                <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-[var(--color-fg-muted)]">
                  Same dataset. Same hardware envelope: 1x H100, 80GB. Lower
                  training loss in fewer cycles wins. Every submission is re-run
                  inside a TEE, so there is no lying about the score and no
                  overfitting to held-out tests.
                </p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-px bg-[var(--color-line)]">
              {metrics.map((metric) => (
                <div key={metric.label} className="bg-[var(--color-bg)] p-5">
                  <p className="label-muted">{metric.label}</p>
                  <p
                    className={`tick mt-3 text-2xl font-medium tracking-tight ${
                      metric.accent
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-fg)]"
                    }`}
                  >
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <Link
                href="/projects"
                className="group inline-flex items-center gap-3 rounded-sm bg-[var(--color-fg)] px-5 py-3 font-mono text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
              >
                <span className="size-2 rounded-full bg-[var(--color-accent)] group-hover:bg-[var(--color-bg)]" />
                Open project
                <Arrow />
              </Link>
              <a
                href="https://github.com/karpathy/llm.c"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-3 rounded-sm border border-[var(--color-line-2)] px-5 py-3 font-mono text-sm text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-3)] hover:text-[var(--color-fg)]"
              >
                View source project
                <Arrow />
              </a>
            </div>
          </div>

          <div className="flex min-h-[620px] flex-col border-t border-[var(--color-line)] p-4 md:p-8 lg:border-t-0 lg:border-l">
            <FeaturedChart />
            <div className="mt-6 grid grid-cols-3 gap-px bg-[var(--color-line)]">
              <div className="bg-[var(--color-bg)] p-4">
                <p className="label-muted text-[10px]">submissions</p>
                <p className="tick mt-2 text-xl text-[var(--color-fg)]">142</p>
              </div>
              <div className="bg-[var(--color-bg)] p-4">
                <p className="label-muted text-[10px]">best miner</p>
                <p className="tick mt-2 text-xl text-[var(--color-accent)]">β-2</p>
              </div>
              <div className="bg-[var(--color-bg)] p-4">
                <p className="label-muted text-[10px]">verified</p>
                <p className="tick mt-2 text-xl text-[var(--color-fg)]">TEE</p>
              </div>
            </div>
            <div className="mt-auto rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-2)] p-5">
              <p className="label-muted">benchmark rule</p>
              <p className="mt-3 font-sans text-sm leading-relaxed text-[var(--color-fg-muted)]">
                Lower loss wins only when the submitted code re-runs inside the
                same hardware envelope and passes held-out validation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedChart() {
  const seed = [
    0.42, 0.41, 0.4, 0.39, 0.385, 0.38, 0.37, 0.366, 0.36, 0.355, 0.348,
    0.342, 0.336, 0.33, 0.325, 0.32, 0.317, 0.314, 0.312, 0.3104,
  ];
  const points = seed.map((value, i) => [
    (i / (seed.length - 1)) * 600,
    200 - ((value - 0.3) / 0.13) * 160 - 10,
  ]);
  const path = `M ${points.map((p) => p.join(",")).join(" L ")}`;
  const last = points[points.length - 1];

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[rgb(0_0_0_/_0.24)] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="label">/ loss · last 24h</p>
        <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--color-fg-dim)] uppercase">
          y · cross-entropy
        </p>
      </div>
      <svg viewBox="0 0 620 260" className="mt-6 block h-auto w-full">
        <defs>
          <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(74,222,188,0.25)" />
            <stop offset="100%" stopColor="rgba(74,222,188,0)" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="0"
            y1={52 + i * 42}
            x2="620"
            y2={52 + i * 42}
            stroke="rgba(255,255,255,0.055)"
          />
        ))}
        <line
          x1="0"
          y1={points[0][1]}
          x2="620"
          y2={points[0][1]}
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="2 4"
        />
        <text
          x="6"
          y={points[0][1] - 4}
          fontFamily="Geist Mono, monospace"
          fontSize="9"
          fill="rgba(255,255,255,0.45)"
        >
          baseline · 0.4218
        </text>
        <path d={`${path} L 600 232 L 0 232 Z`} fill="url(#lossFill)" />
        <path
          d={path}
          fill="none"
          stroke="rgba(74,222,188,0.95)"
          strokeWidth="1.5"
        />
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point[0]}
            cy={point[1]}
            r="2"
            fill="rgba(74,222,188,0.95)"
          />
        ))}
        <g fontFamily="Geist Mono, monospace" fontSize="8" fill="rgba(255,255,255,0.5)">
          <line
            x1={points[6][0]}
            y1={points[6][1]}
            x2={points[6][0]}
            y2={points[6][1] - 30}
            stroke="rgba(255,255,255,0.2)"
          />
          <text x={points[6][0] + 4} y={points[6][1] - 32}>
            alpha-7 · fused-attn
          </text>
          <line
            x1={points[14][0]}
            y1={points[14][1]}
            x2={points[14][0]}
            y2={points[14][1] - 20}
            stroke="rgba(255,255,255,0.2)"
          />
          <text x={points[14][0] + 4} y={points[14][1] - 22}>
            beta-2 · ringbuf
          </text>
        </g>
        <g transform={`translate(${last[0]}, ${last[1]})`}>
          <circle r="5" fill="none" stroke="rgba(74,222,188,0.9)">
            <animate attributeName="r" values="5;10;5" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="rgba(74,222,188,1)" />
        </g>
      </svg>
      <div className="mt-3 flex justify-between font-mono text-[10px] text-[var(--color-fg-dim)]">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>now</span>
      </div>
    </div>
  );
}
