import type { Metadata } from "next";
import Link from "next/link";
import {
  Logo,
  LogoMark,
  NoCampaignsIllustration,
  NoContactsIllustration,
  NoMailboxesIllustration,
  colors,
  contrastRatio,
  relativeLuminance,
  scaleSteps,
  semantic,
  type ScaleName,
} from "@mailfox/ui";
import { brandLayout, personalize, renderMjml, starterTemplates } from "@mailfox/email";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimationPreviews, CopyHex } from "./Previews";

export const metadata: Metadata = { title: "Brand guide" };

const sections = [
  ["logo", "Logo"],
  ["clear-space", "Clear space"],
  ["colors", "Colour"],
  ["contrast", "Contrast"],
  ["type", "Typography"],
  ["motion", "Motion"],
  ["empty-states", "Empty states"],
  ["email", "Email"],
] as const;

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-14">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {intro && <p className="mt-2 max-w-2xl text-muted-foreground">{intro}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Download({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:border-primary hover:text-link"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
      >
        <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
      </svg>
      {children}
    </a>
  );
}

function LogoCard({
  bg,
  fg,
  label,
  children,
  files,
}: {
  bg: string;
  fg: string;
  label: string;
  children: React.ReactNode;
  files: [string, string][];
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid h-44 place-items-center" style={{ background: bg, color: fg }}>
        {children}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 p-4">
        <span className="font-medium">{label}</span>
        <span className="flex gap-2">
          {files.map(([href, text]) => (
            <Download key={href} href={href}>
              {text}
            </Download>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}

async function emailPreview(): Promise<string> {
  const welcome = starterTemplates[0];
  if (!welcome) return "";
  const mjml = brandLayout({
    body: welcome.body,
    preheader: welcome.preheader,
    company: { name: "Mailfox", address: "Mailfox HQ, 1 Fox Lane, Lahore, Pakistan" },
    logoUrl: "/brand-assets/logo-full-email.png",
    unsubscribeUrl: "#",
    preferencesUrl: "#",
    reason: "You're receiving this because you subscribed at mailfox.local.",
  });
  const { html } = await renderMjml(mjml);
  return personalize(html, { first_name: "Ayesha", company: "Acme Bakers" }, { escape: true });
}

export default async function BrandPage() {
  const preview = await emailPreview();
  const scales = Object.keys(colors) as ScaleName[];
  const contrastPairs = [
    ["primary-foreground", "primary", "Primary button"],
    ["foreground", "background", "Body text"],
    ["muted-foreground", "background", "Secondary text"],
    ["link", "background", "Links / orange text"],
    ["destructive-foreground", "destructive", "Danger button"],
    ["success-foreground", "success", "Success badge"],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <header className="sticky top-0 z-20 -mx-5 flex items-center justify-between gap-4 border-b border-border bg-background/85 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Mailfox home">
          <Logo height={30} />
          <span className="hidden rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground sm:inline">
            Brand
          </span>
        </Link>
        <nav aria-label="Brand guide sections" className="hidden gap-1 lg:flex">
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </header>

      <div className="py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-link">Mailfox brand guide</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          A clever fox that delivers your mail.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Fast, clever, trustworthy, friendly. The mark is an envelope whose flap <em>is</em> the fox’s face —
          two ideas, one shape, readable down to 16px.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Download href="/brand-assets/logo-full.svg">Full logo (SVG)</Download>
          <Download href="/brand-assets/logo-mark.svg">Mark (SVG)</Download>
          <Download href="/brand-assets/icon-512.png">App icon (PNG)</Download>
        </div>
      </div>

      <Section
        id="logo"
        title="Logo"
        intro="Use the full logo where there is room, the mark for avatars, favicons and tight spaces. Mono versions are for single-colour print, footers and stamps."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <LogoCard
            bg="#FFFFFF"
            fg="#0F1729"
            label="Full — on light"
            files={[
              ["/brand-assets/logo-full.svg", "SVG"],
              ["/brand-assets/logo-full-email.png", "PNG"],
            ]}
          >
            <Logo height={56} style={{ color: "#0F1729" }} />
          </LogoCard>
          <LogoCard
            bg="#0F1729"
            fg="#FFFFFF"
            label="Full — on dark"
            files={[
              ["/brand-assets/logo-full-dark.svg", "SVG"],
              ["/brand-assets/logo-full-dark-email.png", "PNG"],
            ]}
          >
            <Logo height={56} style={{ color: "#FFFFFF" }} />
          </LogoCard>
          <LogoCard
            bg="#FFF4F0"
            fg="#0F1729"
            label="Mono"
            files={[
              ["/brand-assets/logo-mono.svg", "SVG"],
              ["/brand-assets/logo-mark-mono.svg", "Mark SVG"],
            ]}
          >
            <div className="flex items-center gap-6">
              <LogoMark variant="mono" size={64} />
              <LogoMark variant="mono" size={64} style={{ color: "#A94000" }} />
            </div>
          </LogoCard>
          <LogoCard
            bg="var(--muted)"
            fg="var(--foreground)"
            label="Mark — 64 / 32 / 16 px"
            files={[["/brand-assets/logo-mark.svg", "SVG"]]}
          >
            <div className="flex items-end gap-6">
              <LogoMark size={64} />
              <LogoMark size={32} />
              <LogoMark size={16} />
            </div>
          </LogoCard>
        </div>
      </Section>

      <Section
        id="clear-space"
        title="Clear space & minimum size"
        intro="Keep a margin of at least one ear height (¼ of the mark) on every side. Never place other elements inside it."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <div className="grid place-items-center rounded-xl border border-border bg-card p-8 md:col-span-2">
            <div className="relative p-6" style={{ outline: "2px dashed var(--primary)", outlineOffset: 0 }}>
              <Logo height={64} />
              <span className="absolute -top-6 left-0 font-mono text-xs text-link">x = ¼ mark</span>
            </div>
          </div>
          <ul className="space-y-3 rounded-xl border border-border bg-card p-6 text-sm">
            <li>
              <strong>Minimum size:</strong> mark 16px, full logo 96px wide.
            </li>
            <li>
              <strong>Don’t</strong> recolour the fox, add shadows or outlines, or rotate the mark.
            </li>
            <li>
              <strong>Don’t</strong> put the colour logo on busy photos — use mono.
            </li>
            <li>
              <strong>Emails:</strong> use the PNG files (Gmail and Outlook don’t render SVG).
            </li>
          </ul>
        </div>
      </Section>

      <Section
        id="colors"
        title="Colour"
        intro="Fox orange leads, deep ink grounds. Scales are OKLCH ramps from the two brand anchors. Click a swatch to copy its hex."
      >
        <div className="space-y-5">
          {scales.map((name) => (
            <div key={name}>
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className="font-semibold capitalize">{name}</h3>
                {name === "fox" && (
                  <span className="text-xs text-muted-foreground">anchor 500 · #FF6A1A</span>
                )}
                {name === "ink" && (
                  <span className="text-xs text-muted-foreground">anchor 950 · #0F1729</span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                {scaleSteps.map((step) => {
                  const hex = colors[name][step];
                  return (
                    <CopyHex key={step} hex={hex} label={String(step)} dark={relativeLuminance(hex) < 0.35} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="contrast"
        title="Contrast (WCAG AA)"
        intro="Every semantic pair is verified ≥ 4.5:1 in unit tests. Note: white text on fox-500 fails (2.9:1), so primary buttons use ink text."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {(["light", "dark"] as const).map((mode) => (
            <div key={mode} className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-muted px-4 py-2 text-sm font-semibold capitalize">
                {mode} mode
              </div>
              <ul className="divide-y divide-border">
                {contrastPairs.map(([fg, bg, label]) => {
                  const t = semantic[mode];
                  const ratio = contrastRatio(t[fg], t[bg]);
                  return (
                    <li key={label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                      <span
                        className="rounded-md px-3 py-1 text-sm font-semibold"
                        style={{ background: t[bg], color: t[fg] }}
                      >
                        {label}
                      </span>
                      <span className="font-mono text-sm">
                        {ratio.toFixed(2)}:1{" "}
                        <span className={ratio >= 4.5 ? "text-success" : "text-destructive"}>
                          {ratio >= 4.5 ? "AA ✓" : "fail"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="type"
        title="Typography"
        intro="Plus Jakarta Sans for everything people read; JetBrains Mono for code, IDs and DNS records. Both are self-hosted (no Google Fonts request)."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Plus Jakarta Sans · 400–800</p>
            <p className="mt-3 text-5xl font-extrabold tracking-tight">Aa Mailfox</p>
            <p className="mt-4 text-2xl font-bold">Campaign sent to 12,480 people</p>
            <p className="mt-2 text-base">Open rate 46.1% · Click rate 11.4% · Bounces 1.5%</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The quick brown fox delivers the lazy dog’s mail.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">JetBrains Mono · 400–700</p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm leading-relaxed">
              {`v=spf1 a mx include:mailfox.local ~all
mailfox._domainkey  TXT  "v=DKIM1; k=rsa; p=MIIB…"
_dmarc              TXT  "v=DMARC1; p=quarantine"`}
            </pre>
          </div>
        </div>
      </Section>

      <Section
        id="motion"
        title="Motion"
        intro="Quick start, soft landing. Everything respects prefers-reduced-motion — with it on, you see the final frame instantly."
      >
        <AnimationPreviews />
      </Section>

      <Section
        id="empty-states"
        title="Empty states"
        intro="Friendly, never sad. Each one points to the next action."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            [
              NoCampaignsIllustration,
              "No campaigns yet",
              "Create your first campaign",
              "/brand-assets/no-campaigns.svg",
            ],
            [
              NoContactsIllustration,
              "No contacts yet",
              "Import a CSV or add a signup form",
              "/brand-assets/no-contacts.svg",
            ],
            [
              NoMailboxesIllustration,
              "No mailboxes connected",
              "Connect an SMTP mailbox to start sending",
              "/brand-assets/no-mailboxes.svg",
            ],
          ].map(([Illu, title, hint, file]) => {
            const C = Illu as typeof NoCampaignsIllustration;
            return (
              <div
                key={title as string}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center"
              >
                <C width={220} height={165} />
                <h3 className="mt-2 font-semibold">{title as string}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{hint as string}</p>
                <Download href={file as string}>SVG</Download>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="email"
        title="Email layout"
        intro="Default MJML layout: logo header, white content card, and a compliant footer with the company’s physical address, unsubscribe and preference links."
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-danger-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-success-400" />
            <span className="ml-2">Welcome — preview with sample data</span>
          </div>
          <iframe
            title="Email layout preview"
            srcDoc={preview}
            className="h-[720px] w-full bg-white"
            sandbox=""
          />
        </div>
      </Section>
    </div>
  );
}
