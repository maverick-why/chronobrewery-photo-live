import { NextResponse } from "next/server";
import { createCosClient, createSignedObjectUrl, readCosConfig } from "@/lib/cos";
import {
  mapDisplayToDownloadKey,
  mapDisplayToOriginalKey,
  mapOriginalToDisplayKey,
  mapOriginalToDownloadKey
} from "@/lib/photo-keys";

const SIGN_EXPIRES_SECONDS = 60 * 30;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SourceType = "display" | "originals";

type ListedPhoto = {
  key: string;
  displayKey: string;
  downloadKey: string;
  originalKey: string;
  displayUrl: string;
  previewUrl: string;
  source: SourceType;
  size: number;
  uploadedAt: string;
};

function toNumber(size: string | number | undefined) {
  if (typeof size === "number") return size;
  if (!size) return 0;
  const n = Number(size);
  return Number.isFinite(n) ? n : 0;
}

function normalizeLimit(raw: string | null) {
  const n = Number(raw || "120");
  if (!Number.isFinite(n)) return 120;
  return Math.max(1, Math.min(300, Math.round(n)));
}

async function listObjectsForPrefix(
  params: {
    bucket: string;
    region: string;
    prefix: string;
    maxKeys: number;
  },
  cos: ReturnType<typeof createCosClient>
) {
  const data = await cos.getBucket({
    Bucket: params.bucket,
    Region: params.region,
    Prefix: params.prefix,
    MaxKeys: params.maxKeys
  });

  return (data.Contents || []).filter((item) => item.Key && !item.Key.endsWith("/"));
}

function buildPhoto(
  source: SourceType,
  key: string,
  uploadedAt: string,
  size: number,
  activitySlug: string,
  cos: ReturnType<typeof createCosClient>,
  config: ReturnType<typeof readCosConfig>
): ListedPhoto {
  if (source === "display") {
    const displayKey = key;
    const downloadKey = mapDisplayToDownloadKey(displayKey, activitySlug);
    const originalKey = mapDisplayToOriginalKey(displayKey, activitySlug);
    const displayUrl = createSignedObjectUrl(cos, config, displayKey, SIGN_EXPIRES_SECONDS);
    return {
      key,
      displayKey,
      downloadKey,
      originalKey,
      displayUrl,
      previewUrl: displayUrl,
      source,
      size,
      uploadedAt
    };
  }

  const originalKey = key;
  const displayKey = mapOriginalToDisplayKey(originalKey, activitySlug);
  const downloadKey = mapOriginalToDownloadKey(originalKey, activitySlug);
  const originalUrl = createSignedObjectUrl(cos, config, originalKey, SIGN_EXPIRES_SECONDS);
  return {
    key,
    displayKey,
    downloadKey,
    originalKey,
    displayUrl: originalUrl,
    previewUrl: originalUrl,
    source,
    size,
    uploadedAt
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = normalizeLimit(searchParams.get("limit"));
  const activitySlug = process.env.NEXT_PUBLIC_ACTIVITY_SLUG || "default";

  let config;
  try {
    config = readCosConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "server config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const cos = createCosClient(config);
  const displayPrefix = `display/${activitySlug}/`;
  const originalsPrefix = `originals/${activitySlug}/`;

  try {
    let source: SourceType = "display";
    let objects = await listObjectsForPrefix(
      {
        bucket: config.bucket,
        region: config.region,
        prefix: displayPrefix,
        maxKeys: limit
      },
      cos
    );

    // If CI derivations are not ready, fallback to originals so homepage still works.
    if (objects.length === 0) {
      source = "originals";
      objects = await listObjectsForPrefix(
        {
          bucket: config.bucket,
          region: config.region,
          prefix: originalsPrefix,
          maxKeys: limit
        },
        cos
      );
    }

    const photos = objects
      .map((item) => ({
        key: item.Key,
        uploadedAt: item.LastModified,
        size: toNumber(item.Size)
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, limit)
      .map((item) => buildPhoto(source, item.key, item.uploadedAt, item.size, activitySlug, cos, config));

    return NextResponse.json({
      photos,
      source,
      activitySlug,
      count: photos.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to list photos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export type { ListedPhoto };
