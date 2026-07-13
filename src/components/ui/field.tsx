import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  required,
  description,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </Label>
      {children}
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
