import { Databases, ID, Query } from "node-appwrite";
import { getAppwriteConfig } from "../config";
import { createLeadPermissions } from "../permissions";
import { LeadAssetsRepository, type LeadAssetPayload } from "./assets";
import type { Lead, LeadFilters, LeadInput } from "@/types/lead";
import { calculateLeadScore, getLeadPriority } from "@/lib/scoring/lead-score";
import {
  getDomainFromUrl,
  normalizeDateTime,
  normalizeEmail,
  normalizePhone,
  normalizeUrl,
  normalizeWhitespace,
} from "@/lib/validation/normalize";
import { leadFilterSchema } from "@/lib/validation/lead";

type LeadDocument = Record<string, unknown>;

function mapAssetToLeadExtras(asset: LeadAssetPayload | null): Partial<Lead> {
  if (!asset) return {};
  return {
    sourceName: asset.sourceName ?? undefined,
    city: asset.city,
    timezone: asset.timezone,
    instagram: asset.instagram,
    linkedin: asset.linkedin,
    facebook: asset.facebook,
    otherSocialUrl: asset.otherSocialUrl,
    sourceUrl: asset.sourceUrl,
    verificationConfidence: asset.verificationConfidence,
    verificationNotes: asset.verificationNotes,
    mainOpportunity: asset.mainOpportunity,
    recommendedService: asset.recommendedService,
    notes: asset.notes,
    lastContactedAt: asset.lastContactedAt,
    nextFollowUpAt: asset.nextFollowUpAt,
    demoUrl: asset.demoUrl,
  };
}

function mapLeadDocument(doc: LeadDocument, asset?: LeadAssetPayload | null): Lead {
  const extras = mapAssetToLeadExtras(asset ?? null);
  return {
    $id: String(doc.$id),
    businessName: String(doc.businessName ?? ""),
    contactPerson: (doc.contactPerson as string | null) ?? null,
    industry: String(doc.industry ?? ""),
    businessType: (doc.businessType as Lead["businessType"]) ?? "other",
    country: String(doc.country ?? ""),
    city: extras.city ?? null,
    timezone: extras.timezone ?? null,
    phone: (doc.phone as string | null) ?? null,
    whatsapp: (doc.whatsapp as string | null) ?? null,
    email: (doc.email as string | null) ?? null,
    website: (doc.website as string | null) ?? null,
    instagram: extras.instagram ?? null,
    linkedin: extras.linkedin ?? null,
    facebook: extras.facebook ?? null,
    otherSocialUrl: extras.otherSocialUrl ?? null,
    sourceName: extras.sourceName ?? String(doc.sourceName ?? ""),
    sourceUrl: extras.sourceUrl ?? null,
    sourceNotes: (doc.sourceNotes as string | null) ?? null,
    websiteStatus: (doc.websiteStatus as Lead["websiteStatus"]) ?? "not_checked",
    contactVerification: (doc.contactVerification as Lead["contactVerification"]) ?? "unverified",
    verificationConfidence: (extras.verificationConfidence as number | null) ?? null,
    verificationNotes: (extras.verificationNotes as string | null) ?? null,
    mainOpportunity: (extras.mainOpportunity as string | null) ?? null,
    recommendedService: (extras.recommendedService as string | null) ?? null,
    status: (doc.instagram as Lead["status"]) ?? "new",
    priority: (doc.linkedin as Lead["priority"]) ?? "review",
    leadScore: Number(doc.verificationConfidence ?? 0),
    notes: (extras.notes as string | null) ?? null,
    lastContactedAt: (extras.lastContactedAt as string | null) ?? null,
    nextFollowUpAt: (extras.nextFollowUpAt as string | null) ?? null,
    demoUrl: (extras.demoUrl as string | null) ?? null,
    ownerId: String(doc.sourceName ?? ""),
    createdAt: String(doc.$createdAt ?? new Date().toISOString()),
    updatedAt: String(doc.$updatedAt ?? new Date().toISOString()),
  };
}

function normalizeSupplemental(input: LeadInput): LeadAssetPayload {
  return {
    sourceName: normalizeWhitespace(input.sourceName),
    city: normalizeWhitespace(input.city),
    timezone: normalizeWhitespace(input.timezone),
    instagram: normalizeUrl(input.instagram),
    linkedin: normalizeUrl(input.linkedin),
    facebook: normalizeUrl(input.facebook),
    otherSocialUrl: normalizeUrl(input.otherSocialUrl),
    sourceUrl: normalizeUrl(input.sourceUrl),
    verificationConfidence:
      input.verificationConfidence === null || input.verificationConfidence === undefined
        ? null
        : Number(input.verificationConfidence),
    verificationNotes: normalizeWhitespace(input.verificationNotes),
    mainOpportunity: normalizeWhitespace(input.mainOpportunity),
    recommendedService: normalizeWhitespace(input.recommendedService),
    notes: normalizeWhitespace(input.notes),
    lastContactedAt: normalizeDateTime(input.lastContactedAt),
    nextFollowUpAt: normalizeDateTime(input.nextFollowUpAt),
    demoUrl: normalizeUrl(input.demoUrl),
  };
}

function normalizeCore(input: LeadInput, ownerId: string, leadScore: number, status: Lead["status"], priority: Lead["priority"]) {
  return {
    businessName: normalizeWhitespace(input.businessName) ?? input.businessName,
    contactPerson: normalizeWhitespace(input.contactPerson),
    industry: normalizeWhitespace(input.industry) ?? input.industry,
    businessType: input.businessType,
    country: normalizeWhitespace(input.country) ?? input.country,
    city: status,
    timezone: priority,
    phone: normalizePhone(input.phone),
    whatsapp: normalizePhone(input.whatsapp),
    email: normalizeEmail(input.email),
    website: normalizeUrl(input.website),
    instagram: status,
    linkedin: priority,
    sourceName: ownerId,
    sourceNotes: normalizeWhitespace(input.sourceNotes),
    websiteStatus: input.websiteStatus,
    contactVerification: input.contactVerification,
    verificationConfidence: leadScore,
  };
}

export class LeadsRepository {
  constructor(private readonly databases: Databases) {}

  private get config() {
    return getAppwriteConfig();
  }

  private get assets() {
    return new LeadAssetsRepository(this.databases);
  }

  async list(filters: LeadFilters = {}, ownerId?: string) {
    const parsed = leadFilterSchema.parse(filters);
    const queries: string[] = [];
    if (ownerId) queries.push(Query.equal("sourceName", ownerId));
    if (parsed.status && parsed.status !== "all") queries.push(Query.equal("city", parsed.status));
    if (parsed.priority && parsed.priority !== "all") queries.push(Query.equal("timezone", parsed.priority));
    if (parsed.country && parsed.country !== "all") queries.push(Query.equal("country", parsed.country));
    if (parsed.industry && parsed.industry !== "all") queries.push(Query.equal("industry", parsed.industry));
    if (parsed.websiteStatus && parsed.websiteStatus !== "all") queries.push(Query.equal("websiteStatus", parsed.websiteStatus));
    if (parsed.contactVerification && parsed.contactVerification !== "all") {
      queries.push(Query.equal("contactVerification", parsed.contactVerification));
    }
    if (parsed.query) {
      const q = parsed.query.trim();
      if (q) {
        queries.push(
          Query.or([
            Query.search("businessName", q),
            Query.search("contactPerson", q),
            Query.search("email", q),
            Query.search("phone", q),
          ]),
        );
      }
    }

    const sort = parsed.sort ?? "newest";
    if (sort === "newest") queries.push(Query.orderDesc("$createdAt"));
    if (sort === "oldest") queries.push(Query.orderAsc("$createdAt"));
    if (sort === "score") queries.push(Query.orderDesc("verificationConfidence"));
    if (sort === "alpha") queries.push(Query.orderAsc("businessName"));

    const limit = 20;
    const offset = ((parsed.page ?? 1) - 1) * limit;
    queries.push(Query.limit(limit), Query.offset(offset));

    const result = await this.databases.listDocuments(this.config.databaseId, this.config.leadsCollectionId, queries);
    return {
      total: result.total,
      documents: result.documents.map((doc) => mapLeadDocument(doc as unknown as LeadDocument)),
      page: parsed.page ?? 1,
      limit,
    };
  }

  async getById(leadId: string, ownerId?: string) {
    const doc = await this.databases.getDocument(this.config.databaseId, this.config.leadsCollectionId, leadId);
    const leadDoc = doc as unknown as LeadDocument;
    const leadOwner = String(leadDoc.sourceName ?? "");
    if (ownerId && leadOwner !== ownerId) {
      throw new Error("Permission denied");
    }
    const asset = await this.assets.getByLeadId(leadId, ownerId);
    return mapLeadDocument(leadDoc, asset ?? null);
  }

  async create(input: LeadInput, ownerId: string) {
    const normalizedSupplemental = normalizeSupplemental(input);
    const leadScore = calculateLeadScore({ ...input, ownerId, leadScore: 0 } as Lead);
    const priority = getLeadPriority(leadScore);
    const normalizedCore = normalizeCore(input, ownerId, leadScore, input.status, priority);

    const created = await this.databases.createDocument(
      this.config.databaseId,
      this.config.leadsCollectionId,
      ID.unique(),
      normalizedCore,
      createLeadPermissions(ownerId),
    );

    await this.assets.upsert(created.$id, ownerId, normalizedSupplemental);
    const asset = await this.assets.getByLeadId(created.$id, ownerId);
    return mapLeadDocument(created as unknown as LeadDocument, asset ?? null);
  }

  async update(leadId: string, input: Partial<LeadInput>, ownerId: string) {
    const existing = await this.getById(leadId, ownerId);
    const mergedInput = { ...existing, ...input, ownerId } as LeadInput;
    const normalizedSupplemental = normalizeSupplemental(mergedInput);
    const leadScore = calculateLeadScore({ ...mergedInput, sourceName: mergedInput.sourceName ?? "" });
    const priority = getLeadPriority(leadScore);
    const normalizedCore = normalizeCore(mergedInput, ownerId, leadScore, mergedInput.status, priority);

    const updated = await this.databases.updateDocument(this.config.databaseId, this.config.leadsCollectionId, leadId, normalizedCore);
    await this.assets.upsert(leadId, ownerId, normalizedSupplemental);
    const asset = await this.assets.getByLeadId(leadId, ownerId);
    return mapLeadDocument(updated as unknown as LeadDocument, asset ?? null);
  }

  async remove(leadId: string, ownerId: string) {
    await this.getById(leadId, ownerId);
    await this.databases.deleteDocument(this.config.databaseId, this.config.leadsCollectionId, leadId);
  }

  async updateStatus(leadId: string, status: Lead["status"], ownerId: string) {
    const existing = await this.getById(leadId, ownerId);
    const leadScore = calculateLeadScore({ ...existing, status });
    const priority = getLeadPriority(leadScore);
    const updated = await this.databases.updateDocument(this.config.databaseId, this.config.leadsCollectionId, leadId, {
      instagram: status,
      linkedin: priority,
      sourceName: ownerId,
      city: status,
      timezone: priority,
      sourceNotes: existing.sourceNotes,
      websiteStatus: existing.websiteStatus,
      contactVerification: existing.contactVerification,
      verificationConfidence: leadScore,
    });
    const asset = await this.assets.getByLeadId(leadId, ownerId);
    return mapLeadDocument(updated as unknown as LeadDocument, asset ?? null);
  }

  async markContacted(leadId: string, ownerId: string) {
    const existing = await this.getById(leadId, ownerId);
    return this.update(leadId, { lastContactedAt: new Date().toISOString(), status: "contacted" }, ownerId);
  }

  async listAll(ownerId: string) {
    const result = await this.databases.listDocuments(this.config.databaseId, this.config.leadsCollectionId, [
      Query.equal("sourceName", ownerId),
      Query.orderDesc("$createdAt"),
      Query.limit(1000),
    ]);
    return {
      total: result.total,
      documents: result.documents.map((doc) => mapLeadDocument(doc as unknown as LeadDocument)),
      page: 1,
      limit: 1000,
    };
  }

  async findPotentialDuplicates(input: Partial<LeadInput>, ownerId: string) {
    const normalizedEmail = normalizeEmail(input.email);
    const normalizedPhone = normalizePhone(input.phone) ?? normalizePhone(input.whatsapp);
    const normalizedName = normalizeWhitespace(input.businessName)?.toLowerCase();
    const normalizedCity = normalizeWhitespace(input.city)?.toLowerCase();
    const normalizedDomain = getDomainFromUrl(input.website);

    const result = await this.databases.listDocuments(this.config.databaseId, this.config.leadsCollectionId, [
      Query.equal("sourceName", ownerId),
      Query.limit(1000),
    ]);
    const documents = result.documents.map((doc) => mapLeadDocument(doc as unknown as LeadDocument));

    return documents.filter((lead) => {
      const leadEmail = normalizeEmail(lead.email);
      const leadPhone = normalizePhone(lead.phone) ?? normalizePhone(lead.whatsapp);
      const leadDomain = getDomainFromUrl(lead.website);
      const leadName = normalizeWhitespace(lead.businessName)?.toLowerCase();
      const leadCity = normalizeWhitespace(lead.city)?.toLowerCase();

      return Boolean(
        (normalizedEmail && leadEmail && normalizedEmail === leadEmail) ||
          (normalizedPhone && leadPhone && normalizedPhone === leadPhone) ||
          (normalizedName && normalizedCity && leadName === normalizedName && leadCity === normalizedCity) ||
          (normalizedDomain && leadDomain && normalizedDomain === leadDomain),
      );
    });
  }
}
