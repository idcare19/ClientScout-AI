import { getServerDatabases } from "@/lib/appwrite/server";
import { ActivityRepository } from "@/lib/appwrite/repositories/activity";
import { LeadsRepository } from "@/lib/appwrite/repositories/leads";
import type { Lead, LeadInput } from "@/types/lead";
import type { ActivityAction } from "@/types/activity";

function activityDescription(action: ActivityAction, before?: Lead | null, after?: Lead | null) {
  switch (action) {
    case "created":
      return "Lead created";
    case "updated":
      return "Lead updated";
    case "status_changed":
      return `Status changed from ${before?.status ?? "unknown"} to ${after?.status ?? "unknown"}`;
    case "verification_changed":
      return `Verification changed from ${before?.contactVerification ?? "unknown"} to ${after?.contactVerification ?? "unknown"}`;
    case "contacted":
      return "Lead marked as contacted";
    case "follow_up_scheduled":
      return "Follow-up scheduled";
    case "deleted":
      return "Lead deleted";
    default:
      return "Lead updated";
  }
}

export function createLeadServices(jwt: string) {
  const databases = getServerDatabases(jwt);
  const leads = new LeadsRepository(databases);
  const activity = new ActivityRepository(databases);

  return {
    listLeads: (filters: Parameters<LeadsRepository["list"]>[0], ownerId: string) => leads.list(filters, ownerId),
    listAllLeads: (ownerId: string) => leads.listAll(ownerId),
    getLead: (leadId: string, ownerId: string) => leads.getById(leadId, ownerId),
    findPotentialDuplicates: (input: Parameters<LeadsRepository["findPotentialDuplicates"]>[0], ownerId: string) =>
      leads.findPotentialDuplicates(input, ownerId),
    createLead: async (input: LeadInput, ownerId: string) => {
      const created = await leads.create(input, ownerId);
      await activity.create({
        leadId: created.$id,
        ownerId,
        action: "created",
        description: activityDescription("created"),
        metadata: { leadId: created.$id },
      });
      return created;
    },
    updateLead: async (leadId: string, input: LeadInput, ownerId: string) => {
      const before = await leads.getById(leadId, ownerId);
      const updated = await leads.update(leadId, input, ownerId);
      const action: ActivityAction =
        before.contactVerification !== updated.contactVerification
          ? "verification_changed"
          : before.status !== updated.status
            ? "status_changed"
            : before.lastContactedAt !== updated.lastContactedAt
              ? "contacted"
              : before.nextFollowUpAt !== updated.nextFollowUpAt
                ? "follow_up_scheduled"
                : "updated";

      await activity.create({
        leadId,
        ownerId,
        action,
        description: activityDescription(action, before, updated),
        metadata: { before, after: updated },
      });
      return updated;
    },
    updateStatus: async (leadId: string, status: Lead["status"], ownerId: string) => {
      const before = await leads.getById(leadId, ownerId);
      const updated = await leads.updateStatus(leadId, status, ownerId);
      await activity.create({
        leadId,
        ownerId,
        action: "status_changed",
        description: activityDescription("status_changed", before, updated),
        metadata: { beforeStatus: before.status, afterStatus: updated.status },
      });
      return updated;
    },
    markContacted: async (leadId: string, ownerId: string) => {
      const before = await leads.getById(leadId, ownerId);
      const updated = await leads.update(
        leadId,
        { status: "contacted", lastContactedAt: new Date().toISOString() },
        ownerId,
      );
      await activity.create({
        leadId,
        ownerId,
        action: "contacted",
        description: activityDescription("contacted", before, updated),
        metadata: { beforeStatus: before.status, afterStatus: updated.status },
      });
      return updated;
    },
    deleteLead: async (leadId: string, ownerId: string) => {
      await leads.remove(leadId, ownerId);
      await activity.create({
        leadId,
        ownerId,
        action: "deleted",
        description: activityDescription("deleted"),
        metadata: { leadId },
      });
    },
    listActivity: (leadId: string, ownerId: string) => activity.listByLead(leadId, ownerId),
  };
}
