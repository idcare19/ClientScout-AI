import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { getDomain } from "tldts";
import { z } from "zod";

export function normalizeWhitespace(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeEmail(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value)?.toLowerCase();
  return normalized && z.string().email().safeParse(normalized).success ? normalized : null;
}

export type NormalizedPhoneResult = {
  original: string | null;
  normalized: string | null;
  e164: string | null;
  country: CountryCode | undefined;
  isValid: boolean;
};

function stripDialable(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export function normalizePhoneDetailed(value: string | null | undefined, defaultCountry?: CountryCode): NormalizedPhoneResult {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return { original: null, normalized: null, e164: null, country: undefined, isValid: false };
  }

  const parsed = parsePhoneNumberFromString(normalized, defaultCountry);
  if (parsed?.isValid()) {
    return {
      original: normalized,
      normalized: parsed.number,
      e164: parsed.number,
      country: parsed.country,
      isValid: true,
    };
  }

  const dialable = stripDialable(normalized);
  return {
    original: normalized,
    normalized: dialable.length > 0 ? dialable : null,
    e164: null,
    country: undefined,
    isValid: false,
  };
}

export function normalizePhone(value: string | null | undefined) {
  return normalizePhoneDetailed(value).e164 ?? normalizePhoneDetailed(value).normalized;
}

export function normalizeWhatsapp(value: string | null | undefined, defaultCountry?: CountryCode) {
  return normalizePhoneDetailed(value, defaultCountry).e164 ?? normalizePhoneDetailed(value, defaultCountry).normalized;
}

export function normalizeWebsiteUrl(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;
  try {
    if (/^(data|file|ftp|javascript|chrome):/i.test(normalized)) return null;
    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    const url = new URL(withProtocol);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    url.protocol = "https:";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function normalizeUrl(value: string | null | undefined) {
  return normalizeWebsiteUrl(value);
}

export function normalizeDateTime(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function extractRootDomain(value: string | null | undefined) {
  const normalized = normalizeWebsiteUrl(value);
  if (!normalized) return null;
  const domain = getDomain(normalized, { detectIp: true, validateHostname: true });
  return domain ?? null;
}

export function getDomainFromUrl(value: string | null | undefined) {
  return extractRootDomain(value);
}

export function normalizeBusinessName(value: string | null | undefined) {
  return normalizeWhitespace(value)?.toLowerCase() ?? null;
}

export function normalizeCity(value: string | null | undefined) {
  return normalizeWhitespace(value)?.toLowerCase() ?? null;
}

export function normalizeCountry(value: string | null | undefined) {
  return normalizeWhitespace(value)?.toLowerCase() ?? null;
}

export function buildWhatsAppUrl(phoneE164: string | null | undefined, message: string) {
  if (!phoneE164) return null;
  const digits = phoneE164.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoUrl(email: string | null | undefined, subject: string, body: string) {
  if (!email) return null;
  if (!normalizeEmail(email)) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function hasSourceEvidence(input: { sourceName?: string | null; sourceUrl?: string | null }) {
  return Boolean(normalizeWhitespace(input.sourceName) || normalizeUrl(input.sourceUrl));
}

export function isLikelyWebsiteUrl(value: string | null | undefined) {
  const normalized = normalizeUrl(value);
  if (!normalized) return false;
  try {
    const host = new URL(normalized).hostname;
    return Boolean(host && host.includes("."));
  } catch {
    return false;
  }
}
