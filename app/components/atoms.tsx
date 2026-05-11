"use client";

import { useEffect, useState } from "react";

export function Arrow({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 6h7M6 2.5L9.5 6 6 9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExternalArrow({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 12 12 4M6 4h6v6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SolanaMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="currentColor">
        <path d="M5 6h14l2-2H7z" />
        <path d="M3 14h14l2-2H5z" />
        <path d="M5 22h14l2-2H7z" />
      </g>
    </svg>
  );
}

export function LiveCounter({
  from,
  to,
  interval = 3000,
  format = (n) => n.toLocaleString(),
}: {
  from: number;
  to: number;
  interval?: number;
  format?: (n: number) => string;
}) {
  const [val, setVal] = useState(from);

  useEffect(() => {
    let v = from;
    setVal(v);
    const id = setInterval(() => {
      const step = Math.max(1, Math.round((to - v) / 8 + Math.random() * 3));
      v = Math.min(to, v + step);
      if (v >= to) v = from + Math.floor((to - from) * 0.4);
      setVal(v);
    }, interval);
    return () => clearInterval(id);
  }, [from, to, interval]);

  return <>{format(val)}</>;
}

export function Crosshairs() {
  return (
    <>
      <span className="ch-bl" />
      <span className="ch-br" />
    </>
  );
}
