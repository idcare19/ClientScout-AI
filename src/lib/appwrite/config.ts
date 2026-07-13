import { getServerEnv } from "@/lib/env";
import {
  ACTIVITY_COLLECTION_ID,
  ASSETS_COLLECTION_ID,
  DEFAULT_DATABASE_ID,
  FOLLOW_UPS_COLLECTION_ID,
  LEADS_COLLECTION_ID,
  OUTREACH_DRAFTS_COLLECTION_ID,
  VERIFICATION_EVIDENCE_COLLECTION_ID,
  WEBSITE_AUDITS_COLLECTION_ID,
  SETTINGS_COLLECTION_ID,
} from "./constants";

export function getAppwriteConfig() {
  const env = getServerEnv();
  const endpoint = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    throw new Error("Appwrite endpoint and project ID must be configured before the app can start.");
  }

  return {
    endpoint,
    projectId,
    databaseId: env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || DEFAULT_DATABASE_ID,
    leadsCollectionId: env.NEXT_PUBLIC_APPWRITE_LEADS_COLLECTION_ID || LEADS_COLLECTION_ID,
    activityCollectionId: env.NEXT_PUBLIC_APPWRITE_ACTIVITY_COLLECTION_ID || ACTIVITY_COLLECTION_ID,
    settingsCollectionId: env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID || SETTINGS_COLLECTION_ID,
    assetsCollectionId: ASSETS_COLLECTION_ID,
    verificationEvidenceCollectionId: env.NEXT_PUBLIC_APPWRITE_VERIFICATION_COLLECTION_ID || VERIFICATION_EVIDENCE_COLLECTION_ID,
    websiteAuditsCollectionId: env.NEXT_PUBLIC_APPWRITE_WEBSITE_AUDITS_COLLECTION_ID || WEBSITE_AUDITS_COLLECTION_ID,
    outreachDraftsCollectionId: env.NEXT_PUBLIC_APPWRITE_OUTREACH_COLLECTION_ID || OUTREACH_DRAFTS_COLLECTION_ID,
    followUpsCollectionId: env.NEXT_PUBLIC_APPWRITE_FOLLOWUPS_COLLECTION_ID || FOLLOW_UPS_COLLECTION_ID,
    apiKey: env.APPWRITE_API_KEY || "",
  };
}

export function getBrowserAppwriteConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (typeof window !== "undefined") {
    console.info("Appwrite browser env presence", {
      endpoint: Boolean(endpoint),
      projectId: Boolean(projectId),
    });
  }
  if (!endpoint || !projectId) {
    throw new Error("Missing public Appwrite environment variables.");
  }

  return {
    endpoint,
    projectId,
  };
}
