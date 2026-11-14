import { useId, type SVGProps } from "react";
import { ColorMarkParts } from "./LogoMark";
import { WORDMARK } from "./wordmark";

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Rendered height in px; width follows the aspect ratio. */
  height?: number;
  /** Accessible label. */
  title?: string;
}

/**
 * Mark + "Mailfox" wordmark. The wordmark uses `currentColor`, so it follows the
 * surrounding text colour (ink in light mode, white in dark mode).
 */
export function Logo({ height = 32, title = "Mailfox", ...rest }: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const width = (WORDMARK.width / 64) * height;
  return (
    <svg
      viewBox={`0 0 ${WORDMARK.width} 64`}
      width={width}
      height={height}
      role="img"
      aria-label={title}
      {...rest}
    >
      <ColorMarkParts uid={uid} />
      <path transform={WORDMARK.transform} fill="currentColor" d={WORDMARK.d} />
    </svg>
  );
}
