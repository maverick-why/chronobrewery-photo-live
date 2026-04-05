import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ loggedIn: false });
  }

  return NextResponse.json({
    loggedIn: true,
    username: session.username
  });
}
