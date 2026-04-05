import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  return NextResponse.json(
    {
      error: "not implemented",
      message: "若 download 保持私有，M3 将在此返回临时签名下载地址。"
    },
    { status: 501 }
  );
}
