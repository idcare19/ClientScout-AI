import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createPhase2Services } from "@/lib/services/phase2-service";

export async function POST(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const jwt = await getJwtFromCookies();
  if (!jwt) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { draftId } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const services = createPhase2Services(jwt);
  const draft = await services.getDraftById(draftId, user.$id);
  if (!draft) return NextResponse.json({ message: "Draft not found" }, { status: 404 });

  const action = payload.action === "approve" || payload.action === "used" || payload.action === "copy" ? payload.action : "approve";
  if (action === "approve") {
    const updated = await services.approveOutreachDraft(draftId, user.$id);
    return NextResponse.json({ draft: updated });
  }
  if (action === "used") {
    const updated = await services.markDraftUsed(draftId, user.$id);
    return NextResponse.json({ draft: updated });
  }
  const updated = await services.updateOutreachDraft(draftId, user.$id, { lastCopiedAt: new Date().toISOString() });
  return NextResponse.json({ draft: updated });
}
