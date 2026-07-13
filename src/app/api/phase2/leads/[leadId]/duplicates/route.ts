import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createPhase2Services } from "@/lib/services/phase2-service";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const jwt = await getJwtFromCookies();
  if (!jwt) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { leadId } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const decision = payload.decision === "keep_both" || payload.decision === "not_duplicate" ? payload.decision : "not_duplicate";
  const services = createPhase2Services(jwt);
  const resolution = await services.resolveDuplicate(leadId, user.$id, {
    decision,
    primaryLeadId: typeof payload.primaryLeadId === "string" ? payload.primaryLeadId : undefined,
    notes: typeof payload.notes === "string" ? payload.notes : undefined,
  });
  return NextResponse.json({ resolution });
}
