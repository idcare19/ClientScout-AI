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
  const services = createPhase2Services(jwt);
  const audit = await services.runAudit(
    leadId,
    user.$id,
    typeof payload.requestedUrl === "string" ? payload.requestedUrl : "",
    typeof payload.businessName === "string" ? payload.businessName : null,
    typeof payload.email === "string" ? payload.email : null,
    typeof payload.phone === "string" ? payload.phone : null,
    typeof payload.whatsapp === "string" ? payload.whatsapp : null,
  );
  return NextResponse.json({ audit });
}
