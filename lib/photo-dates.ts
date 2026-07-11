import type COS from "cos-nodejs-sdk-v5";
import type { CosConfig } from "@/lib/cos";

function dateIndexKey(activitySlug: string) {
  return `meta/${activitySlug}/dates.json`;
}

export async function readDateOverrides(
  cos: COS,
  config: CosConfig,
  activitySlug: string
): Promise<Record<string, string>> {
  try {
    const data = await cos.getObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: dateIndexKey(activitySlug)
    });
    const parsed = JSON.parse(data.Body.toString("utf-8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Takes the whole batch in one call so concurrent uploads in the same
// batch do a single read-modify-write instead of racing each other.
export async function setDateOverrides(
  cos: COS,
  config: CosConfig,
  activitySlug: string,
  originalKeys: string[],
  takenAt: string
) {
  const current = await readDateOverrides(cos, config, activitySlug);
  for (const key of originalKeys) {
    current[key] = takenAt;
  }
  await cos.putObject({
    Bucket: config.bucket,
    Region: config.region,
    Key: dateIndexKey(activitySlug),
    Body: JSON.stringify(current),
    ContentType: "application/json"
  });
}
