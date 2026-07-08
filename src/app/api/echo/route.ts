/**
 * Local echo endpoint — the demo workflow's target. Mirrors the request
 * back so response chaining can be exercised without any external API.
 */
async function echo(req: Request) {
  let data: unknown = null;
  const text = await req.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return Response.json({
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    data,
    receivedAt: new Date().toISOString(),
  });
}

export { echo as GET, echo as POST, echo as PUT, echo as PATCH, echo as DELETE };
