export const leadStatuses = [
  "new",
  "researching",
  "verified",
  "message_ready",
  "contacted",
  "replied",
  "interested",
  "demo_requested",
  "demo_sent",
  "proposal_sent",
  "won",
  "not_interested",
  "no_response",
  "rejected",
] as const;

export const websiteStatuses = [
  "not_checked",
  "not_found",
  "active",
  "broken",
  "redirecting",
  "under_construction",
  "unrelated",
  "good",
  "needs_improvement",
] as const;

export const contactVerificationStatuses = [
  "unverified",
  "verified",
  "conflicting",
  "invalid",
  "needs_review",
] as const;

export const leadPriorities = ["hot", "warm", "review", "low", "rejected"] as const;

export const businessTypes = [
  "local_business",
  "agency",
  "startup",
  "freelancer",
  "ecommerce",
  "professional_service",
  "other",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];
export type WebsiteStatus = (typeof websiteStatuses)[number];
export type ContactVerificationStatus = (typeof contactVerificationStatuses)[number];
export type LeadPriority = (typeof leadPriorities)[number];
export type BusinessType = (typeof businessTypes)[number];

export type Lead = {
  $id: string;
  businessName: string;
  contactPerson: string | null;
  industry: string;
  businessType: BusinessType;
  country: string;
  city: string | null;
  timezone: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  otherSocialUrl: string | null;
  sourceName: string;
  sourceUrl: string | null;
  sourceNotes: string | null;
  websiteStatus: WebsiteStatus;
  contactVerification: ContactVerificationStatus;
  verificationConfidence: number | null;
  verificationNotes: string | null;
  mainOpportunity: string | null;
  recommendedService: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  leadScore: number;
  notes: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  demoUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  normalizedPhone?: string | null;
  normalizedWhatsapp?: string | null;
  normalizedEmail?: string | null;
  normalizedWebsite?: string | null;
  websiteDomain?: string | null;
  possibleDuplicate?: boolean;
  duplicateReason?: string | null;
  identityVerificationStatus?: "unverified" | "partially_verified" | "verified" | "conflicting" | "rejected";
  identityConfidence?: number | null;
  contactVerificationStatus?: "unverified" | "partially_verified" | "verified" | "conflicting" | "invalid" | "needs_review";
  contactConfidence?: number | null;
  websiteVerificationStatus?: "not_checked" | "not_found_in_sources" | "reachable" | "unreachable" | "unrelated" | "redirected" | "blocked" | "unsafe" | "needs_review";
  websiteOpportunityType?: "no_public_website_found" | "broken_or_unreachable" | "mobile_experience" | "contact_flow" | "whatsapp_integration" | "enquiry_form" | "booking_flow" | "performance" | "redesign" | "maintenance" | "no_clear_opportunity" | "needs_manual_review";
  verificationSummary?: string | null;
  lastVerifiedAt?: string | null;
  outreachReady?: boolean;
  outreachBlockedReason?: string | null;
  firstContactedAt?: string | null;
};

export type LeadInput = Omit<Lead, "$id" | "leadScore" | "createdAt" | "updatedAt" | "ownerId" | "sourceName"> & {
  ownerId?: string;
  sourceName?: string | null;
};

export type LeadScoreBreakdownItem = {
  label: string;
  points: number;
  included: boolean;
  reason?: string;
};

export type LeadFilters = {
  query?: string;
  status?: LeadStatus | "all";
  priority?: LeadPriority | "all";
  country?: string | "all";
  industry?: string | "all";
  websiteStatus?: WebsiteStatus | "all";
  contactVerification?: ContactVerificationStatus | "all";
  sort?: "newest" | "oldest" | "score" | "alpha";
  page?: number;
};
