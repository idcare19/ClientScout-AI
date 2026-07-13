import * as dns from "node:dns/promises";
import net from "node:net";
import { performance } from "node:perf_hooks";
import * as cheerio from "cheerio";
import { extractRootDomain, normalizeBusinessName, normalizeEmail, normalizePhoneDetailed, normalizeWebsiteUrl } from "@/lib/validation/normalize";

export type WebsiteAuditResult = {
  requestedUrl: string;
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
  checkedAt: string;
};

type AuditInput = {
  requestedUrl: string;
  businessName?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

type AuditOptions = {
  timeoutMs?: number;
  maxRedirects?: number;
  maxBytes?: number;
};

function isPrivateIp(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".local")) return true;
  if (hostname === "0.0.0.0" || hostname === "::1") return true;
  if (net.isIP(hostname) === 4) {
    const parts = hostname.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function isMetadataHost(hostname: string) {
  return hostname === "169.254.169.254" || hostname === "metadata.google.internal" || hostname === "metadata";
}

async function assertSafeUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) {
    return { safe: false, reason: "unsupported scheme" };
  }
  if (url.username || url.password) {
    return { safe: false, reason: "credentials in URL" };
  }
  const hostname = url.hostname.toLowerCase();
  if (isPrivateIp(hostname) || isMetadataHost(hostname)) {
    return { safe: false, reason: "private or metadata host blocked" };
  }
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    if (lookup.some((entry) => isPrivateIp(entry.address) || isMetadataHost(entry.address))) {
      return { safe: false, reason: "private or metadata IP blocked" };
    }
  } catch {
    return { safe: false, reason: "dns resolution failed" };
  }
  return { safe: true as const, reason: null };
}

async function readBodyLimited(response: Response, maxBytes: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      throw new Error("response too large");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function scoreBusinessNameMatch(pageTitle: string | null, metaDescription: string | null, businessName: string | null) {
  if (!businessName) return 0;
  const normalizedBusiness = normalizeBusinessName(businessName) ?? "";
  const title = normalizeBusinessName(pageTitle) ?? "";
  const meta = normalizeBusinessName(metaDescription) ?? "";
  const titleHit = title.includes(normalizedBusiness) ? 45 : 0;
  const metaHit = meta.includes(normalizedBusiness) ? 20 : 0;
  return Math.min(100, titleHit + metaHit);
}

export async function runWebsiteAudit(input: AuditInput, options: AuditOptions = {}): Promise<WebsiteAuditResult> {
  const normalizedUrl = normalizeWebsiteUrl(input.requestedUrl);
  const now = new Date().toISOString();
  if (!normalizedUrl) {
    return {
      requestedUrl: input.requestedUrl,
      normalizedUrl: null,
      finalUrl: null,
      domain: null,
      httpStatus: null,
      reachable: false,
      redirected: false,
      redirectCount: 0,
      httpsEnabled: false,
      responseTimeMs: null,
      contentType: null,
      pageTitle: null,
      metaDescription: null,
      mobileViewport: false,
      language: null,
      businessNameMatch: null,
      businessNameMatchScore: 0,
      phoneMatchesLead: false,
      emailMatchesLead: false,
      whatsappLinkFound: false,
      contactPageFound: false,
      enquiryFormFound: false,
      bookingSignalsFound: false,
      socialLinksFound: false,
      robotsNoIndex: false,
      securityHeadersJson: {},
      detectedIssuesJson: ["unsafe_url"],
      evidenceJson: {},
      auditStatus: "unsafe_url" as const,
      confidence: 0,
      errorCode: "unsafe_url",
      errorMessageSafe: "The URL could not be safely checked.",
      checkedAt: now,
    };
  }

  let current = new URL(normalizedUrl);
  const maxRedirects = options.maxRedirects ?? 5;
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxBytes = options.maxBytes ?? 1_500_000;
  const issues: string[] = [];
  let redirectCount = 0;
  const start = performance.now();

  for (;;) {
    const safe = await assertSafeUrl(current);
    if (!safe.safe) {
      return {
        requestedUrl: input.requestedUrl,
        normalizedUrl,
        finalUrl: null,
        domain: extractRootDomain(current.toString()),
        httpStatus: null,
        reachable: false,
        redirected: redirectCount > 0,
        redirectCount,
        httpsEnabled: current.protocol === "https:",
        responseTimeMs: null,
        contentType: null,
        pageTitle: null,
        metaDescription: null,
        mobileViewport: false,
        language: null,
        businessNameMatch: null,
        businessNameMatchScore: 0,
        phoneMatchesLead: false,
        emailMatchesLead: false,
        whatsappLinkFound: false,
        contactPageFound: false,
        enquiryFormFound: false,
        bookingSignalsFound: false,
        socialLinksFound: false,
        robotsNoIndex: false,
        securityHeadersJson: {},
        detectedIssuesJson: ["unsafe_url"],
        evidenceJson: { blockedReason: safe.reason },
        auditStatus: "unsafe_url" as const,
        confidence: 0,
        errorCode: "unsafe_url",
        errorMessageSafe: "The URL could not be safely checked.",
        checkedAt: now,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "ClientScoutAI/Phase2 (+https://clientscout.local)",
          accept: "text/html,application/xhtml+xml",
        },
      });
      const elapsed = Math.round(performance.now() - start);
      const headers = Object.fromEntries(response.headers.entries());
      const contentType = response.headers.get("content-type");

      if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
        if (redirectCount >= maxRedirects) {
          issues.push("excessive_redirects");
          return {
            requestedUrl: input.requestedUrl,
            normalizedUrl,
            finalUrl: current.toString(),
            domain: extractRootDomain(current.toString()),
            httpStatus: response.status,
            reachable: false,
            redirected: true,
            redirectCount,
            httpsEnabled: current.protocol === "https:",
            responseTimeMs: elapsed,
            contentType,
            pageTitle: null,
            metaDescription: null,
            mobileViewport: false,
            language: null,
            businessNameMatch: null,
            businessNameMatchScore: 0,
            phoneMatchesLead: false,
            emailMatchesLead: false,
            whatsappLinkFound: false,
            contactPageFound: false,
            enquiryFormFound: false,
            bookingSignalsFound: false,
            socialLinksFound: false,
            robotsNoIndex: false,
            securityHeadersJson: headers,
            detectedIssuesJson: issues,
            evidenceJson: {},
            auditStatus: "partial" as const,
            confidence: 10,
            errorCode: "excessive_redirects",
            errorMessageSafe: "Too many redirects while checking the website.",
            checkedAt: now,
          };
        }
        const next = new URL(response.headers.get("location")!, current);
        current = next;
        redirectCount += 1;
        clearTimeout(timeout);
        continue;
      }

      if (!response.ok && response.status >= 500) issues.push("server_error");
      const body = contentType?.includes("text/html") ? await readBodyLimited(response, maxBytes) : "";
      const $ = body ? cheerio.load(body) : null;
      const pageTitle = $ ? $("title").first().text().trim() || null : null;
      const metaDescription = $ ? $('meta[name="description"]').attr("content")?.trim() || null : null;
      const mobileViewport = Boolean($ ? $('meta[name="viewport"]').attr("content") : null);
      const language = $ ? $("html").attr("lang")?.trim() || null : null;
      const links = $ ? $("a").map((_, el) => ($(el).attr("href") ?? "")).get() : [];
      const forms = $ ? $("form").length > 0 : false;
      const whatsappLinkFound = links.some((href) => href.toLowerCase().includes("wa.me") || href.toLowerCase().includes("whatsapp.com"));
      const contactPageFound = links.some((href) => /contact|about|support/i.test(href));
      const enquiryFormFound = forms || links.some((href) => /book|quote|enquir|contact/i.test(href));
      const bookingSignalsFound = links.some((href) => /book|reservation|reserve/i.test(href)) || /book|reserve|appointment/i.test(body);
      const socialLinksFound = links.some((href) => /facebook\.com|instagram\.com|linkedin\.com|x\.com|twitter\.com/i.test(href));
      const robotsNoIndex = Boolean($ && $('meta[name="robots"]').attr("content")?.toLowerCase().includes("noindex"));

      const leadPhone = input.phone ? normalizePhoneDetailed(input.phone).e164 : null;
      const leadWhatsapp = input.whatsapp ? normalizePhoneDetailed(input.whatsapp).e164 : null;
      const leadEmail = normalizeEmail(input.email);
      const phoneMatchesLead = Boolean(
        (leadPhone && body.includes(leadPhone)) || (leadWhatsapp && body.includes(leadWhatsapp)),
      );
      const emailMatchesLead = Boolean(leadEmail && body.toLowerCase().includes(leadEmail));
      const businessNameMatchScore = scoreBusinessNameMatch(pageTitle, metaDescription, input.businessName ?? null);
      const businessNameMatch = businessNameMatchScore >= 40 ? "possible" : null;

      if (!response.ok) issues.push("server_error");
      if (!mobileViewport) issues.push("missing_mobile_viewport");
      if (!pageTitle) issues.push("missing_title");
      if (!metaDescription) issues.push("missing_meta_description");
      if (!contactPageFound) issues.push("missing_contact_path");

      return {
        requestedUrl: input.requestedUrl,
        normalizedUrl,
        finalUrl: current.toString(),
        domain: extractRootDomain(current.toString()),
        httpStatus: response.status,
        reachable: response.ok,
        redirected: redirectCount > 0,
        redirectCount,
        httpsEnabled: current.protocol === "https:",
        responseTimeMs: elapsed,
        contentType,
        pageTitle,
        metaDescription,
        mobileViewport,
        language,
        businessNameMatch,
        businessNameMatchScore,
        phoneMatchesLead,
        emailMatchesLead,
        whatsappLinkFound,
        contactPageFound,
        enquiryFormFound,
        bookingSignalsFound,
        socialLinksFound,
        robotsNoIndex,
        securityHeadersJson: headers,
        detectedIssuesJson: issues,
        evidenceJson: {
          title: pageTitle,
          metaDescription,
          sampleLinks: links.slice(0, 20),
        },
        auditStatus: response.ok ? "completed" : "partial",
        confidence: Math.min(100, 20 + businessNameMatchScore + (phoneMatchesLead ? 20 : 0) + (emailMatchesLead ? 15 : 0)),
        errorCode: response.ok ? null : "server_error",
        errorMessageSafe: response.ok ? null : "The website responded with an error.",
        checkedAt: now,
      };
    } catch (error) {
      clearTimeout(timeout);
      const message = error instanceof Error && error.name === "AbortError" ? "timeout" : "network_error";
      return {
        requestedUrl: input.requestedUrl,
        normalizedUrl,
        finalUrl: current.toString(),
        domain: extractRootDomain(current.toString()),
        httpStatus: null,
        reachable: false,
        redirected: redirectCount > 0,
        redirectCount,
        httpsEnabled: current.protocol === "https:",
        responseTimeMs: null,
        contentType: null,
        pageTitle: null,
        metaDescription: null,
        mobileViewport: false,
        language: null,
        businessNameMatch: null,
        businessNameMatchScore: 0,
        phoneMatchesLead: false,
        emailMatchesLead: false,
        whatsappLinkFound: false,
        contactPageFound: false,
        enquiryFormFound: false,
        bookingSignalsFound: false,
        socialLinksFound: false,
        robotsNoIndex: false,
        securityHeadersJson: {},
        detectedIssuesJson: [message],
        evidenceJson: {},
        auditStatus: "failed" as const,
        confidence: 0,
        errorCode: message,
        errorMessageSafe: message === "timeout" ? "The website check timed out." : "The website could not be checked.",
        checkedAt: now,
      };
    }
  }
}
