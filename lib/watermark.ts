const DEFAULT_WATERMARK_IMAGE_KEY = "watermark/logo.png";

function toUrlSafeBase64(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getWatermarkImageUrl(bucket: string, region: string) {
  const imageUrl = `https://${bucket}.cos.${region}.myqcloud.com/${DEFAULT_WATERMARK_IMAGE_KEY}`;
  return toUrlSafeBase64(imageUrl);
}

function buildImageWatermarkSegment(bucket: string, region: string, dissolve: number, dx: number, dy: number) {
  const imageBase64 = getWatermarkImageUrl(bucket, region);
  return (
    `watermark/1/image/${imageBase64}` +
    `/dissolve/${dissolve}/gravity/SouthEast/dx/${dx}/dy/${dy}/blogo/1`
  );
}

export function buildDisplayWatermarkRule(bucket: string, region: string) {
  return (
    `imageMogr2/thumbnail/2560x/quality/80/format/jpg` +
    `/${buildImageWatermarkSegment(bucket, region, 90, 30, 30)}`
  );
}

export function buildDownloadWatermarkRule(bucket: string, region: string) {
  return (
    `imageMogr2/quality/92/format/jpg` +
    `/${buildImageWatermarkSegment(bucket, region, 90, 36, 36)}`
  );
}
