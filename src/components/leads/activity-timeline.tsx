import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityLog } from "@/types/activity";

export function ActivityTimeline({ items }: { items: ActivityLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity history</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ol className="space-y-3">
            {items.map((item) => (
              <li key={item.$id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-900">{item.description}</p>
                  <time className="text-xs text-slate-500">{format(new Date(item.createdAt), "PP p")}</time>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">No activity yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
