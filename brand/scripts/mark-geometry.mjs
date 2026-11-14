// Mailfox mark geometry — concept A "Envelope Fox".
// 64×64 grid. The envelope's top flap IS the fox's face: an orange V-flap that
// points down to the nose, cream cheeks below it, and two ears rising above the
// envelope's top edge. Keep in sync with packages/ui/src/brand/geometry.ts
// (a unit test verifies they match).

export const COLORS = {
  orange: "#FF6A1A",
  ink: "#0F1729",
  cream: "#FFF3E8",
  white: "#FFFFFF",
};

export const MARK = {
  viewBox: "0 0 64 64",
  earLeft: "M9 27 L15 5.2 Q15.9 2.9 17.6 4.6 L30 20 Z",
  earRight: "M55 27 L49 5.2 Q48.1 2.9 46.4 4.6 L34 20 Z",
  innerEarLeft: "M14.6 20.5 L16.9 10.6 L24.2 19.6 Z",
  innerEarRight: "M49.4 20.5 L47.1 10.6 L39.8 19.6 Z",
  body: { x: 6, y: 18, width: 52, height: 38, rx: 8 },
  // Inset area the cream muzzle is clipped to, leaving an orange envelope rim.
  inner: { x: 8.5, y: 20.5, width: 47, height: 33, rx: 5.8 },
  // Cream area under the envelope flap (clipped to body).
  muzzle: "M6 22 L32 46 L58 22 L58 56 L6 56 Z",
  // The flap edge as an open line (used for the mono cut-out).
  flapLine: "M6 22 L32 46 L58 22",
  eyeLeft: { cx: 22, cy: 30, rx: 2.6, ry: 3.1 },
  eyeRight: { cx: 42, cy: 30, rx: 2.6, ry: 3.1 },
  nose: "M28.4 43.2 L35.6 43.2 Q36.9 43.2 36.1 44.3 L33 48.3 Q32 49.4 31 48.3 L27.9 44.3 Q27.1 43.2 28.4 43.2 Z",
};

const rect = (b, extra = "") =>
  `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${b.rx}"${extra}/>`;
const ellipse = (e, extra = "") => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}"${extra}/>`;

/** Full-colour mark as SVG group markup (no <svg> wrapper). `id` keeps clipPath ids unique. */
export function markGroup({
  id = "mf",
  orange = COLORS.orange,
  ink = COLORS.ink,
  cream = COLORS.cream,
} = {}) {
  return [
    `<defs><clipPath id="${id}-body">${rect(MARK.inner)}</clipPath></defs>`,
    `<g fill="${orange}">`,
    `  <path d="${MARK.earLeft}"/>`,
    `  <path d="${MARK.earRight}"/>`,
    `  ${rect(MARK.body)}`,
    `</g>`,
    `<g fill="${ink}">`,
    `  <path d="${MARK.innerEarLeft}"/>`,
    `  <path d="${MARK.innerEarRight}"/>`,
    `</g>`,
    `<path d="${MARK.muzzle}" fill="${cream}" clip-path="url(#${id}-body)"/>`,
    `<g fill="${ink}">`,
    `  ${ellipse(MARK.eyeLeft)}`,
    `  ${ellipse(MARK.eyeRight)}`,
    `  <path d="${MARK.nose}"/>`,
    `</g>`,
  ].join("\n");
}

/** Single-colour mark: solid silhouette with the face cut out via a mask. */
export function monoGroup({ id = "mfm", color = "currentColor" } = {}) {
  return [
    `<defs><mask id="${id}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">`,
    `  <rect width="64" height="64" fill="#fff"/>`,
    `  <g fill="#000">`,
    `    <path d="${MARK.innerEarLeft}"/>`,
    `    <path d="${MARK.innerEarRight}"/>`,
    `    ${ellipse(MARK.eyeLeft)}`,
    `    ${ellipse(MARK.eyeRight)}`,
    `  </g>`,
    `  <path d="${MARK.flapLine}" fill="none" stroke="#000" stroke-width="3" stroke-linejoin="round"/>`,
    `</mask></defs>`,
    `<g fill="${color}" mask="url(#${id}-cut)">`,
    `  <path d="${MARK.earLeft}"/>`,
    `  <path d="${MARK.earRight}"/>`,
    `  ${rect(MARK.body)}`,
    `</g>`,
  ].join("\n");
}
