import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createPhase2Services } from "@/lib/services/phase2-service";
import { outreachChannels, websiteOpportunityTypes } from "@/types/verification";

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
  const opportunityType =
    typeof payload.opportunityType === "string" && websiteOpportunityTypes.includes(payload.opportunityType as (typeof websiteOpportunityTypes)[number])
      ? (payload.opportunityType as (typeof websiteOpportunityTypes)[number])
      : "needs_manual_review";
  const services = createPhase2Services(jwt);
  const draft = await services.generateOutreachDraft(leadId, user.$id, channel, opportunityType);
  return NextResponse.json({ draft });
}
