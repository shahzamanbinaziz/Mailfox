import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { colors, contrastRatio, scaleSteps, semantic } from "../src/tokens";
import { MARK } from "../src/brand/geometry";

const AA = 4.5;

describe("colour scales", () => {
  it("every scale has all 11 steps, ordered light → dark", () => {
    for (const [name, scale] of Object.entries(colors)) {
      expect(Object.keys(scale).map(Number), name).toEqual([...scaleSteps]);
      // luminance should decrease monotonically
      const lums = scaleSteps.map((s) => contrastRatio(scale[s], "#000000"));
      lums
        .slice(1)
        .forEach((l, i) => expect(l, `${name}-${scaleSteps[i + 1]}`).toBeLessThan(lums[i] ?? Infinity));
    }
  });

  it("keeps the brand anchors exact", () => {
    expect(colors.fox[500]).toBe("#FF6A1A");
    expect(colors.ink[950]).toBe("#0F1729");
  });
});

describe("WCAG AA contrast for semantic pairs", () => {
  const pairs = [
    ["foreground", "background"],
    ["card-foreground", "card"],
    ["popover-foreground", "popover"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["muted-foreground", "muted"],
    ["muted-foreground", "background"],
    ["accent-foreground", "accent"],
    ["destructive-foreground", "destructive"],
    ["success-foreground", "success"],
    ["warning-foreground", "warning"],
    ["link", "background"],
    ["sidebar-foreground", "sidebar"],
  ] as const;

  for (const mode of ["light", "dark"] as const) {
    for (const [fg, bg] of pairs) {
      it(`${mode}: ${fg} on ${bg} ≥ 4.5:1`, () => {
        const t = semantic[mode];
        expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(AA);
      });
    }
  }

  it("light and dark themes define the same tokens", () => {
    expect(Object.keys(semantic.dark).sort()).toEqual(Object.keys(semantic.light).sort());
  });

  it("documents that white text on fox-500 fails AA (so we never use it)", () => {
    expect(contrastRatio("#FFFFFF", colors.fox[500])).toBeLessThan(AA);
  });
});

describe("mark geometry", () => {
  it("matches the generated brand/logo-mark.svg", () => {
    const svg = readFileSync(join(__dirname, "..", "..", "..", "brand", "logo-mark.svg"), "utf8");
    for (const d of [
      MARK.earLeft,
      MARK.earRight,
      MARK.innerEarLeft,
      MARK.innerEarRight,
      MARK.muzzle,
      MARK.nose,
    ]) {
      expect(svg).toContain(d);
    }
    expect(svg).toContain(`rx="${MARK.inner.rx}"`);
  });
});
