"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@mailfox/ui/components";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const forbidden = error.message.includes("role or higher");
  return (
    <div role="alert" className="mx-auto max-w-md py-20 text-center">
      <p className="text-5xl" aria-hidden="true">
        🦊
      </p>
      <h1 className="mt-4 text-xl font-bold">
        {forbidden ? "You don’t have access to that" : "Something went wrong"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {forbidden
          ? error.message
          : "The fox tripped over a cable. Try again — if it keeps happening, check the server logs."}
        {error.digest && <span className="mt-2 block font-mono text-xs">ref {error.digest}</span>}
      </p>
      {!forbidden && (
        <Button className="mt-6" onClick={reset}>
          <RotateCcw /> Try again
        </Button>
      )}
    </div>
  );
}
