import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const RAILWAY = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export async function proxyToRailway(req: NextRequest, upstreamPath: string): Promise<NextResponse> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Forward agent-context headers injected by middleware for subdomain requests.
  // Express booking handlers read these to stamp agentId and pricing tiers.
  const agentHeaders: Record<string, string> = {};
  for (const h of ["x-agent-id", "x-agent-slug", "x-agent-name", "x-agent-color"] as const) {
    const v = req.headers.get(h);
    if (v) agentHeaders[h] = v;
  }

  // Forward the browser-facing origin so the server can build emailed links
  // (verification / password reset) that point back to the exact domain the user
  // is on — apex or an agent subdomain — instead of a hard-coded env value.
  const forwardedOrigin = req.headers.get("origin") ?? req.nextUrl.origin;

  const upstreamInit: RequestInit = {
    method: req.method,
    cache: "no-store",
    headers: {
      ...(req.headers.get("content-type")
        ? { "content-type": req.headers.get("content-type")! }
        : {}),
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...agentHeaders,
      "x-forwarded-origin": forwardedOrigin,
    },
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    upstreamInit.body = await req.arrayBuffer();
  }

  const upstream = await fetch(new URL(upstreamPath, RAILWAY), upstreamInit);
  const resBody = await upstream.arrayBuffer();

  const res = new NextResponse(resBody, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });

  for (const raw of upstream.headers.getSetCookie()) {
    rewriteCookie(res, raw);
  }

  return res;
}

// Re-stamps a Railway Set-Cookie header onto the Vercel origin so Next.js
// server components can read it via cookies(). sameSite is lax because the
// cookie now lives on the same domain as the Next.js app.
function rewriteCookie(res: NextResponse, raw: string): void {
  const parts = raw.split(";").map((s) => s.trim());
  const eqIdx = parts[0].indexOf("=");
  if (eqIdx === -1) return;
  const name = parts[0].slice(0, eqIdx);
  const value = parts[0].slice(eqIdx + 1);

  const attr = (prefix: string): string | undefined =>
    parts.find((p) => p.toLowerCase().startsWith(prefix))?.split("=")[1];

  const maxAgeRaw = attr("max-age=");
  const maxAge = maxAgeRaw !== undefined ? parseInt(maxAgeRaw, 10) : undefined;
  const path = attr("path=") ?? "/";

  if (maxAge === 0) {
    res.cookies.set({ name, value: "", maxAge: 0, path });
    return;
  }

  res.cookies.set({
    name,
    value,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path,
    ...(maxAge !== undefined ? { maxAge } : {}),
  });
}
