import { Badge } from "@mailfox/ui/components";

type Variant = "default" | "neutral" | "success" | "warning" | "danger" | "info";

const map: Record<string, [Variant, string]> = {
  // campaigns
  DRAFT: ["neutral", "Draft"],
  SCHEDULED: ["info", "Scheduled"],
  SENDING: ["default", "Sending"],
  PAUSED: ["warning", "Paused"],
  SENT: ["success", "Sent"],
  CANCELLED: ["neutral", "Cancelled"],
  FAILED: ["danger", "Failed"],
  // mailboxes
  ACTIVE: ["success", "Active"],
  WARMING: ["info", "Warming up"],
  AUTO_PAUSED: ["danger", "Auto-paused"],
  ERROR: ["danger", "Error"],
  DISABLED: ["neutral", "Disabled"],
  // contacts
  SUBSCRIBED: ["success", "Subscribed"],
  UNCONFIRMED: ["warning", "Unconfirmed"],
  UNSUBSCRIBED: ["neutral", "Unsubscribed"],
  BOUNCED: ["danger", "Bounced"],
  COMPLAINED: ["danger", "Complained"],
  BLOCKED: ["danger", "Blocked"],
};

/** Status pill: always text + colour (never colour alone). */
export function StatusBadge({ status }: { status: string }) {
  const [variant, label] = map[status] ?? ["neutral", status.toLowerCase()];
  return (
    <Badge variant={variant}>
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {label}
    </Badge>
  );
}
