import { getServerDatabases } from "@/lib/appwrite/server";
import { ActivityRepository } from "@/lib/appwrite/repositories/activity";
import { LeadsRepository } from "@/lib/appwrite/repositories/leads";
import { SettingsRepository } from "@/lib/appwrite/repositories/settings";
import {
  FollowUpRepository,
  OutreachDraftRepository,
  VerificationEvidenceRepository,
  WebsiteAuditRepository,
} from "@/lib/appwrite/repositories/phase2";
import { findDuplicateCandidates } from "@/lib/duplicates";
import { generateStaticOutreachDraft } from "@/lib/outreach/templates";
import { calculateVerificationConfidence } from "@/lib/verification/scoring";
import { runWebsiteAudit, type WebsiteAuditResult } from "@/lib/verification/website-checker";
import type { ActivityAction } from "@/types/activity";
import type { Lead } from "@/types/lead";
import type {
  FollowUp,
  OutreachChannel,
  OutreachDraft,
  VerificationEvidence,
  WebsiteAudit,
  WebsiteOpportunityType,
} from "@/types/verification";

function activityDescription(action: ActivityAction, extra?: string) {
  if (extra) return extra;
  switch (action) {
    case "evidence_added":
      return "Evidence added";
    case "evidence_edited":
      return "Evidence edited";
    case "evidence_removed":
      return "Evidence removed";
    case "website_audit_started":
      return "Website audit started";
    case "website_audit_completed":
      return "Website audit completed";
    case "website_audit_failed":
      return "Website audit failed";
    case "verification_recalculated":
      return "Verification recalculated";
    case "duplicate_detected":
      return "Duplicate candidate detected";
    case "duplicate_resolved":
      return "Duplicate review resolved";
    case "outreach_generated":
      return "Outreach draft generated";
    case "outreach_edited":
      return "Outreach draft edited";
    case "outreach_approved":
      return "Outreach draft approved";
    case "outreach_copied":
      return "Outreach draft copied";
    case "whatsapp_opened":
      return "WhatsApp opened";
    case "mail_client_opened":
      return "Mail client opened";
    case "follow_up_scheduled":
      return "Follow-up scheduled";
    case "follow_up_completed":
      return "Follow-up completed";
    case "follow_up_skipped":
      return "Follow-up skipped";
    case "follow_up_cancelled":
      return "Follow-up cancelled";
    default:
      return "Lead updated";
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function auditOptions() {
  return {
    timeoutMs: Number(process.env.CLIENTSCOUT_WEBSITE_AUDIT_TIMEOUT_MS ?? 10000),
    maxBytes: Number(process.env.CLIENTSCOUT_WEBSITE_AUDIT_MAX_BYTES ?? 1_500_000),
    maxRedirects: Number(process.env.CLIENTSCOUT_WEBSITE_AUDIT_MAX_REDIRECTS ?? 5),
  };
}

function isWebsiteAuditResultStatus(value: WebsiteAuditResult["auditStatus"]): value is WebsiteAudit["auditStatus"] {
  return value === "pending" || value === "running" || value === "completed" || value === "partial" || value === "failed" || value === "blocked" || value === "unsafe_url";
}

export function createPhase2Services(jwt: string) {
  const databases = getServerDatabases(jwt);
  const leads = new LeadsRepository(databases);
  const activity = new ActivityRepository(databases);
  const settings = new SettingsRepository(databases);
  const evidence = new VerificationEvidenceRepository(databases);
  const audits = new WebsiteAuditRepository(databases);
  const drafts = new OutreachDraftRepository(databases);
  const followUps = new FollowUpRepository(databases);

  async function log(action: ActivityAction, leadId: string, ownerId: string, metadata: Record<string, unknown>, descriptionOverride?: string) {
    await activity.create({
      leadId,
      ownerId,
      action,
      description: activityDescription(action, descriptionOverride),
      metadata,
    });
  }

  async function getLeadBundle(leadId: string, ownerId: string) {
    const lead = await leads.getById(leadId, ownerId);
    const leadEvidence = await evidence.listByLead(leadId, ownerId);
    const leadAudits = await audits.listByLead(leadId, ownerId);
    const leadDrafts = await drafts.listByLead(leadId, ownerId);
    const leadFollowUps = await followUps.listByLead(leadId, ownerId);
    const allLeads = await leads.listAll(ownerId);
    const duplicateCandidates = findDuplicateCandidates(
      lead,
      allLeads.documents.filter((item) => item.$id !== leadId),
    );
    const verification = calculateVerificationConfidence(lead, leadAudits, leadEvidence);
    return {
      lead,
      evidence: leadEvidence,
      audits: leadAudits,
      drafts: leadDrafts,
      followUps: leadFollowUps,
      duplicateCandidates,
      verification,
    };
  }

  async function markDraftUsed(id: string, ownerId: string) {
    const existing = await drafts.getById(id, ownerId);
    if (!existing) throw new Error("Draft not found");
    return drafts.update(id, {
      ...existing,
      approvalStatus: "used",
      contactedAt: new Date().toISOString(),
      ownerId,
      leadId: existing.leadId,
    });
  }

  async function storeWebsiteAudit(
    leadId: string,
    ownerId: string,
    result: WebsiteAuditResult,
  ) {
    const stored = await audits.create({
      leadId,
      ownerId,
      requestedUrl: result.requestedUrl,
      normalizedUrl: result.normalizedUrl,
      finalUrl: result.finalUrl,
      domain: result.domain,
      httpStatus: result.httpStatus,
      reachable: result.reachable,
      redirected: result.redirected,
      redirectCount: result.redirectCount,
      httpsEnabled: result.httpsEnabled,
      responseTimeMs: result.responseTimeMs,
      contentType: result.contentType,
      pageTitle: result.pageTitle,
      metaDescription: result.metaDescription,
      mobileViewport: result.mobileViewport,
      language: result.language,
      businessNameMatch: result.businessNameMatch,
      businessNameMatchScore: result.businessNameMatchScore,
      phoneMatchesLead: result.phoneMatchesLead,
      emailMatchesLead: result.emailMatchesLead,
      whatsappLinkFound: result.whatsappLinkFound,
      contactPageFound: result.contactPageFound,
      enquiryFormFound: result.enquiryFormFound,
      bookingSignalsFound: result.bookingSignalsFound,
      socialLinksFound: result.socialLinksFound,
      robotsNoIndex: result.robotsNoIndex,
      securityHeadersJson: result.securityHeadersJson,
      detectedIssuesJson: result.detectedIssuesJson,
      evidenceJson: result.evidenceJson,
      auditStatus: isWebsiteAuditResultStatus(result.auditStatus) ? result.auditStatus : "partial",
      confidence: result.confidence,
      errorCode: result.errorCode,
      errorMessageSafe: result.errorMessageSafe,
      checkedAt: result.checkedAt,
    });
    return stored;
  }

  return {
    getLeadBundle,
    getSettings: (ownerId: string) => settings.getForUser(ownerId),
    getEvidenceById: (id: string, ownerId: string) => evidence.getById(id, ownerId),
    getDraftById: (id: string, ownerId: string) => drafts.getById(id, ownerId),
    getFollowUpById: (id: string, ownerId: string) => followUps.getById(id, ownerId),
    addEvidence: async (leadId: string, ownerId: string, input: Omit<VerificationEvidence, "$id" | "createdAt" | "updatedAt">) => {
      const created = await evidence.create({ ...input, ownerId, leadId });
      await log("evidence_added", leadId, ownerId, { evidenceId: created.$id, evidenceType: created.evidenceType });
      return created;
    },
    updateEvidence: async (id: string, ownerId: string, input: Omit<VerificationEvidence, "$id" | "createdAt" | "updatedAt">) => {
      const updated = await evidence.update(id, { ...input, ownerId });
      await log("evidence_edited", updated.leadId, ownerId, { evidenceId: updated.$id, evidenceType: updated.evidenceType });
      return updated;
    },
    removeEvidence: async (id: string, ownerId: string) => {
      const existing = await evidence.getById(id, ownerId);
      if (!existing) throw new Error("Evidence not found");
      await evidence.remove(id);
      await log("evidence_removed", existing.leadId, ownerId, { evidenceId: id, evidenceType: existing.evidenceType });
    },
    runAudit: async (
      leadId: string,
      ownerId: string,
      requestedUrl: string,
      businessName?: string | null,
      email?: string | null,
      phone?: string | null,
      whatsapp?: string | null,
    ) => {
      await log("website_audit_started", leadId, ownerId, { requestedUrl });
      const result = await runWebsiteAudit({ requestedUrl, businessName, email, phone, whatsapp }, auditOptions());
      const stored = await storeWebsiteAudit(leadId, ownerId, result);
      await log(
        stored.auditStatus === "failed" || stored.auditStatus === "unsafe_url" ? "website_audit_failed" : "website_audit_completed",
        leadId,
        ownerId,
        { auditId: stored.$id, auditStatus: stored.auditStatus, domain: stored.domain },
      );
      return stored;
    },
    latestAudit: (leadId: string, ownerId: string) => audits.latestByLead(leadId, ownerId),
    duplicateCandidates: async (leadId: string, ownerId: string) => {
      const bundle = await getLeadBundle(leadId, ownerId);
      return bundle.duplicateCandidates;
    },
    resolveDuplicate: async (
      leadId: string,
      ownerId: string,
      resolution: { decision: "keep_both" | "not_duplicate"; primaryLeadId?: string; notes?: string },
    ) => {
      await log("duplicate_resolved", leadId, ownerId, resolution);
      return resolution;
    },
    generateOutreachDraft: async (
      leadId: string,
      ownerId: string,
      channel: OutreachChannel,
      opportunityType: WebsiteOpportunityType,
    ) => {
      const bundle = await getLeadBundle(leadId, ownerId);
      const settingsRecord = (await settings.getForUser(ownerId)) ?? {
        developerName: "Abhishek",
        portfolioUrl: "https://idcare19.me",
        skills: [],
        preferredServices: [],
      };
      const template = generateStaticOutreachDraft({
        lead: bundle.lead,
        channel,
        opportunityType,
        developerName: settingsRecord.developerName,
        portfolioUrl: settingsRecord.portfolioUrl,
        skills: settingsRecord.skills ?? [],
        preferredServices: settingsRecord.preferredServices ?? [],
        audit: bundle.audits[0] ?? null,
      });
      const draft = await drafts.create({
        leadId,
        ownerId,
        channel,
        subject: template.subject,
        message: template.message,
        followUpMessage: template.followUpMessage,
        finalFollowUpMessage: template.finalFollowUpMessage,
        opportunityType: template.opportunityType,
        templateKey: template.templateKey,
        generationMethod: "static_template",
        approvalStatus: "needs_review",
        approvedAt: null,
        contactedAt: null,
        lastCopiedAt: null,
        version: 1,
        sourceSnapshotJson: {
          lead: bundle.lead,
          verification: bundle.verification,
          evidence: bundle.evidence,
          audit: bundle.audits[0] ?? null,
        },
      });
      await log("outreach_generated", leadId, ownerId, { draftId: draft.$id, channel, opportunityType });
      return draft;
    },
    updateOutreachDraft: async (id: string, ownerId: string, input: Partial<OutreachDraft>) => {
      const existing = await drafts.getById(id, ownerId);
      if (!existing) throw new Error("Draft not found");
      const updated = await drafts.update(id, {
        ...existing,
        ...input,
        ownerId,
        leadId: existing.leadId,
      });
      await log("outreach_edited", existing.leadId, ownerId, { draftId: id, channel: updated.channel });
      return updated;
    },
    approveOutreachDraft: async (id: string, ownerId: string) => {
      const existing = await drafts.getById(id, ownerId);
      if (!existing) throw new Error("Draft not found");
      const updated = await drafts.update(id, { ...existing, approvalStatus: "approved", ownerId, leadId: existing.leadId });
      await log("outreach_approved", existing.leadId, ownerId, { draftId: id, channel: updated.channel });
      return updated;
    },
    markDraftUsed,
    markLeadContacted: async (leadId: string, ownerId: string, draftId?: string | null) => {
      const updatedLead = await leads.updateStatus(leadId, "contacted", ownerId);
      await log("contacted", leadId, ownerId, { draftId: draftId ?? null });
      if (draftId) {
        await markDraftUsed(draftId, ownerId);
      }
      return updatedLead;
    },
    scheduleFollowUp: async (input: Omit<FollowUp, "$id" | "createdAt" | "updatedAt">) => {
      const created = await followUps.create(input);
      await log("follow_up_scheduled", input.leadId, input.ownerId, { followUpId: created.$id, followUpType: created.followUpType });
      return created;
    },
    updateFollowUp: async (id: string, ownerId: string, input: Omit<FollowUp, "$id" | "createdAt" | "updatedAt">) => {
      const existing = await followUps.getById(id, ownerId);
      if (!existing) throw new Error("Follow-up not found");
      const updated = await followUps.update(id, input);
      await log("follow_up_scheduled", updated.leadId, ownerId, { followUpId: id, action: "edited" });
      return updated;
    },
    completeFollowUp: async (id: string, ownerId: string) => {
      const existing = await followUps.getById(id, ownerId);
      if (!existing) throw new Error("Follow-up not found");
      const updated = await followUps.update(id, { ...existing, status: "completed", completedAt: new Date().toISOString(), ownerId });
      await log("follow_up_completed", updated.leadId, ownerId, { followUpId: id });
      return updated;
    },
    skipFollowUp: async (id: string, ownerId: string, skipReason: string) => {
      const existing = await followUps.getById(id, ownerId);
      if (!existing) throw new Error("Follow-up not found");
      const updated = await followUps.update(id, { ...existing, status: "skipped", skippedAt: new Date().toISOString(), skipReason, ownerId });
      await log("follow_up_skipped", updated.leadId, ownerId, { followUpId: id, skipReason });
      return updated;
    },
    cancelFollowUp: async (id: string, ownerId: string) => {
      const existing = await followUps.getById(id, ownerId);
      if (!existing) throw new Error("Follow-up not found");
      const updated = await followUps.update(id, { ...existing, status: "cancelled", ownerId });
      await log("follow_up_cancelled", updated.leadId, ownerId, { followUpId: id });
      return updated;
    },
    listFollowUps: async (ownerId: string) => {
      const all = await leads.listAll(ownerId);
      const leadIds = all.documents.map((doc) => doc.$id);
      const rows = await Promise.all(leadIds.map((id) => followUps.listByLead(id, ownerId)));
      return rows.flat();
    },
    listEvidence: (leadId: string, ownerId: string) => evidence.listByLead(leadId, ownerId),
    listAudits: (leadId: string, ownerId: string) => audits.listByLead(leadId, ownerId),
    listDrafts: (leadId: string, ownerId: string) => drafts.listByLead(leadId, ownerId),
    listFollowUpsByLead: (leadId: string, ownerId: string) => followUps.listByLead(leadId, ownerId),
    listLeadDuplicates: (leadId: string, ownerId: string) => getLeadBundle(leadId, ownerId).then((bundle) => bundle.duplicateCandidates),
    log,
    leads,
  };
}
