"use client";

import { useEffect, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { brand, colors, motion as m } from "../tokens";
import { MARK } from "./geometry";

export interface CampaignSentProps {
  /** Headline under the animation. */
  label?: string;
  /** Secondary line, e.g. "12,480 emails queued". */
  detail?: string;
  /** Size of the stage in px. */
  size?: number;
  onComplete?: () => void;
}

/**
 * "Campaign sent" success animation (~1.6s): the fox envelope crouches, then flies off up-right
 * leaving a bushy fox-tail trail; a success check pops in where it was.
 */
export function CampaignSent({ label = "Campaign sent", detail, size = 200, onComplete }: CampaignSentProps) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    if (reduce) onComplete?.();
  }, [reduce, onComplete]);

  return (
    <div role="status" aria-live="polite" style={{ display: "grid", justifyItems: "center", gap: 12 }}>
      <svg
        viewBox="0 0 200 160"
        width={size}
        height={(size * 160) / 200}
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`${uid}-tail`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={brand.cream} stopOpacity="0" />
            <stop offset="0.35" stopColor={brand.cream} />
            <stop offset="0.45" stopColor={brand.orange} />
            <stop offset="1" stopColor={brand.orange} />
          </linearGradient>
        </defs>

        {!reduce && (
          <>
            {/* Fox-tail trail: a thick tapered curve that sweeps behind the flying envelope */}
            <motion.path
              d="M40 130 C 70 120, 100 100, 120 70 S 160 30, 180 18"
              fill="none"
              stroke={`url(#${uid}-tail)`}
              strokeWidth={16}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
              transition={{ delay: 0.45, duration: 0.9, times: [0, 0.6, 1], ease: "easeOut" }}
            />
            {/* Envelope flies off */}
            <motion.g
              initial={{ x: 68, y: 52, scale: 1, rotate: 0, opacity: 1 }}
              animate={{
                x: [68, 68, 170],
                y: [52, 60, -20],
                scale: [1, 0.92, 0.45],
                rotate: [0, 4, -18],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 1, times: [0, 0.3, 1], ease: m.ease }}
            >
              <path d={MARK.earLeft} fill={brand.orange} />
              <path d={MARK.earRight} fill={brand.orange} />
              <path d={MARK.innerEarLeft} fill={brand.ink} />
              <path d={MARK.innerEarRight} fill={brand.ink} />
              <rect {...MARK.body} fill={brand.orange} />
              <rect {...MARK.inner} fill={brand.cream} />
              <path d="M6 18 L58 18 L58 22 L32 46 L6 22 Z" fill={brand.orange} />
              <g fill={brand.ink}>
                <ellipse {...MARK.eyeLeft} />
                <ellipse {...MARK.eyeRight} />
                <path d={MARK.nose} />
              </g>
            </motion.g>
          </>
        )}

        {/* Success check */}
        <motion.g
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: reduce ? 0 : 1.0, type: "spring", stiffness: 400, damping: 16 }}
          style={{ transformOrigin: "100px 84px" }}
          onAnimationComplete={() => {
            if (!reduce) onComplete?.();
          }}
        >
          <circle cx="100" cy="84" r="34" fill={colors.success[500]} />
          <motion.path
            d="M84 85 L96 97 L118 73"
            fill="none"
            stroke="#fff"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: reduce ? 0 : 1.15, duration: 0.3 }}
          />
        </motion.g>
      </svg>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 1.2, duration: 0.3 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontWeight: 700, fontSize: "1.125rem" }}>{label}</div>
        {detail && <div style={{ opacity: 0.7, fontSize: "0.875rem", marginTop: 2 }}>{detail}</div>}
      </motion.div>
    </div>
  );
}
