import { z } from "zod";
import {
  businessTypes,
  contactVerificationStatuses,
  leadPriorities,
  leadStatuses,
  websiteStatuses,
} from "@/types/lead";
import { hasSourceEvidence, normalizeEmail, normalizePhone, normalizeUrl, normalizeWhitespace } from "./normalize";

const nullableTrimmedString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizeWhitespace(value ?? null));

const nullableUrlString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizeUrl(value ?? null));

const nullableEmailString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizeEmail(value ?? null));

const nullablePhoneString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => normalizePhone(value ?? null));

export const leadFormSchema = z
  .object({
    businessName: z.string().min(1, "Business name is required"),
    contactPerson: nullableTrimmedString,
    industry: z.string().min(1, "Industry is required"),
    businessType: z.enum(businessTypes).default("other"),
    country: z.string().min(1, "Country is required"),
    city: nullableTrimmedString,
    timezone: nullableTrimmedString,
    phone: nullablePhoneString,
    whatsapp: nullablePhoneString,
    email: nullableEmailString,
    website: nullableUrlString,
    instagram: nullableUrlString,
    linkedin: nullableUrlString,
    facebook: nullableUrlString,
    otherSocialUrl: nullableUrlString,
    sourceName: nullableTrimmedString,
    sourceUrl: nullableUrlString,
    sourceNotes: nullableTrimmedString,
    websiteStatus: z.enum(websiteStatuses).default("not_checked"),
    contactVerification: z.enum(contactVerificationStatuses).default("unverified"),
    verificationConfidence: z
      .union([z.string(), z.number(), z.null(), z.undefined()])
      .transform((value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === "string" && value.trim() === "") return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100 ? numeric : null;
      }),
    verificationNotes: nullableTrimmedString,
    mainOpportunity: nullableTrimmedString,
    recommendedService: nullableTrimmedString,
    status: z.enum(leadStatuses).default("new"),
    priority: z.enum(leadPriorities).default("review"),
    notes: nullableTrimmedString,
    lastContactedAt: z.union([z.string(), z.null(), z.undefined()]).transform((value) => normalizeWhitespace(value ?? null)),
    nextFollowUpAt: z.union([z.string(), z.null(), z.undefined()]).transform((value) => normalizeWhitespace(value ?? null)),
    demoUrl: nullableUrlString,
  })
  .superRefine((value, ctx) => {
    if (!hasSourceEvidence(value) && value.contactVerification === "verified") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Verified leads require supporting source information",
        path: ["contactVerification"],
      });
    }

    if (!hasSourceEvidence(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a source name or source URL",
        path: ["sourceName"],
      });
    }
  });

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormValues = z.output<typeof leadFormSchema>;

export const leadFilterSchema = z.object({
  query: z.string().optional(),
  status: z.enum([...leadStatuses, "all"] as const).optional(),
  priority: z.enum([...leadPriorities, "all"] as const).optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  websiteStatus: z.enum([...websiteStatuses, "all"] as const).optional(),
  contactVerification: z.enum([...contactVerificationStatuses, "all"] as const).optional(),
  sort: z.enum(["newest", "oldest", "score", "alpha"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const authSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const settingsSchema = z.object({
  developerName: z.string().min(1),
  portfolioUrl: z.string().url(),
  email: z.string().email(),
  defaultCountryFilter: z.string().nullable().optional(),
  defaultIndustries: z.array(z.string().min(1)),
  dailyLeadTarget: z.coerce.number().int().min(0).nullable().optional(),
  minimumLeadScore: z.coerce.number().int().min(0).max(100).nullable().optional(),
  followUpAfterDays: z.coerce.number().int().min(0).nullable().optional(),
  skills: z.array(z.string().min(1)),
  preferredServices: z.array(z.string().min(1)),
});

export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormValues = z.output<typeof settingsSchema>;
