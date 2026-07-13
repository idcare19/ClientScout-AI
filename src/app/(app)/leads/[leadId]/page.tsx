import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { getLeadScoreBreakdown } from "@/lib/scoring/lead-score";
import { PageHeader } from "@/components/layout/page-header";
import { LeadScoreBreakdown } from "@/components/leads/lead-score-breakdown";
import { ActivityTimeline } from "@/components/leads/activity-timeline";
import { FollowUpCard } from "@/components/leads/follow-up-card";
import { ExternalContactLinks } from "@/components/leads/external-contact-links";
import { LeadActions } from "@/components/leads/lead-actions";
import { LeadPriorityBadge, LeadScoreBadge, LeadStatusBadge, VerificationBadge, WebsiteStatusBadge } from "@/components/leads/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LeadDetailPage({ params }: { params: { leadId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jwt = await getJwtFromCookies();
  if (!jwt) redirect("/login");

  const { leadId } = params;
  const services = createLeadServices(jwt);

  let lead!: Awaited<ReturnType<(typeof services)["getLead"]>>;
  let activities!: Awaited<ReturnType<(typeof services)["listActivity"]>>;
  try {
    lead = await services.getLead(leadId, user.$id);
    activities = await services.listActivity(leadId, user.$id);
  } catch {
    notFound();
  }

  const breakdown = getLeadScoreBreakdown(lead);

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.businessName}
        description={lead.industry}
        breadcrumb={[{ label: "Leads", href: "/leads" }, { label: lead.businessName }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/leads/${lead.$id}/edit`}>Edit lead</Link>
            </Button>
            <Button asChild>
              <Link href="/leads/new">Add lead</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lead overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <LeadStatusBadge status={lead.status} />
              <LeadPriorityBadge priority={lead.priority} />
              <VerificationBadge value={lead.contactVerification} />
              <WebsiteStatusBadge value={lead.websiteStatus} />
              <LeadScoreBadge score={lead.leadScore} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Business</p>
                <p className="mt-1 font-medium text-slate-950">{lead.businessName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Contact person</p>
                <p className="mt-1 font-medium text-slate-950">{lead.contactPerson ?? "Not set"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Location</p>
                <p className="mt-1 font-medium text-slate-950">{lead.city ? `${lead.city}, ` : ""}{lead.country}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Updated</p>
                <p className="mt-1 font-medium text-slate-950">{format(new Date(lead.updatedAt), "PP p")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <FollowUpCard nextFollowUpAt={lead.nextFollowUpAt} lastContactedAt={lead.lastContactedAt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Primary actions</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadActions lead={lead} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Industry</p><p className="mt-1 font-medium">{lead.industry}</p></div>
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Business type</p><p className="mt-1 font-medium">{lead.businessType.replaceAll("_", " ")}</p></div>
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Timezone</p><p className="mt-1 font-medium">{lead.timezone ?? "Not set"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Country</p><p className="mt-1 font-medium">{lead.country}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExternalContactLinks email={lead.email} phone={lead.phone} whatsapp={lead.whatsapp} website={lead.website} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Email</p><p className="mt-1 font-medium">{lead.email ?? "Not set"}</p></div>
              <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Phone</p><p className="mt-1 font-medium">{lead.phone ?? "Not set"}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Source name</p><p className="mt-1 font-medium">{lead.sourceName}</p></div>
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Source URL</p><p className="mt-1 font-medium">{lead.sourceUrl ?? "Not set"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Source notes</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{lead.sourceNotes ?? "No notes"}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <WebsiteStatusBadge value={lead.websiteStatus} />
              <VerificationBadge value={lead.contactVerification} />
            </div>
            <p className="text-sm text-slate-600">{lead.verificationNotes ?? "No verification notes yet."}</p>
            <p className="text-sm text-slate-600">Confidence: {lead.verificationConfidence ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LeadScoreBreakdown score={lead.leadScore} items={breakdown} />
        <Card>
          <CardHeader>
            <CardTitle>Opportunity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Main opportunity</p><p className="mt-1 text-sm text-slate-600">{lead.mainOpportunity ?? "Not set"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Recommended service</p><p className="mt-1 text-sm text-slate-600">{lead.recommendedService ?? "Not set"}</p></div>
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Demo URL</p><p className="mt-1 text-sm text-slate-600">{lead.demoUrl ?? "Not set"}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{lead.notes ?? "No notes yet."}</p>
          </CardContent>
        </Card>
        <ActivityTimeline items={activities} />
      </div>
    </div>
  );
}
