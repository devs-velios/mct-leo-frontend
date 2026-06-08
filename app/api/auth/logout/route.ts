import { NextResponse } from "next/server";
import { SESSION_COOKIE, TOKEN_COOKIE } from "../login/route";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  for (const name of [SESSION_COOKIE, TOKEN_COOKIE]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0 // expire immediately
    });
  }
  return res;
}
