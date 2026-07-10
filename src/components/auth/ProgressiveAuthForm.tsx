"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Step = "signin" | "signin-email" | "otp";

/* Class strings mirror card-compare.html option C exactly:
   .btn  → 9px/12px padding, 8px radius, 13.5px/500, 8px gap
   input → 8px/10px padding, 8px radius, 13px, 10px bottom margin */
const sub = "mb-[18px] text-[13px] text-muted";
const btn =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-[9px] text-[13.5px] font-medium leading-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";
const btnPrimary = `${btn} bg-accent text-on-accent hover:bg-accent-strong`;
const btnGhost = `${btn} border border-white/15 bg-foreground/5 text-foreground hover:bg-foreground/10`;
const btnGitHub = `${btn} border border-white/18 bg-[#1f1f1f] text-white hover:bg-[#262626]`;
const input =
  "mb-2.5 w-full rounded-lg border border-white/15 bg-foreground/5 px-2.5 py-2 text-[13px] text-foreground placeholder:text-faint outline-none focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]";
const textlink =
  "mt-3.5 block w-full cursor-pointer rounded-md text-center text-[12.5px] text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const providerRow = "flex w-[166px] items-center gap-2 text-left";

function Spinner() {
  return (
    <span
      className="h-3.5 w-3.5 flex-none animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
      aria-hidden
    />
  );
}

function GitHubIcon() {
  return (
    <svg className="h-4 w-4 flex-none" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 flex-none" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4 flex-none" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm6 5.5L2.5 4.75v7.5h11v-7.5L8 8.5zM8 7l5.5-2.5h-11L8 7z"
      />
    </svg>
  );
}

function OtpInputs({
  value,
  onChange,
}: {
  value: string;
  onChange: (otp: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  function updateAt(index: number, char: string) {
    const next = digits.map((d, i) => (i === index ? char : d.trim())).join("");
    onChange(next.replace(/\s/g, "").slice(0, 6));
  }

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  return (
    <div className="mt-1.5 mb-3.5 flex gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="w-full rounded-lg border border-white/15 bg-foreground/5 px-0 py-2.5 text-center font-mono text-lg text-foreground outline-none focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          onChange={(e) => {
            const char = e.target.value.replace(/\D/g, "").slice(-1);
            updateAt(i, char);
            if (char && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digit.trim() && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, 6);
            if (pasted) onChange(pasted);
          }}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

export function ProgressiveAuthForm({
  githubEnabled,
  googleEnabled,
}: {
  githubEnabled: boolean;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("signin");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [redirecting, setRedirecting] = useState<"github" | "google" | null>(
    null,
  );

  // back-button from the OAuth page restores this page from bfcache with
  // state intact — clear the spinner so the buttons aren't stuck disabled
  useEffect(() => {
    const reset = () => setRedirecting(null);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  // resend countdown — mirrors the server's send rate limit so users see a
  // timer instead of a raw "too many requests" error
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode() {
    setBusy(true);
    setError(null);
    const res = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "Could not send code");
    } else {
      setOtp("");
      setCooldown(30);
      setStep("otp");
    }
  }

  async function verifyOtp(code = otp) {
    setBusy(true);
    setError(null);
    const res = await authClient.signIn.emailOtp({ email, otp: code });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "Invalid code");
    } else {
      router.push("/");
      router.refresh();
    }
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
          <span className="text-[17px] font-semibold tracking-[-0.02em]">
            Orqly
          </span>
        </div>

        <div className="glass rounded-2xl p-6 leading-[normal]">
          {/* key remount replays the step-in animation on every screen change */}
          <div key={step} className="auth-step">
          {step === "signin" && (
            <>
              <h1 className="mb-1 text-[16px] font-bold leading-[18px]">Welcome to Orqly</h1>
              <p className={sub}>Continue to your workflows.</p>
              <div className="space-y-2">
                {githubEnabled && (
                  <button
                    type="button"
                    disabled={!!redirecting}
                    onClick={() => {
                      setRedirecting("github");
                      void authClient.signIn.social({ provider: "github" });
                    }}
                    className={btnGitHub}
                  >
                    {redirecting === "github" ? (
                      <>
                        <Spinner />
                        Redirecting…
                      </>
                    ) : (
                      /* Fixed-width inner row: icon column and label start at the
                         same x across all three buttons despite label widths */
                      <span className={providerRow}>
                        <GitHubIcon />
                        Continue with GitHub
                      </span>
                    )}
                  </button>
                )}
                {googleEnabled && (
                  <button
                    type="button"
                    disabled={!!redirecting}
                    onClick={() => {
                      setRedirecting("google");
                      void authClient.signIn.social({ provider: "google" });
                    }}
                    className={btnGhost}
                  >
                    {redirecting === "google" ? (
                      <>
                        <Spinner />
                        Redirecting…
                      </>
                    ) : (
                      <span className={providerRow}>
                        <GoogleIcon />
                        Continue with Google
                      </span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("signin-email");
                  }}
                  className={btnGhost}
                >
                  <span className={providerRow}>
                    <MailIcon />
                    Continue with email
                  </span>
                </button>
              </div>
            </>
          )}

          {step === "signin-email" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              <h1 className="mb-1 text-[16px] font-bold leading-[18px]">
                Continue with email
              </h1>
              <p className={sub}>We&apos;ll send you a one-time code.</p>
              <label htmlFor="auth-email" className="sr-only">
                Email address
              </label>
              <input
                id="auth-email"
                className={input}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
                autoComplete="email"
              />
              {error && <p className="mb-2.5 text-sm text-danger">{error}</p>}
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy && <Spinner />}
                {busy ? "Sending…" : "Send code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("signin");
                }}
                className={textlink}
              >
                <b className="font-medium text-accent">← All options</b>
              </button>
            </form>
          )}

          {step === "otp" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verifyOtp();
              }}
            >
              <h1 className="mb-1 text-[16px] font-bold leading-[18px]">Check your email</h1>
              <p className={sub}>
                Enter the 6-digit code we sent to{" "}
                <b className="font-medium text-foreground">{email}</b>
              </p>
              <OtpInputs
                value={otp}
                onChange={(next) => {
                  setOtp(next);
                  // auto-verify the moment the 6th digit lands
                  if (next.length === 6 && !busy) void verifyOtp(next);
                }}
              />
              {error && <p className="mb-2.5 text-sm text-danger">{error}</p>}
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy && <Spinner />}
                {busy ? "Verifying…" : "Verify"}
              </button>
              <p className={textlink}>
                Didn&apos;t get it?
                <button
                  type="button"
                  disabled={busy || cooldown > 0}
                  onClick={() => void sendCode()}
                  className="rounded-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setOtp("");
                  setStep("signin-email");
                }}
                className={textlink}
              >
                <b className="font-medium text-accent">← Use a different email</b>
              </button>
            </form>
          )}
          </div>
        </div>
      </div>
    </main>
  );
}
