"use client";

import { useState, type ReactNode } from "react";
import { CampaignSent, FoxSkeletonCard, FoxSpinner, LogoIntro } from "@mailfox/ui";

function ReplayCard({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: (key: number) => ReactNode;
}) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{note}</p>
        </div>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
        >
          Replay
        </button>
      </div>
      <div className="grid min-h-48 flex-1 place-items-center rounded-lg bg-muted/60 p-6">
        {children(run)}
      </div>
    </div>
  );
}

export function AnimationPreviews() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <ReplayCard title="Logo intro" note="Ears pop → flap folds shut → swoosh. 1.3s.">
        {(k) => <LogoIntro key={k} height={88} withWordmark />}
      </ReplayCard>
      <ReplayCard title="Campaign sent" note="Envelope flies off with a fox-tail trail.">
        {(k) => <CampaignSent key={k} size={180} detail="12,480 emails queued" />}
      </ReplayCard>
      <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Loader</h3>
        <p className="mb-4 text-sm text-muted-foreground">Orbit arc + ear twitch. Announced as “Loading”.</p>
        <div className="flex min-h-48 flex-1 items-center justify-center gap-10 rounded-lg bg-muted/60">
          <FoxSpinner size={32} />
          <FoxSpinner size={56} />
          <FoxSpinner size={80} />
        </div>
      </div>
      <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Skeleton</h3>
        <p className="mb-4 text-sm text-muted-foreground">Card placeholder with a faint fox watermark.</p>
        <div className="flex-1 rounded-lg bg-muted/60 p-4">
          <FoxSkeletonCard />
        </div>
      </div>
    </div>
  );
}

export function CopyHex({ hex, label, dark }: { hex: string; label: string; dark: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={`Copy ${hex}`}
      onClick={() => {
        void navigator.clipboard?.writeText(hex).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="group flex h-16 flex-col justify-end rounded-lg p-2 text-left text-[11px] leading-tight ring-1 ring-black/5 transition hover:scale-[1.04]"
      style={{ background: hex, color: dark ? "#FFFFFF" : "#0F1729" }}
    >
      <span className="font-semibold">{label}</span>
      <span className="font-mono opacity-80">{copied ? "Copied!" : hex}</span>
    </button>
  );
}
