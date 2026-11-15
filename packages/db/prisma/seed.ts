/**
 * Demo seed: 1 workspace, an Owner admin, a sending domain, 2 mailboxes (Mailpit) in a pool,
 * custom fields, 2 lists, tags, a segment, 500 contacts with consent records, suppressions,
 * 3 templates and 2 campaigns (one sent with realistic stats/events over the last 14 days,
 * one scheduled) — so the dashboard looks alive on first run.
 *
 * Idempotent: running it twice does nothing the second time (checks the demo workspace slug).
 * Run: pnpm db:seed   (requires DATABASE_URL and ENCRYPTION_KEY)
 */
import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { encryptSecret, parseEncryptionKey, randomToken } from "@mailfox/core";
import { brandLayout, renderMjml, starterTemplates } from "@mailfox/email";
import { createPrismaClient } from "../src/index.js";
import {
  BounceType,
  ContactStatus,
  EventType,
  SendStatus,
  SuppressionReason,
} from "../src/generated/prisma/client.js";
import type { Prisma } from "../src/generated/prisma/client.js";

faker.seed(20261115); // deterministic demo data

const prisma = createPrismaClient();
const key = parseEncryptionKey(process.env.ENCRYPTION_KEY);
const DEMO_SLUG = "mailfox-demo";
const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const existing = await prisma.workspace.findUnique({ where: { slug: DEMO_SLUG } });
  if (existing) {
    console.log("🦊 Seed: demo workspace already exists — skipping base data.");
  } else {
    await seedBase();
  }
  const ws = await prisma.workspace.findUniqueOrThrow({ where: { slug: DEMO_SLUG } });
  await seedTeam(ws.id);
  await seedWelcomeSeries(ws.id);
}

async function seedBase() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@mailfox.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "mailfox-admin-123";
  const address = process.env.SEED_COMPANY_ADDRESS ?? "Mailfox HQ, 1 Fox Lane, Lahore, Pakistan";

  // ── Workspace & admin ────────────────────────────────────
  const workspace = await prisma.workspace.create({
    data: {
      name: "Mailfox Demo",
      slug: DEMO_SLUG,
      companyName: "Mailfox",
      physicalAddress: address,
      timezone: "Asia/Karachi",
    },
  });
  const ws = workspace.id;
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Demo Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.membership.create({ data: { userId: admin.id, workspaceId: ws, role: "OWNER" } });

  // ── Sending: domain, mailboxes, pool ─────────────────────
  const domain = await prisma.domain.create({ data: { workspaceId: ws, name: "mailfox.local" } });
  const smtpPasswordEnc = encryptSecret("mailpit-does-not-check", key);
  const mailboxDefaults = {
    workspaceId: ws,
    domainId: domain.id,
    smtpHost: process.env.MAILPIT_SMTP_HOST ?? "localhost",
    smtpPort: Number(process.env.MAILPIT_SMTP_PORT ?? 1025),
    smtpSecurity: "NONE" as const,
    smtpUser: "demo",
    smtpPasswordEnc,
  };
  const newsMailbox = await prisma.mailbox.create({
    data: {
      ...mailboxDefaults,
      name: "Newsletter",
      fromEmail: "news@mailfox.local",
      fromName: "Mailfox News",
      replyTo: "hello@mailfox.local",
      maxPerHour: 500,
      maxPerDay: 5000,
      healthScore: 97,
      lastUsedAt: new Date(Date.now() - 2 * DAY),
    },
  });
  const helloMailbox = await prisma.mailbox.create({
    data: {
      ...mailboxDefaults,
      name: "Hello (warming up)",
      fromEmail: "hello@mailfox.local",
      fromName: "Mailfox Team",
      status: "WARMING",
      warmupEnabled: true,
      warmupStartedAt: new Date(Date.now() - 6 * DAY),
      warmupDays: 30,
      warmupStartPerDay: 20,
      maxPerHour: 50,
      maxPerDay: 300,
      healthScore: 100,
    },
  });
  const pool = await prisma.mailboxPool.create({
    data: {
      workspaceId: ws,
      name: "Main rotation",
      members: {
        create: [
          { mailboxId: newsMailbox.id, weight: 3 },
          { mailboxId: helloMailbox.id, weight: 1 },
        ],
      },
    },
  });
  await prisma.workspace.update({ where: { id: ws }, data: { defaultMailboxId: newsMailbox.id } });

  // ── Audience structure ───────────────────────────────────
  await prisma.customField.createMany({
    data: [
      { workspaceId: ws, key: "company", label: "Company", type: "TEXT" },
      { workspaceId: ws, key: "city", label: "City", type: "TEXT" },
      { workspaceId: ws, key: "plan", label: "Plan", type: "SELECT", options: ["free", "pro", "business"] },
      { workspaceId: ws, key: "signup_date", label: "Signup date", type: "DATE" },
      { workspaceId: ws, key: "orders", label: "Orders", type: "NUMBER" },
    ],
  });
  const newsletterList = await prisma.list.create({
    data: {
      workspaceId: ws,
      name: "Newsletter",
      description: "Monthly newsletter subscribers",
      doubleOptIn: true,
    },
  });
  const customersList = await prisma.list.create({
    data: { workspaceId: ws, name: "Customers", description: "Paying customers" },
  });
  const tagNames: [string, string][] = [
    ["VIP", "#FF6A1A"],
    ["Lead", "#397CE9"],
    ["Webinar 2026", "#179946"],
    ["Inactive", "#7C8187"],
  ];
  const [vipTag, leadTag, webinarTag] = await Promise.all(
    tagNames.map(([name, color]) => prisma.tag.create({ data: { workspaceId: ws, name, color } })),
  );
  if (!vipTag || !leadTag || !webinarTag) throw new Error("tag creation failed");
  await prisma.segment.create({
    data: {
      workspaceId: ws,
      name: "Engaged — opened in last 30 days",
      rules: { op: "AND", rules: [{ field: "engagement.opened", operator: "within_days", value: 30 }] },
    },
  });
  await prisma.segment.create({
    data: {
      workspaceId: ws,
      name: "Pro & Business plans",
      rules: {
        op: "OR",
        rules: [
          { field: "fields.plan", operator: "equals", value: "pro" },
          { field: "fields.plan", operator: "equals", value: "business" },
        ],
      },
    },
  });

  // ── 500 contacts ─────────────────────────────────────────
  const sources = ["signup-form", "import:csv", "api", "checkout"];
  const statuses: ContactStatus[] = [
    ...Array<ContactStatus>(460).fill(ContactStatus.SUBSCRIBED),
    ...Array<ContactStatus>(15).fill(ContactStatus.UNCONFIRMED),
    ...Array<ContactStatus>(15).fill(ContactStatus.UNSUBSCRIBED),
    ...Array<ContactStatus>(7).fill(ContactStatus.BOUNCED),
    ...Array<ContactStatus>(3).fill(ContactStatus.COMPLAINED),
  ];
  const usedEmails = new Set<string>();
  const contactRows: Prisma.ContactCreateManyInput[] = statuses.map((status, i) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    let email = faker.internet
      .email({
        firstName,
        lastName,
        provider: faker.helpers.arrayElement([
          "gmail.com",
          "outlook.com",
          "yahoo.com",
          "example.com",
          "company.pk",
        ]),
      })
      .toLowerCase();
    while (usedEmails.has(email)) email = `${i}.${email}`;
    usedEmails.add(email);
    const createdAt = faker.date.between({
      from: new Date(Date.now() - 180 * DAY),
      to: new Date(Date.now() - DAY),
    });
    return {
      workspaceId: ws,
      email,
      firstName,
      lastName,
      status,
      timezone: faker.helpers.arrayElement([
        "Asia/Karachi",
        "Europe/London",
        "America/New_York",
        "Asia/Dubai",
        null,
      ]),
      fields: {
        company: faker.company.name(),
        city: faker.location.city(),
        plan: faker.helpers.weightedArrayElement([
          { weight: 6, value: "free" },
          { weight: 3, value: "pro" },
          { weight: 1, value: "business" },
        ]),
        signup_date: createdAt.toISOString().slice(0, 10),
        orders: faker.number.int({ min: 0, max: 40 }),
      },
      consentSource: faker.helpers.arrayElement(sources),
      consentAt: createdAt,
      consentIp: faker.internet.ipv4(),
      confirmedAt: status === ContactStatus.UNCONFIRMED ? null : createdAt,
      mxValid: true,
      isRoleAddress: false,
      unsubscribedAt: status === ContactStatus.UNSUBSCRIBED ? faker.date.recent({ days: 20 }) : null,
      createdAt,
    };
  });
  await prisma.contact.createMany({ data: contactRows });
  const contacts = await prisma.contact.findMany({
    where: { workspaceId: ws },
    orderBy: { createdAt: "asc" },
  });

  await prisma.listMember.createMany({
    data: contacts.map((c) => ({ listId: newsletterList.id, contactId: c.id, addedAt: c.createdAt })),
  });
  await prisma.listMember.createMany({
    data: contacts.filter((_, i) => i % 3 === 0).map((c) => ({ listId: customersList.id, contactId: c.id })),
  });
  await prisma.contactTag.createMany({
    data: contacts.flatMap((c, i) => {
      const t = [];
      if (i % 11 === 0) t.push({ contactId: c.id, tagId: vipTag.id });
      if (i % 4 === 1) t.push({ contactId: c.id, tagId: leadTag.id });
      if (i % 7 === 2) t.push({ contactId: c.id, tagId: webinarTag.id });
      return t;
    }),
  });

  // Suppressions mirror the non-subscribed statuses + a manual block.
  const reasonFor: Partial<Record<ContactStatus, SuppressionReason>> = {
    UNSUBSCRIBED: SuppressionReason.UNSUBSCRIBED,
    BOUNCED: SuppressionReason.HARD_BOUNCE,
    COMPLAINED: SuppressionReason.COMPLAINT,
  };
  await prisma.suppression.createMany({
    data: [
      ...contacts.flatMap((c) => {
        const reason = reasonFor[c.status];
        return reason ? [{ workspaceId: ws, email: c.email, reason, source: "seed" }] : [];
      }),
      {
        workspaceId: ws,
        email: "blocked@competitor.example",
        reason: SuppressionReason.MANUAL,
        note: "Requested via support",
      },
    ],
  });

  // ── Templates ────────────────────────────────────────────
  const company = { name: workspace.companyName, address };
  const templates = [];
  for (const s of starterTemplates) {
    const mjml = brandLayout({
      body: s.body,
      preheader: s.preheader,
      title: s.subject,
      company,
      unsubscribeUrl: "{{unsubscribe_url}}",
      preferencesUrl: "{{preferences_url}}",
      reason: "You're receiving this because you subscribed at mailfox.local.",
    });
    const { html } = await renderMjml(mjml);
    templates.push(
      await prisma.template.create({
        data: {
          workspaceId: ws,
          name: s.name,
          category: s.category,
          kind: "MJML",
          subject: s.subject,
          preheader: s.preheader,
          mjml,
          html,
        },
      }),
    );
  }
  const [, newsletterT, promoT] = templates;
  if (!newsletterT || !promoT) throw new Error("template creation failed");

  // ── Campaign 1: sent 5 days ago, with stats ──────────────
  const sentAt = new Date(Date.now() - 5 * DAY);
  const { text: newsText } = await renderMjml(newsletterT.mjml ?? "");
  const sent = await prisma.campaign.create({
    data: {
      workspaceId: ws,
      name: "November newsletter",
      status: "SENT",
      subject: newsletterT.subject,
      preheader: newsletterT.preheader,
      mailboxId: newsMailbox.id,
      templateId: newsletterT.id,
      mjml: newsletterT.mjml,
      html: newsletterT.html,
      text: newsText,
      startedAt: sentAt,
      completedAt: new Date(sentAt.getTime() + 40 * 60 * 1000),
      createdById: admin.id,
      notes: "Demo campaign created by the seed script.",
      audiences: { create: [{ listId: newsletterList.id }] },
    },
  });
  const links = await Promise.all(
    ["https://example.com/newsletter", "https://example.com/blog/faster-dashboards"].map((url) =>
      prisma.link.create({ data: { campaignId: sent.id, url } }),
    ),
  );

  // Recipients = everyone who was subscribed at send time (incl. those who bounced/complained on this send).
  const recipients = contacts.filter((c) => c.status !== ContactStatus.UNCONFIRMED && c.createdAt < sentAt);
  const sends: Prisma.SendCreateManyInput[] = [];
  const events: Prisma.EventCreateManyInput[] = [];
  const counters = {
    sent: 0,
    delivered: 0,
    opens: 0,
    uOpens: 0,
    clicks: 0,
    uClicks: 0,
    bounces: 0,
    complaints: 0,
    unsubs: 0,
  };
  const userAgents = [
    ["Gmail", "mobile"],
    ["Apple Mail", "desktop"],
    ["Outlook", "desktop"],
    ["Gmail", "desktop"],
    ["iOS Mail", "mobile"],
  ] as const;

  for (const c of recipients) {
    const sendId = `seed_${c.id}`;
    const at = new Date(sentAt.getTime() + faker.number.int({ min: 0, max: 40 * 60 }) * 1000);
    const bounced = c.status === ContactStatus.BOUNCED;
    sends.push({
      id: sendId,
      workspaceId: ws,
      campaignId: sent.id,
      contactId: c.id,
      mailboxId: newsMailbox.id,
      email: c.email,
      status: bounced ? SendStatus.BOUNCED : SendStatus.SENT,
      messageId: `<${sendId}@mailfox.local>`,
      verpToken: randomToken(12),
      attempts: 1,
      queuedAt: sentAt,
      sentAt: at,
      bouncedAt: bounced ? at : null,
    });
    counters.sent++;
    events.push({
      workspaceId: ws,
      type: EventType.SENT,
      sendId,
      contactId: c.id,
      campaignId: sent.id,
      createdAt: at,
    });
    if (bounced) {
      counters.bounces++;
      events.push({
        workspaceId: ws,
        type: EventType.BOUNCE,
        sendId,
        contactId: c.id,
        campaignId: sent.id,
        bounceType: BounceType.HARD,
        diagnostic: "550 5.1.1 The email account that you tried to reach does not exist",
        createdAt: new Date(at.getTime() + 60_000),
      });
      continue;
    }
    counters.delivered++;
    events.push({
      workspaceId: ws,
      type: EventType.DELIVERED,
      sendId,
      contactId: c.id,
      campaignId: sent.id,
      createdAt: at,
    });

    const opened = c.status === ContactStatus.COMPLAINED || faker.number.float() < 0.46;
    if (opened) {
      const [client, device] = faker.helpers.arrayElement(userAgents);
      const n = faker.number.int({ min: 1, max: 3 });
      counters.uOpens++;
      for (let k = 0; k < n; k++) {
        counters.opens++;
        events.push({
          workspaceId: ws,
          type: EventType.OPEN,
          sendId,
          contactId: c.id,
          campaignId: sent.id,
          client,
          device,
          country: faker.helpers.arrayElement(["PK", "PK", "AE", "GB", "US"]),
          isMachine: client === "Apple Mail" && k === 0 && faker.number.float() < 0.5,
          createdAt: new Date(at.getTime() + faker.number.int({ min: 2, max: 72 * 60 }) * 60_000),
        });
      }
      if (faker.number.float() < 0.28) {
        const link = faker.helpers.arrayElement(links);
        counters.uClicks++;
        counters.clicks++;
        events.push({
          workspaceId: ws,
          type: EventType.CLICK,
          sendId,
          contactId: c.id,
          campaignId: sent.id,
          linkId: link.id,
          url: link.url,
          client,
          device,
          createdAt: new Date(at.getTime() + faker.number.int({ min: 5, max: 72 * 60 }) * 60_000),
        });
      }
    }
    if (c.status === ContactStatus.COMPLAINED) {
      counters.complaints++;
      events.push({
        workspaceId: ws,
        type: EventType.COMPLAINT,
        sendId,
        contactId: c.id,
        campaignId: sent.id,
        createdAt: new Date(at.getTime() + DAY),
      });
    }
    if (c.status === ContactStatus.UNSUBSCRIBED && c.unsubscribedAt && c.unsubscribedAt > at) {
      counters.unsubs++;
      events.push({
        workspaceId: ws,
        type: EventType.UNSUBSCRIBE,
        sendId,
        contactId: c.id,
        campaignId: sent.id,
        meta: {
          reason: faker.helpers.arrayElement(["Too many emails", "Not relevant", "Never signed up", null]),
        },
        createdAt: c.unsubscribedAt,
      });
    }
  }
  await prisma.send.createMany({ data: sends });
  for (let i = 0; i < events.length; i += 1000)
    await prisma.event.createMany({ data: events.slice(i, i + 1000) });
  for (const link of links) {
    const clickCount = events.filter((e) => e.linkId === link.id).length;
    await prisma.link.update({ where: { id: link.id }, data: { clickCount } });
  }
  await prisma.campaign.update({
    where: { id: sent.id },
    data: {
      recipientCount: counters.sent,
      sentCount: counters.sent,
      deliveredCount: counters.delivered,
      openCount: counters.opens,
      uniqueOpenCount: counters.uOpens,
      clickCount: counters.clicks,
      uniqueClickCount: counters.uClicks,
      bounceCount: counters.bounces,
      complaintCount: counters.complaints,
      unsubscribeCount: counters.unsubs,
    },
  });

  // ── Campaign 2: scheduled promo through the pool, with an A/B subject test ──
  const scheduled = await prisma.campaign.create({
    data: {
      workspaceId: ws,
      name: "Black Friday — 20% off",
      status: "SCHEDULED",
      subject: promoT.subject,
      preheader: promoT.preheader,
      poolId: pool.id,
      templateId: promoT.id,
      mjml: promoT.mjml,
      html: promoT.html,
      scheduledAt: new Date(Date.now() + 3 * DAY),
      sendTimezone: "Asia/Karachi",
      sendInRecipientTz: true,
      abEnabled: true,
      abTestPercent: 20,
      abMetric: "OPEN_RATE",
      abWaitHours: 4,
      createdById: admin.id,
      audiences: { create: [{ listId: customersList.id }, { listId: newsletterList.id }] },
      variants: {
        create: [
          { label: "A", subject: promoT.subject, weight: 50 },
          { label: "B", subject: "Your 20% member discount is waiting 🦊", weight: 50 },
        ],
      },
    },
  });

  await prisma.notification.create({
    data: {
      workspaceId: ws,
      type: "campaign.completed",
      title: "“November newsletter” finished sending",
      body: `${counters.sent} emails sent · ${counters.uOpens} unique opens`,
      href: `/campaigns/${sent.id}`,
    },
  });
  await prisma.auditLog.createMany({
    data: [
      {
        workspaceId: ws,
        userId: admin.id,
        action: "workspace.create",
        entityType: "Workspace",
        entityId: ws,
      },
      {
        workspaceId: ws,
        userId: admin.id,
        action: "campaign.send",
        entityType: "Campaign",
        entityId: sent.id,
        createdAt: sentAt,
      },
      {
        workspaceId: ws,
        userId: admin.id,
        action: "campaign.schedule",
        entityType: "Campaign",
        entityId: scheduled.id,
      },
    ],
  });

  console.log("🦊 Seed complete:");
  console.log(`   admin       ${adminEmail} / ${adminPassword}`);
  console.log(`   contacts    ${contacts.length}`);
  console.log(`   templates   ${templates.length}`);
  console.log(
    `   campaigns   2 (1 sent: ${counters.sent} sends, ${counters.uOpens} opens, ${counters.uClicks} clicks)`,
  );
  console.log(`   events      ${events.length}`);
}

/** v0.2: extra team members so roles have something to show. Idempotent. */
async function seedTeam(ws: string) {
  const people: [string, string, "ADMIN" | "EDITOR" | "VIEWER"][] = [
    ["sara@mailfox.local", "Sara Khan", "ADMIN"],
    ["bilal@mailfox.local", "Bilal Ahmed", "EDITOR"],
    ["hina@mailfox.local", "Hina Raza", "VIEWER"],
  ];
  for (const [email, name, role] of people) {
    if (await prisma.user.findUnique({ where: { email } })) continue;
    // No password: these demo members can't sign in until an admin resets them (invites arrive in Phase 8).
    const user = await prisma.user.create({
      data: { email, name, lastLoginAt: faker.date.recent({ days: 10 }) },
    });
    await prisma.membership.create({ data: { userId: user.id, workspaceId: ws, role } });
  }
}

/**
 * v0.2: an active "Welcome series" automation that has emailed every new contact from the last
 * 30 days, so the overview chart shows daily volume rather than one spike. Idempotent.
 */
async function seedWelcomeSeries(ws: string) {
  if (await prisma.automation.findFirst({ where: { workspaceId: ws, name: "Welcome series" } })) return;
  const template = await prisma.template.findFirst({ where: { workspaceId: ws, name: "Welcome" } });
  const mailbox = await prisma.mailbox.findFirst({
    where: { workspaceId: ws, fromEmail: "hello@mailfox.local" },
  });
  const list = await prisma.list.findFirst({ where: { workspaceId: ws, name: "Newsletter" } });
  const automation = await prisma.automation.create({
    data: {
      workspaceId: ws,
      name: "Welcome series",
      status: "ACTIVE",
      trigger: "LIST_JOINED",
      triggerConfig: { listId: list?.id ?? null },
      mailboxId: mailbox?.id ?? null,
      steps: {
        create: [
          {
            order: 1,
            type: "EMAIL",
            templateId: template?.id ?? null,
            config: { subject: template?.subject ?? "Welcome" },
          },
        ],
      },
    },
    include: { steps: true },
  });
  const step = automation.steps[0];
  if (!step) return;

  const since = new Date(Date.now() - 30 * DAY);
  const recent = await prisma.contact.findMany({
    where: {
      workspaceId: ws,
      createdAt: { gte: since },
      status: { in: [ContactStatus.SUBSCRIBED, ContactStatus.UNSUBSCRIBED] },
    },
  });
  // Spread joins realistically: a few per day, with weekday bumps.
  const sends: Prisma.SendCreateManyInput[] = [];
  const events: Prisma.EventCreateManyInput[] = [];
  for (let d = 0; d < 30; d++) {
    const day = new Date(Date.now() - d * DAY);
    const weekday = day.getUTCDay() % 6 !== 0;
    const n = faker.number.int({ min: weekday ? 6 : 2, max: weekday ? 18 : 7 });
    for (let i = 0; i < n; i++) {
      const c = recent.length ? faker.helpers.arrayElement(recent) : null;
      if (!c) break;
      const id = `seedw_${d}_${i}_${c.id}`;
      const at = new Date(day.getTime() - faker.number.int({ min: 0, max: 20 * 3600 }) * 1000);
      if (at > new Date()) continue;
      sends.push({
        id,
        workspaceId: ws,
        automationStepId: null,
        contactId: c.id,
        mailboxId: mailbox?.id ?? null,
        email: c.email,
        status: SendStatus.SENT,
        messageId: `<${id}@mailfox.local>`,
        verpToken: randomToken(12),
        attempts: 1,
        queuedAt: at,
        sentAt: at,
      });
      events.push({ workspaceId: ws, type: EventType.SENT, sendId: id, contactId: c.id, createdAt: at });
      events.push({ workspaceId: ws, type: EventType.DELIVERED, sendId: id, contactId: c.id, createdAt: at });
      if (faker.number.float() < 0.62) {
        events.push({
          workspaceId: ws,
          type: EventType.OPEN,
          sendId: id,
          contactId: c.id,
          client: "Gmail",
          device: "mobile",
          createdAt: new Date(at.getTime() + faker.number.int({ min: 1, max: 240 }) * 60_000),
        });
        if (faker.number.float() < 0.35) {
          events.push({
            workspaceId: ws,
            type: EventType.CLICK,
            sendId: id,
            contactId: c.id,
            url: "https://example.com/start",
            createdAt: new Date(at.getTime() + 300 * 60_000),
          });
        }
      }
    }
  }
  await prisma.send.createMany({ data: sends });
  for (let i = 0; i < events.length; i += 1000)
    await prisma.event.createMany({ data: events.slice(i, i + 1000) });
  console.log(`🦊 Seed: welcome series added (${sends.length} sends over 30 days).`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
