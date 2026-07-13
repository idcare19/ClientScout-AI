import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createPhase2Services } from "@/lib/services/phase2-service";
import type { VerificationEvidence } from "@/types/verification";

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const jwt = await getJwtFromCookies();
  if (!jwt) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { leadId } = await params;
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const services = createPhase2Services(jwt);
  const evidence = await services.addEvidence(leadId, user.$id, {
    leadId,
    ownerId: user.$id,
    evidenceType: String(payload.evidenceType ?? "other") as VerificationEvidence["evidenceType"],
    sourceUrl: typeof payload.sourceUrl === "string" ? payload.sourceUrl : null,
    sourceName: typeof payload.sourceName === "string" ? payload.sourceName : null,
    title: typeof payload.title === "string" ? payload.title : null,
    description: typeof payload.description === "string" ? payload.description : null,
    extractedBusinessName: typeof payload.extractedBusinessName === "string" ? payload.extractedBusinessName : null,
    extractedPhone: typeof payload.extractedPhone === "string" ? payload.extractedPhone : null,
    extractedEmail: typeof payload.extractedEmail === "string" ? payload.extractedEmail : null,
    extractedWebsite: typeof payload.extractedWebsite === "string" ? payload.extractedWebsite : null,
    extractedLocation: typeof payload.extractedLocation === "string" ? payload.extractedLocation : null,
    verificationResult: String(payload.verificationResult ?? "inconclusive") as VerificationEvidence["verificationResult"],
    confidence: typeof payload.confidence === "number" ? payload.confidence : Number(payload.confidence ?? 0),
    notes: typeof payload.notes === "string" ? payload.notes : null,
    checkedAt: typeof payload.checkedAt === "string" ? payload.checkedAt : null,
  });
  return NextResponse.json({ evidence });
}
