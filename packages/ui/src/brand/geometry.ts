// Mailfox mark geometry (concept A "Envelope Fox"), 64×64 grid.
// Mirrors brand/scripts/mark-geometry.mjs — geometry.test.ts fails if they drift apart.

export const MARK = {
  viewBox: "0 0 64 64",
  earLeft: "M9 27 L15 5.2 Q15.9 2.9 17.6 4.6 L30 20 Z",
  earRight: "M55 27 L49 5.2 Q48.1 2.9 46.4 4.6 L34 20 Z",
  innerEarLeft: "M14.6 20.5 L16.9 10.6 L24.2 19.6 Z",
  innerEarRight: "M49.4 20.5 L47.1 10.6 L39.8 19.6 Z",
  body: { x: 6, y: 18, width: 52, height: 38, rx: 8 },
  inner: { x: 8.5, y: 20.5, width: 47, height: 33, rx: 5.8 },
  muzzle: "M6 22 L32 46 L58 22 L58 56 L6 56 Z",
  flapLine: "M6 22 L32 46 L58 22",
  eyeLeft: { cx: 22, cy: 30, rx: 2.6, ry: 3.1 },
  eyeRight: { cx: 42, cy: 30, rx: 2.6, ry: 3.1 },
  nose: "M28.4 43.2 L35.6 43.2 Q36.9 43.2 36.1 44.3 L33 48.3 Q32 49.4 31 48.3 L27.9 44.3 Q27.1 43.2 28.4 43.2 Z",
} as const;
