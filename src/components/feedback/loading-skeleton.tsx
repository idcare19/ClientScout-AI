import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
