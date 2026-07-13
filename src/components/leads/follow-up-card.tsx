import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export function FollowUpCard({ nextFollowUpAt, lastContactedAt }: { nextFollowUpAt?: string | null; lastContactedAt?: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Next follow-up</p>
          <p className="mt-1 font-medium text-slate-900">{nextFollowUpAt ? format(new Date(nextFollowUpAt), "PP") : "Not scheduled"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Last contacted</p>
          <p className="mt-1 font-medium text-slate-900">{lastContactedAt ? format(new Date(lastContactedAt), "PP") : "Not contacted yet"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
