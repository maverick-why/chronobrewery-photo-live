const DEFAULT_WATERMARK_IMAGE_KEY = "watermark/logo.png";

function toUrlSafeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

export function getWatermarkImageKey() {
  return process.env.WATERMARK_IMAGE_KEY || DEFAULT_WATERMARK_IMAGE_KEY;
}

export function buildDisplayWatermarkRule() {
  const imageKeyBase64 = toUrlSafeBase64(getWatermarkImageKey());
  return (
    `imageMogr2/thumbnail/2560x/quality/80/format/jpg` +
    `/watermark/1/image_key/${imageKeyBase64}/dissolve/75/gravity/SouthEast/dx/24/dy/24`
  );
}

export function buildDownloadWatermarkRule() {
  const imageKeyBase64 = toUrlSafeBase64(getWatermarkImageKey());
  return (
    `imageMogr2/quality/92/format/jpg` +
    `/watermark/1/image_key/${imageKeyBase64}/dissolve/78/gravity/SouthEast/dx/28/dy/28`
  );
}
