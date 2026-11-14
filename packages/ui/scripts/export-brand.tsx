// Renders the React empty-state illustrations to standalone SVG files in /brand/empty-states,
// and writes CSS-animated SVG versions of the logo intro and loader to /brand/animations
// (for README, docs and places without React).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { emptyStates } from "../src/brand/EmptyStates";
import { MARK } from "../src/brand/geometry";
import { brand } from "../src/tokens";

const here = dirname(fileURLToPath(import.meta.url));
const brandDir = join(here, "..", "..", "..", "brand");

const withNs = (svg: string) => svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');

mkdirSync(join(brandDir, "empty-states"), { recursive: true });
for (const [name, Component] of Object.entries(emptyStates)) {
  const svg = withNs(renderToStaticMarkup(<Component />));
  writeFileSync(join(brandDir, "empty-states", `no-${name}.svg`), svg + "\n");
  console.log(`wrote brand/empty-states/no-${name}.svg`);
}

const rect = (r: { x: number; y: number; width: number; height: number; rx: number }, fill: string) =>
  `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${r.rx}" fill="${fill}"/>`;
const ellipse = (e: { cx: number; cy: number; rx: number; ry: number }) =>
  `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}"/>`;

// CSS-animated logo intro (mirror of <LogoIntro/>). 1.3s, honours prefers-reduced-motion.
const intro = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 0 92 64" width="276" height="192" role="img" aria-label="Mailfox">
<style>
  .ears { animation: ears .45s cubic-bezier(.34,1.56,.64,1) .1s both; }
  .body { transform-origin: 32px 37px; animation: pop .3s cubic-bezier(.22,1,.36,1) both; }
  .flap { transform-origin: 32px 20px; animation: fold .4s cubic-bezier(.22,1,.36,1) .4s both; }
  .face { transform-origin: 32px 36px; animation: face .25s cubic-bezier(.22,1,.36,1) .8s both; }
  .trail { stroke-dasharray: 40; animation: trail .45s ease-out .85s both; }
  @keyframes ears { from { transform: translateY(16px); } to { transform: none; } }
  @keyframes pop { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes fold { from { transform: scaleY(-.9); } to { transform: none; } }
  @keyframes face { from { transform: scale(.4); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes trail { 0% { stroke-dashoffset: 40; opacity: 0; } 60% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .ears, .body, .flap, .face, .trail { animation: none; } .trail { opacity: 0; } }
</style>
<defs>
  <clipPath id="b">${rect(MARK.body, "#000")}</clipPath>
  <linearGradient id="t" x1="1" x2="0"><stop offset="0" stop-color="${brand.orange}"/><stop offset="1" stop-color="${brand.orange}" stop-opacity="0"/></linearGradient>
</defs>
<path class="trail" d="M2 44 C-6 40 -14 42 -26 34" fill="none" stroke="url(#t)" stroke-width="5" stroke-linecap="round"/>
<g class="ears"><g fill="${brand.orange}"><path d="${MARK.earLeft}"/><path d="${MARK.earRight}"/></g><g fill="${brand.ink}"><path d="${MARK.innerEarLeft}"/><path d="${MARK.innerEarRight}"/></g></g>
<g class="body">${rect(MARK.body, brand.orange)}${rect(MARK.inner, brand.cream)}</g>
<g clip-path="url(#b)"><path class="flap" d="M6 18 L58 18 L58 22 L32 46 L6 22 Z" fill="${brand.orange}"/></g>
<g class="face" fill="${brand.ink}">${ellipse(MARK.eyeLeft)}${ellipse(MARK.eyeRight)}<path d="${MARK.nose}"/></g>
</svg>
`;

// CSS-animated loader (mirror of <FoxSpinner/>).
const loader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 80 80" width="80" height="80" role="status" aria-label="Loading">
<style>
  .orbit { transform-origin: 32px 32px; animation: spin .9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .orbit { animation: none; } }
</style>
<circle cx="32" cy="32" r="38" fill="none" stroke="${brand.ink}" stroke-opacity=".12" stroke-width="4"/>
<circle class="orbit" cx="32" cy="32" r="38" fill="none" stroke="${brand.orange}" stroke-width="4" stroke-linecap="round" stroke-dasharray="60 180"/>
<g transform="translate(12 13) scale(.625)">
  <g fill="${brand.orange}"><path d="${MARK.earLeft}"/><path d="${MARK.earRight}"/></g>
  <g fill="${brand.ink}"><path d="${MARK.innerEarLeft}"/><path d="${MARK.innerEarRight}"/></g>
  ${rect(MARK.body, brand.orange)}${rect(MARK.inner, brand.cream)}
  <path d="M6 18 L58 18 L58 22 L32 46 L6 22 Z" fill="${brand.orange}"/>
  <g fill="${brand.ink}">${ellipse(MARK.eyeLeft)}${ellipse(MARK.eyeRight)}<path d="${MARK.nose}"/></g>
</g>
</svg>
`;

mkdirSync(join(brandDir, "animations"), { recursive: true });
writeFileSync(join(brandDir, "animations", "logo-intro.svg"), intro);
writeFileSync(join(brandDir, "animations", "fox-loader.svg"), loader);
console.log("wrote brand/animations/logo-intro.svg, fox-loader.svg");
