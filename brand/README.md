# Mailfox brand

**Personality:** fast, clever, trustworthy, friendly — a smart fox that delivers your mail.
The live guide is at **`/brand`** in the web app.

## The mark — "Envelope Fox"

An envelope whose top flap _is_ the fox's face: orange flap pointing down to the nose, cream cheeks
below, two ears rising above the envelope. One shape says both "fox" and "mail", and it stays readable at 16px.

| File                                   | Use                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `logo-full.svg`                        | Default logo on light backgrounds                                                      |
| `logo-full-dark.svg`                   | On dark backgrounds                                                                    |
| `logo-mono.svg` / `logo-mark-mono.svg` | Single colour (`currentColor`) — print, footers, stamps                                |
| `logo-mark.svg`                        | Avatars, app icons, tight spaces                                                       |
| `icons/`                               | favicon.ico (16/32/48), favicon.svg, apple-touch-icon, 192/512, maskable, web manifest |
| `icons/logo-full-email.png`            | Email headers (email clients don't render SVG)                                         |
| `animations/`                          | CSS-animated `logo-intro.svg`, `fox-loader.svg`                                        |
| `empty-states/`                        | No campaigns / contacts / mailboxes illustrations                                      |

**Clear space:** one ear height (¼ of the mark) on every side. **Minimum size:** mark 16px, full logo 96px wide.
Don't recolour the fox, add effects or rotate the mark.

## Colour

| Token   | Hex       | Use                                            |
| ------- | --------- | ---------------------------------------------- |
| fox-500 | `#FF6A1A` | Primary actions, brand moments (with ink text) |
| fox-700 | `#A94000` | Orange text/links on light backgrounds         |
| fox-400 | `#FF8B5A` | Orange text/links on dark backgrounds          |
| ink-950 | `#0F1729` | Text, dark backgrounds                         |

Full 50–950 scales for fox, ink, gray, success, warning, danger and info live in `packages/ui/src/tokens.ts`.

## Type

Plus Jakarta Sans (UI + wordmark), JetBrains Mono (code, DNS records). Self-hosted via Fontsource.

## Regenerating assets

```bash
pnpm brand:build   # logos → favicons/PNGs → empty states + animated SVGs
```

Geometry lives in `scripts/mark-geometry.mjs` and is mirrored in `packages/ui/src/brand/geometry.ts`
(a unit test fails if they drift).
