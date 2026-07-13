import { Databases, ID, Query } from "node-appwrite";
import { getAppwriteConfig } from "../config";
import { createOwnerPermissions } from "../permissions";
import type { ActivityAction, ActivityLog } from "@/types/activity";

function mapActivityDocument(doc: Record<string, unknown>): ActivityLog {
  const metadataRaw = String(doc.metadata ?? "{}");
  return {
    $id: String(doc.$id),
    leadId: String(doc.leadId ?? ""),
    ownerId: String(doc.ownerId ?? ""),
    action: String(doc.action ?? "updated") as ActivityAction,
    description: String(doc.description ?? ""),
    metadata: (() => {
      try {
        return JSON.parse(metadataRaw) as Record<string, unknown>;
      } catch {
        return {};
      }
    })(),
    createdAt: String(doc.createdAt ?? doc.$createdAt ?? new Date().toISOString()),
  };
}

export class ActivityRepository {
  constructor(private readonly databases: Databases) {}

  private get config() {
    return getAppwriteConfig();
  }

  async listByLead(leadId: string, ownerId: string) {
    const result = await this.databases.listDocuments(this.config.databaseId, this.config.activityCollectionId, [
      Query.equal("leadId", leadId),
      Query.equal("ownerId", ownerId),
      Query.orderDesc("createdAt"),
    ]);
    return result.documents.map((doc) => mapActivityDocument(doc as unknown as Record<string, unknown>));
  }

  async create(input: Omit<ActivityLog, "$id" | "createdAt">) {
    const now = new Date().toISOString();
    const created = await this.databases.createDocument(
      this.config.databaseId,
      this.config.activityCollectionId,
      ID.unique(),
      { ...input, metadata: JSON.stringify(input.metadata ?? {}), createdAt: now },
      createOwnerPermissions(input.ownerId),
    );
    return mapActivityDocument(created as unknown as Record<string, unknown>);
  }
}
