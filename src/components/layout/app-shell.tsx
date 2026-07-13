"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FolderKanban, Menu, Settings, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBrowserAccount } from "@/lib/appwrite/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: FolderKanban },
  { href: "/leads/import", label: "Import Leads", icon: Plus },
  { href: "/settings", label: "Settings", icon: Settings },
];

async function logout() {
  try {
    await getBrowserAccount().deleteSession("current");
  } catch {
    // Best effort only; the server cookie is still cleared below.
  }
  await fetch("/api/auth/logout", { method: "POST" });
}

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-72 border-r border-slate-200/80 bg-white/90 px-5 py-6 lg:flex lg:flex-col">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">ClientScout AI</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-slate-950">{title}</h1>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">Private workspace</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Only users with the clientscoutaccess label may enter.</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">ClientScout AI</p>
                <h2 className="font-heading text-lg font-semibold text-slate-950">{title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <details className="relative">
                <summary className="list-none">
                  <Button variant="outline" className="rounded-full px-4">
                    Profile
                  </Button>
                </summary>
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </details>
            </div>
          </div>

          {open ? (
            <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                        active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
