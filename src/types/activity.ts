export const activityActions = [
  "created",
  "updated",
  "status_changed",
  "verification_changed",
  "contacted",
  "follow_up_scheduled",
  "deleted",
  "evidence_added",
  "evidence_edited",
  "evidence_removed",
  "website_audit_started",
  "website_audit_completed",
  "website_audit_failed",
  "verification_recalculated",
  "duplicate_detected",
  "duplicate_resolved",
  "outreach_generated",
  "outreach_edited",
  "outreach_approved",
  "outreach_copied",
  "whatsapp_opened",
  "mail_client_opened",
  "follow_up_completed",
  "follow_up_skipped",
  "follow_up_cancelled",
] as const;

export type ActivityAction = (typeof activityActions)[number];

export type ActivityLog = {
  $id: string;
  leadId: string;
  ownerId: string;
  action: ActivityAction;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ActivityInput = Omit<ActivityLog, "$id" | "createdAt">;
