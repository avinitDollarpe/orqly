"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { parseCurl } from "@/lib/curl";
import { importedEnvVars } from "@/lib/openapi";
import { parseApiFile } from "@/lib/postman";
import { useStore } from "@/lib/store";

const dots: React.CSSProperties = {
  background:
    "radial-gradient(var(--canvas-dot) 1.2px, transparent 1.2px) 0 0 / 14px 14px, var(--canvas)",
};

/**
 * Paste a cURL command or drop an OpenAPI / Swagger / Postman JSON file;
 * the parsed requests land as nodes anchored below the node whose "+"
 * opened this modal.
 */
export function ImportNodeModal({
  anchorNodeId,
  onClose,
}: {
  anchorNodeId: string;
  onClose: () => void;
}) {
  const addNode = useStore((s) => s.addNode);
  const upsertBody = useStore((s) => s.upsertBody);
  const upsertEnvironment = useStore((s) => s.upsertEnvironment);
  const environments = useStore((s) => s.environments);
  const activeEnvId = useStore((s) => s.activeEnvId);

  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function importCurl() {
    try {
      const { method, url, headers, body } = parseCurl(text);
      let label = `${method} ${url}`;
      try {
        label = `${method} ${new URL(url).pathname}`;
      } catch {
        /* templated / relative URL — keep the raw form */
      }
      addNode({
        anchorNodeId,
        placement: "below",
        data: {
          label,
          method,
          url,
          headers,
          bodyMode: body ? "inline" : "none",
          inlineBody: body,
        },
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse that cURL command");
    }
  }

  async function importFile(file: File) {
    try {
      const parsed = parseApiFile(JSON.parse(await file.text()));
      for (const body of parsed.bodies) upsertBody(body);
      const env = environments.find((e) => e.id === activeEnvId);
      const vars = importedEnvVars(env?.vars ?? [], parsed);
      if (vars) {
        upsertEnvironment(
          env
            ? { ...env, vars }
            : { id: crypto.randomUUID(), name: "Development", vars },
        );
      }
      // first node goes below the anchor; the rest fan out on that same row
      const [first, ...rest] = parsed.nodes;
      const firstId = addNode({
        anchorNodeId,
        placement: "below",
        data: first!.data,
      });
      for (const n of rest) {
        addNode({ anchorNodeId: firstId, placement: "same", data: n.data });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse that file");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-heavy flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl">
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Import requests</h2>
            <p className="mt-0.5 text-[13px] text-muted">
              Paste a cURL command, or drop an OpenAPI, Swagger or Postman file.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-foreground/10 hover:text-foreground"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                d="m2 2 8 8M10 2l-8 8"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          <div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) importCurl();
              }}
              placeholder={"curl -X POST https://api.example.com/orders \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"id\": 1}'"}
              rows={4}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-line bg-surface/60 px-3 py-2.5 font-mono text-[12px] text-foreground placeholder:text-faint focus:border-accent/70 focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-wide text-faint uppercase">
                Method · URL · headers · body prefilled
              </p>
              <button
                type="button"
                onClick={importCurl}
                disabled={!text.trim()}
                className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-default disabled:opacity-40"
              >
                Import cURL
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] text-faint">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void importFile(f);
            }}
            className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-6 transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              dragging ? "border-accent/80" : "border-white/20 hover:border-white/40"
            }`}
            style={dots}
          >
            <p className="text-[14px] font-semibold">Drop a file here</p>
            <p className="text-[12px] text-muted">
              or click to browse — every request becomes a node
            </p>
            <p className="font-mono text-[10px] tracking-wide text-faint uppercase">
              OpenAPI 3 · Swagger 2 · Postman collection · .json
            </p>
          </button>

          {error && (
            <p className="text-[13px] text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void importFile(f);
        }}
      />
    </div>,
    document.body,
  );
}
