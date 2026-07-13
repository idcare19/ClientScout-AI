import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import type { LeadFilters } from "@/types/lead";
import { PageHeader } from "@/components/layout/page-header";
import { LeadTable } from "@/components/leads/lead-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jwt = await getJwtFromCookies();
  if (!jwt) redirect("/login");

  const params = searchParams;
  const services = createLeadServices(jwt);
  const exportParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (key !== "page" && typeof value === "string" && value) exportParams.set(key, value);
  });
  const [filtered, allLeads] = await Promise.all([
    services.listLeads(
      {
        query: typeof params.query === "string" ? params.query : undefined,
        status: typeof params.status === "string" ? (params.status as LeadFilters["status"]) : undefined,
        priority: typeof params.priority === "string" ? (params.priority as LeadFilters["priority"]) : undefined,
        country: typeof params.country === "string" ? params.country : undefined,
        industry: typeof params.industry === "string" ? params.industry : undefined,
        websiteStatus: typeof params.websiteStatus === "string" ? (params.websiteStatus as LeadFilters["websiteStatus"]) : undefined,
        contactVerification:
          typeof params.contactVerification === "string" ? (params.contactVerification as LeadFilters["contactVerification"]) : undefined,
        sort: typeof params.sort === "string" ? (params.sort as LeadFilters["sort"]) : undefined,
        page: typeof params.page === "string" ? Number(params.page) : undefined,
      },
      user.$id,
    ),
    services.listAllLeads(user.$id),
  ]);

  const countries = Array.from(new Set(allLeads.documents.map((lead) => lead.country).filter(Boolean))).sort();
  const industries = Array.from(new Set(allLeads.documents.map((lead) => lead.industry).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Search, filter, sort, and manage every lead in your private CRM."
        actions={
          <>
            <Button asChild variant="outline">
              <a href={`/api/leads/export?${exportParams.toString()}`}>Export CSV</a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/leads/import">Import CSV</Link>
            </Button>
            <Button asChild>
              <Link href="/leads/new">Add lead</Link>
            </Button>
          </>
        }
      />

      {filtered.documents.length === 0 ? (
        <EmptyState
          title="No leads match your filters"
          description="Clear filters or add a new lead to continue."
          actionHref="/leads/new"
          actionLabel="Add a lead"
        />
      ) : (
        <LeadTable
          leads={filtered.documents}
          total={filtered.total}
          page={filtered.page}
          limit={filtered.limit}
          countries={countries}
          industries={industries}
        />
      )}
    </div>
  );
}
