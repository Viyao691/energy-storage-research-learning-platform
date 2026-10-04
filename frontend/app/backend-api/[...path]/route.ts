import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const backend = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
  const target = new URL(path.map(encodeURIComponent).join("/"), `${backend}/`);
  target.search = request.nextUrl.search;
  const headers = new Headers(request.headers);
  for (const name of ["host", "connection", "content-length", "accept-encoding"]) headers.delete(name);
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    // Node fetch needs duplex for streamed PDF uploads.
    duplex: "half",
    cache: "no-store",
    signal: request.signal,
  } as RequestInit & { duplex: "half" });
  const responseHeaders = new Headers(response.headers);
  for (const name of ["connection", "transfer-encoding", "content-encoding", "content-length"]) responseHeaders.delete(name);
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD };
