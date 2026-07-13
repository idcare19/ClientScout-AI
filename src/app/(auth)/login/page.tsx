import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass w-full max-w-5xl overflow-hidden rounded-[2rem]">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative flex flex-col justify-between bg-slate-950 px-8 py-10 text-white lg:px-12 lg:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.22),transparent_32%)]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">ClientScout AI</p>
              <h1 className="mt-4 max-w-lg font-heading text-4xl font-semibold leading-tight">
                A private CRM for carefully managed client scouting.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Phase 1 focuses on manual leads, secure authentication, and Appwrite-backed workflows with no public signup.
              </p>
            </div>
            <div className="relative mt-12 grid grid-cols-2 gap-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Protected access
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Real Appwrite data
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Manual review first
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                No public signup
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12">
            <div className="max-w-md">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">Sign in</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-950">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in with your Appwrite account. Only users labeled <span className="font-medium">clientscoutaccess</span> can enter.
              </p>
            </div>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
