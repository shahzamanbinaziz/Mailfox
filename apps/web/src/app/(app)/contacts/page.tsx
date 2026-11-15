import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { NoContactsIllustration } from "@mailfox/ui";
import { Badge, Button, Card, Input, Table, Td, Th, Tr } from "@mailfox/ui/components";
import type { Prisma } from "@mailfox/db";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getWorkspaceContext } from "@/lib/auth/context";
import { fmt, timeAgo } from "@/lib/format";
import { prisma } from "@/lib/server";

export const metadata: Metadata = { title: "Contacts" };
const PAGE = 25;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const ctx = await getWorkspaceContext();
  const { q = "", page = "1" } = await searchParams;
  const p = Math.max(1, Number.parseInt(page, 10) || 1);
  const query = q.trim().slice(0, 100);
  const where: Prisma.ContactWhereInput = {
    workspaceId: ctx.workspace.id,
    ...(query && {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ],
    }),
  };
  const [total, contacts, subscribed] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (p - 1) * PAGE,
      take: PAGE,
      include: { tags: { include: { tag: true } } },
    }),
    prisma.contact.count({ where: { workspaceId: ctx.workspace.id, status: "SUBSCRIBED" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (n: number) =>
    `/contacts?${new URLSearchParams({ ...(query && { q: query }), page: String(n) })}`;

  return (
    <>
      <PageHeader
        title="Contacts"
        description={`${fmt(subscribed)} subscribed · ${fmt(total)} ${query ? "matching" : "total"}`}
        eyebrow={<Badge>Import, segments & signup forms arrive in Phase 3</Badge>}
      />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search by name or email"
            className="pl-9"
            aria-label="Search contacts"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {contacts.length === 0 ? (
        <Card className="flex flex-col items-center py-14 text-center">
          <NoContactsIllustration />
          <h2 className="mt-2 text-lg font-bold">
            {query ? `No contacts match “${query}”` : "No contacts yet"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {query ? "Try another name or email." : "Imports and signup forms arrive in Phase 3."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th>Contact</Th>
                <Th>Status</Th>
                <Th>Tags</Th>
                <Th>Source</Th>
                <Th>Added</Th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <p className="font-medium">
                      {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium"
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: tag.color }}
                            aria-hidden="true"
                          />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{c.consentSource ?? "—"}</Td>
                  <Td className="text-muted-foreground">{timeAgo(c.createdAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between border-t border-border px-4 py-3 text-sm"
          >
            <span className="text-muted-foreground">
              Page {p} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild={p > 1} disabled={p <= 1}>
                {p > 1 ? (
                  <Link href={href(p - 1)}>
                    <ChevronLeft /> Previous
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft /> Previous
                  </span>
                )}
              </Button>
              <Button variant="outline" size="sm" asChild={p < pages} disabled={p >= pages}>
                {p < pages ? (
                  <Link href={href(p + 1)}>
                    Next <ChevronRight />
                  </Link>
                ) : (
                  <span>
                    Next <ChevronRight />
                  </span>
                )}
              </Button>
            </div>
          </nav>
        </Card>
      )}
    </>
  );
}
