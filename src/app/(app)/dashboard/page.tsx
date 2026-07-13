import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadPriorityBadge, LeadScoreBadge, LeadStatusBadge } from "@/components/leads/status-badges";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jwt = await getJwtFromCookies();
  if (!jwt) redirect("/login");

  const services = createLeadServices(jwt);
  const result = await services.listLeads({}, user.$id);
  const leads = result.documents;

  const totals = {
    total: leads.length,
    new: leads.filter((lead) => lead.status === "new").length,
    verified: leads.filter((lead) => lead.status === "verified").length,
    hot: leads.filter((lead) => lead.priority === "hot").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    replied: leads.filter((lead) => lead.status === "replied").length,
    interested: leads.filter((lead) => lead.status === "interested").length,
    won: leads.filter((lead) => lead.status === "won").length,
  };

  const recent = [...leads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);
  const review = leads.filter((lead) => lead.priority === "review" || lead.contactVerification === "needs_review").slice(0, 5);
  const followUps = leads
    .filter((lead) => lead.nextFollowUpAt)
    .sort((a, b) => +new Date(a.nextFollowUpAt ?? 0) - +new Date(b.nextFollowUpAt ?? 0))
    .slice(0, 5);

  const byIndustry = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.industry] = (acc[lead.industry] ?? 0) + 1;
    return acc;
  }, {});
  const byCountry = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.country] = (acc[lead.country] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A real-time view of your manually reviewed leads."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/leads/import">Import CSV</Link>
            </Button>
            <Button asChild>
              <Link href="/leads/new">Add lead</Link>
            </Button>
          </>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Start by adding your first lead manually or importing a CSV file."
          actionHref="/leads/new"
          actionLabel="Add your first lead"
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard label="Total leads" value={totals.total} />
            <DashboardCard label="New leads" value={totals.new} />
            <DashboardCard label="Verified leads" value={totals.verified} />
            <DashboardCard label="Hot leads" value={totals.hot} />
            <DashboardCard label="Contacted" value={totals.contacted} />
            <DashboardCard label="Replied" value={totals.replied} />
            <DashboardCard label="Interested" value={totals.interested} />
            <DashboardCard label="Projects won" value={totals.won} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recently added leads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recent.map((lead) => (
                  <div key={lead.$id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-950">{lead.businessName}</p>
                      <p className="text-sm text-slate-500">{lead.industry} · {lead.country}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <LeadStatusBadge status={lead.status} />
                      <LeadScoreBadge score={lead.leadScore} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leads requiring review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.length ? review.map((lead) => (
                  <div key={lead.$id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-950">{lead.businessName}</p>
                      <p className="text-sm text-slate-500">{lead.contactVerification.replaceAll("_", " ")}</p>
                    </div>
                    <LeadPriorityBadge priority={lead.priority} />
                  </div>
                )) : <p className="text-sm text-slate-500">No review queue right now.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming follow-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {followUps.length ? followUps.map((lead) => (
                  <div key={lead.$id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-950">{lead.businessName}</p>
                      <p className="text-sm text-slate-500">{lead.nextFollowUpAt ? formatDistanceToNow(new Date(lead.nextFollowUpAt), { addSuffix: true }) : "Not scheduled"}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/leads/${lead.$id}`}>View</Link>
                    </Button>
                  </div>
                )) : <p className="text-sm text-slate-500">No follow-ups scheduled.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Top industries</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(byIndustry).slice(0, 6).map(([key, value]) => (
                      <Badge key={key} variant="outline">{key}: {value}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Top countries</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(byCountry).slice(0, 6).map(([key, value]) => (
                      <Badge key={key} variant="outline">{key}: {value}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
