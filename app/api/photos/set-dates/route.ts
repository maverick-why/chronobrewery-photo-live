import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { createCosClient, readCosConfig } from "@/lib/cos";
import { setDateOverrides } from "@/lib/photo-dates";

type SetDatesPayload = {
  objectKeys?: string[];
  takenAt?: string;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SetDatesPayload | null;
  if (!body?.objectKeys?.length || !body.takenAt) {
    return NextResponse.json({ error: "objectKeys and takenAt are required" }, { status: 400 });
  }

  const parsed = new Date(body.takenAt);
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "takenAt is not a valid date" }, { status: 400 });
  }

  try {
    const config = readCosConfig();
    const cos = createCosClient(config);
    const activitySlug = process.env.NEXT_PUBLIC_ACTIVITY_SLUG || "default";
    await setDateOverrides(cos, config, activitySlug, body.objectKeys, parsed.toISOString());
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to save photo dates";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: body.objectKeys.length });
}
