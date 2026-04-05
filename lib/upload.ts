import { extname } from "node:path";
import { randomBytes } from "node:crypto";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);

export function resolveImageExtension(filename: string, contentType: string | undefined) {
  const fromName = extname(filename).replace(".", "").toLowerCase();
  if (IMAGE_EXTENSIONS.has(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (!contentType) {
    return "jpg";
  }

  switch (contentType.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "jpg";
  }
}

export function buildOriginalObjectKey(activitySlug: string, extension: string) {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const datePath = `${yyyy}-${mm}-${dd}`;
  const timestamp = Date.now();
  const random = randomBytes(6).toString("hex");
  return `originals/${activitySlug}/${datePath}/${timestamp}-${random}.${extension}`;
}

export function encodeObjectKeyForUrl(objectKey: string) {
  return objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
