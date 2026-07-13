import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { normalizeLeadImportRow } from "@/lib/csv/leads";
import type { LeadInput } from "@/types/lead";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { rows } = (await request.json().catch(() => ({}))) as { rows?: Record<string, string>[] };
  if (!Array.isArray(rows)) {
    return NextResponse.json({ message: "Missing CSV rows." }, { status: 400 });
  }

  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  const imported: Array<{ rowIndex: number; leadId?: string; status: string; duplicateCount?: number; error?: string }> = [];

  for (const [index, row] of rows.entries()) {
    try {
      const normalized = normalizeLeadImportRow(row);
      const duplicates = await services.findPotentialDuplicates(normalized as LeadInput, user.$id);
      const lead = await services.createLead(normalized, user.$id);
      imported.push({
        rowIndex: index,
        leadId: lead.$id,
        status: duplicates.length > 0 ? "imported_with_warning" : "imported",
        duplicateCount: duplicates.length || undefined,
      });
    } catch (error) {
      imported.push({
        rowIndex: index,
        status: "invalid",
        error: error instanceof Error ? error.message : "Invalid row",
      });
    }
  }

  return NextResponse.json({ imported });
}
