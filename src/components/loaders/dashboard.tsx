// components/DashboardSkeleton.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-primary p-4 rounded-2xl shadow">
            <Skeleton className="h-6 w-24 mb-4 bg-background" />
            <Skeleton className="h-8 w-32 mb-2 bg-background" />
            <Skeleton className="h-4 w-16 bg-background" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-primary p-4 rounded-2xl shadow h-64">
          <Skeleton className="h-6 w-48 mb-4 bg-background" />
          <Skeleton className="h-48 w-full bg-background" />
        </div>
        <div className="bg-primary p-4 rounded-2xl shadow h-64">
          <Skeleton className="h-6 w-48 mb-4 bg-background " />
          <Skeleton className="h-48 w-full bg-background" />
        </div>
      </div>
    </div>
  );
}
