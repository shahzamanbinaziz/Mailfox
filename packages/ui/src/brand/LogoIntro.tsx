"use client";

import { useEffect, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { brand, motion as m } from "../tokens";
import { MARK } from "./geometry";
import { Logo } from "./Logo";
import { LogoMark } from "./LogoMark";
import { WORDMARK } from "./wordmark";

export interface LogoIntroProps {
  /** Height in px. */
  height?: number;
  /** Also slide in the wordmark. */
  withWordmark?: boolean;
  /** Called when the sequence finishes (immediately when reduced motion is on). */
  onComplete?: () => void;
}

/** Envelope flap polygon (closed position). Rotating it about y=20 opens/closes the envelope. */
const FLAP = "M6 18 L58 18 L58 22 L32 46 L6 22 Z";

/**
 * Animated logo intro (~1.3s): ears pop up → envelope flap folds shut → face appears → swoosh trail.
 * Respects `prefers-reduced-motion` by rendering the static mark.
 */
export function LogoIntro({ height = 96, withWordmark = false, onComplete }: LogoIntroProps) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    if (reduce) onComplete?.();
  }, [reduce, onComplete]);

  if (reduce) {
    return withWordmark ? <Logo height={height} /> : <LogoMark size={height} />;
  }

  const spring = { type: "spring", stiffness: 520, damping: 18 } as const;

  return (
    <svg
      viewBox={withWordmark ? `-28 0 ${WORDMARK.width + 28} 64` : "-28 0 92 64"}
      width={withWordmark ? ((WORDMARK.width + 28) / 64) * height : (92 / 64) * height}
      height={height}
      role="img"
      aria-label="Mailfox"
      style={{ overflow: "visible" }}
    >
      <defs>
        <clipPath id={`${uid}-body`}>
          <rect {...MARK.body} />
        </clipPath>
        <linearGradient id={`${uid}-trail`} x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor={brand.orange} />
          <stop offset="1" stopColor={brand.orange} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Swoosh trail */}
      <motion.path
        d="M2 44 C-6 40 -14 42 -26 34"
        fill="none"
        stroke={`url(#${uid}-trail)`}
        strokeWidth={5}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
        transition={{ delay: 0.85, duration: 0.45, ease: "easeOut" }}
      />

      {/* Ears pop up from behind the envelope */}
      <motion.g initial={{ y: 16 }} animate={{ y: 0 }} transition={{ ...spring, delay: 0.1 }}>
        <g fill={brand.orange}>
          <path d={MARK.earLeft} />
          <path d={MARK.earRight} />
        </g>
        <g fill={brand.ink}>
          <path d={MARK.innerEarLeft} />
          <path d={MARK.innerEarRight} />
        </g>
      </motion.g>

      {/* Envelope body */}
      <motion.g
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: m.ease }}
        style={{ transformOrigin: "32px 37px" }}
      >
        <rect {...MARK.body} fill={brand.orange} />
        <rect {...MARK.inner} fill={brand.cream} />
      </motion.g>

      {/* Flap folds shut: rotate around the top edge (scaleY -1 → 1) */}
      <g clipPath={`url(#${uid}-body)`} style={{ overflow: "visible" }}>
        <motion.path
          d={FLAP}
          fill={brand.orange}
          initial={{ scaleY: -0.9 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease: m.ease }}
          style={{ transformOrigin: "32px 20px" }}
        />
      </g>
      {/* Face */}
      <motion.g
        fill={brand.ink}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.25, ease: m.ease }}
        style={{ transformOrigin: "32px 36px" }}
        onAnimationComplete={() => {
          if (!withWordmark) setTimeout(() => onComplete?.(), 450);
        }}
      >
        <ellipse {...MARK.eyeLeft} />
        <ellipse {...MARK.eyeRight} />
        <path d={MARK.nose} />
      </motion.g>

      {withWordmark && (
        // The static translate lives on the <g>: Framer Motion's `x` writes a CSS transform that
        // would otherwise replace the SVG transform attribute on the animated element.
        <g transform={WORDMARK.transform}>
          <motion.path
            fill="currentColor"
            d={WORDMARK.d}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.4, ease: m.ease }}
            onAnimationComplete={() => onComplete?.()}
          />
        </g>
      )}
    </svg>
  );
}
