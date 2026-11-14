/**
 * Personalization engine.
 *
 *   {{first_name}}                 → value, HTML-escaped
 *   {{first_name|"there"}}         → value or fallback when empty
 *   {{{custom_html}}}              → raw value (not escaped) — use only for trusted values
 *   {{#if company}}…{{else}}…{{/if}} → conditional block (truthy = non-empty, not "false"/"0")
 *
 * Unknown tags render as empty string (or their fallback) — never as raw `{{tag}}`.
 */
export type MergeData = Record<string, string | number | boolean | null | undefined>;

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isTruthy = (v: MergeData[string]) =>
  v !== undefined && v !== null && v !== "" && v !== false && v !== "false" && v !== 0 && v !== "0";

function lookup(data: MergeData, key: string): MergeData[string] {
  if (key in data) return data[key];
  // Allow case-insensitive keys and dashes vs underscores ({{First-Name}} → first_name)
  const norm = key.toLowerCase().replace(/-/g, "_");
  return data[norm];
}

const IF_BLOCK = /\{\{#if\s+([\w.-]+)\s*\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
const RAW_TAG = /\{\{\{\s*([\w.-]+)\s*\}\}\}/g;
const TAG = /\{\{\s*([\w.-]+)\s*(?:\|\s*"([^"]*)"\s*)?\}\}/g;

export function personalize(template: string, data: MergeData, opts: { escape?: boolean } = {}): string {
  const escape = opts.escape ?? true;
  let out = template;
  // Resolve conditionals innermost-first by repeating until stable (supports simple nesting).
  for (let i = 0; i < 10; i++) {
    const next = out.replace(IF_BLOCK, (_m, key: string, yes: string, no?: string) =>
      isTruthy(lookup(data, key)) ? yes : (no ?? ""),
    );
    if (next === out) break;
    out = next;
  }
  out = out.replace(RAW_TAG, (_m, key: string) => String(lookup(data, key) ?? ""));
  out = out.replace(TAG, (_m, key: string, fallback?: string) => {
    const v = lookup(data, key);
    const s = isTruthy(v) || v === 0 ? String(v) : (fallback ?? "");
    return escape ? escapeHtml(s) : s;
  });
  return out;
}

/** List the merge tags used in a template (for editor hints and validation). */
export function extractTags(template: string): string[] {
  const tags = new Set<string>();
  for (const m of template.matchAll(TAG)) if (m[1]) tags.add(m[1]);
  for (const m of template.matchAll(RAW_TAG)) if (m[1]) tags.add(m[1]);
  for (const m of template.matchAll(/\{\{#if\s+([\w.-]+)/g)) if (m[1]) tags.add(m[1]);
  return [...tags];
}
