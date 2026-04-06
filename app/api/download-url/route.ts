import { NextRequest, NextResponse } from "next/server";
import { checkObjectExists, createCosClient, createSignedObjectUrl, readCosConfig } from "@/lib/cos";
import { buildDownloadKeyCandidates } from "@/lib/photo-keys";
import { buildDownloadWatermarkRule } from "@/lib/watermark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGN_EXPIRES_SECONDS = 60 * 10;

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const fallbackKey = request.nextUrl.searchParams.get("fallbackKey");
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  const activitySlug = process.env.NEXT_PUBLIC_ACTIVITY_SLUG || "default";
  let config;
  try {
    config = readCosConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "server config error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const cos = createCosClient(config);
  const candidates = [
    ...buildDownloadKeyCandidates(key, activitySlug),
    ...(fallbackKey ? buildDownloadKeyCandidates(fallbackKey, activitySlug) : [])
  ];
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const candidate of uniqueCandidates) {
    const exists = await checkObjectExists(cos, config, candidate);
    if (!exists) {
      continue;
    }

    const isOriginal = candidate.startsWith(`originals/${activitySlug}/`);
    const signedUrl = createSignedObjectUrl(
      cos,
      config,
      candidate,
      SIGN_EXPIRES_SECONDS,
      isOriginal ? buildDownloadWatermarkRule() : undefined
    );

    return NextResponse.json({
      ok: true,
      key: candidate,
      url: signedUrl,
      expiresIn: SIGN_EXPIRES_SECONDS
    });
  }

  return NextResponse.json({ error: "object not found" }, { status: 404 });
}
