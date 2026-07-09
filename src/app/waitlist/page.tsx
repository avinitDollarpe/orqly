"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const btn =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-[9px] text-[13.5px] font-medium leading-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";
const input =
  "mb-2.5 w-full rounded-lg border border-white/15 bg-foreground/5 px-2.5 py-2 text-[13px] text-foreground placeholder:text-faint outline-none focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]";

export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(body: { email?: string; passcode?: string }) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong — try again");
      return false;
    }
    return true;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(208_219_218/0.14)_1.2px,transparent_1.2px)] bg-[size:22px_22px]"
      />
      <div
        aria-hidden
        className="bg-pulse pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_30%,rgb(255_90_25/0.13),transparent_70%)]"
      />
      <div className="relative w-full max-w-[340px]">
        <div className="mb-7 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent font-mono text-[19px] font-bold text-on-accent">
            ⌘
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.02em]">Orqly</span>
        </div>

        <div className="glass rounded-2xl p-6">
          <h1 className="mb-1 text-[16px] font-bold leading-[18px]">
            Orqly is in private beta
          </h1>
          <p className="mb-[18px] text-[13px] text-muted">
            Build, test and simulate API workflows on a visual canvas. Join the
            waitlist and we&apos;ll email you an invite.
          </p>

          {!showCode ? (
            <>
              {joined ? (
                <p className="mb-2.5 rounded-lg border border-(--success)/30 bg-(--success)/10 px-3 py-2.5 text-[13px] text-(--success)">
                  You&apos;re on the list — we&apos;ll be in touch.
                </p>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await submit({ email })) setJoined(true);
                  }}
                >
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={input}
                    aria-label="Email"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className={`${btn} bg-accent text-on-accent hover:bg-accent-strong`}
                  >
                    Join the waitlist
                  </button>
                </form>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowCode(true);
                  setError(null);
                }}
                className="mt-3.5 block w-full cursor-pointer text-center text-[12.5px] text-muted transition hover:text-foreground"
              >
                Have an invite code?
              </button>
            </>
          ) : (
            <>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await submit({ passcode })) {
                    router.push("/sign-in");
                    router.refresh();
                  }
                }}
              >
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Invite code"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className={`${input} font-mono`}
                  aria-label="Invite code"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className={`${btn} bg-accent text-on-accent hover:bg-accent-strong`}
                >
                  Enter beta
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  setShowCode(false);
                  setError(null);
                }}
                className="mt-3.5 block w-full cursor-pointer text-center text-[12.5px] text-muted transition hover:text-foreground"
              >
                Back to waitlist
              </button>
            </>
          )}

          {error && <p className="mt-2.5 text-[13px] text-danger">{error}</p>}
        </div>
      </div>
    </main>
  );
}
