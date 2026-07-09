"use client";

import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import { useState } from "react";
import { useStore } from "@/lib/store";

const toolBtn =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted transition hover:bg-foreground/8 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

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

function FitViewIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] [&_path]:[stroke-width:2]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.7794 17.5599H9.21945C7.68945 17.5599 6.43945 16.3199 6.43945 14.7799V9.21994C6.43945 7.68994 7.67945 6.43994 9.21945 6.43994H14.7794C16.3094 6.43994 17.5594 7.67994 17.5594 9.21994V14.7799C17.5594 16.3099 16.3194 17.5599 14.7794 17.5599Z" />
      <path d="M18.6699 21.9999V19.7799C18.6699 19.1699 19.1699 18.6699 19.7799 18.6699H21.9999" />
      <path d="M5.33 2V4.22C5.33 4.83 4.83 5.33 4.22 5.33H2" />
      <path d="M2 18.6699H4.22C4.83 18.6699 5.33 19.1699 5.33 19.7799V21.9999" />
      <path d="M21.9999 5.33H19.7799C19.1699 5.33 18.6699 4.83 18.6699 4.22V2" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] [&_path]:[stroke-width:2]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        d="M7.13086 18.3101H15.1309C17.8909 18.3101 20.1309 16.0701 20.1309 13.3101C20.1309 10.5501 17.8909 8.31006 15.1309 8.31006H4.13086"
        strokeMiterlimit="10"
      />
      <path d="M6.42914 10.8099L3.86914 8.24994L6.42914 5.68994" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      className="h-[18px] w-[18px] [&_path]:[stroke-width:2]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        d="M16.8691 18.3101H8.86914C6.10914 18.3101 3.86914 16.0701 3.86914 13.3101C3.86914 10.5501 6.10914 8.31006 8.86914 8.31006H19.8691"
        strokeMiterlimit="10"
      />
      <path d="M17.5703 10.8099L20.1303 8.24994L17.5703 5.68994" />
    </svg>
  );
}

export function CanvasToolbar() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => {
    void s.historyTick;
    return s.canUndo();
  });
  const canRedo = useStore((s) => {
    void s.historyTick;
    return s.canRedo();
  });
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
          <FitViewIcon />
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

      <div className="playground-toolbar pointer-events-auto flex flex-col p-1">
        <button
          type="button"
          className={toolBtn}
          title="Undo"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => undo()}
        >
          <UndoIcon />
        </button>
        <div className="mx-2 h-px bg-white/10" />
        <button
          type="button"
          className={toolBtn}
          title="Redo"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => redo()}
        >
          <RedoIcon />
        </button>
      </div>
    </div>
  );
}
