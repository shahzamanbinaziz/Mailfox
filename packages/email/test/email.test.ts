import { describe, expect, it } from "vitest";
import { brandLayout, extractTags, personalize, renderMjml, starterTemplates } from "../src/index.js";

describe("personalize", () => {
  it("fills tags, fallbacks and escapes HTML", () => {
    expect(personalize('Hi {{first_name|"there"}}!', { first_name: "Ayesha" })).toBe("Hi Ayesha!");
    expect(personalize('Hi {{first_name|"there"}}!', {})).toBe("Hi there!");
    expect(personalize("{{name}}", { name: "<b>x</b>" })).toBe("&lt;b&gt;x&lt;/b&gt;");
    expect(personalize("{{{name}}}", { name: "<b>x</b>" })).toBe("<b>x</b>");
  });

  it("never leaks unknown tags", () => {
    expect(personalize("Hello {{unknown}}.", {})).toBe("Hello .");
  });

  it("handles conditional blocks", () => {
    const t = "{{#if company}}At {{company}}{{else}}Solo{{/if}}";
    expect(personalize(t, { company: "Acme" })).toBe("At Acme");
    expect(personalize(t, { company: "" })).toBe("Solo");
    expect(personalize("{{#if vip}}VIP{{/if}}", { vip: "false" })).toBe("");
  });

  it("keeps 0 as a real value", () => {
    expect(personalize('{{orders|"none"}}', { orders: 0 })).toBe("0");
  });

  it("extracts tags", () => {
    expect(extractTags('{{a}} {{b|"x"}} {{{c}}} {{#if d}}{{/if}}').sort()).toEqual(["a", "b", "c", "d"]);
  });
});

describe("brand layout", () => {
  it("renders valid responsive HTML with compliance footer for every starter", async () => {
    for (const s of starterTemplates) {
      const mjml = brandLayout({
        body: s.body,
        preheader: s.preheader,
        company: { name: "Mailfox", address: "1 Fox Lane, Lahore" },
        unsubscribeUrl: "{{unsubscribe_url}}",
        preferencesUrl: "{{preferences_url}}",
      });
      const { html, text, errors } = await renderMjml(mjml);
      expect(errors, s.key).toEqual([]);
      expect(html).toContain("1 Fox Lane, Lahore");
      expect(html).toContain("{{unsubscribe_url}}");
      expect(text).toContain("Unsubscribe");
      expect(text.length).toBeGreaterThan(50);
    }
  });
});
