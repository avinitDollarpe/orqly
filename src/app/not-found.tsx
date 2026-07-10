"use client";

// beui.dev "not-found-glitch" block, ported dep-free: scramble is plain
// React + rAF, ghost layers and button presses are CSS.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MethodChip } from "@/components/shared/ui";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$?/\\";
const SCRAMBLE_MS = 700;
const TICK_MS = 45;

/**
 * Renders the code, scrambling each character on mount before it settles.
 * SSR and the first paint show the real code, so the scramble is a pure
 * client-side enhancement and reduced-motion users see the code immediately.
 */
function Scramble({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = text.split("");
    const start = performance.now();
    let raf = 0;
    let last = 0;

    const loop = (now: number) => {
      if (now - last >= TICK_MS) {
        last = now;
        const progress = Math.min((now - start) / SCRAMBLE_MS, 1);
        const settled = Math.floor(progress * chars.length);
        setDisplay(
          chars
            .map((ch, i) =>
              i < settled || ch === " "
                ? ch
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            )
            .join(""),
        );
      }
      if (now - start < SCRAMBLE_MS) {
        raf = requestAnimationFrame(loop);
      } else {
        setDisplay(text);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return <span className="tabular-nums">{display}</span>;
}

export default function NotFound() {
  const pathname = usePathname();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-background px-6 text-center">
      {/* Canvas dot field + breathing voltage glow — same stage as auth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(208_219_218/0.14)_1.2px,transparent_1.2px)] bg-[size:22px_22px]"
      />
      <div
        aria-hidden
        className="bg-pulse pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_30%,rgb(255_90_25/0.13),transparent_70%)]"
      />

      <div className="relative flex flex-col items-center gap-8">
        {/* The failing request, in the product's own run grammar. */}
        <div className="glass flex max-w-[min(90vw,28rem)] items-center gap-2 rounded-xl px-3 py-2 font-mono text-xs">
          <MethodChip method="GET" />
          <span className="truncate text-muted">{pathname}</span>
          <span aria-hidden className="text-faint">
            →
          </span>
          <span className="font-bold text-danger">404</span>
        </div>

        <div className="group relative select-none font-mono font-bold leading-none tracking-tighter text-foreground [font-size:clamp(5rem,18vw,11rem)]">
          {/* Chromatic ghost layers, nudged apart on hover — voltage split. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 text-accent opacity-0 mix-blend-screen transition-[transform,opacity] duration-150 ease-out group-hover:translate-x-[3px] group-hover:opacity-70 motion-reduce:hidden"
          >
            <Scramble text="404" />
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 text-[#00e5ff] opacity-0 mix-blend-screen transition-[transform,opacity] duration-150 ease-out group-hover:-translate-x-[3px] group-hover:opacity-70 motion-reduce:hidden"
          >
            <Scramble text="404" />
          </span>
          <h1 className="relative">
            <Scramble text="404" />
          </h1>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-lg font-semibold text-foreground">
            Route not found
          </p>
          <p className="max-w-sm text-sm text-muted">
            This route doesn&apos;t exist — it moved, vanished, or never
            shipped.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-10 select-none items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.96] motion-reduce:active:scale-100"
        >
          Back to workspace
        </Link>
      </div>
    </main>
  );
}
