import { Client, Databases, Permission, Role, Users } from "node-appwrite";
import { getAppwriteConfig } from "@/lib/appwrite/config";
import {
  CLIENTSCOUT_LABEL,
  DEFAULT_DATABASE_ID,
  LEADS_COLLECTION_ID,
  ACTIVITY_COLLECTION_ID,
  SETTINGS_COLLECTION_ID,
  ASSETS_COLLECTION_ID,
  VERIFICATION_EVIDENCE_COLLECTION_ID,
  WEBSITE_AUDITS_COLLECTION_ID,
  OUTREACH_DRAFTS_COLLECTION_ID,
  FOLLOW_UPS_COLLECTION_ID,
} from "@/lib/appwrite/constants";

const leadAttributes = [
  ["string", "businessName", { size: 255, required: true }],
  ["string", "contactPerson", { size: 255, required: false }],
  ["string", "industry", { size: 255, required: true }],
  ["string", "businessType", { size: 64, required: true }],
  ["string", "country", { size: 255, required: true }],
  ["string", "city", { size: 255, required: false }],
  ["string", "timezone", { size: 255, required: false }],
  ["string", "phone", { size: 32, required: false }],
  ["string", "whatsapp", { size: 32, required: false }],
  ["string", "email", { size: 320, required: false }],
  ["string", "website", { size: 1024, required: false }],
  ["string", "sourceName", { size: 255, required: false }],
  ["string", "sourceNotes", { size: 5000, required: false }],
  ["string", "websiteStatus", { size: 64, required: true }],
  ["string", "contactVerification", { size: 64, required: true }],
  ["integer", "verificationConfidence", { required: false, min: 0, max: 100 }],
  ["string", "normalizedPhone", { size: 64, required: false }],
  ["string", "normalizedWhatsapp", { size: 64, required: false }],
  ["string", "normalizedEmail", { size: 320, required: false }],
  ["string", "normalizedWebsite", { size: 1024, required: false }],
  ["string", "websiteDomain", { size: 255, required: false }],
  ["boolean", "possibleDuplicate", { required: false }],
] as const;

const assetAttributes = [
  ["string", "leadId", { size: 255, required: true }],
  ["string", "ownerId", { size: 255, required: true }],
  ["string", "payload", { size: 10000, required: true }],
  ["datetime", "createdAt", { required: true }],
  ["datetime", "updatedAt", { required: true }],
] as const;

const activityAttributes = [
  ["string", "leadId", { size: 255, required: true }],
  ["string", "ownerId", { size: 255, required: true }],
  ["string", "action", { size: 64, required: true }],
  ["string", "description", { size: 5000, required: true }],
  ["string", "metadata", { size: 10000, required: true }],
  ["datetime", "createdAt", { required: true }],
] as const;

const settingsAttributes = [
  ["string", "userId", { size: 255, required: true }],
  ["string", "developerName", { size: 255, required: true }],
  ["string", "portfolioUrl", { size: 1024, required: true }],
  ["string", "email", { size: 320, required: true }],
  ["string", "defaultCountryFilter", { size: 255, required: false }],
  ["string", "defaultIndustries", { size: 10000, required: true }],
  ["datetime", "createdAt", { required: true }],
  ["datetime", "updatedAt", { required: true }],
] as const;

const verificationEvidenceAttributes = [
  ["string", "leadId", { size: 255, required: true }],
  ["string", "ownerId", { size: 255, required: true }],
  ["string", "evidenceType", { size: 64, required: true }],
  ["string", "sourceUrl", { size: 1024, required: false }],
  ["string", "sourceName", { size: 255, required: false }],
  ["string", "title", { size: 500, required: false }],
  ["string", "description", { size: 5000, required: false }],
  ["string", "extractedBusinessName", { size: 255, required: false }],
  ["string", "extractedPhone", { size: 64, required: false }],
  ["string", "extractedEmail", { size: 320, required: false }],
  ["string", "extractedWebsite", { size: 1024, required: false }],
  ["string", "extractedLocation", { size: 255, required: false }],
  ["string", "verificationResult", { size: 64, required: true }],
  ["integer", "confidence", { required: true, min: 0, max: 100 }],
  ["string", "notes", { size: 5000, required: false }],
  ["datetime", "checkedAt", { required: false }],
  ["datetime", "createdAt", { required: true }],
  ["datetime", "updatedAt", { required: true }],
] as const;

const websiteAuditAttributes = [
  ["string", "leadId", { size: 255, required: true }],
  ["string", "ownerId", { size: 255, required: true }],
  ["string", "requestedUrl", { size: 1024, required: false }],
  ["string", "normalizedUrl", { size: 1024, required: false }],
  ["string", "finalUrl", { size: 1024, required: false }],
  ["string", "domain", { size: 255, required: false }],
  ["integer", "httpStatus", { required: false, min: 0, max: 999 }],
  ["boolean", "reachable", { required: true }],
  ["boolean", "redirected", { required: true }],
  ["integer", "redirectCount", { required: true, min: 0, max: 20 }],
  ["boolean", "httpsEnabled", { required: true }],
  ["integer", "responseTimeMs", { required: false, min: 0, max: 60000 }],
  ["string", "contentType", { size: 255, required: false }],
  ["string", "pageTitle", { size: 500, required: false }],
  ["string", "metaDescription", { size: 1000, required: false }],
  ["boolean", "mobileViewport", { required: true }],
  ["string", "language", { size: 32, required: false }],
  ["string", "businessNameMatch", { size: 64, required: false }],
  ["integer", "businessNameMatchScore", { required: true, min: 0, max: 100 }],
  ["boolean", "phoneMatchesLead", { required: true }],
  ["boolean", "emailMatchesLead", { required: true }],
  ["boolean", "whatsappLinkFound", { required: true }],
  ["boolean", "contactPageFound", { required: true }],
  ["boolean", "enquiryFormFound", { required: true }],
  ["boolean", "bookingSignalsFound", { required: true }],
  ["boolean", "socialLinksFound", { required: true }],
  ["boolean", "robotsNoIndex", { required: true }],
  ["string", "auditStatus", { size: 32, required: true }],
  ["integer", "confidence", { required: true, min: 0, max: 100 }],
  ["datetime", "checkedAt", { required: false }],
] as const;

const outreachDraftAttributes = [
  ["string", "leadId", { size: 255, required: true }],
  ["string", "ownerId", { size: 255, required: true }],
  ["string", "channel", { size: 32, required: true }],
  ["string", "message", { size: 10000, required: true }],
  ["string", "opportunityType", { size: 64, required: true }],
  ["string", "templateKey", { size: 255, required: true }],
  ["string", "generationMethod", { size: 32, required: true }],
  ["string", "approvalStatus", { size: 32, required: true }],
  ["integer", "version", { required: true, min: 1, max: 1000 }],
] as const;

const followUpAttributes = [
  ["string", "leadId", { size: 255, required: true }],
  ["string", "ownerId", { size: 255, required: true }],
  ["string", "outreachDraftId", { size: 255, required: false }],
  ["string", "channel", { size: 32, required: true }],
  ["string", "followUpType", { size: 32, required: true }],
  ["datetime", "scheduledAt", { required: true }],
  ["string", "status", { size: 32, required: true }],
  ["string", "message", { size: 10000, required: false }],
  ["datetime", "completedAt", { required: false }],
  ["datetime", "skippedAt", { required: false }],
] as const;

async function exists<T>(fn: () => Promise<T>) {
  try {
    return { exists: true, value: await fn() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("404") || message.toLowerCase().includes("could not be found") || message.toLowerCase().includes("not found")) {
      return { exists: false, value: null };
    }
    throw error;
  }
}

async function ensureDatabase(databases: Databases, databaseId: string) {
  const found = await exists(() => databases.get(databaseId));
  if (found.exists) {
    if (found.value?.name && found.value.name !== databaseId) {
      throw new Error(`Database ${databaseId} already exists with incompatible name ${found.value.name}.`);
    }
    console.log(`Using database: ${databaseId}`);
    return;
  }
  await databases.create(databaseId, databaseId);
  console.log(`Created database: ${databaseId}`);
}

async function ensureCollection(databases: Databases, databaseId: string, collectionId: string, name: string) {
  const found = await exists(() => databases.getCollection(databaseId, collectionId));
  if (found.exists) {
    if (found.value?.name && found.value.name !== name) {
      throw new Error(`Collection ${collectionId} already exists with incompatible name ${found.value.name}.`);
    }
    console.log(`Using collection: ${collectionId}`);
    return;
  }
  await databases.createCollection(databaseId, collectionId, name, [
    Permission.create(Role.label(CLIENTSCOUT_LABEL)),
  ], true, true);
  console.log(`Created collection: ${collectionId}`);
}

async function ensureAttribute(databases: any, databaseId: string, collectionId: string, definition: readonly [string, string, Record<string, unknown>]) {
  const [, key, config] = definition;
  const found = await exists(() => databases.getAttribute(databaseId, collectionId, key));
  if (found.exists) {
    const existing = found.value as { type?: string } | null;
    if (existing?.type && existing.type !== definition[0]) {
      throw new Error(`Attribute ${collectionId}.${key} already exists with incompatible type ${existing.type}.`);
    }
    return;
  }

  switch (definition[0]) {
    case "string":
      await databases.createStringAttribute(databaseId, collectionId, key, config.size as number, config.required as boolean, config.filterable as boolean | undefined, config.default as string | undefined, config.array as boolean | undefined);
      break;
    case "enum":
      await databases.createEnumAttribute(databaseId, collectionId, key, config.elements as string[], config.required as boolean, config.default as string | undefined, config.array as boolean | undefined);
      break;
    case "integer":
      await databases.createIntegerAttribute(databaseId, collectionId, key, config.required as boolean, config.min as number | undefined, config.max as number | undefined, config.default as number | undefined, config.array as boolean | undefined);
      break;
    case "boolean":
      await databases.createBooleanAttribute(databaseId, collectionId, key, config.required as boolean, config.default as boolean | undefined, config.array as boolean | undefined);
      break;
    case "datetime":
      await databases.createDatetimeAttribute(databaseId, collectionId, key, config.required as boolean, config.default as string | undefined, config.array as boolean | undefined);
      break;
    default:
      throw new Error(`Unsupported attribute type: ${definition[0]}`);
  }
  console.log(`Created attribute ${collectionId}.${key}`);
}

async function ensureIndex(
  databases: any,
  databaseId: string,
  collectionId: string,
  id: string,
  key: string,
  type: "key" | "unique" | "fulltext" = "key",
) {
  const found = await exists(() => databases.getIndex(databaseId, collectionId, id));
  if (found.exists) {
    const existing = found.value as { type?: string } | null;
    if (existing?.type && existing.type !== type) {
      throw new Error(`Index ${collectionId}.${id} already exists with incompatible type ${existing.type}.`);
    }
    return;
  }
  await (databases as any).createIndex(databaseId, collectionId, id, type, [key], []);
  console.log(`Created index ${collectionId}.${id}`);
}

async function ensureLabel(users: Users) {
  const userApi = users as any;
  if (typeof userApi.listLabels !== "function" || typeof userApi.createLabel !== "function") {
    console.log("Appwrite label management APIs are not available in this SDK. Create label clientscoutaccess manually.");
    return;
  }

  const labels = await userApi.listLabels();
  const existing = Array.isArray(labels?.labels) ? labels.labels.find((label: { name: string }) => label.name === CLIENTSCOUT_LABEL) : null;
  if (existing) {
    console.log(`Using label: ${CLIENTSCOUT_LABEL}`);
    return;
  }
  await userApi.createLabel(CLIENTSCOUT_LABEL);
  console.log(`Created label: ${CLIENTSCOUT_LABEL}`);
}

async function main() {
  const config = getAppwriteConfig();
  const client = new Client();
  client.setEndpoint(config.endpoint);
  client.setProject(config.projectId);
  client.setKey(config.apiKey);
  const databases = new Databases(client) as any;
  const users = new Users(client) as any;

  if (!config.apiKey) {
    throw new Error("APPWRITE_API_KEY is required for the setup script.");
  }

  await ensureLabel(users);
  await ensureDatabase(databases, config.databaseId || DEFAULT_DATABASE_ID);
  await ensureCollection(databases, config.databaseId || DEFAULT_DATABASE_ID, LEADS_COLLECTION_ID, "ClientScout Leads");
  await ensureCollection(databases, config.databaseId || DEFAULT_DATABASE_ID, ACTIVITY_COLLECTION_ID, "ClientScout Activity Logs");
  await ensureCollection(databases, config.databaseId || DEFAULT_DATABASE_ID, SETTINGS_COLLECTION_ID, "ClientScout Settings");
  await ensureCollection(databases, config.databaseId || DEFAULT_DATABASE_ID, ASSETS_COLLECTION_ID, "ClientScout Assets");
  await ensureCollection(databases, config.databaseId || DEFAULT_DATABASE_ID, VERIFICATION_EVIDENCE_COLLECTION_ID, "ClientScout Verification Evidence");
  await ensureCollection(databases, config.databaseId || DEFAULT_DATABASE_ID, WEBSITE_AUDITS_COLLECTION_ID, "ClientScout Website Audits");
  await ensureCollection(databases, config.databaseId || DEFAULT_DATABASE_ID, OUTREACH_DRAFTS_COLLECTION_ID, "ClientScout Outreach Drafts");
  await ensureCollection(databases, config.databaseId || DEFAULT_DATABASE_ID, FOLLOW_UPS_COLLECTION_ID, "ClientScout Follow Ups");

  for (const attribute of leadAttributes) {
    await ensureAttribute(databases, config.databaseId || DEFAULT_DATABASE_ID, LEADS_COLLECTION_ID, attribute);
  }
  for (const attribute of assetAttributes) {
    await ensureAttribute(databases, config.databaseId || DEFAULT_DATABASE_ID, ASSETS_COLLECTION_ID, attribute);
  }
  for (const attribute of activityAttributes) {
    await ensureAttribute(databases, config.databaseId || DEFAULT_DATABASE_ID, ACTIVITY_COLLECTION_ID, attribute);
  }
  for (const attribute of settingsAttributes) {
    await ensureAttribute(databases, config.databaseId || DEFAULT_DATABASE_ID, SETTINGS_COLLECTION_ID, attribute);
  }
  for (const attribute of verificationEvidenceAttributes) {
    await ensureAttribute(databases, config.databaseId || DEFAULT_DATABASE_ID, VERIFICATION_EVIDENCE_COLLECTION_ID, attribute);
  }
  for (const attribute of websiteAuditAttributes) {
    await ensureAttribute(databases, config.databaseId || DEFAULT_DATABASE_ID, WEBSITE_AUDITS_COLLECTION_ID, attribute);
  }
  for (const attribute of outreachDraftAttributes) {
    await ensureAttribute(databases, config.databaseId || DEFAULT_DATABASE_ID, OUTREACH_DRAFTS_COLLECTION_ID, attribute);
  }
  for (const attribute of followUpAttributes) {
    await ensureAttribute(databases, config.databaseId || DEFAULT_DATABASE_ID, FOLLOW_UPS_COLLECTION_ID, attribute);
  }

  const leadIndexes = [
    "businessName",
    "businessName_search",
    "country",
    "industry",
    "websiteStatus",
    "contactVerification",
    "email",
    "email_search",
    "phone",
    "phone_search",
    "whatsapp",
    "contactPerson_search",
    "sourceName",
    "city",
    "timezone",
    "verificationConfidence",
    "normalizedPhone",
    "normalizedWhatsapp",
    "normalizedEmail",
    "websiteDomain",
  ];
  for (const key of leadIndexes) {
    await ensureIndex(
      databases,
      config.databaseId || DEFAULT_DATABASE_ID,
      LEADS_COLLECTION_ID,
      key,
      key.replace(/_search$/, ""),
      key.includes("_search") ? "fulltext" : "key",
    );
  }

  for (const key of ["ownerId", "leadId", "createdAt", "action"]) {
    await ensureIndex(databases, config.databaseId || DEFAULT_DATABASE_ID, ACTIVITY_COLLECTION_ID, key, key);
  }
  await ensureIndex(databases, config.databaseId || DEFAULT_DATABASE_ID, SETTINGS_COLLECTION_ID, "userId", "userId", "unique");
  for (const key of ["ownerId", "leadId", "evidenceType", "verificationResult", "createdAt"]) {
    await ensureIndex(databases, config.databaseId || DEFAULT_DATABASE_ID, VERIFICATION_EVIDENCE_COLLECTION_ID, key, key);
  }
  for (const key of ["ownerId", "leadId", "auditStatus", "checkedAt", "domain"]) {
    await ensureIndex(databases, config.databaseId || DEFAULT_DATABASE_ID, WEBSITE_AUDITS_COLLECTION_ID, key, key);
  }
  for (const key of ["ownerId", "leadId", "channel", "approvalStatus"]) {
    await ensureIndex(databases, config.databaseId || DEFAULT_DATABASE_ID, OUTREACH_DRAFTS_COLLECTION_ID, key, key);
  }
  for (const key of ["ownerId", "leadId", "status", "scheduledAt", "channel"]) {
    await ensureIndex(databases, config.databaseId || DEFAULT_DATABASE_ID, FOLLOW_UPS_COLLECTION_ID, key, key);
  }

  console.log("Appwrite setup complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
