# OpenResearch — website

Minimal Next.js landing site for **OpenResearch**, the decentralized,
agent-driven research protocol where the benchmark is the oracle.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (`@theme` design tokens, no `tailwind.config`)
- `next/font` (Inter + JetBrains Mono)
- Brand assets in `public/logos/`

## Brand tokens

Defined as CSS variables under `@theme` in `app/globals.css`:

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#0B0F1A` | Deep Indigo · backgrounds |
| `--color-cyan` | `#22D3EE` | Electric Cyan · highlights |
| `--color-blue` | `#3B82F6` | Soft Blue · structure |
| `--color-green` | `#22C55E` | Success Green · top node |

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Structure

```
app/
  layout.tsx           # fonts, metadata, theme bootstrap
  page.tsx             # composes the landing sections
  globals.css          # Tailwind v4 + brand tokens
  components/
    Nav.tsx
    Hero.tsx
    Insight.tsx
    HowItWorks.tsx
    Domains.tsx
    Architecture.tsx
    TokenFlow.tsx
    GetStarted.tsx
    Footer.tsx
public/logos/
  icon.png
  watermark-vertical.png
```

Sections map directly to the brand guide and `detail.md`: hero / insight /
how-it-works / domains / architecture / token flow / get started / footer.
