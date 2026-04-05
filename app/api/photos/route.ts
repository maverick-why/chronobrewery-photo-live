import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    photos: [],
    message: "M3 将接入 display 目录列表并按时间倒序返回。"
  });
}
