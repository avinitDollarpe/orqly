"use client";

import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import { useState } from "react";
import { useStore } from "@/lib/store";

const toolBtn =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted transition hover:bg-foreground/8 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

function ToolIcon({ d }: { d: string }) {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={d}
      />
    </svg>
  );
}

export function CanvasToolbar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [zoomPct, setZoomPct] = useState(100);

  useOnViewportChange({
    onChange: ({ zoom }) => setZoomPct(Math.round(zoom * 100)),
  });

  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 transition-[left] duration-300 ease-out motion-reduce:transition-none ${
        sidebarOpen
          ? "left-[calc(var(--shell-inset)+15rem+var(--shell-inset))]"
          : "left-4"
      }`}
    >
      <div className="playground-toolbar pointer-events-auto flex flex-col gap-0.5 p-1">
        <button
          type="button"
          className={toolBtn}
          title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg className="h-[17px] w-[17px]" viewBox="0 0 16 16" aria-hidden>
            <rect
              x="1.5"
              y="2.5"
              width="13"
              height="11"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path d="M6 2.5v11" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        <button
          type="button"
          className={toolBtn}
          title="Fit to view"
          aria-label="Fit to view"
          onClick={() => void fitView({ padding: 0.3, maxZoom: 1 })}
        >
          <ToolIcon d="M2.5 6V4.2a1.2 1.2 0 0 1 1.2-1.2H5.5M10.5 3h1.3a1.2 1.2 0 0 1 1.2 1.2V5.5M13.5 10v1.3a1.2 1.2 0 0 1-1.2 1.2H10.5M5.5 13.5H4.2a1.2 1.2 0 0 1-1.2-1.2V10" />
        </button>
      </div>

      <div className="playground-toolbar pointer-events-auto flex flex-col items-center gap-0.5 p-1">
        <button
          type="button"
          className={toolBtn}
          title="Zoom in"
          aria-label="Zoom in"
          onClick={() => zoomIn({ duration: 200 })}
        >
          <ToolIcon d="M8 4v8M4 8h8" />
        </button>
        <span className="w-9 py-0.5 text-center font-mono text-[10px] font-semibold text-faint">
          {zoomPct}%
        </span>
        <button
          type="button"
          className={toolBtn}
          title="Zoom out"
          aria-label="Zoom out"
          onClick={() => zoomOut({ duration: 200 })}
        >
          <ToolIcon d="M4 8h8" />
        </button>
      </div>
    </div>
  );
}
