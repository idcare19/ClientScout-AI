import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass max-w-lg rounded-3xl p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Not found</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-slate-900">This lead no longer exists</h1>
        <p className="mt-3 text-sm text-slate-600">
          The record may have been deleted or you may not have access to it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/leads">Back to leads</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
