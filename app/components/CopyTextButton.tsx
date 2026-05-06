"use client";

import { useCallback, useState } from "react";

type CopyTextButtonProps = {
  text: string;
  label: string;
  idleLabel?: string;
  copiedLabel?: string;
  className?: string;
  /** `icon` — compact square control with clipboard / check SVG (for headings, toolbars). */
  variant?: "label" | "icon";
};

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Copies `text` to the clipboard with a short “Copied” confirmation.
 */
export function CopyTextButton({
  text,
  label,
  idleLabel = "Copy",
  copiedLabel = "Copied",
  className,
  variant = "label",
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  }, [text]);

  const base =
    variant === "icon"
      ? "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-brand)] transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand-bright)] "
      : "shrink-0 cursor-pointer rounded border border-[var(--color-line)] bg-[var(--color-bg)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-brand-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand-bright)] ";

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={label}
      title={copied ? copiedLabel : label}
      className={base + (className ?? "")}
    >
      {variant === "icon" ? (
        copied ? (
          <IconCheck className="text-[var(--color-brand-bright)]" />
        ) : (
          <IconClipboard />
        )
      ) : copied ? (
        copiedLabel
      ) : (
        idleLabel
      )}
    </button>
  );
}
