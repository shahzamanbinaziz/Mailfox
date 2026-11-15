import type { ReactNode } from "react";
import { Badge, Card } from "@mailfox/ui/components";

export function ComingSoon({
  phase,
  title,
  children,
  illustration,
}: {
  phase: number;
  title: string;
  children: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      {illustration}
      <Badge className="mt-4">Arrives in Phase {phase}</Badge>
      <h2 className="mt-3 text-lg font-bold">{title}</h2>
      <div className="mt-2 max-w-md text-sm text-muted-foreground">{children}</div>
    </Card>
  );
}
