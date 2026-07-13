import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { CSVImportWizard } from "@/features/leads/csv-import-wizard";

export default async function ImportLeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import leads"
        description="Upload a CSV, map columns, review duplicates, and import only the rows you want."
        breadcrumb={[{ label: "Leads", href: "/leads" }, { label: "Import" }]}
      />
      <CSVImportWizard />
    </div>
  );
}
