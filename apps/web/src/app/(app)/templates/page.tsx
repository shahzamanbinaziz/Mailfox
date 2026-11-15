import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";
import { getWorkspaceContext } from "@/lib/auth/context";
import { prisma } from "@/lib/server";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const ctx = await getWorkspaceContext();
  const count = await prisma.template.count({ where: { workspaceId: ctx.workspace.id } });
  return (
    <>
      <PageHeader
        title="Templates"
        description={`${count} saved template${count === 1 ? "" : "s"} in this workspace.`}
      />
      <ComingSoon
        phase={4}
        title="Drag-and-drop MJML editor"
        illustration={<FileText className="size-12 text-link" />}
      >
        Blocks for text, images, buttons, columns and social links; code mode with live preview; desktop,
        mobile and dark-mode previews; test sends; and six starter templates. Your three seeded templates will
        open here.
      </ComingSoon>
    </>
  );
}
