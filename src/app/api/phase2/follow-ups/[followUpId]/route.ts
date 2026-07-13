import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createPhase2Services } from "@/lib/services/phase2-service";

export async function POST(request: Request, { params }: { params: Promise<{ followUpId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const jwt = await getJwtFromCookies();
  if (!jwt) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { followUpId } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = payload.action === "complete" || payload.action === "cancel" ? payload.action : "complete";
  const services = createPhase2Services(jwt);
  if (action === "complete") {
    const followUp = await services.completeFollowUp(followUpId, user.$id);
    return NextResponse.json({ followUp });
  }
  const followUp = await services.cancelFollowUp(followUpId, user.$id);
  return NextResponse.json({ followUp });
}
