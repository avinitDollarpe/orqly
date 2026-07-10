import CryptoJS from "crypto-js";
import type { ResolvedRequest } from "@/lib/types";

export class PreRequestScriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreRequestScriptError";
  }
}

/** Postman-style signing script — reads API_KEY / API_SECRET from the active environment. */
export const DEFAULT_PRE_REQUEST_SCRIPT = `const apiKey = pm.environment.get("API_KEY");
const apiSecret = pm.environment.get("API_SECRET");

// Get current timestamp
const timestamp = Math.floor(Date.now() / 1000);

// Function to sort object keys recursively
const sortObjectKeys = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
    }, {});
};

// Get request body (if any)
let body = {};
if (pm.request.body && pm.request.body.raw) {
    body = pm.request.body.raw;
    try {
        body = JSON.parse(body);
    } catch (e) {
        console.error("Failed to parse request body:", e);
    }
}

// Sort body recursively and stringify
const sortedBody = JSON.stringify(sortObjectKeys(body));
const message = \`\${apiKey}|\${timestamp}|\${sortedBody}\`;
const signature = CryptoJS.HmacSHA256(message, apiSecret);
const base64Signature = CryptoJS.enc.Base64.stringify(signature);

// Set headers
pm.request.headers.add({ key: "X-API-KEY", value: apiKey });
pm.request.headers.add({ key: "X-TIMESTAMP", value: timestamp.toString() });
pm.request.headers.add({ key: "X-SIGNATURE", value: base64Signature });
`;

type HeaderOp = { key: string; value: string };

function buildPm(
  env: Record<string, string>,
  request: ResolvedRequest,
  addedHeaders: HeaderOp[],
) {
  return {
    environment: {
      get: (key: string) => env[key] ?? "",
      set: (key: string, value: string) => {
        env[key] = String(value);
      },
      unset: (key: string) => {
        delete env[key];
      },
    },
    request: {
      method: request.method,
      url: request.url,
      headers: {
        add: ({ key, value }: HeaderOp) => {
          addedHeaders.push({ key, value: String(value) });
        },
      },
      body: {
        raw: request.body ?? "",
      },
    },
    console: {
      log: (...args: unknown[]) => console.log("[pre-request]", ...args),
      error: (...args: unknown[]) => console.error("[pre-request]", ...args),
    },
  };
}

/**
 * Run a workflow pre-request script before each HTTP call.
 * Mutates env in place; returns request with script-added headers merged in.
 */
export function applyPreRequestScript(
  script: string | undefined,
  env: Record<string, string>,
  request: ResolvedRequest,
): ResolvedRequest {
  if (!script?.trim()) return request;

  const addedHeaders: HeaderOp[] = [];
  const pm = buildPm(env, request, addedHeaders);

  try {
    const run = new Function("pm", "CryptoJS", script) as (
      pm: ReturnType<typeof buildPm>,
      crypto: typeof CryptoJS,
    ) => void;
    run(pm, CryptoJS);
  } catch (e) {
    throw new PreRequestScriptError(
      e instanceof Error ? e.message : String(e),
    );
  }

  if (addedHeaders.length === 0) return request;

  const headers = { ...request.headers };
  for (const { key, value } of addedHeaders) {
    if (key.trim()) headers[key.trim()] = value;
  }
  return { ...request, headers };
}
