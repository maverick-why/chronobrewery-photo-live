function removeLeadingSlash(key: string) {
  return key.replace(/^\/+/, "");
}

function replaceExtension(key: string, extension: string) {
  const normalized = removeLeadingSlash(key);
  const dotIndex = normalized.lastIndexOf(".");
  if (dotIndex === -1) {
    return `${normalized}.${extension}`;
  }
  return `${normalized.slice(0, dotIndex + 1)}${extension}`;
}

function splitActivityPath(key: string, prefix: "originals" | "display" | "download", activitySlug: string) {
  const normalized = removeLeadingSlash(key);
  const head = `${prefix}/${activitySlug}/`;
  if (!normalized.startsWith(head)) {
    return null;
  }
  return normalized.slice(head.length);
}

export function mapOriginalToDisplayKey(originalKey: string, activitySlug: string) {
  const suffix = splitActivityPath(originalKey, "originals", activitySlug);
  if (suffix === null) {
    return originalKey;
  }
  return replaceExtension(`display/${activitySlug}/${suffix}`, "jpg");
}

export function mapOriginalToDownloadKey(originalKey: string, activitySlug: string) {
  const suffix = splitActivityPath(originalKey, "originals", activitySlug);
  if (suffix === null) {
    return originalKey;
  }
  return replaceExtension(`download/${activitySlug}/${suffix}`, "jpg");
}

export function mapDisplayToDownloadKey(displayKey: string, activitySlug: string) {
  const suffix = splitActivityPath(displayKey, "display", activitySlug);
  if (suffix === null) {
    return displayKey;
  }
  return `download/${activitySlug}/${suffix}`;
}

export function mapDisplayToOriginalKey(displayKey: string, activitySlug: string) {
  const suffix = splitActivityPath(displayKey, "display", activitySlug);
  if (suffix === null) {
    return displayKey;
  }
  return `originals/${activitySlug}/${suffix}`;
}

export function mapDownloadToDisplayKey(downloadKey: string, activitySlug: string) {
  const suffix = splitActivityPath(downloadKey, "download", activitySlug);
  if (suffix === null) {
    return downloadKey;
  }
  return `display/${activitySlug}/${suffix}`;
}

export function mapDownloadToOriginalKey(downloadKey: string, activitySlug: string) {
  const suffix = splitActivityPath(downloadKey, "download", activitySlug);
  if (suffix === null) {
    return downloadKey;
  }
  return `originals/${activitySlug}/${suffix}`;
}

export function buildDownloadKeyCandidates(rawKey: string, activitySlug: string) {
  const key = removeLeadingSlash(rawKey);
  const candidates = new Set<string>();
  candidates.add(key);

  if (key.startsWith(`download/${activitySlug}/`)) {
    candidates.add(mapDownloadToDisplayKey(key, activitySlug));
    candidates.add(mapDownloadToOriginalKey(key, activitySlug));
  } else if (key.startsWith(`display/${activitySlug}/`)) {
    candidates.add(mapDisplayToDownloadKey(key, activitySlug));
    candidates.add(mapDisplayToOriginalKey(key, activitySlug));
  } else if (key.startsWith(`originals/${activitySlug}/`)) {
    candidates.add(mapOriginalToDownloadKey(key, activitySlug));
    candidates.add(key);
  }

  return Array.from(candidates);
}
