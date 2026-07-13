import Papa from "papaparse";
import type { Lead, LeadInput } from "@/types/lead";
import { leadFormSchema } from "@/lib/validation/lead";
import { getDomainFromUrl, normalizeEmail, normalizePhone, normalizeUrl, normalizeWhitespace } from "@/lib/validation/normalize";

export const leadCsvHeaders = [
  "businessName",
  "contactPerson",
  "industry",
  "businessType",
  "country",
  "city",
  "timezone",
  "phone",
  "whatsapp",
  "email",
  "website",
  "instagram",
  "linkedin",
  "facebook",
  "otherSocialUrl",
  "sourceName",
  "sourceUrl",
  "sourceNotes",
  "websiteStatus",
  "contactVerification",
  "verificationConfidence",
  "verificationNotes",
  "mainOpportunity",
  "recommendedService",
  "status",
  "priority",
  "notes",
  "lastContactedAt",
  "nextFollowUpAt",
  "demoUrl",
] as const;

export type LeadCsvRow = Record<(typeof leadCsvHeaders)[number], string>;

export function createLeadSampleCsv() {
  return Papa.unparse([
    {
      businessName: "Northwind Studio",
      contactPerson: "Avery Stone",
      industry: "Web Design",
      businessType: "agency",
      country: "India",
      city: "Bengaluru",
      timezone: "Asia/Kolkata",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      email: "hello@northwindstudio.com",
      website: "https://northwindstudio.com",
      sourceName: "Manual research",
      sourceUrl: "https://northwindstudio.com/contact",
      status: "new",
      priority: "review",
    },
  ]);
}

export function exportLeadsToCsv(leads: Lead[]) {
  return Papa.unparse(
    leads.map((lead) => ({
      businessName: lead.businessName,
      contactPerson: lead.contactPerson ?? "",
      industry: lead.industry,
      businessType: lead.businessType,
      country: lead.country,
      city: lead.city ?? "",
      timezone: lead.timezone ?? "",
      phone: lead.phone ?? "",
      whatsapp: lead.whatsapp ?? "",
      email: lead.email ?? "",
      website: lead.website ?? "",
      instagram: lead.instagram ?? "",
      linkedin: lead.linkedin ?? "",
      facebook: lead.facebook ?? "",
      otherSocialUrl: lead.otherSocialUrl ?? "",
      sourceName: lead.sourceName,
      sourceUrl: lead.sourceUrl ?? "",
      sourceNotes: lead.sourceNotes ?? "",
      websiteStatus: lead.websiteStatus,
      contactVerification: lead.contactVerification,
      verificationConfidence: lead.verificationConfidence ?? "",
      verificationNotes: lead.verificationNotes ?? "",
      mainOpportunity: lead.mainOpportunity ?? "",
      recommendedService: lead.recommendedService ?? "",
      status: lead.status,
      priority: lead.priority,
      leadScore: lead.leadScore,
      notes: lead.notes ?? "",
      lastContactedAt: lead.lastContactedAt ?? "",
      nextFollowUpAt: lead.nextFollowUpAt ?? "",
      demoUrl: lead.demoUrl ?? "",
      ownerId: lead.ownerId,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    })),
  );
}

export function parseLeadCsv(text: string) {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return parsed.data;
}

export function normalizeLeadImportRow(row: Record<string, string>): LeadInput {
  const input = {
    businessName: normalizeWhitespace(row.businessName) ?? "",
    contactPerson: normalizeWhitespace(row.contactPerson),
    industry: normalizeWhitespace(row.industry) ?? "",
    businessType: (row.businessType || "other") as LeadInput["businessType"],
    country: normalizeWhitespace(row.country) ?? "",
    city: normalizeWhitespace(row.city),
    timezone: normalizeWhitespace(row.timezone),
    phone: normalizePhone(row.phone),
    whatsapp: normalizePhone(row.whatsapp),
    email: normalizeEmail(row.email),
    website: normalizeUrl(row.website),
    instagram: normalizeUrl(row.instagram),
    linkedin: normalizeUrl(row.linkedin),
    facebook: normalizeUrl(row.facebook),
    otherSocialUrl: normalizeUrl(row.otherSocialUrl),
    sourceName: normalizeWhitespace(row.sourceName) ?? "",
    sourceUrl: normalizeUrl(row.sourceUrl),
    sourceNotes: normalizeWhitespace(row.sourceNotes),
    websiteStatus: (row.websiteStatus || "not_checked") as LeadInput["websiteStatus"],
    contactVerification: (row.contactVerification || "unverified") as LeadInput["contactVerification"],
    verificationConfidence: row.verificationConfidence ? Number(row.verificationConfidence) : null,
    verificationNotes: normalizeWhitespace(row.verificationNotes),
    mainOpportunity: normalizeWhitespace(row.mainOpportunity),
    recommendedService: normalizeWhitespace(row.recommendedService),
    status: (row.status || "new") as LeadInput["status"],
    priority: (row.priority || "review") as LeadInput["priority"],
    notes: normalizeWhitespace(row.notes),
    lastContactedAt: normalizeWhitespace(row.lastContactedAt),
    nextFollowUpAt: normalizeWhitespace(row.nextFollowUpAt),
    demoUrl: normalizeUrl(row.demoUrl),
  };
  return leadFormSchema.parse(input);
}

export function getLeadDuplicateFingerprint(lead: Partial<LeadInput>) {
  return {
    email: normalizeEmail(lead.email),
    phone: normalizePhone(lead.phone) ?? normalizePhone(lead.whatsapp),
    name: normalizeWhitespace(lead.businessName)?.toLowerCase() ?? null,
    city: normalizeWhitespace(lead.city)?.toLowerCase() ?? null,
    domain: getDomainFromUrl(lead.website),
  };
}

export function isLikelyDuplicate(a: Partial<LeadInput>, b: Partial<LeadInput>) {
  const left = getLeadDuplicateFingerprint(a);
  const right = getLeadDuplicateFingerprint(b);
  return Boolean(
    (left.email && left.email === right.email) ||
      (left.phone && left.phone === right.phone) ||
      (left.name && left.city && left.name === right.name && left.city === right.city) ||
      (left.domain && left.domain === right.domain),
  );
}
