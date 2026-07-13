"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Account } from "appwrite";
import { getBrowserClient } from "@/lib/appwrite/client";
import { authSchema } from "@/lib/validation/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = authSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your login details.");
      return;
    }

    setLoading(true);
    try {
      const account = new Account(getBrowserClient());
      await account.createEmailPasswordSession(parsed.data.email, parsed.data.password);
      const jwt = await account.createJWT();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt: jwt.jwt }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "You do not have access to ClientScout AI.");
      }

      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in right now.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200/70 bg-white/90">
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Email" required error={error && error.toLowerCase().includes("email") ? error : undefined}>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" autoComplete="email" />
          </Field>
          <Field label="Password" required error={error && !error.toLowerCase().includes("email") ? error : undefined}>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Your Appwrite password"
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">First user setup</p>
          <p className="mt-1 leading-6">
            Create the initial user in the Appwrite Console, then assign the <code>clientscoutaccess</code> label before signing in here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
