/**
 * Mailfox design tokens — the single source of truth for colour, type, radius and motion.
 *
 * Scales were generated as OKLCH lightness ramps from the brand anchors
 * (fox-500 = #FF6A1A, ink-950 = #0F1729), gamut-clipped to sRGB.
 * `pnpm tokens:build` turns this file into `src/styles/tokens.css` (Tailwind v4 @theme + CSS vars).
 *
 * Contrast rules (verified in tokens.test.ts, WCAG 2.x AA = 4.5:1 for body text):
 *  - Primary button: fox-500 background + ink-950 text (≈6.2:1). White on fox-500 FAILS (2.9:1).
 *  - Orange text on light backgrounds: fox-700 (≈6.1:1). On dark backgrounds: fox-400 (≈7.7:1).
 */

export const scaleSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ScaleStep = (typeof scaleSteps)[number];
export type ColorScale = Record<ScaleStep, string>;

export const colors = {
  fox: {
    50: "#FFF4F0",
    100: "#FFE7DD",
    200: "#FFD1BE",
    300: "#FFB293",
    400: "#FF8B5A",
    500: "#FF6A1A",
    600: "#D25100",
    700: "#A94000",
    800: "#863100",
    900: "#682400",
    950: "#411300",
  },
  ink: {
    50: "#F3F7FF",
    100: "#E3EBFC",
    200: "#CED9F0",
    300: "#B0BEDC",
    400: "#8B98B5",
    500: "#687490",
    600: "#4C5872",
    700: "#37425B",
    800: "#253047",
    900: "#192236",
    950: "#0F1729",
  },
  gray: {
    50: "#F6F7F8",
    100: "#EBEDEF",
    200: "#DADCE0",
    300: "#C4C8CD",
    400: "#ABB0B6",
    500: "#979CA3",
    600: "#7C8187",
    700: "#62666C",
    800: "#4D5055",
    900: "#3B3D41",
    950: "#222427",
  },
  success: {
    50: "#EEFBEF",
    100: "#DAF5DE",
    200: "#BAEBC1",
    300: "#8EDD9D",
    400: "#5FCA78",
    500: "#37B75D",
    600: "#179946",
    700: "#007B34",
    800: "#006127",
    900: "#004B1C",
    950: "#002D0E",
  },
  warning: {
    50: "#FFF5EA",
    100: "#FFE9D0",
    200: "#FDD5A7",
    300: "#F7BA70",
    400: "#EA9D30",
    500: "#D58800",
    600: "#B17000",
    700: "#8D5900",
    800: "#704500",
    900: "#573400",
    950: "#351E00",
  },
  danger: {
    50: "#FFF4F3",
    100: "#FFE6E4",
    200: "#FFCFCB",
    300: "#FFAFAB",
    400: "#FF8783",
    500: "#FC5E60",
    600: "#D84549",
    700: "#B13136",
    800: "#8C2429",
    900: "#6D1B1E",
    950: "#48050B",
  },
  info: {
    50: "#F2F7FF",
    100: "#E3EEFF",
    200: "#C9DEFF",
    300: "#A7C9FF",
    400: "#7FB0FF",
    500: "#5B99FF",
    600: "#397CE9",
    700: "#2862C0",
    800: "#1D4C98",
    900: "#153A77",
    950: "#042150",
  },
} as const satisfies Record<string, ColorScale>;

export type ScaleName = keyof typeof colors;

/** Brand constants used outside CSS (emails, OG images, manifest). */
export const brand = {
  orange: colors.fox[500],
  ink: colors.ink[950],
  cream: "#FFF3E8",
  white: "#FFFFFF",
} as const;

/**
 * Semantic tokens, shadcn/ui-compatible names. Each value is a hex string.
 * Light and dark themes must define exactly the same keys.
 */
export const semantic = {
  light: {
    background: "#FFFFFF",
    foreground: colors.ink[950],
    card: "#FFFFFF",
    "card-foreground": colors.ink[950],
    popover: "#FFFFFF",
    "popover-foreground": colors.ink[950],
    primary: colors.fox[500],
    "primary-foreground": colors.ink[950],
    secondary: colors.ink[50],
    "secondary-foreground": colors.ink[900],
    muted: colors.ink[50],
    "muted-foreground": colors.ink[600],
    accent: colors.fox[50],
    "accent-foreground": colors.fox[700],
    destructive: colors.danger[700],
    "destructive-foreground": "#FFFFFF",
    success: colors.success[700],
    "success-foreground": "#FFFFFF",
    warning: colors.warning[700],
    "warning-foreground": "#FFFFFF",
    border: colors.ink[100],
    input: colors.ink[200],
    ring: colors.fox[500],
    link: colors.fox[700],
    sidebar: colors.ink[50],
    "sidebar-foreground": colors.ink[900],
    // Chart series (validated with the dataviz palette checker: CVD ΔE ≥ 25, ≥ 3:1 vs surface)
    "chart-1": colors.fox[600],
    "chart-2": colors.info[700],
  },
  dark: {
    background: colors.ink[950],
    foreground: colors.ink[50],
    card: colors.ink[900],
    "card-foreground": colors.ink[50],
    popover: colors.ink[900],
    "popover-foreground": colors.ink[50],
    primary: colors.fox[500],
    "primary-foreground": colors.ink[950],
    secondary: colors.ink[800],
    "secondary-foreground": colors.ink[50],
    muted: colors.ink[800],
    "muted-foreground": colors.ink[300],
    accent: colors.ink[800],
    "accent-foreground": colors.fox[400],
    destructive: colors.danger[400],
    "destructive-foreground": colors.ink[950],
    success: colors.success[400],
    "success-foreground": colors.ink[950],
    warning: colors.warning[400],
    "warning-foreground": colors.ink[950],
    border: colors.ink[800],
    input: colors.ink[700],
    ring: colors.fox[400],
    link: colors.fox[400],
    sidebar: "#0B1120",
    "sidebar-foreground": colors.ink[100],
    "chart-1": colors.fox[600],
    "chart-2": colors.info[600],
  },
} as const;

export type SemanticToken = keyof (typeof semantic)["light"];

export const typography = {
  sans: '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const radius = { sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", "2xl": "1.25rem" } as const;

export const motion = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
  /** Brand ease: quick start, soft landing ("a fox landing on its feet"). */
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
} as const;

// ── WCAG helpers ────────────────────────────────────────────

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
