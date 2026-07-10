"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  NODE_H,
  NODE_W,
  NodeChevron,
  NodeField,
  NodeMetaBadge,
  NodeTitleRow,
  PlayIcon,
  TaskIcon,
  urlDisplayPath,
} from "@/components/canvas/WorkflowNodeParts";
import { MethodChip, OrqlyMark } from "@/components/shared/ui";
import { METHOD_COLORS } from "@/lib/method-colors";
import type { Method } from "@/lib/types";

/**
 * Waitlist — direction E: you land inside the editor canvas. Full playground
 * demo nodes (Start + seeded API chain) scatter at the periphery; the selected
 * Join waitlist node sits front-center. Invite access is progressive disclosure.
 */

type RunState = "ready" | "running" | "ok" | "failed";

type ApiError = { status: number; label: string; message: string };

function mapPasscodeError(status: number, raw: string): ApiError {
  const lower = raw.toLowerCase();
  if (status === 404 || lower.includes("not found")) {
    return { status: 404, label: "Not Found", message: "Invite does not exist" };
  }
  if (status === 410 || lower.includes("expired")) {
    return { status: 410, label: "Gone", message: "Invite has expired" };
  }
  if (status === 401 || status === 403 || lower.includes("invalid")) {
    return { status: 403, label: "Forbidden", message: "Invalid invite code" };
  }
  return { status, label: "Error", message: raw };
}

function ApiErrorBlock({ error }: { error: ApiError }) {
  return (
    <div className="waitlist-response-panel flex flex-col gap-0.5" role="alert">
      <span className="font-bold text-danger">
        {error.status} {error.label}
      </span>
      <span className="text-muted">{error.message}</span>
    </div>
  );
}

function ApiSuccessBlock({ passcode }: { passcode: string }) {
  return (
    <div className="waitlist-response-panel waitlist-response-panel--success flex flex-col gap-1.5" role="status">
      <div className="flex items-center gap-2">
        <span className="font-bold text-success">200 OK</span>
        <span className="text-[10px] text-muted">GET /beta/access</span>
      </div>
      <span className="text-foreground">Invite validated</span>
      <span className="inline-flex items-center gap-1.5 text-muted">
        <span className="waitlist-launching-dot h-1.5 w-1.5 rounded-full bg-success motion-reduce:animate-none" aria-hidden />
        Launching workspace…
      </span>
      <span className="sr-only">Access granted for invite code {passcode}</span>
    </div>
  );
}

function HeroTitleRow({
  hue,
  title,
  step,
  icon,
}: {
  hue: string;
  title: string;
  step: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-full py-1 pr-1 pl-2"
      style={{
        background: `linear-gradient(to right, color-mix(in srgb, ${hue} 8.2%, transparent), transparent)`,
      }}
    >
      <div
        className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[15px] font-medium tracking-[-0.01em]"
        style={{ color: hue }}
      >
        {icon}
        <span className="truncate">{title}</span>
      </div>
      <span
        className="flex size-5 flex-none items-center justify-center rounded-full border font-mono text-[10px] font-medium"
        style={{ color: hue, borderColor: hue }}
        aria-hidden
      >
        {step}
      </span>
    </div>
  );
}

function HeroMethodTag({ method, hue }: { method: string; hue: string }) {
  return (
    <span
      className="inline-flex flex-none items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide"
      style={{ color: hue, background: `color-mix(in srgb, ${hue} 10%, transparent)` }}
    >
      {method}
    </span>
  );
}

const DEMO_ECHO_URL = "{{env.BASE_URL}}/api/echo";

type BackdropDepth = "far" | "mid" | "near";

function BackdropShell({
  depth,
  children,
}: {
  depth: BackdropDepth;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`workflow-node waitlist-backdrop-node waitlist-backdrop-node--${depth} flex flex-col gap-2 rounded-[20px] p-2`}
      style={{ width: NODE_W, height: NODE_H }}
    >
      {children}
    </div>
  );
}

/** Start node — matches `StartNode` on the playground canvas. */
function BackdropStartNode({ depth }: { depth: BackdropDepth }) {
  const hue = "var(--success)";
  return (
    <BackdropShell depth={depth}>
      <NodeTitleRow hue={hue} icon={<PlayIcon />} title="Start" step={0} />
      <NodeField>
        <span className="truncate text-[13px] leading-snug text-muted">
          Entry point for your workflow
        </span>
      </NodeField>
      <div className="flex px-1">
        <NodeMetaBadge chip="Trigger" hue={hue} />
      </div>
    </BackdropShell>
  );
}

/** API node — matches `ApiNode` shells from the seeded demo workflow. */
function BackdropApiNode({
  depth,
  label,
  step,
  method,
  url = DEMO_ECHO_URL,
}: {
  depth: BackdropDepth;
  label: string;
  step: number;
  method: Method;
  url?: string;
}) {
  const hue = METHOD_COLORS[method].color;
  return (
    <BackdropShell depth={depth}>
      <NodeTitleRow hue={hue} icon={<TaskIcon />} title={label} step={step} />
      <NodeField trailing={<NodeChevron />}>
        <MethodChip method={method} className="shrink-0" />
        <span className="min-w-0 truncate font-mono text-[12px] leading-none text-foreground">
          {urlDisplayPath(url)}
        </span>
      </NodeField>
      <div className="flex px-1">
        <NodeMetaBadge chip="Ready" hue="var(--accent)" />
      </div>
    </BackdropShell>
  );
}

/** Seeded demo nodes — same labels, methods and URL as `seed.ts`. */
const SCATTERED_NODES = [
  { kind: "start" as const, depth: "far" as const, className: "top-[7%] left-[2%]" },
  {
    kind: "api" as const,
    label: "Create Customer",
    step: 1,
    method: "POST" as const,
    depth: "mid" as const,
    className: "top-[3.75rem] right-[2%]",
    align: "right" as const,
  },
  {
    kind: "api" as const,
    label: "Share KYC",
    step: 2,
    method: "POST" as const,
    depth: "mid" as const,
    className: "top-[38%] left-[1%]",
  },
  {
    kind: "api" as const,
    label: "Create Payout",
    step: 3,
    method: "POST" as const,
    depth: "near" as const,
    className: "bottom-[6%] right-[2%]",
    align: "right" as const,
  },
] as const;

/**
 * Background canvas — full playground node shells scattered at the periphery.
 * Clears the hero center; depth tiers keep peripheral nodes from competing.
 */
function CanvasBackdrop() {
  return (
    <div
      className="waitlist-backdrop pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden
    >
      {SCATTERED_NODES.map((node, i) => (
        <div
          key={node.kind === "start" ? "start" : node.label}
          className={`waitlist-backdrop-float absolute ${node.className}${"align" in node && node.align === "right" ? " waitlist-backdrop-anchor-right" : ""}`}
          style={{ animationDelay: `${i * 2.4}s` }}
        >
          {node.kind === "start" ? (
            <BackdropStartNode depth={node.depth} />
          ) : (
            <BackdropApiNode
              depth={node.depth}
              label={node.label}
              step={node.step}
              method={node.method}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function HeroCardGlow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[380px] sm:max-w-[400px]">
      <div
        aria-hidden
        className="waitlist-hero-glow bg-pulse pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[40px] motion-reduce:animate-none"
      />
      {children}
    </div>
  );
}

/** Node-styled hero form: title row, method tag + input + submit, response slot. */
function HeroCard({
  state,
  onSubmit,
  title,
  method,
  okValue,
  okValueClass = "",
  input,
  submitLabel,
  busyLabel,
  runningText,
  response,
}: {
  state: RunState;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  method: Method;
  /** Shown in the input row once the request succeeded. */
  okValue: string;
  okValueClass?: string;
  input: React.ReactNode;
  submitLabel: string;
  /** Screen-reader label while the request is running. */
  busyLabel: string;
  runningText: string;
  /** Failed / success blocks for the response slot. */
  response: React.ReactNode;
}) {
  const hue = METHOD_COLORS[method].color;
  return (
    <HeroCardGlow>
      <form
        onSubmit={onSubmit}
        className={`waitlist-card workflow-node workflow-node--selected relative flex w-full flex-col gap-2 rounded-[20px] p-2 ${
          state === "running" ? "node-running motion-reduce:animate-none" : ""
        } ${state === "failed" ? "waitlist-card--error" : ""} ${
          state === "ok" ? "waitlist-card--validated" : ""
        }`}
        aria-busy={state === "running"}
      >
        <HeroTitleRow
          hue={state === "ok" ? "var(--success)" : "var(--accent)"}
          title={title}
          step="1"
        />
        {state === "ok" ? (
          <div className="waitlist-input-row waitlist-input-row--success flex items-center gap-2 rounded-xl border bg-foreground/[0.03] p-1.5 pl-3">
            <HeroMethodTag method={method} hue={hue} />
            <span
              className={`min-w-0 flex-1 truncate font-mono text-xs text-foreground ${okValueClass}`}
            >
              {okValue}
            </span>
            <span className="inline-flex h-9 flex-none items-center gap-1 rounded-lg border border-success/30 bg-success/10 px-3 font-mono text-[11px] font-bold text-success">
              <Check size={12} strokeWidth={2.5} aria-hidden />
              OK
            </span>
          </div>
        ) : (
          <div
            className={`waitlist-input-row flex items-center gap-2 rounded-xl border border-white/12 bg-foreground/[0.03] p-1.5 pl-3 ${
              state === "failed" ? "waitlist-input-row--error" : ""
            }`}
          >
            <HeroMethodTag method={method} hue={hue} />
            {input}
            <button
              type="submit"
              disabled={state === "running"}
              className="waitlist-join-btn flex h-9 min-w-[4.5rem] flex-none cursor-pointer items-center justify-center rounded-lg bg-accent px-4 text-[13.5px] font-semibold text-on-accent disabled:opacity-60"
            >
              {state === "running" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  <span className="sr-only">{busyLabel}</span>
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        )}
        <div className="waitlist-response-slot" aria-live="polite">
          {response}
          {state === "running" && (
            <p className="waitlist-response-panel text-xs text-muted">{runningText}</p>
          )}
        </div>
      </form>
    </HeroCardGlow>
  );
}

const TRUST_ITEMS = ["No spam", "Early access", "Help shape Orqly"] as const;

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL;
const X_URL = process.env.NEXT_PUBLIC_X_URL;

function WaitlistSuccessBlock({ email }: { email: string }) {
  return (
    <div className="waitlist-response-panel waitlist-response-panel--success flex flex-col gap-1.5" role="status">
      <div className="flex items-center gap-2">
        <span className="font-bold text-success">201 Created</span>
        <span className="text-[10px] text-muted">POST /waitlist</span>
      </div>
      <span className="text-foreground">You&apos;re on the waitlist!</span>
      <span className="text-muted">We&apos;ll send your invite as soon as your access is ready.</span>
      {(DISCORD_URL || X_URL) && (
        <div className="mt-1 flex flex-wrap gap-2">
          {DISCORD_URL && (
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="waitlist-social-btn"
            >
              Join Discord
            </a>
          )}
          {X_URL && (
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className="waitlist-social-btn">
              Follow on X
            </a>
          )}
        </div>
      )}
      <span className="sr-only">Waitlist signup confirmed for {email}</span>
    </div>
  );
}

export default function WaitlistPage() {
  const router = useRouter();
  const inviteInputId = useId();
  const inviteRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [joinState, setJoinState] = useState<RunState>("ready");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [codeState, setCodeState] = useState<RunState>("ready");
  const [codeError, setCodeError] = useState<ApiError | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [cardVisible, setCardVisible] = useState(true);

  async function post(body: { email?: string; passcode?: string }) {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true as const };
    const data = await res.json().catch(() => null);
    const error = (data?.error as string) ?? "Something went wrong — try again";
    return { ok: false as const, status: res.status, error };
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setJoinState("running");
    setJoinError(null);
    const result = await post({ email });
    if (!result.ok) {
      setJoinState("failed");
      setJoinError(result.error);
    } else {
      setJoinState("ok");
    }
  }

  async function enterBeta(e: React.FormEvent) {
    e.preventDefault();
    setCodeState("running");
    setCodeError(null);
    const result = await post({ passcode: passcode.trim().toUpperCase() });
    if (!result.ok) {
      setCodeState("failed");
      setCodeError(mapPasscodeError(result.status, result.error));
    } else {
      setCodeState("ok");
      setTimeout(() => {
        router.push("/sign-in");
        router.refresh();
      }, 1200);
    }
  }

  const switchCard = useCallback(
    (toInvite: boolean) => {
      if (toInvite === showInvite) return;
      setCardVisible(false);
      window.setTimeout(() => {
        setShowInvite(toInvite);
        requestAnimationFrame(() => {
          setCardVisible(true);
          if (toInvite) inviteRef.current?.focus();
        });
      }, 150);
    },
    [showInvite],
  );

  function openInvite() {
    switchCard(true);
  }

  function openWaitlist() {
    switchCard(false);
  }

  const joined = joinState === "ok";

  useEffect(() => {
    if (!showInvite || joinState === "ok") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        switchCard(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showInvite, joinState, switchCard]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(208_219_218/0.14)_1.2px,transparent_1.2px)] bg-[size:22px_22px]"
      />
      <div
        aria-hidden
        className="bg-pulse pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_30%,rgb(255_90_25/0.13),transparent_70%)] motion-reduce:animate-none"
      />

      <header className="absolute top-4 right-4 left-4 z-40 flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-accent text-on-accent">
            <OrqlyMark className="h-[19px] w-[19px]" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Orqly</span>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-accent uppercase">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none"
            aria-hidden
          />
          Private beta
        </span>
      </header>

      <div className="relative min-h-screen">
        <CanvasBackdrop />

        <div className="waitlist-vignette absolute inset-0" aria-hidden />

        <div className="relative z-30 flex min-h-screen flex-col items-center justify-center px-6 py-24">
          <div className="waitlist-hero-enter flex w-full max-w-[790px] flex-col items-center">
            <h1 className="waitlist-headline max-w-[790px] text-center text-[clamp(26px,5vw,40px)] font-extrabold">
              <span className="block">Visual API workflows.</span>
              <span className="block">
                Watch the entire flow <span className="text-accent">run.</span>
              </span>
            </h1>
            <p className="waitlist-subheading mt-10 max-w-[52ch] text-center text-[16px] leading-relaxed">
              Build, run and debug API workflows in one visual canvas.
            </p>

            <div className="waitlist-card-enter mt-10 flex w-full justify-center">
              <div
                className={`waitlist-card-switch flex w-full justify-center ${cardVisible ? "is-visible" : "is-exiting"}`}
              >
          {showInvite ? (
            <HeroCard
              state={codeState}
              onSubmit={enterBeta}
              title="Access Beta"
              method="GET"
              okValue={passcode}
              okValueClass="uppercase"
              submitLabel="Run"
              busyLabel="Validating invite"
              runningText="Validating invite…"
              input={
                <>
                  <label htmlFor={inviteInputId} className="sr-only">
                    Invite code
                  </label>
                  <input
                    ref={inviteRef}
                    id={inviteInputId}
                    type="text"
                    required
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="ORQLY-9XK2-P7LM"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value.toUpperCase());
                      if (codeState === "failed") setCodeState("ready");
                    }}
                    disabled={codeState === "running"}
                    aria-invalid={codeState === "failed"}
                    aria-describedby={codeError ? "invite-code-error" : undefined}
                    className="waitlist-email-field h-8 w-full min-w-0 flex-1 bg-transparent font-mono text-xs uppercase text-foreground outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-muted/80"
                  />
                </>
              }
              response={
                <>
                  {codeState === "failed" && codeError && (
                    <div id="invite-code-error">
                      <ApiErrorBlock error={codeError} />
                    </div>
                  )}
                  {codeState === "ok" && (
                    <div id="invite-code-success">
                      <ApiSuccessBlock passcode={passcode} />
                    </div>
                  )}
                </>
              }
            />
          ) : (
            <HeroCard
              state={joinState}
              onSubmit={joinWaitlist}
              title="Join waitlist"
              method="POST"
              okValue={email}
              submitLabel="Join"
              busyLabel="Joining waitlist"
              runningText="Joining waitlist…"
              input={
                <>
                  <label htmlFor="waitlist-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    required
                    autoFocus={!showInvite}
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (joinState === "failed") setJoinState("ready");
                    }}
                    disabled={joinState === "running"}
                    aria-invalid={joinState === "failed"}
                    aria-describedby={joinError ? "waitlist-email-error" : undefined}
                    className="waitlist-email-field h-8 w-full min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-muted/80"
                  />
                </>
              }
              response={
                <>
                  {joinState === "failed" && joinError && (
                    <p
                      id="waitlist-email-error"
                      className="waitlist-response-panel text-danger"
                      role="alert"
                    >
                      {joinError}
                    </p>
                  )}
                  {joinState === "ok" && (
                    <div id="waitlist-email-success">
                      <WaitlistSuccessBlock email={email} />
                    </div>
                  )}
                </>
              }
            />
          )}
              </div>
            </div>

            {!joined && (
              <ul
                className="waitlist-trust-row mt-10 flex flex-wrap items-center justify-center gap-y-2 text-[12px] leading-none"
                aria-label="Waitlist benefits"
              >
                {TRUST_ITEMS.map((item, index) => (
                  <li key={item} className="inline-flex items-center">
                    {index > 0 && (
                      <span className="waitlist-trust-sep px-3" aria-hidden>
                        ·
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Check
                        size={13}
                        strokeWidth={2.5}
                        className="shrink-0 text-success"
                        aria-hidden
                      />
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {!joined && (
            <button
              type="button"
              onClick={showInvite ? openWaitlist : openInvite}
              className="group mt-8 cursor-pointer border-none bg-transparent text-[11px] text-faint focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {showInvite ? (
                <>
                  Don&apos;t have an invite?{" "}
                  <span className="text-muted underline-offset-2 transition-[color,text-decoration-color] duration-200 group-hover:text-accent group-hover:underline">
                    Join the waitlist
                    <span className="waitlist-invite-arrow" aria-hidden>
                      {" "}
                      →
                    </span>
                  </span>
                </>
              ) : (
                <>
                  Already have an invite?{" "}
                  <span className="text-muted underline-offset-2 transition-[color,text-decoration-color] duration-200 group-hover:text-accent group-hover:underline">
                    Skip the waitlist
                    <span className="waitlist-invite-arrow" aria-hidden>
                      {" "}
                      →
                    </span>
                  </span>
                </>
              )}
            </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
