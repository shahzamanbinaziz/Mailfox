import type { Metadata } from "next";
import { ChartColumn } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Per-campaign funnels, links, devices and bounce reasons." />
      <ComingSoon
        phase={7}
        title="Campaign reports"
        illustration={<ChartColumn className="size-12 text-link" />}
      >
        Delivery funnel, timeline, top links, opens by device, client and country, bounce and unsubscribe
        reasons — exportable as PDF and CSV.
      </ComingSoon>
    </>
  );
}
