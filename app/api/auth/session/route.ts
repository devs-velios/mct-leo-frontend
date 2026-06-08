import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "../login/route";
import { verifySession } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE);

  // Reject missing OR forged/tampered cookies — the email must carry a valid signature.
  const email = await verifySession(sessionCookie?.value);
  if (!email) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: { email } });
}
