import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getJwtFromCookies } from "@/lib/appwrite/server";
import { createSettingsServices } from "@/lib/services/settings-service";
import { settingsSchema } from "@/lib/validation/lead";
import type { SettingsInput } from "@/types/settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const services = createSettingsServices((await getJwtFromCookies()) ?? "");
  const settings = await services.getSettings(user.$id);
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const services = createSettingsServices((await getJwtFromCookies()) ?? "");
  const payload = settingsSchema.parse(await request.json());
  const normalizedPayload: SettingsInput = {
    developerName: payload.developerName,
    portfolioUrl: payload.portfolioUrl,
    email: payload.email,
    defaultCountryFilter: payload.defaultCountryFilter ?? null,
    defaultIndustries: payload.defaultIndustries,
    dailyLeadTarget: payload.dailyLeadTarget ?? null,
    minimumLeadScore: payload.minimumLeadScore ?? null,
    followUpAfterDays: payload.followUpAfterDays ?? null,
    skills: payload.skills,
    preferredServices: payload.preferredServices,
  };
  const settings = await services.saveSettings(user.$id, normalizedPayload);
  return NextResponse.json({ settings });
}
