"use client";

import type { HTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { brand } from "../tokens";
import { MARK } from "./geometry";

export interface FoxSpinnerProps {
  size?: number;
  label?: string;
}

/**
 * Loading spinner: the fox mark with an orange "orbit" arc circling it and a little ear twitch.
 * With reduced motion it shows a static mark + arc (still announced to screen readers).
 */
export function FoxSpinner({ size = 40, label = "Loading" }: FoxSpinnerProps) {
  const reduce = useReducedMotion();
  return (
    <span role="status" aria-label={label} style={{ display: "inline-flex", width: size, height: size }}>
      <svg viewBox="-8 -8 80 80" width={size} height={size} aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={4}
        />
        <motion.circle
          cx="32"
          cy="32"
          r="38"
          fill="none"
          stroke={brand.orange}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="60 180"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
          style={{ transformOrigin: "32px 32px" }}
        />
        <g transform="translate(12 13) scale(0.625)">
          <motion.g
            animate={reduce ? undefined : { rotate: [0, -8, 0, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, times: [0, 0.1, 0.2, 1] }}
            style={{ transformOrigin: "20px 22px" }}
          >
            <path d={MARK.earLeft} fill={brand.orange} />
            <path d={MARK.innerEarLeft} fill={brand.ink} />
          </motion.g>
          <path d={MARK.earRight} fill={brand.orange} />
          <path d={MARK.innerEarRight} fill={brand.ink} />
          <rect {...MARK.body} fill={brand.orange} />
          <rect {...MARK.inner} fill={brand.cream} />
          <path d="M6 18 L58 18 L58 22 L32 46 L6 22 Z" fill={brand.orange} />
          <g fill={brand.ink}>
            <ellipse {...MARK.eyeLeft} />
            <ellipse {...MARK.eyeRight} />
            <path d={MARK.nose} />
          </g>
        </g>
      </svg>
    </span>
  );
}

/** Generic shimmer block. Uses the `mf-shimmer` keyframes from tokens.css. */
export function Skeleton({ className = "", style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={`mf-skeleton ${className}`}
      style={{ borderRadius: "0.5rem", ...style }}
      {...rest}
    />
  );
}

/** Card-shaped skeleton with a faint fox watermark — used while dashboard cards load. */
export function FoxSkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "1rem",
        border: "1px solid var(--border)",
        padding: "1.25rem",
        background: "var(--card)",
      }}
    >
      <svg
        viewBox={MARK.viewBox}
        width={56}
        height={56}
        aria-hidden="true"
        style={{ position: "absolute", right: 12, top: 12, opacity: 0.08, color: "var(--foreground)" }}
      >
        <g fill="currentColor">
          <path d={MARK.earLeft} />
          <path d={MARK.earRight} />
          <rect {...MARK.body} />
        </g>
      </svg>
      <Skeleton style={{ height: 14, width: "40%", marginBottom: 16 }} />
      <Skeleton style={{ height: 28, width: "55%", marginBottom: 20 }} />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} style={{ height: 10, width: `${90 - i * 15}%`, marginBottom: 10 }} />
      ))}
    </div>
  );
}
