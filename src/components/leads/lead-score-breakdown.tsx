import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadScoreBreakdownItem } from "@/types/lead";

export function LeadScoreBreakdown({ score, items }: { score: number; items: LeadScoreBreakdownItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Current score</p>
          <p className="mt-1 font-heading text-3xl font-semibold text-slate-950">{score}</p>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                {item.reason ? <p className="text-xs text-slate-500">{item.reason}</p> : null}
              </div>
              <p className={`text-sm font-semibold ${item.points >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {item.points > 0 ? `+${item.points}` : item.points}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
