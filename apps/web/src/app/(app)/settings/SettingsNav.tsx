"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ShieldCheck, UserRound, Users } from "lucide-react";
import { cn } from "@mailfox/ui/components";

const items = [
  { href: "/settings", label: "Profile", icon: UserRound },
  { href: "/settings/security", label: "Security", icon: ShieldCheck },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/workspace", label: "Workspace", icon: Building2 },
];

export function SettingsNav() {
  const path = usePathname();
  return (
    <nav aria-label="Settings" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
