import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { LeadForm } from "@/features/leads/lead-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewLeadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add lead"
        description="Create a new manually reviewed lead."
        breadcrumb={[{ label: "Leads", href: "/leads" }, { label: "New lead" }]}
        actions={
          <Button asChild variant="outline">
            <Link href="/leads">Back to leads</Link>
          </Button>
        }
      />
      <LeadForm mode="create" />
    </div>
  );
}
