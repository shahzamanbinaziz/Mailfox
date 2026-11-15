"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { Check, ChevronsUpDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Logo, LogoMark } from "@mailfox/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Tooltip,
  cn,
} from "@mailfox/ui/components";
import { switchWorkspaceAction } from "@/app/(app)/actions";
import { mainNav, secondaryNav, type NavItem } from "./nav";
import type { ShellWorkspace } from "./types";

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-foreground/5 hover:text-sidebar-foreground",
        active && "text-sidebar-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon
        className={cn(
          "relative size-[18px] shrink-0",
          active ? "text-link" : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {!collapsed && <span className="relative flex-1 truncate">{item.label}</span>}
      {!collapsed && item.phase && (
        <span className="relative rounded bg-foreground/5 px-1.5 text-[10px] font-semibold text-muted-foreground">
          P{item.phase}
        </span>
      )}
    </Link>
  );
  return collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link;
}

function WorkspaceSwitcher({
  workspaces,
  currentId,
  collapsed,
}: {
  workspaces: ShellWorkspace[];
  currentId: string;
  collapsed: boolean;
}) {
  const [pending, start] = useTransition();
  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];
  if (!current) return null;
  const initial = current.name[0]?.toUpperCase() ?? "W";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-foreground/5 focus-visible:outline-2",
          collapsed && "justify-center",
          pending && "opacity-60",
        )}
        aria-label="Switch workspace"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-ink-950 text-xs font-bold text-white dark:bg-fox-500 dark:text-ink-950">
          {initial}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{current.name}</span>
              <span className="block text-[11px] capitalize text-muted-foreground">
                {current.role.toLowerCase()}
              </span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onSelect={() => w.id !== currentId && start(() => switchWorkspaceAction(w.id))}
          >
            <span className="grid size-6 place-items-center rounded bg-muted text-[11px] font-bold">
              {w.name[0]?.toUpperCase()}
            </span>
            <span className="flex-1 truncate">{w.name}</span>
            {w.id === currentId && <Check className="!text-link" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarContent({
  collapsed,
  workspaces,
  currentWorkspaceId,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  workspaces: ShellWorkspace[];
  currentWorkspaceId: string;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className={cn("flex h-9 items-center", collapsed ? "justify-center" : "justify-between px-1")}>
        <Link href="/dashboard" aria-label="Mailfox overview" onClick={onNavigate}>
          {collapsed ? <LogoMark size={28} /> : <Logo height={26} />}
        </Link>
        {onToggle && !collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>
      <WorkspaceSwitcher workspaces={workspaces} currentId={currentWorkspaceId} collapsed={collapsed} />
      <nav aria-label="Main" className="grid gap-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
      <nav aria-label="Secondary" className="mt-auto grid gap-0.5">
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        {onToggle && collapsed && (
          <Tooltip content="Expand sidebar">
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="size-[18px]" />
            </button>
          </Tooltip>
        )}
      </nav>
    </div>
  );
}
