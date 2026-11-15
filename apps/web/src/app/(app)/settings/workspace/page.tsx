import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mailfox/ui/components";
import { getWorkspaceContext } from "@/lib/auth/context";
import { WorkspaceForm } from "../forms";

export const metadata: Metadata = { title: "Workspace" };

export default async function WorkspaceSettings() {
  const ctx = await getWorkspaceContext();
  const w = ctx.workspace;
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Company details used in email footers, plus defaults for scheduling and tracking.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <WorkspaceForm
          canEdit={ctx.can("ADMIN")}
          timezones={[...new Set(["UTC", ...Intl.supportedValuesOf("timeZone")])]}
          values={{
            name: w.name,
            companyName: w.companyName,
            physicalAddress: w.physicalAddress,
            timezone: w.timezone,
            trackingDomain: w.trackingDomain ?? "",
          }}
        />
      </CardContent>
    </Card>
  );
}
