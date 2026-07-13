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
  const preview: Array<{ rowIndex: number; status: string; duplicateCount?: number; error?: string }> = [];

  for (const [index, row] of rows.entries()) {
    try {
      const normalized = normalizeLeadImportRow(row);
      const duplicates = await services.findPotentialDuplicates(normalized as LeadInput, user.$id);
      preview.push({
        rowIndex: index,
        status: duplicates.length > 0 ? "possible_duplicate" : "ready",
        duplicateCount: duplicates.length || undefined,
      });
    } catch (error) {
      preview.push({
        rowIndex: index,
        status: "invalid",
        error: error instanceof Error ? error.message : "Invalid row",
      });
    }
  }

  return NextResponse.json({ preview });
}
