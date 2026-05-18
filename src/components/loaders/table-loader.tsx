import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeletonLoader() {
  return (
    <div className="rounded-md  border bg-transparent p-2">
      <table className="min-w-full text-sm text-white">
        <thead className="text-left font-semibold text-white bg-transparent">
          <tr>
            <th className="p-3">TRX ID</th>
            <th className="p-3">Tracking ID</th>
            <th className="p-3">Player ID</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Payment Gateway</th>
            <th className="p-3">Date</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y  ">
          {[...Array(3)].map((_, i) => (
            <tr key={i}>
              {[...Array(8)].map((_, j) => (
                <td key={j} className="p-3">
                  <Skeleton className="h-4 w-full bg-primary" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
