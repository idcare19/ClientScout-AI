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

export default async function OutreachPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jwt = await getJwtFromCookies();
  if (!jwt) redirect("/login");

  const phase2 = createPhase2Services(jwt);
  const leadsService = createLeadServices(jwt);
  const allLeads = await leadsService.listAllLeads(user.$id);
  const draftGroups = await Promise.all(allLeads.documents.map(async (lead) => ({ lead, drafts: await phase2.listDrafts(lead.$id, user.$id) })));
  const drafts = draftGroups
    .flatMap((group) => group.drafts.map((draft) => ({ lead: group.lead, draft })))
    .sort((a, b) => +new Date(b.draft.createdAt) - +new Date(a.draft.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach"
        description="Review generated drafts and jump back into the lead workspace when it is time to send."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {drafts.length === 0 ? (
          <Card className="xl:col-span-3">
            <CardContent className="p-6 text-sm text-slate-500">No outreach drafts have been generated yet.</CardContent>
          </Card>
        ) : (
          drafts.map(({ lead, draft }) => (
            <Card key={draft.$id}>
              <CardHeader>
                <CardTitle>{lead.businessName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{draft.channel.toUpperCase()}</Badge>
                  <Badge variant="outline">{draft.approvalStatus.replaceAll("_", " ")}</Badge>
                </div>
                <p className="text-slate-600">{draft.subject ?? "No subject"}</p>
                <p className="text-xs text-slate-500">Created {format(new Date(draft.createdAt), "PP p")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/leads/${lead.$id}`}>Open lead</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
