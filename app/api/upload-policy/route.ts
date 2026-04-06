import COS from "cos-nodejs-sdk-v5";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { createCosClient, readCosConfig } from "@/lib/cos";
import { mapOriginalToDisplayKey, mapOriginalToDownloadKey } from "@/lib/photo-keys";
import {
  buildDisplayWatermarkRule,
  buildDownloadWatermarkRule,
  createSignedWatermarkImageUrl
} from "@/lib/watermark";
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

function buildPicOperations(originalKey: string, activitySlug: string, watermarkImageUrl: string) {
  const displayKey = mapOriginalToDisplayKey(originalKey, activitySlug);
  const downloadKey = mapOriginalToDownloadKey(originalKey, activitySlug);

  return JSON.stringify({
    is_pic_info: 1,
    rules: [
      {
        // Use absolute key so COS CI writes to bucket root instead of nesting under current original object path.
        fileid: `/${displayKey}`,
        rule: buildDisplayWatermarkRule(watermarkImageUrl)
      },
      {
        fileid: `/${downloadKey}`,
        rule: buildDownloadWatermarkRule(watermarkImageUrl)
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

  let config;
  try {
    config = readCosConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "server config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const watermarkImageUrl = createSignedWatermarkImageUrl(createCosClient(config), config);
  const picOperations = buildPicOperations(objectKey, activitySlug, watermarkImageUrl);

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
