import { Databases, ID, Query } from "node-appwrite";
import { getAppwriteConfig } from "../config";
import { createOwnerPermissions } from "../permissions";
import type { Settings, SettingsInput } from "@/types/settings";

function mapSettingsDocument(doc: Record<string, unknown>): Settings {
  const parsePayload = (value: unknown) => {
    if (typeof value !== "string") return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };

  const payload = parsePayload(doc.defaultIndustries);
  return {
    $id: String(doc.$id),
    userId: String(doc.userId ?? ""),
    developerName: String(doc.developerName ?? "Abhishek"),
    portfolioUrl: String(doc.portfolioUrl ?? "https://idcare19.me"),
    email: String(doc.email ?? ""),
    defaultCountryFilter: (doc.defaultCountryFilter as string | null) ?? null,
    defaultIndustries: Array.isArray(payload.defaultIndustries) ? (payload.defaultIndustries as string[]) : [],
    dailyLeadTarget:
      typeof payload.dailyLeadTarget === "number"
        ? payload.dailyLeadTarget
        : payload.dailyLeadTarget == null
          ? null
          : Number(payload.dailyLeadTarget),
    minimumLeadScore:
      typeof payload.minimumLeadScore === "number"
        ? payload.minimumLeadScore
        : payload.minimumLeadScore == null
          ? null
          : Number(payload.minimumLeadScore),
    followUpAfterDays:
      typeof payload.followUpAfterDays === "number"
        ? payload.followUpAfterDays
        : payload.followUpAfterDays == null
          ? null
          : Number(payload.followUpAfterDays),
    skills: Array.isArray(payload.skills) ? (payload.skills as string[]) : [],
    preferredServices: Array.isArray(payload.preferredServices) ? (payload.preferredServices as string[]) : [],
    createdAt: String(doc.createdAt ?? doc.$createdAt ?? new Date().toISOString()),
    updatedAt: String(doc.updatedAt ?? doc.$updatedAt ?? new Date().toISOString()),
  };
}

export class SettingsRepository {
  constructor(private readonly databases: Databases) {}

  private get config() {
    return getAppwriteConfig();
  }

  async getForUser(userId: string) {
    const result = await this.databases.listDocuments(this.config.databaseId, this.config.settingsCollectionId, [
      Query.equal("userId", userId),
      Query.limit(1),
    ]);
    const doc = result.documents[0];
    return doc ? mapSettingsDocument(doc as unknown as Record<string, unknown>) : null;
  }

  async upsert(userId: string, input: SettingsInput) {
    const existing = await this.getForUser(userId);
    const payload = {
      userId,
      defaultIndustries: JSON.stringify({
        defaultIndustries: input.defaultIndustries ?? [],
        dailyLeadTarget: input.dailyLeadTarget ?? null,
        minimumLeadScore: input.minimumLeadScore ?? null,
        followUpAfterDays: input.followUpAfterDays ?? null,
        skills: input.skills ?? [],
        preferredServices: input.preferredServices ?? [],
      }),
      updatedAt: new Date().toISOString(),
    };

    if (!existing) {
      const created = await this.databases.createDocument(
        this.config.databaseId,
        this.config.settingsCollectionId,
        ID.unique(),
        {
          ...payload,
          developerName: input.developerName,
          portfolioUrl: input.portfolioUrl,
          email: input.email,
          defaultCountryFilter: input.defaultCountryFilter ?? null,
          createdAt: new Date().toISOString(),
        },
        createOwnerPermissions(userId),
      );
      return mapSettingsDocument(created as unknown as Record<string, unknown>);
    }

    const updated = await this.databases.updateDocument(this.config.databaseId, this.config.settingsCollectionId, existing.$id, {
      ...payload,
      developerName: input.developerName,
      portfolioUrl: input.portfolioUrl,
      email: input.email,
      defaultCountryFilter: input.defaultCountryFilter ?? null,
    });
    return mapSettingsDocument(updated as unknown as Record<string, unknown>);
  }
}
