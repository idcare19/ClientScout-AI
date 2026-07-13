import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createPhase2Services } from "@/lib/services/phase2-service";
import { outreachChannels, followUpTypes } from "@/types/verification";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const jwt = await getJwtFromCookies();
  if (!jwt) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { leadId } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const channel = typeof payload.channel === "string" && outreachChannels.includes(payload.channel as (typeof outreachChannels)[number])
    ? (payload.channel as (typeof outreachChannels)[number])
    : "whatsapp";
  const followUpType =
    typeof payload.followUpType === "string" && followUpTypes.includes(payload.followUpType as (typeof followUpTypes)[number])
      ? (payload.followUpType as (typeof followUpTypes)[number])
      : "custom";
  const services = createPhase2Services(jwt);
  const followUp = await services.scheduleFollowUp({
    leadId,
    ownerId: user.$id,
    outreachDraftId: typeof payload.outreachDraftId === "string" ? payload.outreachDraftId : null,
    channel,
    followUpType: followUpType,
    scheduledAt: typeof payload.scheduledAt === "string" ? payload.scheduledAt : new Date().toISOString(),
    status: "scheduled",
    message: typeof payload.message === "string" ? payload.message : null,
    completedAt: null,
    skippedAt: null,
    skipReason: null,
    notes: typeof payload.notes === "string" ? payload.notes : null,
  });
  return NextResponse.json({ followUp });
}
