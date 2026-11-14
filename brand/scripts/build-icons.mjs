// Generates the raster favicon set + email logo PNGs from the SVG sources.
// Run after build-wordmark.mjs:  node brand/scripts/build-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const here = dirname(fileURLToPath(import.meta.url));
const brandDir = join(here, "..");
const iconsDir = join(brandDir, "icons");
mkdirSync(iconsDir, { recursive: true });

const markSvg = readFileSync(join(iconsDir, "favicon.svg"));
const ink = { r: 15, g: 23, b: 41, alpha: 1 };

/** Render the mark centered on a square canvas with padding (and optional background). */
async function renderSquare(size, { padding = 0, background } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const mark = await sharp(markSvg, { density: 72 * Math.ceil(inner / 64) * 2 })
    .resize(inner, inner)
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

const outputs = [
  // name, size, options
  ["icon-16.png", 16, {}],
  ["icon-32.png", 32, {}],
  ["icon-48.png", 48, {}],
  ["apple-touch-icon.png", 180, { padding: 0.14, background: ink }], // iOS wants an opaque tile
  ["icon-192.png", 192, { padding: 0.1 }],
  ["icon-512.png", 512, { padding: 0.1 }],
  ["icon-maskable-512.png", 512, { padding: 0.2, background: ink }], // safe zone for Android masks
];

const written = {};
for (const [name, size, opts] of outputs) {
  const png = await renderSquare(size, opts);
  writeFileSync(join(iconsDir, name), png);
  written[name] = png;
  console.log(`wrote brand/icons/${name}`);
}

const ico = await pngToIco([written["icon-16.png"], written["icon-32.png"], written["icon-48.png"]]);
writeFileSync(join(iconsDir, "favicon.ico"), ico);
console.log("wrote brand/icons/favicon.ico");

// Email clients (Gmail, Outlook) do not render SVG — ship PNG logos for email headers.
for (const [src, out] of [
  ["logo-full.svg", "logo-full-email.png"],
  ["logo-full-dark.svg", "logo-full-dark-email.png"],
]) {
  const svg = readFileSync(join(brandDir, src));
  await sharp(svg, { density: 72 * 3 })
    .resize({ height: 96 })
    .png()
    .toFile(join(iconsDir, out));
  console.log(`wrote brand/icons/${out}`);
}

const manifest = {
  name: "Mailfox",
  short_name: "Mailfox",
  description: "Self-hosted email campaigns, delivered by a clever fox.",
  start_url: "/",
  display: "standalone",
  background_color: "#0F1729",
  theme_color: "#FF6A1A",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
writeFileSync(join(iconsDir, "site.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote brand/icons/site.webmanifest");
