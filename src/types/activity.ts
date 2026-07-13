export const activityActions = [
  "created",
  "updated",
  "status_changed",
  "verification_changed",
  "contacted",
  "follow_up_scheduled",
  "deleted",
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
