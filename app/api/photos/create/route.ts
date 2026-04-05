import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

type CreatePhotoPayload = {
  objectKey?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
};

export async function POST(request: NextRequest) {
  const session = getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreatePhotoPayload | null;
  if (!body?.objectKey) {
    return NextResponse.json({ error: "objectKey is required" }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: true,
      message: "metadata accepted (no persistence in M2)",
      createdBy: session.username,
      photo: {
        objectKey: body.objectKey,
        fileName: body.fileName || "",
        fileSize: body.fileSize || 0,
        contentType: body.contentType || ""
      }
    },
    { status: 202 }
  );
}
