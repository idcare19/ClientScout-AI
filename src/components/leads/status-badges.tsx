import { Badge } from "@/components/ui/badge";
import type {
  ContactVerificationStatus,
  LeadPriority,
  LeadStatus,
  WebsiteStatus,
} from "@/types/lead";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const variant = status === "won" ? "success" : status === "rejected" || status === "not_interested" ? "danger" : "default";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}

export function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  const variant = priority === "hot" ? "danger" : priority === "warm" ? "warning" : priority === "review" ? "info" : priority === "rejected" ? "outline" : "default";
  return <Badge variant={variant}>{priority}</Badge>;
}

export function VerificationBadge({ value }: { value: ContactVerificationStatus }) {
  const variant = value === "verified" ? "success" : value === "conflicting" || value === "invalid" ? "danger" : value === "needs_review" ? "warning" : "default";
  return <Badge variant={variant}>{value.replaceAll("_", " ")}</Badge>;
}

export function WebsiteStatusBadge({ value }: { value: WebsiteStatus }) {
  const variant = value === "active" || value === "good" ? "success" : value === "broken" || value === "not_found" || value === "unrelated" ? "danger" : value === "needs_improvement" ? "warning" : "default";
  return <Badge variant={variant}>{value.replaceAll("_", " ")}</Badge>;
}

export function LeadScoreBadge({ score }: { score: number }) {
  const variant = score >= 80 ? "danger" : score >= 60 ? "warning" : score >= 40 ? "info" : score >= 20 ? "default" : "outline";
  return <Badge variant={variant}>{score}</Badge>;
}
