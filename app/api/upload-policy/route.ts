import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const activitySlug = process.env.NEXT_PUBLIC_ACTIVITY_SLUG || "default";
  return NextResponse.json(
    {
      error: "not implemented",
      message: "M2 接入腾讯云 COS 临时密钥/签名后返回真实上传策略。",
      activitySlug
    },
    { status: 501 }
  );
}
