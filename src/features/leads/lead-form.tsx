"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  businessTypes,
  contactVerificationStatuses,
  leadPriorities,
  leadStatuses,
  websiteStatuses,
} from "@/types/lead";
import { leadFormSchema, type LeadFormInput, type LeadFormValues } from "@/lib/validation/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const defaultValues: LeadFormInput = {
  businessName: "",
  contactPerson: null,
  industry: "",
  businessType: "other",
  country: "",
  city: null,
  timezone: null,
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  instagram: null,
  linkedin: null,
  facebook: null,
  otherSocialUrl: null,
  sourceName: "",
  sourceUrl: null,
  sourceNotes: null,
  websiteStatus: "not_checked",
  contactVerification: "unverified",
  verificationConfidence: null,
  verificationNotes: null,
  mainOpportunity: null,
  recommendedService: null,
  status: "new",
  priority: "review",
  notes: null,
  lastContactedAt: null,
  nextFollowUpAt: null,
  demoUrl: null,
};

type LeadFormProps = {
  mode: "create" | "edit";
  leadId?: string;
  initialValues?: Partial<LeadFormInput>;
  submitLabel?: string;
};

export function LeadForm({ mode, leadId, initialValues, submitLabel }: LeadFormProps) {
  const router = useRouter();
  const form = useForm<LeadFormInput, undefined, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const { register, handleSubmit, formState, watch } = form;
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (formState.isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [formState.isDirty]);

  const onSubmit = async (values: LeadFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch(mode === "create" ? "/api/leads" : `/api/leads/${leadId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string; lead?: { $id: string } } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to save lead");
      }
      toast.success(mode === "create" ? "Lead created" : "Lead updated");
      router.push(`/leads/${payload?.lead?.$id ?? leadId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save lead");
    } finally {
      setSubmitting(false);
    }
  };

  const sourceName = watch("sourceName");
  const sourceUrl = watch("sourceUrl");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" required error={formState.errors.businessName?.message}>
              <Input {...register("businessName")} />
            </Field>
            <Field label="Contact person" error={formState.errors.contactPerson?.message}>
              <Input {...register("contactPerson")} />
            </Field>
            <Field label="Industry" required error={formState.errors.industry?.message}>
              <Input {...register("industry")} />
            </Field>
            <Field label="Business type">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" {...register("businessType")}>
                {businessTypes.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" required error={formState.errors.country?.message}>
              <Input {...register("country")} />
            </Field>
            <Field label="City">
              <Input {...register("city")} />
            </Field>
            <Field label="Timezone">
              <Input {...register("timezone")} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={formState.errors.email?.message}>
              <Input {...register("email")} type="email" />
            </Field>
            <Field label="Phone" error={formState.errors.phone?.message}>
              <Input {...register("phone")} />
            </Field>
            <Field label="WhatsApp">
              <Input {...register("whatsapp")} />
            </Field>
            <div />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Online presence</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Website" error={formState.errors.website?.message}>
              <Input {...register("website")} />
            </Field>
            <Field label="Instagram">
              <Input {...register("instagram")} />
            </Field>
            <Field label="LinkedIn">
              <Input {...register("linkedin")} />
            </Field>
            <Field label="Facebook">
              <Input {...register("facebook")} />
            </Field>
            <Field label="Other social URL" className="sm:col-span-2">
              <Input {...register("otherSocialUrl")} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source evidence</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Source name" error={formState.errors.sourceName?.message} description="Provide either a source name or a source URL.">
              <Input {...register("sourceName")} />
            </Field>
            <Field label="Source URL" error={formState.errors.sourceUrl?.message}>
              <Input {...register("sourceUrl")} />
            </Field>
            <Field label="Source notes">
              <Textarea {...register("sourceNotes")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Website status">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" {...register("websiteStatus")}>
                {websiteStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Contact verification">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" {...register("contactVerification")}>
                {contactVerificationStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Verification confidence">
              <Input {...register("verificationConfidence", { valueAsNumber: true })} type="number" min={0} max={100} />
            </Field>
            <Field label="Verification notes">
              <Textarea {...register("verificationNotes")} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Opportunity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Main opportunity">
              <Textarea {...register("mainOpportunity")} />
            </Field>
            <Field label="Recommended service">
              <Input {...register("recommendedService")} />
            </Field>
            <Field label="Demo URL">
              <Input {...register("demoUrl")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CRM status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" {...register("status")}>
                {leadStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" {...register("priority")}>
                {leadPriorities.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Last contacted at">
              <Input {...register("lastContactedAt")} type="datetime-local" />
            </Field>
            <Field label="Next follow-up at">
              <Input {...register("nextFollowUpAt")} type="datetime-local" />
            </Field>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Internal notes">
            <Textarea {...register("notes")} className="min-h-40" />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          {sourceName || sourceUrl ? "Source evidence captured." : "Source evidence is required for verified leads."}
        </div>
        <Button type="submit" disabled={submitting} className={cn("min-w-36")}>
          {submitting ? "Saving..." : submitLabel ?? (mode === "create" ? "Create lead" : "Update lead")}
        </Button>
      </div>
    </form>
  );
}
