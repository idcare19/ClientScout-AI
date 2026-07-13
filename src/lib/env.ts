import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_ACTIVITY_COLLECTION_ID: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_VERIFICATION_COLLECTION_ID: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_WEBSITE_AUDITS_COLLECTION_ID: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_OUTREACH_COLLECTION_ID: z.string().min(1).optional().or(z.literal("")),
  NEXT_PUBLIC_APPWRITE_FOLLOWUPS_COLLECTION_ID: z.string().min(1).optional().or(z.literal("")),
});

const serverEnvSchema = publicEnvSchema.extend({
  APPWRITE_API_KEY: z.string().min(1).optional().or(z.literal("")),
  CLIENTSCOUT_WEBSITE_AUDIT_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  CLIENTSCOUT_WEBSITE_AUDIT_MAX_BYTES: z.coerce.number().int().positive().optional(),
  CLIENTSCOUT_WEBSITE_AUDIT_MAX_REDIRECTS: z.coerce.number().int().positive().optional(),
  CLIENTSCOUT_AUDIT_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid public Appwrite environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server Appwrite environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function ensureRequiredEnv() {
  const env = getServerEnv();
  const missing = [
    ["NEXT_PUBLIC_APPWRITE_ENDPOINT", env.NEXT_PUBLIC_APPWRITE_ENDPOINT],
    ["NEXT_PUBLIC_APPWRITE_PROJECT_ID", env.NEXT_PUBLIC_APPWRITE_PROJECT_ID],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return env;
}
