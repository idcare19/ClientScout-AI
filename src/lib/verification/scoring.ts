import type { Lead } from "@/types/lead";
import type { VerificationEvidence, WebsiteAudit } from "@/types/verification";
import { normalizeWhitespace } from "@/lib/validation/normalize";

export type VerificationScoreResult = {
  identityConfidence: number;
  contactConfidence: number;
  websiteConfidence: number;
  overallConfidence: number;
  blockingReasons: string[];
  nextRecommendedAction: string;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateBusinessIdentityScore(lead: Partial<Lead>, audits: WebsiteAudit[] = [], evidence: VerificationEvidence[] = []) {
  let score = 0;
  const indicators: string[] = [];
  const conflicts: string[] = [];

  const name = normalizeWhitespace(lead.businessName);
  const phone = normalizeWhitespace(lead.phone);
  const email = normalizeWhitespace(lead.email);
  const website = normalizeWhitespace(lead.website);

  if (evidence.length > 0) {
    score += 20;
    indicators.push("source evidence available");
  }
  if (evidence.some((item) => item.verificationResult === "supports_identity")) {
    score += 30;
    indicators.push("source supports identity");
  }
  if (evidence.filter((item) => item.verificationResult === "supports_identity").length >= 2) score += 20;
  if (audits.some((audit) => audit.businessNameMatchScore >= 80)) score += 20;
  if (audits.some((audit) => audit.phoneMatchesLead)) score += 20;
  if (audits.some((audit) => audit.emailMatchesLead)) score += 15;
  if (evidence.some((item) => item.verificationResult === "conflicts_identity")) {
    score -= 50;
    conflicts.push("conflicting business identity evidence");
  }
  if (evidence.some((item) => item.verificationResult === "conflicts_contact")) {
    score -= 50;
    conflicts.push("conflicting contact evidence");
  }
  if (name && website) score += 5;
  if (phone && email) score += 5;

  const clamped = clamp(score);
  return {
    score: clamped,
    indicators,
    conflicts,
    status: clamped >= 80 ? "strong_match" : clamped >= 60 ? "likely_match" : clamped >= 40 ? "unclear" : "likely_unrelated",
  } as const;
}

export function verifyLeadContact(evidence: VerificationEvidence[], lead: Partial<Lead>) {
  let score = 0;
  const reasons: string[] = [];
  if (evidence.some((item) => item.verificationResult === "supports_contact")) {
    score += 35;
    reasons.push("supporting contact evidence");
  }
  if (lead.phone && lead.email) score += 10;
  if (evidence.some((item) => item.verificationResult === "conflicts_contact")) {
    score -= 70;
    reasons.push("conflicting contact evidence");
  }
  if (evidence.some((item) => item.verificationResult === "invalid_source")) {
    score -= 60;
    reasons.push("invalid source");
  }
  return { score: clamp(score), reasons };
}

export function calculateVerificationConfidence(lead: Partial<Lead>, audits: WebsiteAudit[] = [], evidence: VerificationEvidence[] = []): VerificationScoreResult {
  const identity = calculateBusinessIdentityScore(lead, audits, evidence);
  const contact = verifyLeadContact(evidence, lead);
  const websiteScore = clamp(
    (audits.length > 0 ? 15 : 0) +
      (audits.some((audit) => audit.reachable) ? 30 : 0) +
      (audits.some((audit) => audit.httpsEnabled) ? 10 : 0) +
      (audits.some((audit) => audit.contactPageFound || audit.enquiryFormFound) ? 20 : 0) -
      (audits.some((audit) => audit.auditStatus === "unsafe_url") ? 80 : 0),
  );
  const overall = clamp(identity.score * 0.45 + contact.score * 0.35 + websiteScore * 0.2);
  const blockingReasons: string[] = [];

  if (evidence.length === 0) blockingReasons.push("missing source evidence");
  if (identity.score < 40) blockingReasons.push("identity conflict or unclear");
  if (contact.score < 20) blockingReasons.push("contact not yet supported");
  if (audits.some((audit) => audit.auditStatus === "unsafe_url")) blockingReasons.push("unsafe website url");
  if (!audits.some((audit) => audit.reachable)) blockingReasons.push("website unavailable");

  return {
    identityConfidence: identity.score,
    contactConfidence: contact.score,
    websiteConfidence: websiteScore,
    overallConfidence: overall,
    blockingReasons,
    nextRecommendedAction: blockingReasons.length ? "review evidence and website audit findings" : "prepare outreach draft",
  };
}
