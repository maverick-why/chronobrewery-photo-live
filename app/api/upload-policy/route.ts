import COS from "cos-nodejs-sdk-v5";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { readCosConfig } from "@/lib/cos";
import { mapOriginalToDisplayKey, mapOriginalToDownloadKey } from "@/lib/photo-keys";
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
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const WATERMARK_TEXT = "时光酿造所";

function toUrlSafeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

function buildPicOperations(originalKey: string, activitySlug: string) {
  const text = toUrlSafeBase64(WATERMARK_TEXT);
  const fill = toUrlSafeBase64("#FFFFFF");
  const displayKey = mapOriginalToDisplayKey(originalKey, activitySlug);
  const downloadKey = mapOriginalToDownloadKey(originalKey, activitySlug);

  const displayRule =
    `imageMogr2/thumbnail/2560x/quality/80/format/jpg` +
    `/watermark/2/text/${text}/fontsize/36/fill/${fill}/dissolve/60/gravity/SouthEast/dx/24/dy/24`;

  const downloadRule =
    `imageMogr2/quality/92/format/jpg` +
    `/watermark/2/text/${text}/fontsize/40/fill/${fill}/dissolve/62/gravity/SouthEast/dx/28/dy/28`;

  return JSON.stringify({
    is_pic_info: 1,
    rules: [
      {
        fileid: displayKey,
        rule: displayRule
      },
      {
        fileid: downloadKey,
        rule: downloadRule
      }
    ]
  });
}

export const runtime = "nodejs";

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
  const picOperations = buildPicOperations(objectKey, activitySlug);

  let config;
  try {
    config = readCosConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "server config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { bucket, region, secretId, secretKey } = config;
  const host = `${bucket}.cos.${region}.myqcloud.com`;
  const pathname = `/${objectKey}`;
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + SIGN_EXPIRES_SECONDS;

  const authorization = COS.getAuthorization({
    SecretId: secretId,
    SecretKey: secretKey,
    Method: "PUT",
    Pathname: pathname,
    Headers: {
      host,
      "Pic-Operations": picOperations
    },
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
      "Content-Type": body.contentType || "application/octet-stream",
      "Pic-Operations": picOperations
    },
    derivatives: {
      displayKey: mapOriginalToDisplayKey(objectKey, activitySlug),
      downloadKey: mapOriginalToDownloadKey(objectKey, activitySlug)
    }
  });
}
