"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { LogOut, Moon, Search, Send, ShieldCheck, Sun, UserRound } from "lucide-react";
import { CommandPrimitive as Command, Kbd } from "@mailfox/ui/components";
import { logoutAction } from "@/app/(app)/actions";
import { setTheme } from "@/components/theme";
import { mainNav, secondaryNav } from "./nav";

interface SearchHit {
  type: "contact" | "campaign";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const itemClass =
  "flex cursor-default select-none items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none data-[selected=true]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground";
const groupClass =
  "px-1 py-1.5 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground";

/** ⌘K / Ctrl+K: jump anywhere, run actions, and search contacts + campaigns. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { hits: [] }))
        .then((d: { hits: SearchHit[] }) => setHits(d.hits))
        .catch(() => undefined);
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    setQuery("");
    setHits([]);
    fn();
  };
  const go = (href: string) => run(() => router.push(href));
  const showHits = query.trim().length >= 2 && hits.length > 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[14vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search pages, contacts and campaigns, or run an action.
          </DialogPrimitive.Description>
          <Command label="Command palette" shouldFilter={!showHits} className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Command.Input
                value={query}
                onValueChange={(v) => {
                  setQuery(v);
                  if (v.trim().length < 2) setHits([]);
                }}
                placeholder="Search contacts, campaigns, pages…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5">
              <Command.Empty className="px-4 py-10 text-center text-sm text-muted-foreground">
                No results for “{query}”.
              </Command.Empty>
              {showHits && (
                <Command.Group heading="Search results" className={groupClass}>
                  {hits.map((h) => (
                    <Command.Item
                      key={`${h.type}-${h.id}`}
                      value={`${h.type}-${h.id}`}
                      onSelect={() => go(h.href)}
                      className={itemClass}
                    >
                      {h.type === "contact" ? <UserRound /> : <Send />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{h.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{h.subtitle}</span>
                      </span>
                      <span className="text-xs capitalize text-muted-foreground">{h.type}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              {!showHits && (
                <>
                  <Command.Group heading="Go to" className={groupClass}>
                    {[...mainNav, ...secondaryNav].map((n) => {
                      const Icon = n.icon;
                      return (
                        <Command.Item
                          key={n.href}
                          value={`${n.label} ${n.keywords?.join(" ") ?? ""}`}
                          onSelect={() => go(n.href)}
                          className={itemClass}
                        >
                          <Icon /> {n.label}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                  <Command.Group heading="Actions" className={groupClass}>
                    <Command.Item
                      value="light theme"
                      onSelect={() => run(() => setTheme("light"))}
                      className={itemClass}
                    >
                      <Sun /> Switch to light theme
                    </Command.Item>
                    <Command.Item
                      value="dark theme"
                      onSelect={() => run(() => setTheme("dark"))}
                      className={itemClass}
                    >
                      <Moon /> Switch to dark theme
                    </Command.Item>
                    <Command.Item
                      value="security two-factor 2fa"
                      onSelect={() => go("/settings/security")}
                      className={itemClass}
                    >
                      <ShieldCheck /> Set up two-factor authentication
                    </Command.Item>
                    <Command.Item
                      value="sign out log out"
                      onSelect={() => run(() => startTransition(() => logoutAction()))}
                      className={itemClass}
                    >
                      <LogOut /> Sign out
                    </Command.Item>
                  </Command.Group>
                </>
              )}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
