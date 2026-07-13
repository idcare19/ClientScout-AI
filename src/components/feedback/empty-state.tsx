import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="max-w-md">
          <h3 className="font-heading text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          {actionHref && actionLabel ? (
            <Button asChild className="mt-5">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
