import { getServerDatabases } from "@/lib/appwrite/server";
import { SettingsRepository } from "@/lib/appwrite/repositories/settings";
import type { SettingsInput } from "@/types/settings";

export function createSettingsServices(jwt: string) {
  const databases = getServerDatabases(jwt);
  const settings = new SettingsRepository(databases);

  return {
    getSettings: (userId: string) => settings.getForUser(userId),
    saveSettings: (userId: string, input: SettingsInput) => settings.upsert(userId, input),
  };
}
