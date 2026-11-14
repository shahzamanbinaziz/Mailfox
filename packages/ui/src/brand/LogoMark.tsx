import { useId, type SVGProps } from "react";
import { brand } from "../tokens";
import { MARK } from "./geometry";

export interface LogoMarkProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Rendered width/height in px (square). */
  size?: number;
  /** `color` = brand colours; `mono` = single colour (uses currentColor). */
  variant?: "color" | "mono";
  /** Accessible label. Pass `null` for purely decorative use. */
  title?: string | null;
}

/** The Mailfox "Envelope Fox" mark. */
export function LogoMark({ size = 32, variant = "color", title = "Mailfox", ...rest }: LogoMarkProps) {
  const uid = useId().replace(/:/g, "");
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };
  return (
    <svg viewBox={MARK.viewBox} width={size} height={size} {...a11y} {...rest}>
      {variant === "color" ? <ColorMarkParts uid={uid} /> : <MonoMarkParts uid={uid} />}
    </svg>
  );
}

export function ColorMarkParts({ uid }: { uid: string }) {
  const { body, inner, eyeLeft, eyeRight } = MARK;
  return (
    <>
      <defs>
        <clipPath id={`${uid}-inner`}>
          <rect {...inner} />
        </clipPath>
      </defs>
      <g fill={brand.orange}>
        <path d={MARK.earLeft} />
        <path d={MARK.earRight} />
        <rect {...body} />
      </g>
      <g fill={brand.ink}>
        <path d={MARK.innerEarLeft} />
        <path d={MARK.innerEarRight} />
      </g>
      <path d={MARK.muzzle} fill={brand.cream} clipPath={`url(#${uid}-inner)`} />
      <g fill={brand.ink}>
        <ellipse {...eyeLeft} />
        <ellipse {...eyeRight} />
        <path d={MARK.nose} />
      </g>
    </>
  );
}

function MonoMarkParts({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <mask id={`${uid}-cut`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <g fill="#000">
            <path d={MARK.innerEarLeft} />
            <path d={MARK.innerEarRight} />
            <ellipse {...MARK.eyeLeft} />
            <ellipse {...MARK.eyeRight} />
          </g>
          <path d={MARK.flapLine} fill="none" stroke="#000" strokeWidth={3} strokeLinejoin="round" />
        </mask>
      </defs>
      <g fill="currentColor" mask={`url(#${uid}-cut)`}>
        <path d={MARK.earLeft} />
        <path d={MARK.earRight} />
        <rect {...MARK.body} />
      </g>
    </>
  );
}
