import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

export async function POST(_request: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: "not implemented",
      message: "M2/M3 接入元数据持久化后实现。"
    },
    { status: 501 }
  );
}
