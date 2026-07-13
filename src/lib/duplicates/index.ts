import type { Lead } from "@/types/lead";
import { normalizeBusinessName, normalizeCity, normalizeCountry, normalizeEmail, normalizePhone, normalizeWhitespace, extractRootDomain } from "@/lib/validation/normalize";

export type DuplicateStrength = "exact duplicate" | "likely duplicate" | "possible duplicate" | "no duplicate";

export type DuplicateCandidate = {
  lead: Lead;
  confidence: number;
  strength: DuplicateStrength;
  reasons: string[];
};

function tokenSet(value: string | null | undefined) {
  return new Set((normalizeWhitespace(value) ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function tokenOverlapScore(a: string | null | undefined, b: string | null | undefined) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) {
    if (right.has(token)) shared += 1;
  }
  return shared / Math.max(left.size, right.size);
}

export function getDuplicateReasons(candidate: Lead, current: Partial<Lead>) {
  const reasons: string[] = [];
  const currentEmail = normalizeEmail(current.email);
  const candidateEmail = normalizeEmail(candidate.email);
  const currentPhone = normalizePhone(current.phone)?.toString();
  const candidatePhone = normalizePhone(candidate.phone)?.toString();
  const currentWhatsapp = normalizePhone(current.whatsapp)?.toString();
  const candidateWhatsapp = normalizePhone(candidate.whatsapp)?.toString();
  const currentDomain = extractRootDomain(current.website);
  const candidateDomain = extractRootDomain(candidate.website);
  const currentName = normalizeBusinessName(current.businessName);
  const candidateName = normalizeBusinessName(candidate.businessName);
  const currentCity = normalizeCity(current.city);
  const candidateCity = normalizeCity(candidate.city);
  const currentCountry = normalizeCountry(current.country);
  const candidateCountry = normalizeCountry(candidate.country);

  if (currentEmail && candidateEmail && currentEmail === candidateEmail) reasons.push("same normalized email");
  if (currentPhone && candidatePhone && currentPhone === candidatePhone) reasons.push("same normalized phone");
  if (currentWhatsapp && candidateWhatsapp && currentWhatsapp === candidateWhatsapp) reasons.push("same normalized WhatsApp");
  if (currentDomain && candidateDomain && currentDomain === candidateDomain) reasons.push("same website root domain");
  if (currentName && candidateName && currentName === candidateName && currentCity && candidateCity && currentCity === candidateCity) {
    reasons.push("same business name and city");
  }
  if (currentName && candidateName && currentName === candidateName && currentCountry && candidateCountry && currentCountry === candidateCountry) {
    reasons.push("same business name and country");
  }
  if (tokenOverlapScore(current.businessName, candidate.businessName) >= 0.8 && (currentEmail || currentPhone || currentWhatsapp)) {
    reasons.push("similar business name plus matching contact");
  }
  return reasons;
}

export function calculateDuplicateConfidence(candidate: Lead, current: Partial<Lead>) {
  const reasons = getDuplicateReasons(candidate, current);
  let score = 0;
  for (const reason of reasons) {
    if (reason === "same normalized email") score = Math.max(score, 100);
    if (reason === "same normalized phone" || reason === "same normalized WhatsApp") score = Math.max(score, 100);
    if (reason === "same website root domain") score = Math.max(score, 90);
    if (reason === "same business name and city" || reason === "same business name and country") score = Math.max(score, 75);
    if (reason === "similar business name plus matching contact") score = Math.max(score, 65);
  }
  return score;
}

export function getDuplicateStrength(confidence: number): DuplicateStrength {
  if (confidence >= 100) return "exact duplicate";
  if (confidence >= 75) return "likely duplicate";
  if (confidence >= 60) return "possible duplicate";
  return "no duplicate";
}

export function findDuplicateCandidates(current: Partial<Lead>, leads: Lead[]): DuplicateCandidate[] {
  return leads
    .map((lead) => {
      const confidence = calculateDuplicateConfidence(lead, current);
      const strength = getDuplicateStrength(confidence);
      return { lead, confidence, strength, reasons: getDuplicateReasons(lead, current) };
    })
    .filter((candidate) => candidate.strength !== "no duplicate")
    .sort((a, b) => b.confidence - a.confidence);
}
