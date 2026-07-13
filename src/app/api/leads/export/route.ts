import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { exportLeadsToCsv } from "@/lib/csv/leads";
import { leadFilterSchema } from "@/lib/validation/lead";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const filters = leadFilterSchema.parse(Object.fromEntries(url.searchParams.entries()));
  const result = ids.length ? await services.listAllLeads(user.$id) : await services.listLeads(filters, user.$id);
  const leads = ids.length ? result.documents.filter((lead) => ids.includes(lead.$id)) : result.documents;
  const csv = exportLeadsToCsv(leads);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clientscout-leads.csv"',
    },
  });
}
