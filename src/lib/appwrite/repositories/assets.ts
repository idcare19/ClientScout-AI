import { Databases, Query } from "node-appwrite";
import { getAppwriteConfig } from "../config";
import { createOwnerPermissions } from "../permissions";

export type LeadAssetPayload = {
  sourceName: string | null;
  city: string | null;
  timezone: string | null;
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  otherSocialUrl: string | null;
  sourceUrl: string | null;
  verificationConfidence: number | null;
  verificationNotes: string | null;
  mainOpportunity: string | null;
  recommendedService: string | null;
  notes: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  demoUrl: string | null;
};

function normalizePayload(payload: Partial<LeadAssetPayload>): LeadAssetPayload {
  return {
    sourceName: payload.sourceName ?? null,
    city: payload.city ?? null,
    timezone: payload.timezone ?? null,
    instagram: payload.instagram ?? null,
    linkedin: payload.linkedin ?? null,
    facebook: payload.facebook ?? null,
    otherSocialUrl: payload.otherSocialUrl ?? null,
    sourceUrl: payload.sourceUrl ?? null,
    verificationConfidence: payload.verificationConfidence ?? null,
    verificationNotes: payload.verificationNotes ?? null,
    mainOpportunity: payload.mainOpportunity ?? null,
    recommendedService: payload.recommendedService ?? null,
    notes: payload.notes ?? null,
    lastContactedAt: payload.lastContactedAt ?? null,
    nextFollowUpAt: payload.nextFollowUpAt ?? null,
    demoUrl: payload.demoUrl ?? null,
  };
}

export class LeadAssetsRepository {
  constructor(private readonly databases: Databases) {}

  private get config() {
    return getAppwriteConfig();
  }

  async getByLeadId(leadId: string, ownerId?: string) {
    const result = await this.databases.listDocuments(this.config.databaseId, this.config.assetsCollectionId, [
      Query.equal("leadId", leadId),
      Query.limit(1),
    ]);
    const doc = result.documents[0] as Record<string, unknown> | undefined;
    if (!doc) return null;
    if (ownerId && String(doc.ownerId ?? "") !== ownerId) return null;
    return this.decode(doc);
  }

  async upsert(leadId: string, ownerId: string, payload: Partial<LeadAssetPayload>) {
    const existing = await this.getByLeadId(leadId, ownerId);
    const normalized = normalizePayload(payload);
    const now = new Date().toISOString();
    const data = {
      leadId,
      ownerId,
      payload: JSON.stringify(normalized),
      updatedAt: now,
      ...(existing ? {} : { createdAt: now }),
    };

    if (!existing) {
      const created = await this.databases.createDocument(
        this.config.databaseId,
        this.config.assetsCollectionId,
        leadId,
        data,
        createOwnerPermissions(ownerId),
      );
      return this.decode(created as unknown as Record<string, unknown>);
    }

    const updated = await this.databases.updateDocument(this.config.databaseId, this.config.assetsCollectionId, leadId, data);
    return this.decode(updated as unknown as Record<string, unknown>);
  }

  private decode(doc: Record<string, unknown>): LeadAssetPayload {
    const raw = String(doc.payload ?? "{}");
    try {
      return normalizePayload(JSON.parse(raw) as Partial<LeadAssetPayload>);
    } catch {
      return normalizePayload({});
    }
  }
}
