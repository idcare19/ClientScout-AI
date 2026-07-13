import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 space-y-4", className)}>
      {breadcrumb?.length ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {breadcrumb.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href ? (
                <Link href={item.href} className="hover:text-slate-900">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-900">{item.label}</span>
              )}
              {index < breadcrumb.length - 1 ? <span>/</span> : null}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
