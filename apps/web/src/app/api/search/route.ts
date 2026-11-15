import { getWorkspaceContext } from "@/lib/auth/context";
import { prisma } from "@/lib/server";

export const dynamic = "force-dynamic";

/** Global search for the ⌘K palette: contacts (email/name) and campaigns (name/subject). */
export async function GET(req: Request) {
  const ctx = await getWorkspaceContext();
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 2) return Response.json({ hits: [] });

  const [contacts, campaigns] = await Promise.all([
    prisma.contact.findMany({
      where: {
        workspaceId: ctx.workspace.id,
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, firstName: true, lastName: true, status: true },
    }),
    prisma.campaign.findMany({
      where: {
        workspaceId: ctx.workspace.id,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { subject: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, status: true },
    }),
  ]);

  return Response.json({
    hits: [
      ...campaigns.map((c) => ({
        type: "campaign",
        id: c.id,
        title: c.name,
        subtitle: c.status.toLowerCase(),
        href: `/campaigns?highlight=${c.id}`,
      })),
      ...contacts.map((c) => ({
        type: "contact",
        id: c.id,
        title: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email,
        subtitle: `${c.email} · ${c.status.toLowerCase()}`,
        href: `/contacts?q=${encodeURIComponent(c.email)}`,
      })),
    ],
  });
}
