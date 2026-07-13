"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DuplicateCandidate } from "@/lib/duplicates";
import { getChannelLabel } from "@/lib/outreach/templates";
import type { Lead } from "@/types/lead";
import type {
  FollowUp,
  OutreachChannel,
  OutreachDraft,
  VerificationEvidence,
  WebsiteAudit,
  WebsiteOpportunityType,
} from "@/types/verification";
import type { VerificationScoreResult } from "@/lib/verification/scoring";
import { evidenceTypes, verificationResults, outreachChannels, websiteOpportunityTypes, followUpTypes } from "@/types/verification";

type Phase2Bundle = {
  evidence: VerificationEvidence[];
  audits: WebsiteAudit[];
  drafts: OutreachDraft[];
  followUps: FollowUp[];
  duplicateCandidates: DuplicateCandidate[];
  verification: VerificationScoreResult;
};

type Props = {
  lead: Lead;
  bundle: Phase2Bundle;
};

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Request failed");
  }
  return response.json().catch(() => ({}));
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function LeadWorkspace({ lead, bundle }: Props) {
  const router = useRouter();
  const [savingEvidence, setSavingEvidence] = React.useState(false);
  const [runningAudit, setRunningAudit] = React.useState(false);
  const [generatingDraft, setGeneratingDraft] = React.useState(false);
  const [savingFollowUp, setSavingFollowUp] = React.useState(false);
  const [processingAction, setProcessingAction] = React.useState<string | null>(null);

  const latestAudit = bundle.audits[0] ?? null;
  const latestDraft = bundle.drafts[0] ?? null;

  const refreshAfter = async (fn: () => Promise<void>) => {
    try {
      await fn();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  };

  const addEvidence = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSavingEvidence(true);
    await refreshAfter(async () => {
      await postJson(`/api/phase2/leads/${lead.$id}/evidence`, {
        evidenceType: String(form.get("evidenceType") ?? "other"),
        sourceUrl: String(form.get("sourceUrl") ?? "").trim() || null,
        sourceName: String(form.get("sourceName") ?? "").trim() || null,
        title: String(form.get("title") ?? "").trim() || null,
        description: String(form.get("description") ?? "").trim() || null,
        extractedBusinessName: String(form.get("extractedBusinessName") ?? "").trim() || null,
        extractedPhone: String(form.get("extractedPhone") ?? "").trim() || null,
        extractedEmail: String(form.get("extractedEmail") ?? "").trim() || null,
        extractedWebsite: String(form.get("extractedWebsite") ?? "").trim() || null,
        extractedLocation: String(form.get("extractedLocation") ?? "").trim() || null,
        verificationResult: String(form.get("verificationResult") ?? "inconclusive"),
        confidence: Number(form.get("confidence") ?? 0),
        notes: String(form.get("notes") ?? "").trim() || null,
        checkedAt: String(form.get("checkedAt") ?? "").trim() || null,
      });
      toast.success("Evidence saved");
    });
    setSavingEvidence(false);
  };

  const runAudit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setRunningAudit(true);
    await refreshAfter(async () => {
      await postJson(`/api/phase2/leads/${lead.$id}/audit`, {
        requestedUrl: String(form.get("requestedUrl") ?? "").trim(),
        businessName: String(form.get("businessName") ?? "").trim() || null,
        email: String(form.get("email") ?? "").trim() || null,
        phone: String(form.get("phone") ?? "").trim() || null,
        whatsapp: String(form.get("whatsapp") ?? "").trim() || null,
      });
      toast.success("Website audit completed");
    });
    setRunningAudit(false);
  };

  const generateDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setGeneratingDraft(true);
    await refreshAfter(async () => {
      await postJson(`/api/phase2/leads/${lead.$id}/outreach`, {
        channel: String(form.get("channel") ?? "whatsapp") as OutreachChannel,
        opportunityType: String(form.get("opportunityType") ?? "needs_manual_review") as WebsiteOpportunityType,
      });
      toast.success("Outreach draft generated");
    });
    setGeneratingDraft(false);
  };

  const scheduleFollowUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSavingFollowUp(true);
    await refreshAfter(async () => {
      await postJson(`/api/phase2/leads/${lead.$id}/follow-ups`, {
        outreachDraftId: String(form.get("outreachDraftId") ?? "").trim() || null,
        channel: String(form.get("channel") ?? "whatsapp") as OutreachChannel,
        followUpType: String(form.get("followUpType") ?? "custom"),
        scheduledAt: String(form.get("scheduledAt") ?? "").trim(),
        status: "scheduled",
        message: String(form.get("message") ?? "").trim() || null,
        skipReason: null,
        notes: String(form.get("notes") ?? "").trim() || null,
      });
      toast.success("Follow-up scheduled");
    });
    setSavingFollowUp(false);
  };

  const handleDuplicateResolution = async (candidate: DuplicateCandidate, decision: "keep_both" | "not_duplicate") => {
    setProcessingAction(candidate.lead.$id);
    await refreshAfter(async () => {
      await postJson(`/api/phase2/leads/${lead.$id}/duplicates`, {
        decision,
        primaryLeadId: candidate.lead.$id,
        notes: candidate.reasons.join("; "),
      });
      toast.success("Duplicate review saved");
    });
    setProcessingAction(null);
  };

  const handleDraftAction = async (draftId: string, action: "approve" | "used" | "copy") => {
    setProcessingAction(draftId);
    await refreshAfter(async () => {
      await postJson(`/api/phase2/outreach/${draftId}`, { action });
      if (action === "copy") {
        toast.success("Draft copied");
      } else if (action === "approve") {
        toast.success("Draft approved");
      } else {
        toast.success("Draft marked used");
      }
    });
    setProcessingAction(null);
  };

  const handleFollowUpAction = async (followUpId: string, action: "complete" | "cancel") => {
    setProcessingAction(followUpId);
    await refreshAfter(async () => {
      await postJson(`/api/phase2/follow-ups/${followUpId}`, { action });
      toast.success(action === "complete" ? "Follow-up completed" : "Follow-up cancelled");
    });
    setProcessingAction(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 2 workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatPill label="Identity confidence" value={`${bundle.verification.identityConfidence}%`} />
            <StatPill label="Contact confidence" value={`${bundle.verification.contactConfidence}%`} />
            <StatPill label="Website confidence" value={`${bundle.verification.websiteConfidence}%`} />
            <StatPill label="Overall confidence" value={`${bundle.verification.overallConfidence}%`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Evidence: {bundle.evidence.length}</Badge>
            <Badge>Audits: {bundle.audits.length}</Badge>
            <Badge>Drafts: {bundle.drafts.length}</Badge>
            <Badge>Follow-ups: {bundle.followUps.length}</Badge>
            <Badge>Duplicates: {bundle.duplicateCandidates.length}</Badge>
          </div>
          <p className="text-sm text-slate-600">{bundle.verification.nextRecommendedAction}</p>
          {bundle.verification.blockingReasons.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {bundle.verification.blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-4" onSubmit={addEvidence}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Evidence type">
                  <select name="evidenceType" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue="other">
                    {evidenceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Verification result">
                  <select name="verificationResult" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue="inconclusive">
                    {verificationResults.map((result) => (
                      <option key={result} value={result}>
                        {result.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source URL">
                  <Input name="sourceUrl" placeholder="https://..." />
                </Field>
                <Field label="Source name">
                  <Input name="sourceName" placeholder="Google Business Profile" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title">
                  <Input name="title" />
                </Field>
                <Field label="Confidence">
                  <Input name="confidence" type="number" min={0} max={100} defaultValue={0} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business name">
                  <Input name="extractedBusinessName" defaultValue={lead.businessName} />
                </Field>
                <Field label="Checked at">
                  <Input name="checkedAt" type="datetime-local" />
                </Field>
              </div>
              <Field label="Description">
                <Textarea name="description" rows={3} />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" rows={2} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingEvidence}>
                  {savingEvidence ? "Saving..." : "Save evidence"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {bundle.evidence.length === 0 ? <p className="text-sm text-slate-500">No evidence yet.</p> : null}
              {bundle.evidence.map((item) => (
                <div key={item.$id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-slate-950">{item.evidenceType.replaceAll("_", " ")}</strong>
                    <span className="text-slate-500">{item.verificationResult.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-2 text-slate-600">{item.title ?? item.sourceName ?? "Untitled evidence"}</p>
                  <p className="mt-1 text-xs text-slate-500">Confidence {item.confidence}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website audit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-4" onSubmit={runAudit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Requested URL">
                  <Input name="requestedUrl" defaultValue={lead.website ?? ""} placeholder="https://example.com" />
                </Field>
                <Field label="Business name">
                  <Input name="businessName" defaultValue={lead.businessName} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Email">
                  <Input name="email" defaultValue={lead.email ?? ""} />
                </Field>
                <Field label="Phone">
                  <Input name="phone" defaultValue={lead.phone ?? ""} />
                </Field>
                <Field label="WhatsApp">
                  <Input name="whatsapp" defaultValue={lead.whatsapp ?? ""} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={runningAudit}>
                  {runningAudit ? "Checking..." : "Run audit"}
                </Button>
              </div>
            </form>

            {latestAudit ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-slate-950">{latestAudit.domain ?? latestAudit.normalizedUrl ?? "Website audit"}</strong>
                  <span className="text-slate-500">{latestAudit.auditStatus.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-2 text-slate-600">Confidence {latestAudit.confidence}%</p>
                <p className="mt-1 text-xs text-slate-500">
                  {latestAudit.contactPageFound ? "Contact flow found." : "No contact flow detected."}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No audits yet.</p>
            )}

            <div className="space-y-3">
              {bundle.audits.slice(0, 3).map((audit) => (
                <div key={audit.$id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <strong>{audit.domain ?? audit.normalizedUrl ?? "Unknown site"}</strong>
                    <span className="text-slate-500">{audit.auditStatus.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-slate-600">Checked {format(new Date(audit.checkedAt ?? audit.createdAt), "PP p")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate outreach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-4" onSubmit={generateDraft}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Channel">
                  <select name="channel" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue="whatsapp">
                    {outreachChannels.map((channel) => (
                      <option key={channel} value={channel}>
                        {getChannelLabel(channel)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Opportunity type">
                  <select
                    name="opportunityType"
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    defaultValue={lead.websiteOpportunityType ?? "needs_manual_review"}
                  >
                    {websiteOpportunityTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={generatingDraft}>
                  {generatingDraft ? "Generating..." : "Generate draft"}
                </Button>
              </div>
            </form>

            {latestDraft ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-slate-950">{latestDraft.channel.toUpperCase()}</strong>
                  <span className="text-slate-500">{latestDraft.approvalStatus.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-2 text-slate-600">{latestDraft.subject ?? "No subject for this channel"}</p>
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-slate-500">{latestDraft.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDraftAction(latestDraft.$id, "approve")} disabled={processingAction === latestDraft.$id}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDraftAction(latestDraft.$id, "copy")}
                    disabled={processingAction === latestDraft.$id}
                  >
                    Copy note
                  </Button>
                  <Button size="sm" type="button" variant="secondary" onClick={() => handleDraftAction(latestDraft.$id, "used")} disabled={processingAction === latestDraft.$id}>
                    Mark used
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No outreach draft yet.</p>
            )}

            <div className="space-y-3">
              {bundle.drafts.slice(0, 3).map((draft) => (
                <div key={draft.$id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <strong>{draft.channel.toUpperCase()}</strong>
                    <span className="text-slate-500">{draft.approvalStatus.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-slate-600">{draft.templateKey}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-4" onSubmit={scheduleFollowUp}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Channel">
                  <select name="channel" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue="whatsapp">
                    {outreachChannels.map((channel) => (
                      <option key={channel} value={channel}>
                        {getChannelLabel(channel)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Follow-up type">
                  <select name="followUpType" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue="custom">
                    {followUpTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Draft">
                  <select name="outreachDraftId" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" defaultValue="">
                    <option value="">No draft linked</option>
                    {bundle.drafts.map((draft) => (
                      <option key={draft.$id} value={draft.$id}>
                        {draft.channel.toUpperCase()} - {draft.templateKey}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Scheduled at">
                  <Input name="scheduledAt" type="datetime-local" />
                </Field>
              </div>
              <Field label="Message">
                <Textarea name="message" rows={3} placeholder="Follow-up message" />
              </Field>
              <Field label="Notes">
                <Textarea name="notes" rows={2} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingFollowUp}>
                  {savingFollowUp ? "Scheduling..." : "Schedule follow-up"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {bundle.followUps.length === 0 ? <p className="text-sm text-slate-500">No follow-ups yet.</p> : null}
              {bundle.followUps.map((followUp) => (
                <div key={followUp.$id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-slate-950">{followUp.followUpType.replaceAll("_", " ")}</strong>
                    <span className="text-slate-500">{followUp.status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-slate-600">Scheduled {format(new Date(followUp.scheduledAt), "PP p")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFollowUpAction(followUp.$id, "complete")}
                      disabled={processingAction === followUp.$id}
                    >
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleFollowUpAction(followUp.$id, "cancel")}
                      disabled={processingAction === followUp.$id}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Duplicate review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bundle.duplicateCandidates.length === 0 ? <p className="text-sm text-slate-500">No duplicate candidates found.</p> : null}
          {bundle.duplicateCandidates.map((candidate) => (
            <div key={candidate.lead.$id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-950">{candidate.lead.businessName}</p>
                  <p className="text-sm text-slate-500">{candidate.lead.city ?? "Unknown city"} - {candidate.lead.country}</p>
                </div>
                <Badge variant="outline">{candidate.strength}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">Reasons: {candidate.reasons.join(", ")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleDuplicateResolution(candidate, "not_duplicate")} disabled={processingAction === candidate.lead.$id}>
                  Not duplicate
                </Button>
                <Button size="sm" type="button" variant="secondary" onClick={() => handleDuplicateResolution(candidate, "keep_both")} disabled={processingAction === candidate.lead.$id}>
                  Keep both
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
