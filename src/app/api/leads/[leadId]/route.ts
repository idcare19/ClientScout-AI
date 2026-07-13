import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { leadFormSchema } from "@/lib/validation/lead";

export async function GET(_: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { leadId } = await params;
  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  const lead = await services.getLead(leadId, user.$id);
  return NextResponse.json({ lead });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { leadId } = await params;
  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  const payload = leadFormSchema.parse(await request.json());
  const lead = await services.updateLead(leadId, payload, user.$id);
  return NextResponse.json({ lead });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { leadId } = await params;
  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  await services.deleteLead(leadId, user.$id);
  return NextResponse.json({ ok: true });
}
