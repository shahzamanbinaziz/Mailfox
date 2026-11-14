import mjml2html from "mjml";
import { convert } from "html-to-text";

export interface RenderResult {
  html: string;
  text: string;
  errors: string[];
}

/** Compile MJML to responsive HTML and derive the plain-text alternative. */
export async function renderMjml(source: string): Promise<RenderResult> {
  const result = await mjml2html(source, { validationLevel: "soft", keepComments: false });
  const errors = result.errors.map((e) => `line ${e.line}: ${e.message}`);
  return { html: result.html, text: htmlToPlainText(result.html), errors };
}

/** Plain-text version of an HTML email (links kept as "text [url]"). */
export function htmlToPlainText(html: string): string {
  return convert(html, {
    wordwrap: 78,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      { selector: "h1", options: { uppercase: false } },
      { selector: "h2", options: { uppercase: false } },
    ],
  })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
