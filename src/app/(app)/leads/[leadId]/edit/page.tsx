import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { PageHeader } from "@/components/layout/page-header";
import { LeadForm } from "@/features/leads/lead-form";
import { Button } from "@/components/ui/button";

function toDateTimeLocal(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function EditLeadPage({ params }: { params: { leadId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jwt = await getJwtFromCookies();
  if (!jwt) redirect("/login");

  const { leadId } = params;
  const services = createLeadServices(jwt);
  let lead!: Awaited<ReturnType<(typeof services)["getLead"]>>;
  try {
    lead = await services.getLead(leadId, user.$id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit lead"
        description={lead.businessName}
        breadcrumb={[{ label: "Leads", href: "/leads" }, { label: lead.businessName, href: `/leads/${leadId}` }, { label: "Edit" }]}
        actions={
          <Button asChild variant="outline">
            <Link href={`/leads/${leadId}`}>Back to lead</Link>
          </Button>
        }
      />
      <LeadForm
        mode="edit"
        leadId={leadId}
        initialValues={{
          ...lead,
          lastContactedAt: toDateTimeLocal(lead.lastContactedAt),
          nextFollowUpAt: toDateTimeLocal(lead.nextFollowUpAt),
        }}
      />
    </div>
  );
}
