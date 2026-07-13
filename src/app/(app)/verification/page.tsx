import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function VerificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const jwt = await getJwtFromCookies();
  if (!jwt) redirect("/login");

  const services = createLeadServices(jwt);
  const result = await services.listLeads({}, user.$id);
  const leads = [...result.documents].sort((a, b) => (b.verificationConfidence ?? 0) - (a.verificationConfidence ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification"
        description="Scan lead readiness, open the detailed workspace, and keep the verification queue moving."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {leads.length === 0 ? (
          <Card className="xl:col-span-3">
            <CardContent className="p-6 text-sm text-slate-500">No leads available yet.</CardContent>
          </Card>
        ) : (
          leads.map((lead) => (
            <Card key={lead.$id}>
              <CardHeader>
                <CardTitle>{lead.businessName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{lead.status.replaceAll("_", " ")}</Badge>
                  <Badge variant="outline">Confidence {lead.verificationConfidence ?? 0}%</Badge>
                </div>
                <p className="text-slate-600">{lead.verificationNotes ?? "No verification notes yet."}</p>
                <p className="text-xs text-slate-500">
                  {lead.lastVerifiedAt ? `Last verified ${format(new Date(lead.lastVerifiedAt), "PP p")}` : "Not verified yet"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/leads/${lead.$id}`}>Open workspace</Link>
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
