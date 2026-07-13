import type { Lead, LeadPriority, LeadScoreBreakdownItem } from "@/types/lead";
import { hasSourceEvidence, normalizeUrl } from "@/lib/validation/normalize";

function addIf(condition: boolean, points: number, label: string, reason?: string): LeadScoreBreakdownItem | null {
  if (!condition) return null;
  return { label, points, included: true, reason };
}

export function calculateLeadScore(lead: Partial<Lead>): number {
  const breakdown = getLeadScoreBreakdown(lead);
  const score = breakdown.reduce((sum, item) => sum + item.points, 0);
  return lead.status === "rejected" ? 0 : Math.max(0, Math.min(100, score));
}

export function getLeadPriority(score: number): LeadPriority {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  if (score >= 40) return "review";
  if (score >= 20) return "low";
  return "rejected";
}

export function getLeadScoreBreakdown(lead: Partial<Lead>): LeadScoreBreakdownItem[] {
  const items: Array<LeadScoreBreakdownItem | null> = [
    addIf(lead.websiteStatus === "not_found", 35, "Website not found"),
    addIf(lead.websiteStatus === "broken", 30, "Website broken"),
    addIf(lead.websiteStatus === "needs_improvement", 20, "Website needs improvement"),
    addIf(Boolean(lead.whatsapp), 15, "Public WhatsApp available"),
    addIf(Boolean(lead.email), 10, "Public business email available"),
    addIf(Boolean(lead.instagram || lead.linkedin || lead.facebook || lead.otherSocialUrl), 5, "Social profile available"),
    addIf(Boolean(normalizeUrl(lead.sourceUrl)), 10, "Source URL available"),
    addIf(lead.contactVerification === "verified", 15, "Contact verified"),
    addIf((lead.verificationConfidence ?? 0) >= 80, 10, "Verification confidence >= 80"),
    addIf(Boolean(lead.mainOpportunity?.trim()), 10, "Main opportunity provided"),
    addIf(Boolean(lead.recommendedService?.trim()), 5, "Recommended service provided"),
    addIf(lead.contactVerification === "conflicting", -40, "Contact conflicting"),
    addIf(lead.contactVerification === "invalid", -50, "Contact invalid"),
    addIf(lead.websiteStatus === "unrelated", -40, "Website unrelated"),
    addIf(!hasSourceEvidence(lead), -25, "No source evidence"),
    addIf(lead.status === "rejected", -1000, "Lead rejected"),
  ];

  return items.filter((item): item is LeadScoreBreakdownItem => Boolean(item));
}

export function getLeadScoreDetails(lead: Partial<Lead>) {
  const breakdown = getLeadScoreBreakdown(lead);
  const score = calculateLeadScore(lead);
  const priority = getLeadPriority(score);
  return { score, priority, breakdown };
}
