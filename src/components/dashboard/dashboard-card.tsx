import { Card, CardContent } from "@/components/ui/card";

export function DashboardCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="mt-3 font-heading text-3xl font-semibold text-slate-950">{value}</p>
        {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
