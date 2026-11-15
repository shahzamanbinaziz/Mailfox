"use client";

import { useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { SheetContent, Toaster, TooltipProvider, cn } from "@mailfox/ui/components";
import { setSidebarCollapsedAction } from "@/app/(app)/actions";
import { useIsDark } from "@/components/theme";
import { CommandPalette } from "./CommandPalette";
import { SidebarContent } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { ShellNotification, ShellUser, ShellWorkspace } from "./types";

export interface AppShellProps {
  user: ShellUser;
  role: string;
  workspaces: ShellWorkspace[];
  currentWorkspaceId: string;
  notifications: ShellNotification[];
  initialCollapsed: boolean;
  children: ReactNode;
}

export function AppShell({
  user,
  role,
  workspaces,
  currentWorkspaceId,
  notifications,
  initialCollapsed,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const dark = useIsDark();

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    void setSidebarCollapsedAction(next);
  };

  return (
    <TooltipProvider>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-sidebar transition-[width] duration-200 ease-out lg:block",
            collapsed ? "w-[68px]" : "w-64",
          )}
        >
          <SidebarContent
            collapsed={collapsed}
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId}
            onToggle={toggle}
          />
        </aside>

        <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" aria-describedby={undefined}>
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <SidebarContent
              collapsed={false}
              workspaces={workspaces}
              currentWorkspaceId={currentWorkspaceId}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </DialogPrimitive.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            user={user}
            role={role}
            notifications={notifications}
            onMenu={() => setMobileOpen(true)}
            onSearch={() => setPaletteOpen(true)}
          />
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Toaster position="bottom-right" theme={dark ? "dark" : "light"} richColors closeButton />
    </TooltipProvider>
  );
}
