"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { settingsSchema, type SettingsFormInput, type SettingsFormValues } from "@/lib/validation/lead";
import type { Settings } from "@/types/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function toCommaList(values: string[] | undefined) {
  return (values ?? []).join(", ");
}

function fromCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const defaultValues: SettingsFormInput = {
  developerName: "Abhishek",
  portfolioUrl: "https://idcare19.me",
  email: "",
  defaultCountryFilter: "",
  defaultIndustries: [],
  dailyLeadTarget: 0,
  minimumLeadScore: 0,
  followUpAfterDays: 3,
  skills: [
    "Next.js",
    "React",
    "Django",
    "FastAPI",
    "JavaScript",
    "Python",
    "API integration",
    "Business dashboards",
    "SaaS development",
    "Website redesign",
    "Bug fixing",
    "Maintenance",
  ],
  preferredServices: [
    "Business websites",
    "Website redesign",
    "SaaS MVPs",
    "Admin dashboards",
    "API integrations",
    "Booking systems",
    "Bug fixing",
    "Maintenance",
  ],
};

export function SettingsForm({ initialValues, email }: { initialValues?: Settings | null; email: string }) {
  const form = useForm<SettingsFormInput, undefined, SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues
      ? {
          developerName: initialValues.developerName,
          portfolioUrl: initialValues.portfolioUrl,
          email: initialValues.email || email,
          defaultCountryFilter: initialValues.defaultCountryFilter ?? "",
          defaultIndustries: initialValues.defaultIndustries,
          dailyLeadTarget: initialValues.dailyLeadTarget ?? 0,
          minimumLeadScore: initialValues.minimumLeadScore ?? 0,
          followUpAfterDays: initialValues.followUpAfterDays ?? 3,
          skills: initialValues.skills,
          preferredServices: initialValues.preferredServices,
        }
      : { ...defaultValues, email },
  });
  const { register, handleSubmit, formState, setValue, watch } = form;
  const [submitting, setSubmitting] = React.useState(false);
  const defaultIndustries = watch("defaultIndustries");
  const skills = watch("skills");
  const preferredServices = watch("preferredServices");

  const onSubmit = async (values: SettingsFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          defaultIndustries: values.defaultIndustries,
          skills: values.skills,
          preferredServices: values.preferredServices,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to save settings");
      }
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Developer name" error={formState.errors.developerName?.message}>
            <Input {...register("developerName")} />
          </Field>
          <Field label="Portfolio URL" error={formState.errors.portfolioUrl?.message}>
            <Input {...register("portfolioUrl")} />
          </Field>
          <Field label="Email" error={formState.errors.email?.message}>
            <Input {...register("email")} type="email" />
          </Field>
          <Field label="Default country filter">
            <Input {...register("defaultCountryFilter")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Targets and thresholds</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Daily lead target">
            <Input {...register("dailyLeadTarget", { valueAsNumber: true })} type="number" min={0} />
          </Field>
          <Field label="Minimum lead score">
            <Input {...register("minimumLeadScore", { valueAsNumber: true })} type="number" min={0} max={100} />
          </Field>
          <Field label="Follow-up after days">
            <Input {...register("followUpAfterDays", { valueAsNumber: true })} type="number" min={0} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lists</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Default industries" description="Comma-separated list">
            <Textarea
              value={toCommaList(defaultIndustries)}
              onChange={(event) => setValue("defaultIndustries", fromCommaList(event.target.value), { shouldDirty: true })}
            />
          </Field>
          <Field label="Skills" description="Comma-separated list">
            <Textarea
              value={toCommaList(skills)}
              onChange={(event) => setValue("skills", fromCommaList(event.target.value), { shouldDirty: true })}
            />
          </Field>
          <Field label="Preferred services" description="Comma-separated list">
            <Textarea
              value={toCommaList(preferredServices)}
              onChange={(event) => setValue("preferredServices", fromCommaList(event.target.value), { shouldDirty: true })}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
