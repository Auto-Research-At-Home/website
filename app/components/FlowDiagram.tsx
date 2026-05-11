"use client";

import { useEffect, useState } from "react";

type IconKind = "user" | "git" | "hash" | "chart" | "cpu" | "shield" | "check";

const W = 1240;
const H = 580;
const PAD_X = 80;

export function FlowDiagram() {
  const [tick, setTick] = useState(0);
  const [activeMiner, setActiveMiner] = useState(1);
  const [raceDuration, setRaceDuration] = useState(1.05);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let timer: number;

    const schedule = () => {
      const delay = 1500 + Math.random() * 1900;
      timer = window.setTimeout(() => {
        setRaceDuration(0.75 + Math.random() * 0.95);
        setActiveMiner((current) => {
          let next = Math.floor(Math.random() * minerPaths.length);
          if (next === current) next = (next + 1) % minerPaths.length;
          return next;
        });
        schedule();
      }, delay);
    };

    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  const t = tick / 20;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(74,222,188,0.75)" />
          </linearGradient>
          <linearGradient id="lineGradBack" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0.75)" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(74,222,188,0.55)" />
            <stop offset="100%" stopColor="rgba(74,222,188,0)" />
          </radialGradient>
          <pattern
            id="dotgrid"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>

        <rect width={W} height={H} fill="url(#dotgrid)" />

        <g
          stroke="rgba(255,255,255,0.08)"
          strokeDasharray="3 6"
          strokeWidth="1"
        >
          <line x1={PAD_X} y1="130" x2={W - PAD_X} y2="130" />
          <line x1={PAD_X} y1="290" x2={W - PAD_X} y2="290" />
          <line x1={PAD_X} y1="450" x2={W - PAD_X} y2="450" />
        </g>

        <g
          fontFamily="Geist Mono, monospace"
          fontSize="12"
          fontWeight="600"
          letterSpacing="2"
          fill="rgba(255,255,255,0.55)"
        >
          <text x={PAD_X} y="70">
            01 · CREATE
          </text>
          <text x={PAD_X} y="230">
            02 · MINE
          </text>
          <text x={PAD_X} y="390">
            03 · VALIDATE
          </text>
        </g>

        {/* CREATE row */}
        <FlowNode
          x={230}
          y={100}
          label="RESEARCHER"
          sub="karpathy/llm.c"
          icon="user"
        />
        <FlowEdge from={[300, 100]} to={[440, 100]} progress={(t * 0.4) % 1} />
        <FlowNode
          x={510}
          y={100}
          label="GITHUB"
          sub="project published"
          icon="git"
        />
        <FlowEdge
          from={[580, 100]}
          to={[720, 100]}
          progress={(t * 0.4 + 0.2) % 1}
        />
        <FlowNode
          x={790}
          y={100}
          label="PROJECT"
          sub="Sol: 4kZ…x4q"
          icon="hash"
          highlight
        />
        <FlowEdge
          from={[860, 100]}
          to={[1010, 100]}
          progress={(t * 0.4 + 0.5) % 1}
        />
        <FlowNode
          x={1080}
          y={100}
          label="BASELINE"
          sub="0.4218 loss"
          icon="chart"
        />

        <path
          d="M 820 140 C 820 200, 510 220, 510 270"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeDasharray="5 5"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-20"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>

        {/* MINE row */}
        <FlowNode
          x={230}
          y={290}
          label="MINER · α-7"
          sub="rank #2 · +3.1%"
          icon="cpu"
          highlight={activeMiner === 0}
        />
        <FlowNode
          x={510}
          y={290}
          label="MINER · β-2"
          sub="rank #1 · +4.7%"
          icon="cpu"
          highlight={activeMiner === 1}
        />
        <FlowNode
          x={790}
          y={290}
          label="MINER · γ-9"
          sub="rank #5 · +1.8%"
          icon="cpu"
          highlight={activeMiner === 2}
        />

        <MinerRacePaths active={activeMiner} duration={raceDuration} />
        <KarpathyLoop x={1080} y={290} t={t} />

        <path
          d="M 1080 350 C 1080 410, 865 420, 790 444"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeDasharray="5 5"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-20"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>

        {/* VALIDATE row */}
        <FlowNode
          x={230}
          y={470}
          label="ENCLAVE · TEE-1"
          sub="attestation: ok"
          icon="shield"
        />
        <FlowNode
          x={510}
          y={470}
          label="ENCLAVE · TEE-2"
          sub="attestation: ok"
          icon="shield"
        />
        <FlowNode
          x={790}
          y={470}
          label="ENCLAVE · TEE-3"
          sub="attestation: ok"
          icon="shield"
        />

        <FlowEdge
          from={[300, 470]}
          to={[440, 470]}
          progress={(t * 0.35 + 0.1) % 1}
          dashed
        />
        <FlowEdge
          from={[580, 470]}
          to={[720, 470]}
          progress={(t * 0.35 + 0.35) % 1}
          dashed
        />
        <path
          d="M 865 470 C 920 470, 955 454, 1008 454"
          fill="none"
          stroke="rgba(74,222,188,0.58)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-20"
            dur="1.3s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M 865 470 C 922 470, 958 494, 1008 494"
          fill="none"
          stroke="rgba(248,113,113,0.45)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-20"
            dur="1.3s"
            repeatCount="indefinite"
          />
        </path>

        <g transform="translate(1010,438)">
          <rect
            width="170"
            height="30"
            rx="4"
            fill="rgba(74,222,188,0.1)"
            stroke="rgba(74,222,188,0.55)"
            strokeWidth="1.4"
          />
          <circle cx="16" cy="15" r="4.5" fill="rgba(74,222,188,1)" />
          <text
            x="30"
            y="20"
            fontFamily="Geist Mono, monospace"
            fontSize="11"
            fontWeight="600"
            fill="rgba(74,222,188,1)"
            letterSpacing="1"
          >
            VALID → +SOL
          </text>
        </g>
        <g transform="translate(1010,478)">
          <rect
            width="170"
            height="30"
            rx="4"
            fill="rgba(248,113,113,0.08)"
            stroke="rgba(248,113,113,0.5)"
            strokeWidth="1.4"
          />
          <circle cx="16" cy="15" r="4.5" fill="rgba(248,113,113,0.95)" />
          <text
            x="30"
            y="20"
            fontFamily="Geist Mono, monospace"
            fontSize="11"
            fontWeight="600"
            fill="rgba(248,113,113,0.95)"
            letterSpacing="1"
          >
            INVALID → SLASH
          </text>
        </g>

        <path
          d="M 1080 320 C 1180 360, 1180 180, 1080 130"
          fill="none"
          stroke="url(#lineGradBack)"
          strokeWidth="2"
          strokeDasharray="4 6"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-20"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </path>
        <text
          x={1162}
          y={228}
          fontFamily="Geist Mono, monospace"
          fontSize="11"
          fontWeight="600"
          fill="rgba(96,165,250,0.95)"
          letterSpacing="1.5"
          textAnchor="middle"
          transform="rotate(90 1162 228)"
        >
          IMPROVED CODE
        </text>

        <Particle path="M 300 100 L 440 100" delay={0} />
        <Particle path="M 580 100 L 720 100" delay={0.5} />
        <Particle path="M 860 100 L 1010 100" delay={1.0} />
        <Particle path="M 820 140 C 820 200, 510 220, 510 270" delay={1.4} />
        <Particle path={minerPaths[activeMiner].particlePath} delay={0.2} />
      </svg>
    </div>
  );
}

const minerPaths = [
  {
    d: "M 305 290 C 475 220, 760 225, 1016 282",
    particlePath: "M 305 290 C 475 220, 760 225, 1016 282",
  },
  {
    d: "M 585 290 C 715 245, 880 250, 1016 286",
    particlePath: "M 585 290 C 715 245, 880 250, 1016 286",
  },
  {
    d: "M 865 290 C 910 278, 965 276, 1016 288",
    particlePath: "M 865 290 C 910 278, 965 276, 1016 288",
  },
];

function MinerRacePaths({
  active,
  duration,
}: {
  active: number;
  duration: number;
}) {
  return (
    <g>
      {minerPaths.map((path, i) => {
        const on = active === i;
        return (
          <path
            key={path.d}
            d={path.d}
            fill="none"
            stroke={on ? "rgba(74,222,188,0.78)" : "rgba(255,255,255,0.14)"}
            strokeWidth={on ? "2" : "1.2"}
            strokeDasharray="5 7"
            opacity={on ? 1 : 0.55}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-24"
              dur={on ? `${duration}s` : "1.8s"}
              repeatCount="indefinite"
            />
          </path>
        );
      })}
      <text
        x="948"
        y="258"
        fontFamily="Geist Mono, monospace"
        fontSize="9"
        fontWeight="600"
        fill="rgba(74,222,188,0.72)"
        letterSpacing="1"
        textAnchor="middle"
      >
        ANY MINER CAN BEAT BEST
      </text>
    </g>
  );
}

function FlowNode({
  x,
  y,
  label,
  sub,
  icon,
  highlight,
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
  icon: IconKind;
  highlight?: boolean;
}) {
  const w = 150;
  const h = 52;
  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      {highlight && (
        <rect x="-8" y="-8" width={w + 16} height={h + 16} fill="url(#nodeGlow)" />
      )}
      <rect
        width={w}
        height={h}
        rx="5"
        fill="rgba(12,16,22,0.96)"
        stroke={
          highlight ? "rgba(74,222,188,0.85)" : "rgba(255,255,255,0.28)"
        }
        strokeWidth={highlight ? 1.8 : 1.4}
      />
      <g transform="translate(12,16)">
        <NodeIcon kind={icon} highlight={highlight} />
      </g>
      <text
        x={36}
        y={22}
        fontFamily="Geist Mono, monospace"
        fontSize="11"
        fontWeight="600"
        fill={highlight ? "rgba(74,222,188,1)" : "rgba(255,255,255,0.95)"}
        letterSpacing="1.2"
      >
        {label}
      </text>
      <text
        x={36}
        y={38}
        fontFamily="Geist Mono, monospace"
        fontSize="10"
        fontWeight="500"
        fill="rgba(255,255,255,0.6)"
      >
        {sub}
      </text>
    </g>
  );
}

function NodeIcon({ kind, highlight }: { kind: IconKind; highlight?: boolean }) {
  const c = highlight ? "rgba(74,222,188,1)" : "rgba(255,255,255,0.85)";
  const sw = 1.6;
  if (kind === "user")
    return (
      <g stroke={c} strokeWidth={sw} fill="none">
        <circle cx="9" cy="7" r="3.5" />
        <path d="M3 18 C 3 13, 15 13, 15 18" />
      </g>
    );
  if (kind === "git")
    return (
      <g>
        <circle cx="5" cy="5" r="2.5" fill="none" stroke={c} strokeWidth={sw} />
        <circle cx="13" cy="13" r="2.5" fill="none" stroke={c} strokeWidth={sw} />
        <line x1="6.5" y1="7" x2="11.5" y2="11" stroke={c} strokeWidth={sw} />
      </g>
    );
  if (kind === "hash")
    return (
      <g stroke={c} strokeWidth={sw} fill="none">
        <path d="M2 7h14M2 12h14M6 2v17M12 2v17" />
      </g>
    );
  if (kind === "chart")
    return (
      <g fill={c}>
        <rect x="2" y="12" width="3" height="6" />
        <rect x="7" y="7" width="3" height="11" />
        <rect x="12" y="3" width="3" height="15" />
      </g>
    );
  if (kind === "cpu")
    return (
      <g stroke={c} strokeWidth={sw} fill="none">
        <rect x="3" y="3" width="13" height="13" rx="1.5" />
        <rect x="7" y="7" width="5" height="5" />
        <path d="M9 0v3M9 16v3M0 9h3M16 9h3" />
      </g>
    );
  if (kind === "shield")
    return (
      <path
        d="M9 1 L15 4 V10 C15 13.5, 9 17, 9 17 C9 17, 3 13.5, 3 10 V4 Z"
        fill="none"
        stroke={c}
        strokeWidth={sw}
      />
    );
  if (kind === "check")
    return (
      <path
        d="M3 9 L7 13 L15 4"
        stroke={c}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  return null;
}

function FlowEdge({
  from,
  to,
  progress = 0,
  dashed = false,
}: {
  from: [number, number];
  to: [number, number];
  progress?: number;
  dashed?: boolean;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.4"
        strokeDasharray={dashed ? "4 6" : undefined}
      />
      <circle
        cx={x1 + (x2 - x1) * progress}
        cy={y1 + (y2 - y1) * progress}
        r="3"
        fill="rgba(74,222,188,1)"
      >
        <animate
          attributeName="r"
          values="2;4;2"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>
      <polygon
        points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
        fill="rgba(255,255,255,0.55)"
      />
    </g>
  );
}

function Particle({ path, delay }: { path: string; delay: number }) {
  return (
    <circle r="3" fill="rgba(74,222,188,1)">
      <animateMotion
        dur="3s"
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={path}
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        dur="3s"
        repeatCount="indefinite"
        begin={`${delay}s`}
      />
    </circle>
  );
}

function KarpathyLoop({ x, y, t }: { x: number; y: number; t: number }) {
  const r = 60;
  const angle = (t * 60) % 360;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle
        r={r}
        fill="rgba(74,222,188,0.03)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.4"
        strokeDasharray="3 5"
      />
      <text
        textAnchor="middle"
        y={-4}
        fontFamily="Geist Mono, monospace"
        fontSize="11"
        fontWeight="600"
        fill="rgba(74,222,188,1)"
        letterSpacing="1.2"
      >
        KARPATHY
      </text>
      <text
        textAnchor="middle"
        y={12}
        fontFamily="Geist Mono, monospace"
        fontSize="11"
        fontWeight="600"
        fill="rgba(74,222,188,1)"
        letterSpacing="1.2"
      >
        LOOP
      </text>
      <g transform={`rotate(${angle})`}>
        <circle cx={r} cy={0} r="4" fill="rgba(74,222,188,1)" />
        <circle
          cx={r}
          cy={0}
          r="8"
          fill="none"
          stroke="rgba(74,222,188,0.4)"
          strokeWidth="1"
        />
      </g>
      <g
        fontFamily="Geist Mono, monospace"
        fontSize="9"
        fontWeight="600"
        fill="rgba(255,255,255,0.7)"
        letterSpacing="0.5"
      >
        <text x={0} y={-r - 10} textAnchor="middle">
          ITERATE
        </text>
        <text x={r + 8} y={4} textAnchor="start">
          RUN
        </text>
        <text x={0} y={r + 16} textAnchor="middle">
          BEAT?
        </text>
        <text x={-r - 8} y={4} textAnchor="end">
          KEEP
        </text>
      </g>
    </g>
  );
}
