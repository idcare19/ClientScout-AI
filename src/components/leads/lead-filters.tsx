"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LeadFilters({
  countries,
  industries,
}: {
  countries: string[];
  industries: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clear = () => router.push(pathname);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            defaultValue={searchParams.get("query") ?? ""}
            placeholder="Search by business, contact, email, or phone"
            aria-label="Search leads"
            className="pl-9"
            onChange={(event) => {
              updateParam("query", event.target.value);
            }}
          />
        </div>
        <select
          aria-label="Filter by status"
          className={cn("h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm")}
          defaultValue={searchParams.get("status") ?? "all"}
          onChange={(event) => updateParam("status", event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="researching">Researching</option>
          <option value="verified">Verified</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="interested">Interested</option>
          <option value="won">Won</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          aria-label="Filter by priority"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          defaultValue={searchParams.get("priority") ?? "all"}
          onChange={(event) => updateParam("priority", event.target.value)}
        >
          <option value="all">All priorities</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="review">Review</option>
          <option value="low">Low</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <select
          aria-label="Filter by country"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          defaultValue={searchParams.get("country") ?? "all"}
          onChange={(event) => updateParam("country", event.target.value)}
        >
          <option value="all">All countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by industry"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          defaultValue={searchParams.get("industry") ?? "all"}
          onChange={(event) => updateParam("industry", event.target.value)}
        >
          <option value="all">All industries</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by website status"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          defaultValue={searchParams.get("websiteStatus") ?? "all"}
          onChange={(event) => updateParam("websiteStatus", event.target.value)}
        >
          <option value="all">All website states</option>
          <option value="not_checked">Not checked</option>
          <option value="not_found">Not found</option>
          <option value="active">Active</option>
          <option value="broken">Broken</option>
          <option value="redirecting">Redirecting</option>
          <option value="under_construction">Under construction</option>
          <option value="unrelated">Unrelated</option>
          <option value="good">Good</option>
          <option value="needs_improvement">Needs improvement</option>
        </select>
        <select
          aria-label="Sort leads"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          defaultValue={searchParams.get("sort") ?? "newest"}
          onChange={(event) => updateParam("sort", event.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="score">Score</option>
          <option value="alpha">Alphabetical</option>
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <select
          aria-label="Filter by contact verification"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          defaultValue={searchParams.get("contactVerification") ?? "all"}
          onChange={(event) => updateParam("contactVerification", event.target.value)}
        >
          <option value="all">All verification states</option>
          <option value="unverified">Unverified</option>
          <option value="verified">Verified</option>
          <option value="conflicting">Conflicting</option>
          <option value="invalid">Invalid</option>
          <option value="needs_review">Needs review</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={clear}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
