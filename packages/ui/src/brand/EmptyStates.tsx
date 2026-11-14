import type { ReactNode, SVGProps } from "react";
import { brand, colors } from "../tokens";

/*
 * Empty-state illustrations. Colours come from CSS variables with light-mode fallbacks,
 * so the same SVG works in the app (light + dark) and as a standalone file in /brand/empty-states.
 */
const c = {
  blob: `var(--mf-illu-blob, ${colors.ink[50]})`,
  shadow: `var(--mf-illu-shadow, ${colors.ink[100]})`,
  paper: `var(--mf-illu-paper, #FFFFFF)`,
  line: `var(--mf-illu-line, ${colors.ink[200]})`,
  stroke: `var(--mf-illu-stroke, ${colors.ink[950]})`,
  orange: brand.orange,
  cream: brand.cream,
  ink: brand.ink,
};

type IlluProps = Omit<SVGProps<SVGSVGElement>, "children"> & { title?: string };

function Frame({ title, children, ...rest }: IlluProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 180" width={240} height={180} role="img" aria-label={title} {...rest}>
      <ellipse cx="120" cy="92" rx="96" ry="76" fill={c.blob} />
      <ellipse cx="120" cy="158" rx="70" ry="7" fill={c.shadow} />
      {children}
    </svg>
  );
}

/** No campaigns yet: an open envelope with a fox peeking out, waiting for a message. */
export function NoCampaignsIllustration({ title = "No campaigns yet", ...rest }: IlluProps) {
  return (
    <Frame title={title} {...rest}>
      {/* sparkles */}
      <g fill={c.orange}>
        <circle cx="62" cy="48" r="3" />
        <circle cx="182" cy="40" r="4" />
        <circle cx="194" cy="74" r="2.5" />
      </g>
      {/* envelope back flap (open, behind the fox) */}
      <path d="M64 96 L120 58 L176 96 Z" fill={c.line} />
      {/* fox head peeking out of the envelope */}
      <g>
        <path d="M92 86 L98 52 Q99 49 101.5 51 L116 70 Z" fill={c.orange} />
        <path d="M148 86 L142 52 Q141 49 138.5 51 L124 70 Z" fill={c.orange} />
        <path d="M98 70 L100.5 58 L109 68 Z" fill={c.ink} />
        <path d="M142 70 L139.5 58 L131 68 Z" fill={c.ink} />
        <rect x="94" y="64" width="52" height="40" rx="18" fill={c.orange} />
        <ellipse cx="110" cy="82" rx="3" ry="3.6" fill={c.ink} />
        <ellipse cx="130" cy="82" rx="3" ry="3.6" fill={c.ink} />
      </g>
      {/* envelope pocket in front */}
      <rect x="64" y="96" width="112" height="60" rx="8" fill={c.paper} stroke={c.stroke} strokeWidth="3" />
      <path
        d="M64 100 L120 136 L176 100"
        fill="none"
        stroke={c.stroke}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M66 154 L104 124 M174 154 L136 124" stroke={c.line} strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

/** No contacts yet: stacked contact cards with a "+" badge. */
export function NoContactsIllustration({ title = "No contacts yet", ...rest }: IlluProps) {
  return (
    <Frame title={title} {...rest}>
      <rect
        x="78"
        y="44"
        width="104"
        height="72"
        rx="10"
        fill={c.paper}
        stroke={c.line}
        strokeWidth="3"
        transform="rotate(8 130 80)"
      />
      <rect x="60" y="58" width="112" height="80" rx="10" fill={c.paper} stroke={c.stroke} strokeWidth="3" />
      {/* fox avatar */}
      <circle cx="90" cy="92" r="17" fill={c.cream} stroke={c.stroke} strokeWidth="3" />
      <path d="M78 84 L80 72 L88 80 Z M102 84 L100 72 L92 80 Z" fill={c.orange} />
      <path d="M77 90 Q90 80 103 90 L90 104 Z" fill={c.orange} />
      <circle cx="90" cy="103" r="2.2" fill={c.ink} />
      <rect x="116" y="80" width="42" height="7" rx="3.5" fill={c.stroke} />
      <rect x="116" y="94" width="32" height="6" rx="3" fill={c.line} />
      <rect x="76" y="118" width="80" height="6" rx="3" fill={c.line} />
      {/* plus badge */}
      <circle cx="172" cy="134" r="16" fill={c.orange} />
      <path d="M172 126 V142 M164 134 H180" stroke={c.ink} strokeWidth="3.5" strokeLinecap="round" />
    </Frame>
  );
}

/** No mailboxes yet: an empty mailbox on a post with a fox tail curling out. */
export function NoMailboxesIllustration({ title = "No mailboxes connected", ...rest }: IlluProps) {
  return (
    <Frame title={title} {...rest}>
      {/* post */}
      <rect x="112" y="108" width="16" height="48" rx="3" fill={c.stroke} />
      {/* mailbox, front view */}
      <path
        d="M86 112 V74 Q86 42 120 42 Q154 42 154 74 V112 Z"
        fill={c.paper}
        stroke={c.stroke}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M97 104 V76 Q97 54 120 54 Q143 54 143 76 V104 Z" fill={c.ink} />
      {/* fox tail hanging out of the opening */}
      <path d="M112 98 C 100 112, 78 110, 70 132 C 86 138, 108 126, 128 100 Z" fill={c.orange} />
      <path d="M70 132 C 68 124, 72 116, 82 112 C 80 120, 80 128, 84 136 Z" fill={c.cream} />
      {/* flag (down = nothing to send yet) */}
      <rect x="154" y="62" width="6" height="40" rx="2" fill={c.stroke} />
      <rect x="160" y="88" width="24" height="14" rx="2" fill={c.orange} />
      {/* "waiting" signal */}
      <path
        d="M164 34 q8 -8 16 0 M170 26 q8 -8 16 0"
        fill="none"
        stroke={c.line}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Frame>
  );
}

export const emptyStates = {
  campaigns: NoCampaignsIllustration,
  contacts: NoContactsIllustration,
  mailboxes: NoMailboxesIllustration,
} as const;
