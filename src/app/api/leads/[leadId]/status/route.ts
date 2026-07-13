import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { leadStatuses } from "@/types/lead";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
  if (!status || !leadStatuses.includes(status as (typeof leadStatuses)[number])) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }
  const { leadId } = await params;
  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  const lead = await services.updateStatus(leadId, status as (typeof leadStatuses)[number], user.$id);
  return NextResponse.json({ lead });
}
