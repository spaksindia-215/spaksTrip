import Skeleton from "@/components/ui/Skeleton";

export default function TaxiResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="grid overflow-hidden rounded-lg border border-border-soft bg-white md:grid-cols-[230px_1fr_auto]">
          <Skeleton className="h-48 rounded-none md:h-full" />
          <div className="space-y-4 p-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-4 gap-3">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </div>
            <Skeleton className="h-8 w-72" />
          </div>
          <div className="space-y-4 p-4 md:w-52">
            <Skeleton className="ml-auto h-8 w-28" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
