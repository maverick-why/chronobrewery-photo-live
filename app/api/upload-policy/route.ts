import COS from "cos-nodejs-sdk-v5";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import {
  buildOriginalObjectKey,
  encodeObjectKeyForUrl,
  resolveImageExtension
} from "@/lib/upload";

type UploadPolicyPayload = {
  filename?: string;
  contentType?: string;
  fileSize?: number;
};

const SIGN_EXPIRES_SECONDS = 10 * 60;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const runtime = "nodejs";

function readRequiredEnv(
  name:
    | "TENCENT_COS_BUCKET"
    | "TENCENT_COS_REGION"
    | "TENCENT_SECRET_ID"
    | "TENCENT_SECRET_KEY"
) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export async function POST(request: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as UploadPolicyPayload | null;
  if (!body?.filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }
  if (body.fileSize && body.fileSize > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `file size exceeds ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB` },
      { status: 400 }
    );
  }
  if (body.contentType && !body.contentType.startsWith("image/")) {
    return NextResponse.json({ error: "only image uploads are allowed" }, { status: 400 });
  }

  const extension = resolveImageExtension(body.filename, body.contentType);
  const activitySlug = process.env.NEXT_PUBLIC_ACTIVITY_SLUG || "default";
  const objectKey = buildOriginalObjectKey(activitySlug, extension);

  let bucket = "";
  let region = "";
  let secretId = "";
  let secretKey = "";
  try {
    bucket = readRequiredEnv("TENCENT_COS_BUCKET");
    region = readRequiredEnv("TENCENT_COS_REGION");
    secretId = readRequiredEnv("TENCENT_SECRET_ID");
    secretKey = readRequiredEnv("TENCENT_SECRET_KEY");
  } catch (error) {
    const message = error instanceof Error ? error.message : "server config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const host = `${bucket}.cos.${region}.myqcloud.com`;
  const pathname = `/${objectKey}`;
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + SIGN_EXPIRES_SECONDS;

  const authorization = COS.getAuthorization({
    SecretId: secretId,
    SecretKey: secretKey,
    Method: "PUT",
    Pathname: pathname,
    Headers: { host },
    KeyTime: `${startTime};${endTime}`
  });

  return NextResponse.json({
    ok: true,
    method: "PUT",
    uploadUrl: `https://${host}/${encodeObjectKeyForUrl(objectKey)}`,
    objectKey,
    activitySlug,
    expiresAt: endTime,
    headers: {
      Authorization: authorization,
      "Content-Type": body.contentType || "application/octet-stream"
    }
  });
}
