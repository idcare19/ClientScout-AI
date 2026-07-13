"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { leadStatuses, type Lead } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeadFilters } from "./lead-filters";
import { LeadPriorityBadge, LeadScoreBadge, LeadStatusBadge, VerificationBadge, WebsiteStatusBadge } from "./status-badges";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { ExternalContactLinks } from "./external-contact-links";
import { cn } from "@/lib/utils";

async function updateLeadStatus(leadId: string, status: string) {
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

export function LeadTable({
  leads,
  total,
  page,
  limit,
  countries,
  industries,
}: {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  countries: string[];
  industries: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const exportParams = new URLSearchParams(searchParams.toString());
  exportParams.delete("page");

  const gotoPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/leads?${params.toString()}`);
  };

  const deleteLead = async (leadId: string) => {
    const response = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Delete failed");
    toast.success("Lead deleted");
    router.refresh();
  };

  const exportHref = selectedIds.size
    ? `/api/leads/export?ids=${encodeURIComponent([...selectedIds].join(","))}`
    : `/api/leads/export?${exportParams.toString()}`;

  return (
    <div className="space-y-6">
      <LeadFilters countries={countries} industries={industries} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{selectedIds.size ? `${selectedIds.size} selected` : "Select leads for specific export."}</p>
        <Button asChild variant="outline">
          <a href={exportHref}>Export selected</a>
        </Button>
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all leads on this page"
                  checked={selectedIds.size > 0 && selectedIds.size === leads.length}
                  onChange={(event) => setSelectedIds(event.target.checked ? new Set(leads.map((lead) => lead.$id)) : new Set())}
                />
              </th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.$id} className="border-t border-slate-200">
                <td className="px-4 py-4">
                    <input
                    type="checkbox"
                    aria-label={`Select ${lead.businessName}`}
                    checked={selectedIds.has(lead.$id)}
                    onChange={(event) => {
                      const next = new Set(selectedIds);
                      if (event.target.checked) next.add(lead.$id);
                      else next.delete(lead.$id);
                      setSelectedIds(next);
                    }}
                  />
                </td>
                <td className="px-4 py-4">
                  <Link href={`/leads/${lead.$id}`} className="font-medium text-slate-950 hover:underline">
                    {lead.businessName}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">{lead.contactPerson ?? "No contact named"}</p>
                </td>
                <td className="px-4 py-4 text-slate-700">{lead.industry}</td>
                <td className="px-4 py-4 text-slate-700">{lead.country}</td>
                <td className="px-4 py-4">
                  <ExternalContactLinks email={lead.email} phone={lead.phone} whatsapp={lead.whatsapp} website={lead.website} />
                </td>
                <td className="px-4 py-4">
                  <WebsiteStatusBadge value={lead.websiteStatus} />
                </td>
                <td className="px-4 py-4">
                  <VerificationBadge value={lead.contactVerification} />
                </td>
                <td className="px-4 py-4">
                  <LeadScoreBadge score={lead.leadScore} />
                </td>
                <td className="px-4 py-4">
                  <LeadPriorityBadge priority={lead.priority} />
                </td>
                <td className="px-4 py-4">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/leads/${lead.$id}`}>View</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/leads/${lead.$id}/edit`}>Edit</Link>
                    </Button>
                    <select
                      aria-label={`Change status for ${lead.businessName}`}
                      className={cn("h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs")}
                      defaultValue={lead.status}
                      onChange={async (event) => {
                        try {
                          await updateLeadStatus(lead.$id, event.target.value);
                          toast.success("Status updated");
                          router.refresh();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Status update failed");
                        }
                      }}
                    >
                      {leadStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <ConfirmDeleteDialog
                      trigger={
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      }
                      onConfirm={() => deleteLead(lead.$id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 lg:hidden">
        {leads.map((lead) => (
          <Card key={lead.$id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/leads/${lead.$id}`} className="font-medium text-slate-950">
                    {lead.businessName}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {lead.industry} · {lead.country}
                  </p>
                </div>
                <LeadScoreBadge score={lead.leadScore} />
              </div>
              <div className="flex flex-wrap gap-2">
                <LeadStatusBadge status={lead.status} />
                <LeadPriorityBadge priority={lead.priority} />
                <VerificationBadge value={lead.contactVerification} />
                <WebsiteStatusBadge value={lead.websiteStatus} />
              </div>
              <ExternalContactLinks email={lead.email} phone={lead.phone} whatsapp={lead.whatsapp} website={lead.website} />
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/leads/${lead.$id}`}>View</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/leads/${lead.$id}/edit`}>Edit</Link>
                </Button>
                <select
                  aria-label={`Change status for ${lead.businessName}`}
                  className={cn("h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs")}
                  defaultValue={lead.status}
                  onChange={async (event) => {
                    try {
                      await updateLeadStatus(lead.$id, event.target.value);
                      toast.success("Status updated");
                      router.refresh();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Status update failed");
                    }
                  }}
                >
                  {leadStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <ConfirmDeleteDialog
                  trigger={
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  }
                  onConfirm={() => deleteLead(lead.$id)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => gotoPage(page - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => gotoPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
