import { Databases, ID, Query } from "node-appwrite";
import { getAppwriteConfig } from "../config";
import { createOwnerPermissions } from "../permissions";
import type { FollowUp, OutreachDraft, VerificationEvidence, WebsiteAudit } from "@/types/verification";

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function mapEvidence(doc: Record<string, unknown>): VerificationEvidence {
  return {
    $id: String(doc.$id),
    leadId: String(doc.leadId ?? ""),
    ownerId: String(doc.ownerId ?? ""),
    evidenceType: String(doc.evidenceType ?? "other") as VerificationEvidence["evidenceType"],
    sourceUrl: safeString(doc.sourceUrl),
    sourceName: safeString(doc.sourceName),
    title: safeString(doc.title),
    description: safeString(doc.description),
    extractedBusinessName: safeString(doc.extractedBusinessName),
    extractedPhone: safeString(doc.extractedPhone),
    extractedEmail: safeString(doc.extractedEmail),
    extractedWebsite: safeString(doc.extractedWebsite),
    extractedLocation: safeString(doc.extractedLocation),
    verificationResult: String(doc.verificationResult ?? "inconclusive") as VerificationEvidence["verificationResult"],
    confidence: Number(doc.confidence ?? 0),
    notes: safeString(doc.notes),
    checkedAt: safeString(doc.checkedAt),
    createdAt: String(doc.createdAt ?? doc.$createdAt ?? new Date().toISOString()),
    updatedAt: String(doc.updatedAt ?? doc.$updatedAt ?? new Date().toISOString()),
  };
}

function mapAudit(doc: Record<string, unknown>): WebsiteAudit {
  return {
    $id: String(doc.$id),
    leadId: String(doc.leadId ?? ""),
    ownerId: String(doc.ownerId ?? ""),
    requestedUrl: safeString(doc.requestedUrl),
    normalizedUrl: safeString(doc.normalizedUrl),
    finalUrl: safeString(doc.finalUrl),
    domain: safeString(doc.domain),
    httpStatus: safeNumber(doc.httpStatus),
    reachable: safeBoolean(doc.reachable),
    redirected: safeBoolean(doc.redirected),
    redirectCount: Number(doc.redirectCount ?? 0),
    httpsEnabled: safeBoolean(doc.httpsEnabled),
    responseTimeMs: safeNumber(doc.responseTimeMs),
    contentType: safeString(doc.contentType),
    pageTitle: safeString(doc.pageTitle),
    metaDescription: safeString(doc.metaDescription),
    mobileViewport: safeBoolean(doc.mobileViewport),
    language: safeString(doc.language),
    businessNameMatch: safeString(doc.businessNameMatch),
    businessNameMatchScore: Number(doc.businessNameMatchScore ?? 0),
    phoneMatchesLead: safeBoolean(doc.phoneMatchesLead),
    emailMatchesLead: safeBoolean(doc.emailMatchesLead),
    whatsappLinkFound: safeBoolean(doc.whatsappLinkFound),
    contactPageFound: safeBoolean(doc.contactPageFound),
    enquiryFormFound: safeBoolean(doc.enquiryFormFound),
    bookingSignalsFound: safeBoolean(doc.bookingSignalsFound),
    socialLinksFound: safeBoolean(doc.socialLinksFound),
    robotsNoIndex: safeBoolean(doc.robotsNoIndex),
    securityHeadersJson: safeParseJson<Record<string, unknown>>(doc.securityHeadersJson, {}),
    detectedIssuesJson: safeParseJson<string[]>(doc.detectedIssuesJson, []),
    evidenceJson: safeParseJson<Record<string, unknown>>(doc.evidenceJson, {}),
    auditStatus: String(doc.auditStatus ?? "pending") as WebsiteAudit["auditStatus"],
    confidence: Number(doc.confidence ?? 0),
    errorCode: safeString(doc.errorCode),
    errorMessageSafe: safeString(doc.errorMessageSafe),
    checkedAt: safeString(doc.checkedAt),
    createdAt: String(doc.createdAt ?? doc.$createdAt ?? new Date().toISOString()),
    updatedAt: String(doc.updatedAt ?? doc.$updatedAt ?? new Date().toISOString()),
  };
}

function mapDraft(doc: Record<string, unknown>): OutreachDraft {
  return {
    $id: String(doc.$id),
    leadId: String(doc.leadId ?? ""),
    ownerId: String(doc.ownerId ?? ""),
    channel: String(doc.channel ?? "whatsapp") as OutreachDraft["channel"],
    subject: safeString(doc.subject),
    message: String(doc.message ?? ""),
    followUpMessage: safeString(doc.followUpMessage),
    finalFollowUpMessage: safeString(doc.finalFollowUpMessage),
    opportunityType: String(doc.opportunityType ?? "needs_manual_review") as OutreachDraft["opportunityType"],
    templateKey: String(doc.templateKey ?? "default"),
    generationMethod: String(doc.generationMethod ?? "static_template") as OutreachDraft["generationMethod"],
    approvalStatus: String(doc.approvalStatus ?? "draft") as OutreachDraft["approvalStatus"],
    approvedAt: safeString(doc.approvedAt),
    contactedAt: safeString(doc.contactedAt),
    lastCopiedAt: safeString(doc.lastCopiedAt),
    version: Number(doc.version ?? 1),
    sourceSnapshotJson: safeParseJson<Record<string, unknown>>(doc.sourceSnapshotJson, {}),
    createdAt: String(doc.createdAt ?? doc.$createdAt ?? new Date().toISOString()),
    updatedAt: String(doc.updatedAt ?? doc.$updatedAt ?? new Date().toISOString()),
  };
}

function mapFollowUp(doc: Record<string, unknown>): FollowUp {
  return {
    $id: String(doc.$id),
    leadId: String(doc.leadId ?? ""),
    ownerId: String(doc.ownerId ?? ""),
    outreachDraftId: safeString(doc.outreachDraftId),
    channel: String(doc.channel ?? "whatsapp") as FollowUp["channel"],
    followUpType: String(doc.followUpType ?? "custom") as FollowUp["followUpType"],
    scheduledAt: String(doc.scheduledAt ?? new Date().toISOString()),
    status: String(doc.status ?? "scheduled") as FollowUp["status"],
    message: safeString(doc.message),
    completedAt: safeString(doc.completedAt),
    skippedAt: safeString(doc.skippedAt),
    skipReason: safeString(doc.skipReason),
    notes: safeString(doc.notes),
    createdAt: String(doc.createdAt ?? doc.$createdAt ?? new Date().toISOString()),
    updatedAt: String(doc.updatedAt ?? doc.$updatedAt ?? new Date().toISOString()),
  };
}

export class VerificationEvidenceRepository {
  constructor(private readonly databases: Databases) {}
  private get config() { return getAppwriteConfig(); }
  async listByLead(leadId: string, ownerId: string) {
    const result = await this.databases.listDocuments(this.config.databaseId, this.config.verificationEvidenceCollectionId ?? "cs_verification_evidence", [
      Query.equal("leadId", leadId),
      Query.equal("ownerId", ownerId),
      Query.orderDesc("createdAt"),
    ]);
    return result.documents.map((doc) => mapEvidence(doc as unknown as Record<string, unknown>));
  }
  async create(input: Omit<VerificationEvidence, "$id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const created = await this.databases.createDocument(
      this.config.databaseId,
      this.config.verificationEvidenceCollectionId ?? "cs_verification_evidence",
      ID.unique(),
      { ...input, createdAt: now, updatedAt: now, checkedAt: input.checkedAt ?? now },
      createOwnerPermissions(input.ownerId),
    );
    return mapEvidence(created as unknown as Record<string, unknown>);
  }
}

export class WebsiteAuditRepository {
  constructor(private readonly databases: Databases) {}
  private get config() { return getAppwriteConfig(); }
  async listByLead(leadId: string, ownerId: string) {
    const result = await this.databases.listDocuments(this.config.databaseId, this.config.websiteAuditsCollectionId ?? "cs_website_audits", [
      Query.equal("leadId", leadId),
      Query.equal("ownerId", ownerId),
      Query.orderDesc("checkedAt"),
    ]);
    return result.documents.map((doc) => mapAudit(doc as unknown as Record<string, unknown>));
  }
  async create(input: Omit<WebsiteAudit, "$id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const created = await this.databases.createDocument(
      this.config.databaseId,
      this.config.websiteAuditsCollectionId ?? "cs_website_audits",
      ID.unique(),
      {
        ...input,
        securityHeadersJson: JSON.stringify(input.securityHeadersJson ?? {}),
        detectedIssuesJson: JSON.stringify(input.detectedIssuesJson ?? []),
        evidenceJson: JSON.stringify(input.evidenceJson ?? {}),
        createdAt: now,
        updatedAt: now,
      },
      createOwnerPermissions(input.ownerId),
    );
    return mapAudit(created as unknown as Record<string, unknown>);
  }
}

export class OutreachDraftRepository {
  constructor(private readonly databases: Databases) {}
  private get config() { return getAppwriteConfig(); }
  async listByLead(leadId: string, ownerId: string) {
    const result = await this.databases.listDocuments(this.config.databaseId, this.config.outreachDraftsCollectionId ?? "cs_outreach_drafts", [
      Query.equal("leadId", leadId),
      Query.equal("ownerId", ownerId),
      Query.orderDesc("version"),
    ]);
    return result.documents.map((doc) => mapDraft(doc as unknown as Record<string, unknown>));
  }
  async create(input: Omit<OutreachDraft, "$id" | "createdAt" | "updatedAt">) {
    const { subject: _subject, followUpMessage: _followUpMessage, finalFollowUpMessage: _finalFollowUpMessage, sourceSnapshotJson: _sourceSnapshotJson, ...rest } = input;
    const created = await this.databases.createDocument(
      this.config.databaseId,
      this.config.outreachDraftsCollectionId ?? "cs_outreach_drafts",
      ID.unique(),
      rest,
      createOwnerPermissions(input.ownerId),
    );
    return mapDraft(created as unknown as Record<string, unknown>);
  }
}

export class FollowUpRepository {
  constructor(private readonly databases: Databases) {}
  private get config() { return getAppwriteConfig(); }
  async listByLead(leadId: string, ownerId: string) {
    const result = await this.databases.listDocuments(this.config.databaseId, this.config.followUpsCollectionId ?? "cs_follow_ups", [
      Query.equal("leadId", leadId),
      Query.equal("ownerId", ownerId),
      Query.orderAsc("scheduledAt"),
    ]);
    return result.documents.map((doc) => mapFollowUp(doc as unknown as Record<string, unknown>));
  }
  async create(input: Omit<FollowUp, "$id" | "createdAt" | "updatedAt">) {
    const { skipReason: _skipReason, notes: _notes, ...rest } = input;
    const created = await this.databases.createDocument(
      this.config.databaseId,
      this.config.followUpsCollectionId ?? "cs_follow_ups",
      ID.unique(),
      rest,
      createOwnerPermissions(input.ownerId),
    );
    return mapFollowUp(created as unknown as Record<string, unknown>);
  }
}
