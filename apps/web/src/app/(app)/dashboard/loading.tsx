import { FoxSkeletonCard, Skeleton } from "@mailfox/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading overview">
      <Skeleton style={{ height: 32, width: 280, marginBottom: 8 }} />
      <Skeleton style={{ height: 16, width: 220, marginBottom: 32 }} />
      <div className="grid gap-4 sm:grid-cols-3">
        <FoxSkeletonCard lines={1} />
        <FoxSkeletonCard lines={1} />
        <FoxSkeletonCard lines={1} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <FoxSkeletonCard lines={6} />
        </div>
        <FoxSkeletonCard lines={4} />
      </div>
    </div>
  );
}
