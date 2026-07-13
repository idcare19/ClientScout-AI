import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createLeadServices } from "@/lib/services/lead-service";
import { leadFormSchema, leadFilterSchema } from "@/lib/validation/lead";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const filters = leadFilterSchema.parse(Object.fromEntries(url.searchParams.entries()));
  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  const result = await services.listLeads(filters, user.$id);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const services = createLeadServices((await getJwtFromCookies()) ?? "");
  const payload = leadFormSchema.parse(await request.json());
  const created = await services.createLead(payload, user.$id);
  return NextResponse.json({ lead: created }, { status: 201 });
}
