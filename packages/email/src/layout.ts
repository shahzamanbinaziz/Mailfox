/**
 * Default Mailfox MJML layout: branded header with logo, content slot, and a compliant footer
 * (company name + physical address + unsubscribe + manage preferences).
 *
 * Brand colours are inlined (not imported from @mailfox/ui) so this package stays React-free.
 */
export const EMAIL_BRAND = {
  orange: "#FF6A1A",
  orangeText: "#A94000", // fox-700: AA-compliant orange on white
  ink: "#0F1729",
  muted: "#4C5872", // ink-600
  border: "#E3EBFC", // ink-100
  canvas: "#F3F7FF", // ink-50
  white: "#FFFFFF",
  font: "'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export interface LayoutOptions {
  /** MJML for the content area: one or more <mj-section>/<mj-wrapper> elements. */
  body: string;
  title?: string;
  /** Inbox preview text (hidden in the email body). */
  preheader?: string;
  /** Absolute URL of a PNG logo (email clients do not support SVG). */
  logoUrl?: string;
  logoAlt?: string;
  company: { name: string; address: string };
  /** Personalization tags are allowed, e.g. "{{unsubscribe_url}}". */
  unsubscribeUrl: string;
  preferencesUrl?: string;
  /** Short "why you're receiving this" line. */
  reason?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function brandLayout(o: LayoutOptions): string {
  const b = EMAIL_BRAND;
  const logo = o.logoUrl
    ? `<mj-image src="${esc(o.logoUrl)}" alt="${esc(o.logoAlt ?? o.company.name)}" width="150px" align="left" padding="0" />`
    : `<mj-text font-size="22px" font-weight="800" color="${b.ink}" padding="0">${esc(o.company.name)}</mj-text>`;
  const prefs = o.preferencesUrl
    ? ` · <a href="${esc(o.preferencesUrl)}" style="color:${b.muted};text-decoration:underline;">Manage preferences</a>`
    : "";

  return `<mjml lang="en">
  <mj-head>
    ${o.title ? `<mj-title>${esc(o.title)}</mj-title>` : ""}
    ${o.preheader ? `<mj-preview>${esc(o.preheader)}</mj-preview>` : ""}
    <mj-font name="Plus Jakarta Sans" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" />
    <mj-attributes>
      <mj-all font-family="${b.font}" />
      <mj-text font-size="16px" line-height="1.6" color="${b.ink}" />
      <mj-button background-color="${b.orange}" color="${b.ink}" font-weight="700" border-radius="10px" inner-padding="14px 26px" font-size="16px" />
      <mj-section padding="0" />
    </mj-attributes>
    <mj-style inline="inline">
      a { color: ${b.orangeText}; }
    </mj-style>
    <mj-style>
      @media (prefers-color-scheme: dark) {
        .mf-canvas { background: #0F1729 !important; }
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="${b.canvas}" width="600px" css-class="mf-canvas">
    <mj-section padding="28px 24px 16px">
      <mj-column>${logo}</mj-column>
    </mj-section>
    <mj-wrapper background-color="${b.white}" border-radius="16px" padding="8px 0" border="1px solid ${b.border}">
      ${o.body}
    </mj-wrapper>
    <mj-section padding="24px 24px 8px">
      <mj-column>
        <mj-divider border-color="${b.orange}" border-width="3px" width="40px" align="left" padding="0 0 16px" />
        <mj-text font-size="12px" line-height="1.6" color="${b.muted}" padding="0">
          <strong>${esc(o.company.name)}</strong><br />${esc(o.company.address)}
        </mj-text>
        <mj-text font-size="12px" line-height="1.6" color="${b.muted}" padding="8px 0 0">
          ${o.reason ? `${esc(o.reason)}<br />` : ""}<a href="${esc(o.unsubscribeUrl)}" style="color:${b.muted};text-decoration:underline;">Unsubscribe</a>${prefs}
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="8px 24px 32px">
      <mj-column>
        <mj-text font-size="11px" color="${b.muted}" padding="0">Sent with Mailfox 🦊</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}
