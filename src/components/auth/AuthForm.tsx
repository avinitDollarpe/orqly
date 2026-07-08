"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground placeholder:text-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export function AuthForm({
  mode,
  googleEnabled,
}: {
  mode: "sign-in" | "sign-up";
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res =
      mode === "sign-up"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "Something went wrong");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-strong font-mono text-sm font-bold text-white">
            ⌘
          </span>
          <span className="text-lg font-semibold tracking-tight">Orqly</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
          <h1 className="mb-1 text-base font-semibold">
            {mode === "sign-up" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mb-5 text-sm text-muted">
            {mode === "sign-up"
              ? "Start building API workflows in minutes."
              : "Sign in to continue to your workflows."}
          </p>
          <form onSubmit={submit} className="space-y-3">
            {mode === "sign-up" && (
              <input
                className={inputCls}
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              className={inputCls}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={inputCls}
              // Chromium injects caret-color into password fields before
              // hydration, which would otherwise trip React's mismatch check
              suppressHydrationWarning
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-accent-strong px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy
                ? "Please wait…"
                : mode === "sign-up"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
          {googleEnabled && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-faint">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
              <button
                onClick={() => authClient.signIn.social({ provider: "google" })}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium transition hover:bg-surface-2"
              >
                Continue with Google
              </button>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {mode === "sign-up" ? (
            <>
              Already have an account?{" "}
              <Link href="/sign-in" className="text-accent hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to Orqly?{" "}
              <Link href="/sign-up" className="text-accent hover:underline">
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
