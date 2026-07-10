"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
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
import { MethodChip } from "@/components/shared/ui";
import { methodHue } from "@/lib/method-colors";
import type { Method } from "@/lib/types";

/**
 * Waitlist — direction E: you land inside the editor canvas. Full playground
 * demo nodes (Start + seeded API chain) scatter at the periphery; the selected
 * Join waitlist node sits front-center. Invite access is progressive disclosure.
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
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
        )}
        {text}
      </span>
      {detail && <span className="min-w-0 truncate text-xs text-muted">{detail}</span>}
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
  const hue = methodHue(method).color;
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
      {SCATTERED_NODES.map((node) => (
        <div
          key={node.kind === "start" ? "start" : node.label}
          className={`absolute ${node.className}${"align" in node && node.align === "right" ? " waitlist-backdrop-anchor-right" : ""}`}
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
    <div className="relative mt-8 w-full max-w-[380px]">
      <div
        aria-hidden
        className="waitlist-hero-glow bg-pulse pointer-events-none absolute -inset-x-10 -inset-y-8 rounded-[40px] motion-reduce:animate-none"
      />
      {children}
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
  const [codeState, setCodeState] = useState<RunState | "locked">("locked");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

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

  function openInvite() {
    setShowInvite(true);
    if (codeState === "locked") setCodeState("ready");
    requestAnimationFrame(() => inviteRef.current?.focus());
  }

  function openWaitlist() {
    setShowInvite(false);
  }

  const joined = joinState === "ok";
  const unlocked = codeState === "ok";

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
          <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-accent font-mono text-base leading-none font-bold text-on-accent">
            ⌘
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
          <h1 className="text-center text-[clamp(28px,5vw,40px)] leading-[1.08] font-extrabold tracking-[-0.03em]">
            <span className="block">Chain every API call.</span>
            <span className="block whitespace-nowrap">
              Watch the whole flow <span className="text-accent">run.</span>
            </span>
          </h1>
          <p className="mt-4 max-w-[52ch] text-center text-[15px] leading-relaxed text-muted">
            A visual, node based editor for building API workflows
          </p>

          {showInvite ? (
            <HeroCardGlow>
            <form
              onSubmit={enterBeta}
              className={`workflow-node workflow-node--selected relative flex w-full flex-col gap-2 rounded-[20px] p-2 ${
                codeState === "running" ? "node-running motion-reduce:animate-none" : ""
              }`}
            >
              <HeroTitleRow
                hue={unlocked ? "var(--success)" : "var(--accent)"}
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
                <HeroMethodTag method="GET" hue="var(--success)" />
                <label htmlFor={inviteInputId} className="sr-only">
                  Invite code
                </label>
                <input
                  ref={inviteRef}
                  id={inviteInputId}
                  type="password"
                  required
                  placeholder="Invite code"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (codeState === "failed") setCodeState("ready");
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
                state={codeState === "locked" ? "ready" : codeState}
                labels={{ ok: "OK · redirecting" }}
                detail={
                  codeState === "failed"
                    ? codeError
                    : unlocked
                      ? "Welcome in."
                      : null
                }
              />
            </form>
            </HeroCardGlow>
          ) : (
            <HeroCardGlow>
            <form
              onSubmit={joinWaitlist}
              className={`workflow-node workflow-node--selected relative flex w-full flex-col gap-2 rounded-[20px] p-2 ${
                joinState === "running" ? "node-running motion-reduce:animate-none" : ""
              }`}
            >
              <HeroTitleRow hue="var(--accent)" title="Join waitlist" step="1" />
              <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-foreground/[0.03] p-1.5 pl-3">
                <HeroMethodTag method="POST" hue="var(--accent)" />
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
            </HeroCardGlow>
          )}

          <button
            type="button"
            onClick={showInvite ? openWaitlist : openInvite}
            className="group mt-3 cursor-pointer border-none bg-transparent text-[12.5px] font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {showInvite ? (
              <>
                Need an invite?{" "}
                <span className="text-accent transition-colors group-hover:text-accent-strong">
                  Join the waitlist →
                </span>
              </>
            ) : (
              <>
                Have an invite code?{" "}
                <span className="text-accent transition-colors group-hover:text-accent-strong">
                  Run straight in →
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
