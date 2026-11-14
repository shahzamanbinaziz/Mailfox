/** BullMQ queue names, shared by web (producers) and worker (consumers). */
export const QUEUES = {
  /** Expand a campaign into Send jobs in batches. */
  campaign: "mf-campaign",
  /** Deliver one email. */
  send: "mf-send",
  /** Read bounce mailboxes over IMAP. */
  bounce: "mf-bounce",
  /** Scheduled campaigns, A/B winner picks, automations. */
  schedule: "mf-schedule",
  /** Daily warmup limit recalculation and mailbox health scoring. */
  warmup: "mf-warmup",
  /** Webhook deliveries. */
  webhook: "mf-webhook",
  /** Housekeeping + worker heartbeat. */
  system: "mf-system",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const WORKER_HEARTBEAT_KEY = "mailfox:worker:heartbeat";
