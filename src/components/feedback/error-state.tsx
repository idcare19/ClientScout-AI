import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-10">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-heading text-xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          {onRetry ? (
            <div>
              <Button variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
