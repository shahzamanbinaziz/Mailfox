import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Logo,
  LogoMark,
  NoCampaignsIllustration,
  NoContactsIllustration,
  NoMailboxesIllustration,
} from "../src";

describe("brand components render accessible SVG", () => {
  it("LogoMark has an accessible label by default", () => {
    const html = renderToStaticMarkup(<LogoMark size={16} />);
    expect(html).toContain('aria-label="Mailfox"');
    expect(html).toContain('width="16"');
  });

  it("LogoMark can be decorative", () => {
    const html = renderToStaticMarkup(<LogoMark title={null} />);
    expect(html).toContain('aria-hidden="true"');
  });

  it("mono variant uses currentColor", () => {
    expect(renderToStaticMarkup(<LogoMark variant="mono" />)).toContain('fill="currentColor"');
  });

  it("Logo keeps the aspect ratio", () => {
    const html = renderToStaticMarkup(<Logo height={64} />);
    expect(html).toMatch(/width="\d+(\.\d+)?"/);
    expect(html).toContain('height="64"');
  });

  it.each([
    [NoCampaignsIllustration, "No campaigns yet"],
    [NoContactsIllustration, "No contacts yet"],
    [NoMailboxesIllustration, "No mailboxes connected"],
  ])("empty state %#", (Component, label) => {
    expect(renderToStaticMarkup(<Component />)).toContain(`aria-label="${label}"`);
  });
});
