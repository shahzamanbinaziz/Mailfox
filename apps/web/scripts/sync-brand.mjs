// Copies favicons + logo files from /brand into apps/web/public so Next serves them.
// /brand stays the single source of truth; the copies are git-ignored.
import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const brand = join(here, "..", "..", "..", "brand");
const pub = join(here, "..", "public");
const assets = join(pub, "brand-assets");
mkdirSync(assets, { recursive: true });

// Favicons → public root (where browsers look for them)
for (const f of [
  "favicon.ico",
  "favicon.svg",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "site.webmanifest",
]) {
  cpSync(join(brand, "icons", f), join(pub, f));
}
// Everything downloadable from the /brand page → public/brand-assets
for (const f of readdirSync(brand).filter((f) => f.endsWith(".svg"))) cpSync(join(brand, f), join(assets, f));
for (const f of ["logo-full-email.png", "logo-full-dark-email.png", "icon-512.png"])
  cpSync(join(brand, "icons", f), join(assets, f));
for (const dir of ["animations", "empty-states"]) {
  for (const f of readdirSync(join(brand, dir))) cpSync(join(brand, dir, f), join(assets, f));
}
console.log("🦊 brand assets synced to apps/web/public");
