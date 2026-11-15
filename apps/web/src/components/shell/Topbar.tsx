"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bell, LogOut, Menu, Monitor, Moon, Palette, Search, Settings, ShieldCheck, Sun } from "lucide-react";
import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuCheckItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Kbd,
  cn,
} from "@mailfox/ui/components";
import { logoutAction, markNotificationsReadAction } from "@/app/(app)/actions";
import { setTheme, useIsDark, useThemeMode } from "@/components/theme";
import { timeAgo } from "@/lib/format";
import type { ShellNotification, ShellUser } from "./types";

function Notifications({ items }: { items: ShellNotification[] }) {
  const [pending, start] = useTransition();
  const unread = items.filter((n) => !n.read).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => markNotificationsReadAction())}
              className="text-xs font-medium text-link hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You’re all caught up. 🦊</p>
          ) : (
            items.map((n) => (
              <DropdownMenuItem key={n.id} asChild className="items-start">
                <Link href={n.href ?? "/dashboard"}>
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-primary",
                    )}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{n.title}</span>
                    {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeButton() {
  const dark = useIsDark();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

function UserMenu({ user, role }: { user: ShellUser; role: string }) {
  const mode = useThemeMode();
  const [, start] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-2" aria-label="Account menu">
        <Avatar name={user.name || user.email} src={user.avatarUrl} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Avatar name={user.name || user.email} src={user.avatarUrl} className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name || "Unnamed"}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="px-2.5 pb-2">
          <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold capitalize text-accent-foreground">
            {role.toLowerCase()}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/security">
              <ShieldCheck /> Security & 2FA
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/brand">
              <Palette /> Brand guide
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuCheckItem checked={mode === "light"} onSelect={() => setTheme("light")}>
          <Sun /> Light
        </DropdownMenuCheckItem>
        <DropdownMenuCheckItem checked={mode === "dark"} onSelect={() => setTheme("dark")}>
          <Moon /> Dark
        </DropdownMenuCheckItem>
        <DropdownMenuCheckItem checked={mode === "system"} onSelect={() => setTheme("system")}>
          <Monitor /> System
        </DropdownMenuCheckItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => start(() => logoutAction())}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar({
  user,
  role,
  notifications,
  onMenu,
  onSearch,
}: {
  user: ShellUser;
  role: string;
  notifications: ShellNotification[];
  onMenu: () => void;
  onSearch: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-5">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu />
      </Button>
      <button
        type="button"
        onClick={onSearch}
        className="flex h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition hover:border-input hover:bg-muted"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">Search or jump to…</span>
        <span className="hidden items-center gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <ThemeButton />
        <Notifications items={notifications} />
        <div className="ml-1.5">
          <UserMenu user={user} role={role} />
        </div>
      </div>
    </header>
  );
}
