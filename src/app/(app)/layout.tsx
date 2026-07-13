import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireCurrentUser();
  return <AppShell title="ClientScout AI">{children}</AppShell>;
}
