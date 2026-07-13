"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteDialog({
  trigger,
  title = "Delete lead?",
  description = "This action cannot be undone.",
  onConfirm,
}: {
  trigger: React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>;
  title?: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  return (
    <>
      {React.cloneElement(trigger, {
        onClick: () => setOpen(true),
      })}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft">
            <h3 className="font-heading text-xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await onConfirm();
                    setOpen(false);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
