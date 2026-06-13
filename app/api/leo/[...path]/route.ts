import { NextRequest, NextResponse } from "next/server";
import { leoFetch, TOKEN_COOKIE } from "@/lib/server/leo";

// Same-origin proxy to the Léo backend. The browser calls
//   /api/leo/dashboard   →   GET  {LEO_API_URL}/api/dashboard
//   /api/leo/centres/123 →   GET  {LEO_API_URL}/api/centres/123
// The user's JWT (mct_token cookie) is attached server-side as a Bearer token, so it never
// touches client code and CORS stays a non-issue (everything is same-origin).

const FORWARD_HEADERS = ["content-type", "accept", "prefer", "range"];

async function handle(req: NextRequest, path: string[]): Promise<Response> {
  const target = "api/" + path.join("/") + req.nextUrl.search;

  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    // Raw bytes — preserves JSON and multipart (the content-type header carries the boundary).
    init.body = Buffer.from(await req.arrayBuffer());
  }

  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  try {
    const upstream = await leoFetch(target, init, token);
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        ...(upstream.headers.get("content-range")
          ? { "content-range": upstream.headers.get("content-range") as string }
          : {})
      }
    });
  } catch (err) {
    // The backend was unreachable/timed out even after a retry. Return a clean JSON
    // 502 so the client gets a real error to handle instead of a bare empty 500.
    const message = err instanceof Error ? err.message : "Upstream request failed";
    return Response.json(
      { error: "Service momentanément indisponible. Veuillez réessayer.", detail: message },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return handle(req, (await ctx.params).path);
}
