import type { Metadata } from "next";
import { Workflow } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Automations" };

export default function AutomationsPage() {
  return (
    <>
      <PageHeader title="Automations" description="Welcome series, drips and triggered emails." />
      <ComingSoon
        phase={8}
        title="Automations & drip sequences"
        illustration={<Workflow className="size-12 text-link" />}
      >
        Trigger on list joins, tags or date fields, then chain emails with delays and conditions.
      </ComingSoon>
    </>
  );
}
