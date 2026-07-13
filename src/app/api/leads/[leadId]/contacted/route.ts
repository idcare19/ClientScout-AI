import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";

export async function POST(_: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { leadId } = await params;
  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  const lead = await services.markContacted(leadId, user.$id);
  return NextResponse.json({ lead });
}
