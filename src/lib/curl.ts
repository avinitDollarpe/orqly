import type { KV, Method } from "@/lib/types";
import { METHODS } from "@/lib/types";

export type ParsedCurl = {
  method: Method;
  url: string;
  headers: KV[];
  body: string;
};

/**
 * Split a shell command into tokens, honoring single quotes, double quotes,
 * ANSI-C $'…' quotes, backslash escapes and line continuations.
 */
function tokenize(src: string): string[] {
  const s = src.replace(/\\\r?\n/g, " ");
  const out: string[] = [];
  let cur = "";
  let started = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "'") {
      const ansi = cur.endsWith("$");
      if (ansi) cur = cur.slice(0, -1);
      started = true;
      i++;
      while (i < s.length && s[i] !== "'") {
        if (ansi && s[i] === "\\") {
          i++;
          const esc: Record<string, string> = { n: "\n", t: "\t", r: "\r" };
          cur += esc[s[i]!] ?? s[i]!;
        } else {
          cur += s[i]!;
        }
        i++;
      }
    } else if (c === '"') {
      started = true;
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\" && '"\\$`'.includes(s[i + 1] ?? "")) i++;
        cur += s[i]!;
        i++;
      }
    } else if (c === "\\") {
      i++;
      cur += s[i] ?? "";
      started = true;
    } else if (/\s/.test(c)) {
      if (started) {
        out.push(cur);
        cur = "";
        started = false;
      }
    } else {
      cur += c;
      started = true;
    }
  }
  if (started) out.push(cur);
  return out;
}

/** Value-taking flags we deliberately ignore (output, timing, TLS, proxy…). */
const SKIP_WITH_VALUE = new Set([
  "-o", "--output", "-m", "--max-time", "--connect-timeout", "--retry",
  "-w", "--write-out", "-c", "--cookie-jar", "--cacert", "--capath",
  "-E", "--cert", "--key", "-x", "--proxy", "--proxy-user", "--resolve",
  "--limit-rate", "-F", "--form", "--form-string",
]);

/**
 * Parse a cURL command into request parts. Covers what "Copy as cURL"
 * emits from browsers and Postman: -X, -H, -d/--data*, --json, -u, -b, -A.
 */
export function parseCurl(input: string): ParsedCurl {
  const tokens = tokenize(input.trim());
  if (tokens[0]?.toLowerCase() !== "curl") {
    throw new Error('Not a cURL command — it should start with "curl"');
  }

  let method: string | undefined;
  let url = "";
  const headers: KV[] = [];
  const dataParts: string[] = [];
  const pushHeader = (key: string, value: string) =>
    headers.push({ key, value, enabled: true });

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i]!;
    const next = () => tokens[++i] ?? "";
    if (t === "-X" || t === "--request") {
      method = next().toUpperCase();
    } else if (t === "-H" || t === "--header") {
      const h = next();
      const colon = h.indexOf(":");
      if (colon > 0) pushHeader(h.slice(0, colon).trim(), h.slice(colon + 1).trim());
    } else if (
      t === "-d" || t === "--data" || t === "--data-raw" ||
      t === "--data-binary" || t === "--data-ascii" || t === "--data-urlencode"
    ) {
      dataParts.push(next());
    } else if (t === "--json") {
      dataParts.push(next());
      if (!headers.some((h) => h.key.toLowerCase() === "content-type")) {
        pushHeader("Content-Type", "application/json");
      }
    } else if (t === "-u" || t === "--user") {
      pushHeader("Authorization", `Basic ${btoa(next())}`);
    } else if (t === "-b" || t === "--cookie") {
      pushHeader("Cookie", next());
    } else if (t === "-A" || t === "--user-agent") {
      pushHeader("User-Agent", next());
    } else if (t === "-e" || t === "--referer") {
      pushHeader("Referer", next());
    } else if (t === "--url") {
      url = next();
    } else if (SKIP_WITH_VALUE.has(t)) {
      next();
    } else if (t.startsWith("-")) {
      // boolean flag (-s, -L, --compressed, …) — ignore
    } else if (!url) {
      url = t;
    }
  }

  if (!url) throw new Error("No URL found in the cURL command");
  const body = dataParts.join("&");
  const m = (method ?? (body ? "POST" : "GET")) as Method;
  if (!METHODS.includes(m)) {
    throw new Error(`Unsupported method "${m}" — use one of ${METHODS.join(", ")}`);
  }
  return { method: m, url, headers, body };
}
