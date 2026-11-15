"use client";

import { motion } from "framer-motion";
import { LogoIntro } from "@mailfox/ui";

const stats = [
  ["50k+", "emails a day, one VPS"],
  ["2FA", "on every account"],
  ["100%", "opt-in sending"],
];

/** Left panel of the sign-in page: brand intro over the ink background. */
export function LoginArt() {
  return (
    <aside className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col">
      {/* soft orange glow + grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 size-[520px] rounded-full bg-fox-500/25 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]"
      />
      <div className="relative">
        <LogoIntro height={44} withWordmark />
      </div>
      <div className="relative mt-auto max-w-md">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl font-extrabold leading-tight tracking-tight"
        >
          Your campaigns, your servers, <span className="text-fox-400">delivered by a clever fox.</span>
        </motion.h2>
        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6"
        >
          {stats.map(([value, label]) => (
            <div key={label}>
              <dt className="text-2xl font-bold text-white">{value}</dt>
              <dd className="mt-1 text-xs text-ink-300">{label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </aside>
  );
}
