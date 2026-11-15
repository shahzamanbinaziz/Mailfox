import {
  ChartColumn,
  FileText,
  LayoutDashboard,
  Mailbox,
  Palette,
  Send,
  Settings,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Phase where the feature lands (shown as a hint until then). */
  phase?: number;
  keywords?: string[];
}

export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, keywords: ["home", "stats"] },
  { href: "/campaigns", label: "Campaigns", icon: Send, keywords: ["email", "newsletter", "send"] },
  {
    href: "/automations",
    label: "Automations",
    icon: Workflow,
    phase: 8,
    keywords: ["drip", "welcome", "series"],
  },
  {
    href: "/templates",
    label: "Templates",
    icon: FileText,
    phase: 4,
    keywords: ["editor", "design", "mjml"],
  },
  { href: "/contacts", label: "Contacts", icon: Users, keywords: ["audience", "lists", "subscribers"] },
  { href: "/mailboxes", label: "Mailboxes", icon: Mailbox, keywords: ["smtp", "senders", "domains", "dns"] },
  {
    href: "/reports",
    label: "Reports",
    icon: ChartColumn,
    phase: 7,
    keywords: ["analytics", "opens", "clicks"],
  },
];

export const secondaryNav: NavItem[] = [
  { href: "/brand", label: "Brand guide", icon: Palette, keywords: ["logo", "colors"] },
  { href: "/settings", label: "Settings", icon: Settings, keywords: ["profile", "security", "team", "2fa"] },
];
