export const evidenceTypes = [
  "business_directory",
  "official_social_profile",
  "website",
  "public_listing",
  "company_page",
  "user_provided",
  "email_signature",
  "other",
] as const;

export const verificationResults = [
  "supports_identity",
  "supports_contact",
  "conflicts_identity",
  "conflicts_contact",
  "inconclusive",
  "invalid_source",
] as const;

export const verificationStatuses = [
  "unverified",
  "partially_verified",
  "verified",
  "conflicting",
  "rejected",
] as const;

export const contactVerificationStatusesPhase2 = [
  "unverified",
  "partially_verified",
  "verified",
  "conflicting",
  "invalid",
  "needs_review",
] as const;

export const websiteVerificationStatuses = [
  "not_checked",
  "not_found_in_sources",
  "reachable",
  "unreachable",
  "unrelated",
  "redirected",
  "blocked",
  "unsafe",
  "needs_review",
] as const;

export const websiteOpportunityTypes = [
  "no_public_website_found",
  "broken_or_unreachable",
  "mobile_experience",
  "contact_flow",
  "whatsapp_integration",
  "enquiry_form",
  "booking_flow",
  "performance",
  "redesign",
  "maintenance",
  "no_clear_opportunity",
  "needs_manual_review",
] as const;

export const outreachChannels = ["whatsapp", "email", "linkedin"] as const;
export const outreachApprovalStatuses = ["draft", "needs_review", "approved", "used", "archived"] as const;
export const outreachGenerationMethods = ["static_template", "manually_edited", "duplicated"] as const;
export const followUpTypes = ["first_follow_up", "final_follow_up", "custom"] as const;
export const followUpStatuses = ["scheduled", "due", "completed", "skipped", "cancelled"] as const;

export type EvidenceType = (typeof evidenceTypes)[number];
export type VerificationResult = (typeof verificationResults)[number];
export type VerificationStatus = (typeof verificationStatuses)[number];
export type ContactVerificationStatusPhase2 = (typeof contactVerificationStatusesPhase2)[number];
export type WebsiteVerificationStatus = (typeof websiteVerificationStatuses)[number];
export type WebsiteOpportunityType = (typeof websiteOpportunityTypes)[number];
export type OutreachChannel = (typeof outreachChannels)[number];
export type OutreachApprovalStatus = (typeof outreachApprovalStatuses)[number];
export type OutreachGenerationMethod = (typeof outreachGenerationMethods)[number];
export type FollowUpType = (typeof followUpTypes)[number];
export type FollowUpStatus = (typeof followUpStatuses)[number];

export type VerificationEvidence = {
  $id: string;
  leadId: string;
  ownerId: string;
  evidenceType: EvidenceType;
  sourceUrl: string | null;
  sourceName: string | null;
  title: string | null;
  description: string | null;
  extractedBusinessName: string | null;
  extractedPhone: string | null;
  extractedEmail: string | null;
  extractedWebsite: string | null;
  extractedLocation: string | null;
  verificationResult: VerificationResult;
  confidence: number;
  notes: string | null;
  checkedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebsiteAudit = {
  $id: string;
  leadId: string;
  ownerId: string;
  requestedUrl: string | null;
  normalizedUrl: string | null;
  finalUrl: string | null;
  domain: string | null;
  httpStatus: number | null;
  reachable: boolean;
  redirected: boolean;
  redirectCount: number;
  httpsEnabled: boolean;
  responseTimeMs: number | null;
  contentType: string | null;
  pageTitle: string | null;
  metaDescription: string | null;
  mobileViewport: boolean;
  language: string | null;
  businessNameMatch: string | null;
  businessNameMatchScore: number;
  phoneMatchesLead: boolean;
  emailMatchesLead: boolean;
  whatsappLinkFound: boolean;
  contactPageFound: boolean;
  enquiryFormFound: boolean;
  bookingSignalsFound: boolean;
  socialLinksFound: boolean;
  robotsNoIndex: boolean;
  securityHeadersJson: Record<string, unknown>;
  detectedIssuesJson: string[];
  evidenceJson: Record<string, unknown>;
  auditStatus: "pending" | "running" | "completed" | "partial" | "failed" | "blocked" | "unsafe_url";
  confidence: number;
  errorCode: string | null;
  errorMessageSafe: string | null;
  checkedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OutreachDraft = {
  $id: string;
  leadId: string;
  ownerId: string;
  channel: OutreachChannel;
  subject: string | null;
  message: string;
  followUpMessage: string | null;
  finalFollowUpMessage: string | null;
  opportunityType: WebsiteOpportunityType;
  templateKey: string;
  generationMethod: OutreachGenerationMethod;
  approvalStatus: OutreachApprovalStatus;
  approvedAt: string | null;
  contactedAt: string | null;
  lastCopiedAt: string | null;
  version: number;
  sourceSnapshotJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type FollowUp = {
  $id: string;
  leadId: string;
  ownerId: string;
  outreachDraftId: string | null;
  channel: OutreachChannel;
  followUpType: FollowUpType;
  scheduledAt: string;
  status: FollowUpStatus;
  message: string | null;
  completedAt: string | null;
  skippedAt: string | null;
  skipReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
