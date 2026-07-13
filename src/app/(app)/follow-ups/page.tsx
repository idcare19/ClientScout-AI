import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createPhase2Services } from "@/lib/services/phase2-service";
import { createLeadServices } from "@/lib/services/lead-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function FollowUpsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jwt = await getJwtFromCookies();
  if (!jwt) redirect("/login");

  const phase2 = createPhase2Services(jwt);
  const leadsService = createLeadServices(jwt);
  const allLeads = await leadsService.listAllLeads(user.$id);
  const leadMap = new Map(allLeads.documents.map((lead) => [lead.$id, lead]));
  const followUps = await phase2.listFollowUps(user.$id);
  const sorted = [...followUps].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="See scheduled follow-ups and open the owning lead when it is time to act."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.length === 0 ? (
          <Card className="xl:col-span-3">
            <CardContent className="p-6 text-sm text-slate-500">No follow-ups are scheduled right now.</CardContent>
          </Card>
        ) : (
          sorted.map((followUp) => {
            const lead = leadMap.get(followUp.leadId);
            return (
              <Card key={followUp.$id}>
                <CardHeader>
                  <CardTitle>{lead?.businessName ?? "Unknown lead"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{followUp.channel.toUpperCase()}</Badge>
                    <Badge variant="outline">{followUp.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="text-slate-600">{followUp.followUpType.replaceAll("_", " ")}</p>
                  <p className="text-xs text-slate-500">Scheduled {format(new Date(followUp.scheduledAt), "PP p")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/leads/${followUp.leadId}`}>Open lead</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
