"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { leadStatuses, type Lead } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

async function saveLead(lead: Lead, patch: Partial<Lead>) {
  const response = await fetch(`/api/leads/${lead.$id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...lead, ...patch }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Lead update failed");
  }
}

async function changeStatus(leadId: string, status: Lead["status"]) {
  const response = await fetch(`/api/leads/${leadId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "Status update failed");
  }
}

export function LeadActions({ lead }: { lead: Lead }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label="Change lead status"
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        defaultValue={lead.status}
        onChange={(event) =>
          changeStatus(lead.$id, event.target.value as Lead["status"])
            .then(() => router.refresh())
            .catch((error) => toast.error(error.message))
        }
      >
        {leadStatuses.map((status) => (
          <option key={status} value={status}>
            {status.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        onClick={() =>
          saveLead(lead, {
            contactVerification: "verified",
            status: "verified",
          })
            .then(() => router.refresh())
            .catch((error) => toast.error(error.message))
        }
      >
        Mark Verified
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          fetch(`/api/leads/${lead.$id}/contacted`, { method: "POST" })
            .then(async (response) => {
              if (!response.ok) throw new Error("Unable to mark contacted");
              router.refresh();
            })
            .catch((error) => toast.error(error.message))
        }
      >
        Mark Contacted
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          const nextFollowUpAt = window.prompt("Enter follow-up date/time (ISO or local datetime):");
          if (!nextFollowUpAt) return;
          saveLead(lead, { nextFollowUpAt })
            .then(() => router.refresh())
            .catch((error) => toast.error(error.message));
        }}
      >
        Schedule Follow-up
      </Button>
      <ConfirmDeleteDialog
        trigger={
          <Button variant="destructive">
            Delete Lead
          </Button>
        }
        onConfirm={async () => {
          const response = await fetch(`/api/leads/${lead.$id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("Delete failed");
          router.push("/leads");
          router.refresh();
        }}
      />
    </div>
  );
}
