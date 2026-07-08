import { isIP } from "node:net";
import { getSession, unauthorized } from "@/lib/session";

const TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 2_000_000;

function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }
  if (isIP(host) === 4) {
    const [a, b] = host.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    );
  }
  if (isIP(host) === 6) {
    return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80");
  }
  return false;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  let input: { method?: string; url?: string; headers?: Record<string, string>; body?: string };
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const method = String(input.method ?? "GET").toUpperCase();
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return Response.json({ error: `Unsupported method "${method}"` }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(String(input.url ?? ""));
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
  } catch {
    return Response.json(
      { error: `Invalid URL "${input.url}" — must be absolute http(s)` },
      { status: 400 },
    );
  }

  if (process.env.EXECUTE_BLOCK_PRIVATE_IPS === "1" && isPrivateHost(url.hostname)) {
    return Response.json(
      { error: "Requests to private/loopback addresses are disabled" },
      { status: 400 },
    );
  }

  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: input.headers ?? {},
      body: method === "GET" ? undefined : input.body,
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    const buf = await res.arrayBuffer();
    const ms = Date.now() - started;
    if (buf.byteLength > MAX_RESPONSE_BYTES) {
      return Response.json(
        { error: `Response too large (${buf.byteLength} bytes, limit ${MAX_RESPONSE_BYTES})` },
        { status: 502 },
      );
    }
    const bodyText = new TextDecoder().decode(buf);
    let body: unknown = bodyText;
    try {
      body = JSON.parse(bodyText);
    } catch {
      // keep raw text for non-JSON responses
    }

    return Response.json({
      status: res.status,
      statusText: res.statusText,
      ms,
      headers: Object.fromEntries(res.headers.entries()),
      body,
      bodyText,
    });
  } catch (e) {
    const message =
      e instanceof Error && e.name === "TimeoutError"
        ? `Request timed out after ${TIMEOUT_MS / 1000}s`
        : e instanceof Error
          ? (e.cause instanceof Error ? `${e.message}: ${e.cause.message}` : e.message)
          : String(e);
    return Response.json({ error: message }, { status: 502 });
  }
}
