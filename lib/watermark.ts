const DEFAULT_WATERMARK_IMAGE_KEY = "watermark/logo.png";
const DEFAULT_WATERMARK_TEXT = "";

function toUrlSafeBase64(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function encodeObjectKeyPath(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function getWatermarkImageKey() {
  return process.env.WATERMARK_IMAGE_KEY || DEFAULT_WATERMARK_IMAGE_KEY;
}

export function getWatermarkText() {
  return process.env.WATERMARK_TEXT || DEFAULT_WATERMARK_TEXT;
}

function createPublicWatermarkImageUrl(bucket: string, region: string) {
  const key = encodeObjectKeyPath(getWatermarkImageKey());
  return `http://${bucket}.cos.${region}.myqcloud.com/${key}`;
}

function buildImageWatermarkSegment(
  bucket: string,
  region: string,
  dissolve: number,
  ws: number,
  dx: number,
  dy: number
) {
  const imageBase64 = toUrlSafeBase64(createPublicWatermarkImageUrl(bucket, region));
  return `watermark/1/image/${imageBase64}/ws/${ws}/dissolve/${dissolve}/gravity/SouthEast/dx/${dx}/dy/${dy}`;
}

function buildUploadImageWatermarkSegment(
  bucket: string,
  region: string,
  dissolve: number,
  dx: number,
  dy: number
) {
  const imageBase64 = toUrlSafeBase64(createPublicWatermarkImageUrl(bucket, region));
  return `watermark/1/image/${imageBase64}/dissolve/${dissolve}/gravity/SouthEast/dx/${dx}/dy/${dy}`;
}

function buildUploadDisplayRule(bucket: string, region: string) {
  return `imageMogr2/thumbnail/2560x/quality/80/format/jpg/${buildUploadImageWatermarkSegment(
    bucket,
    region,
    88,
    10,
    10
  )}`;
}

function buildUploadDownloadRule(bucket: string, region: string) {
  return `imageMogr2/quality/92/format/jpg/${buildUploadImageWatermarkSegment(
    bucket,
    region,
    90,
    12,
    12
  )}`;
}

function buildTextWatermarkSegment(fontSize: number, dissolve: number, dx: number, dy: number) {
  const text = getWatermarkText().trim();
  if (!text) {
    return "";
  }
  const textBase64 = toUrlSafeBase64(text);
  const fillBase64 = toUrlSafeBase64("#FFFFFF");
  return (
    `watermark/2/text/${textBase64}` +
    `/fontsize/${fontSize}/fill/${fillBase64}` +
    `/dissolve/${dissolve}/gravity/SouthEast/dx/${dx}/dy/${dy}`
  );
}

function buildFogBackgroundSegment(plateWs: number, dx: number, dy: number) {
  // Build a rectangular "nameplate" style panel under the logo.
  const fogText = "██████████████████████";
  const fogBase64 = toUrlSafeBase64(fogText);
  const fogFillBase64 = toUrlSafeBase64("#D9DEE3");
  const fontSize = Math.max(110, Math.round(plateWs * 860));
  return `watermark/2/text/${fogBase64}/fontsize/${fontSize}/fill/${fogFillBase64}/dissolve/58/gravity/SouthEast/dx/${dx}/dy/${dy}`;
}

function buildDisplayWatermarkChain(bucket: string, region: string) {
  const logoWs = 0.20;
  const plateWs = 0.32;
  const logoDx = 8;
  const logoDy = 8;
  const segments = [
    buildFogBackgroundSegment(plateWs, logoDx, logoDy),
    buildImageWatermarkSegment(bucket, region, 96, logoWs, logoDx, logoDy),
    buildTextWatermarkSegment(42, 62, 28, 28)
  ].filter(Boolean);
  return segments.join("|");
}

function buildDownloadWatermarkChain(bucket: string, region: string) {
  const logoWs = 0.20;
  const plateWs = 0.34;
  const logoDx = 10;
  const logoDy = 10;
  const segments = [
    buildFogBackgroundSegment(plateWs, logoDx, logoDy),
    buildImageWatermarkSegment(bucket, region, 96, logoWs, logoDx, logoDy),
    buildTextWatermarkSegment(48, 66, 36, 36)
  ].filter(Boolean);
  return segments.join("|");
}

export function buildDisplayPicRules(bucket: string, region: string, displayKey: string, downloadKey: string) {
  return [
    {
      fileid: `/${displayKey}`,
      rule: buildUploadDisplayRule(bucket, region)
    },
    {
      fileid: `/${downloadKey}`,
      rule: buildUploadDownloadRule(bucket, region)
    }
  ];
}

// 用于签名 URL 实时处理
export function buildDisplayWatermarkRule(bucket: string, region: string) {
  return `imageMogr2/thumbnail/2560x/quality/80/format/jpg|${buildDisplayWatermarkChain(bucket, region)}`;
}

export function buildDownloadWatermarkRule(bucket: string, region: string) {
  return `imageMogr2/quality/92/format/jpg|${buildDownloadWatermarkChain(bucket, region)}`;
}
