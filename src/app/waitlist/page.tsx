"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The waitlist is a locked workflow, rendered in the product's own node
 * grammar: Start → POST /waitlist (the email form IS the node) → GET /orqly
 * (locked until an invite code runs it). Submitting "runs" your node —
 * status chips and edges behave exactly like a real canvas run.
 */

type RunState = "ready" | "running" | "ok" | "failed";

function StatusChip({
  state,
  labels,
  detail,
}: {
  state: RunState | "locked";
  labels?: Partial<Record<RunState | "locked", string>>;
  detail?: string | null;
}) {
  const hue =
    state === "ok"
      ? "var(--success)"
      : state === "failed"
        ? "var(--danger)"
        : state === "locked"
          ? "var(--faint)"
          : "var(--accent)";
  const text =
    labels?.[state] ??
    { ready: "Ready", running: "Running", ok: "OK", failed: "Failed", locked: "Locked" }[
      state
    ];
  return (
    <div className="flex min-w-0 items-center gap-2 px-1" aria-live="polite">
      <span
        className="inline-flex flex-none items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide uppercase"
        style={{ color: hue, background: `color-mix(in srgb, ${hue} 10%, transparent)` }}
      >
        {state === "running" && (
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
        )}
        {text}
      </span>
      {detail && <span className="min-w-0 truncate text-xs text-muted">{detail}</span>}
    </div>
  );
}

type EdgeState = "idle" | "running" | "done";

const edgeStroke = (state: EdgeState) =>
  state === "done"
    ? "var(--success)"
    : state === "running"
      ? "var(--accent)"
      : "color-mix(in srgb, var(--foreground) 22%, var(--border-strong))";

const edgeDash = (state: EdgeState) =>
  state === "running" ? "6 4" : undefined;

const edgeAnim = (state: EdgeState) =>
  state === "running"
    ? "animate-[edge-dash_0.5s_linear_infinite] motion-reduce:animate-none"
    : undefined;

/**
 * Start fans out to both branches — the canvas's own smoothstep fork.
 * Desktop only; mobile stacks the branches with plain vertical edges.
 */
function ForkEdges({ left, right }: { left: EdgeState; right: EdgeState }) {
  return (
    <svg
      viewBox="0 0 400 44"
      className="hidden h-11 w-full sm:block"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M200 2 V14 Q200 20 194 20 H106 Q100 20 100 26 V42"
        fill="none"
        stroke={edgeStroke(left)}
        strokeWidth={left === "idle" ? 1.75 : 2}
        strokeDasharray={edgeDash(left)}
        className={edgeAnim(left)}
      />
      <path
        d="M200 2 V14 Q200 20 206 20 H294 Q300 20 300 26 V42"
        fill="none"
        stroke={edgeStroke(right)}
        strokeWidth={right === "idle" ? 1.75 : 2}
        strokeDasharray={edgeDash(right)}
        className={edgeAnim(right)}
      />
      {[
        [200, 3, left === "idle" && right === "idle" ? "idle" : left !== "idle" ? left : right],
        [100, 41, left],
        [300, 41, right],
      ].map(([x, y, s], i) => (
        <circle
          key={i}
          cx={x as number}
          cy={y as number}
          r="3"
          fill="var(--surface)"
          stroke={s === "idle" ? "var(--border-strong)" : edgeStroke(s as EdgeState)}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

/** Vertical wire between nodes — same stroke grammar as canvas edges. */
function Edge({ state }: { state: EdgeState }) {
  const stroke =
    state === "done"
      ? "var(--success)"
      : state === "running"
        ? "var(--accent)"
        : "color-mix(in srgb, var(--foreground) 22%, var(--border-strong))";
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <span
        className="h-[7px] w-[7px] rounded-full border-[1.5px] bg-surface"
        style={{ borderColor: state === "idle" ? "var(--border-strong)" : stroke }}
      />
      <svg width="2" height="34" className="-my-px">
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="34"
          stroke={stroke}
          strokeWidth={state === "idle" ? 1.75 : 2}
          strokeDasharray={state === "running" ? "6 4" : undefined}
          className={
            state === "running"
              ? "animate-[edge-dash_0.5s_linear_infinite] motion-reduce:animate-none"
              : undefined
          }
        />
      </svg>
      <span
        className="h-[7px] w-[7px] rounded-full border-[1.5px] bg-surface"
        style={{ borderColor: state === "idle" ? "var(--border-strong)" : stroke }}
      />
    </div>
  );
}

function NodeTitleRow({
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

function MethodTag({ method, hue }: { method: string; hue: string }) {
  return (
    <span
      className="inline-flex flex-none items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide"
      style={{ color: hue, background: `color-mix(in srgb, ${hue} 10%, transparent)` }}
    >
      {method}
    </span>
  );
}

export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [joinState, setJoinState] = useState<RunState>("ready");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [codeState, setCodeState] = useState<RunState | "locked">("locked");
  const [codeError, setCodeError] = useState<string | null>(null);

  async function post(body: { email?: string; passcode?: string }) {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => null);
    return (data?.error as string) ?? "Something went wrong — try again";
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setJoinState("running");
    setJoinError(null);
    const error = await post({ email });
    if (error) {
      setJoinState("failed");
      setJoinError(error);
    } else {
      setJoinState("ok");
    }
  }

  async function enterBeta(e: React.FormEvent) {
    e.preventDefault();
    setCodeState("running");
    setCodeError(null);
    const error = await post({ passcode });
    if (error) {
      setCodeState("failed");
      setCodeError(error);
    } else {
      setCodeState("ok");
      setTimeout(() => {
        router.push("/sign-in");
        router.refresh();
      }, 700);
    }
  }

  const joined = joinState === "ok";
  const unlocked = codeState === "ok";

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(208_219_218/0.14)_1.2px,transparent_1.2px)] bg-[size:22px_22px]"
      />
      <div
        aria-hidden
        className="bg-pulse pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_30%,rgb(255_90_25/0.13),transparent_70%)]"
      />

      <div className="relative flex w-full max-w-[420px] flex-1 flex-col items-center sm:max-w-[720px]">
        {/* masthead */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent font-mono text-[19px] leading-none font-bold text-on-accent">
              ⌘
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.02em]">Orqly</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Private beta
          </span>
        </div>

        {/* thesis */}
        <h1 className="mt-10 w-full text-[clamp(26px,6vw,34px)] leading-[1.12] font-extrabold tracking-[-0.03em] text-balance">
          Chain every API call.
          <br />
          Watch the whole flow run.
        </h1>
        <p className="mt-3 w-full max-w-[52ch] self-start text-[14px] leading-relaxed text-muted">
          Orqly is a node-based editor for API workflows — every response feeds
          the next request. Two branches from Start: queue for an invite, or
          run straight in with a code.
        </p>

        {/* the forked workflow: Start fans out to both branches (level 1) */}
        <div className="mt-8 flex w-full flex-col items-center">
          {/* Start */}
          <div className="workflow-node flex w-full max-w-[340px] flex-col gap-2 rounded-[20px] p-2">
            <NodeTitleRow
              hue="var(--success)"
              title="Start"
              step="0"
              icon={
                <svg className="h-3.5 w-3.5 flex-none" viewBox="0 0 16 16" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M4.5 2.8v10.4c0 .5.55.8 1 .55l8.2-5.2a.65.65 0 0 0 0-1.1L5.5 2.25a.65.65 0 0 0-1 .55Z"
                  />
                </svg>
              }
            />
          </div>

          <ForkEdges
            left={joinState === "running" ? "running" : joined ? "done" : "idle"}
            right={codeState === "running" ? "running" : unlocked ? "done" : "idle"}
          />
          <div className="sm:hidden">
            <Edge
              state={joinState === "running" ? "running" : joined ? "done" : "idle"}
            />
          </div>

          <div className="grid w-full grid-cols-1 justify-items-center gap-0 sm:grid-cols-2 sm:items-start sm:gap-6">

          {/* Branch A — the email form */}
          <form
            onSubmit={joinWaitlist}
            className={`workflow-node flex w-full max-w-[340px] flex-col gap-2 self-start justify-self-center rounded-[20px] p-2 ${
              joinState === "running" ? "node-running" : ""
            }`}
          >
            <NodeTitleRow hue="var(--accent)" title="Join waitlist" step="1" />
            <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-foreground/[0.03] p-1.5 pl-3">
              <MethodTag method="POST" hue="var(--accent)" />
              {joined ? (
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                  {email}
                </span>
              ) : (
                <>
                  <label htmlFor="waitlist-email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    required
                    autoFocus
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (joinState === "failed") setJoinState("ready");
                    }}
                    className="h-8 w-full min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-faint"
                  />
                  <button
                    type="submit"
                    disabled={joinState === "running"}
                    className="flex h-8 flex-none cursor-pointer items-center rounded-lg bg-accent px-3 text-[13.5px] font-medium text-on-accent transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                  >
                    Join
                  </button>
                </>
              )}
            </div>
            <StatusChip
              state={joinState}
              labels={{ ok: "OK · 201" }}
              detail={
                joinState === "failed"
                  ? joinError
                  : joined
                    ? "You're on the list — invite by email."
                    : null
              }
            />
          </form>

          {/* mobile-only: the second branch stacks below with its own wire */}
          <div className="flex flex-col items-center sm:hidden">
            <span className="py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-faint uppercase">
              or
            </span>
            <Edge
              state={codeState === "running" ? "running" : unlocked ? "done" : "idle"}
            />
          </div>

          {/* Branch B — locked beta access */}
          <form
            onSubmit={enterBeta}
            className={`workflow-node flex w-full max-w-[340px] flex-col gap-2 self-start justify-self-center rounded-[20px] p-2 transition-opacity ${
              codeState === "running" ? "node-running" : ""
            } ${codeState === "locked" ? "opacity-80" : ""}`}
          >
            <NodeTitleRow
              hue={unlocked ? "var(--success)" : "var(--foreground)"}
              title="Beta access"
              step="1"
              icon={
                <svg className="h-3.5 w-3.5 flex-none" viewBox="0 0 16 16" aria-hidden>
                  {unlocked ? (
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8.4 6.2 11.6 13 4.8"
                    />
                  ) : (
                    <path
                      fill="currentColor"
                      d="M8 1.5A3.5 3.5 0 0 0 4.5 5v1.5H4A1.5 1.5 0 0 0 2.5 8v4.5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V8A1.5 1.5 0 0 0 12 6.5h-.5V5A3.5 3.5 0 0 0 8 1.5Zm2 5H6V5a2 2 0 1 1 4 0v1.5Z"
                    />
                  )}
                </svg>
              }
            />
            <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-foreground/[0.03] p-1.5 pl-3">
              <MethodTag method="GET" hue="var(--success)" />
              <label htmlFor="invite-code" className="sr-only">
                Invite code
              </label>
              <input
                id="invite-code"
                type="password"
                required
                placeholder="Invite code"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (codeState === "failed") setCodeState("locked");
                }}
                disabled={unlocked}
                className="h-8 w-full min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-faint"
              />
              <button
                type="submit"
                disabled={codeState === "running" || unlocked}
                className="flex h-8 flex-none cursor-pointer items-center rounded-lg border border-white/15 bg-foreground/5 px-3 text-[13.5px] font-medium text-foreground transition hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
              >
                Run
              </button>
            </div>
            <StatusChip
              state={codeState}
              labels={{ locked: "Locked", ok: "OK · redirecting" }}
              detail={
                codeState === "failed"
                  ? codeError
                  : unlocked
                    ? "Welcome in."
                    : codeState === "locked"
                      ? "Runs with your invite code."
                      : null
              }
            />
          </form>
          </div>
        </div>

        <p className="mt-auto pt-10 font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
          Build · test · simulate API workflows
        </p>
      </div>
    </main>
  );
}
