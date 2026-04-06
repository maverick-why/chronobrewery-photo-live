import COS from "cos-nodejs-sdk-v5";
import type { CosConfig } from "@/lib/cos";

const DEFAULT_WATERMARK_IMAGE_KEY = "watermark/logo.png";
const DEFAULT_WATERMARK_TEXT = "时光酿造所";

function toUrlSafeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

export function getWatermarkImageKey() {
  return process.env.WATERMARK_IMAGE_KEY || DEFAULT_WATERMARK_IMAGE_KEY;
}

export function getWatermarkText() {
  return process.env.WATERMARK_TEXT || DEFAULT_WATERMARK_TEXT;
}

export function createSignedWatermarkImageUrl(cos: COS, config: CosConfig, expiresSeconds = 3600) {
  return cos.getObjectUrl({
    Bucket: config.bucket,
    Region: config.region,
    Key: getWatermarkImageKey(),
    Sign: true,
    Expires: expiresSeconds,
    Method: "GET",
    Protocol: "http:"
  });
}

export function buildDisplayWatermarkRule(watermarkImageUrl: string) {
  const imageBase64 = toUrlSafeBase64(watermarkImageUrl);
  const textBase64 = toUrlSafeBase64(getWatermarkText());
  const fillBase64 = toUrlSafeBase64("#FFFFFF");
  return (
    `imageMogr2/thumbnail/2560x/quality/80/format/jpg` +
    `/watermark/1/image/${imageBase64}/dissolve/75/gravity/SouthEast/dx/24/dy/24` +
    `/watermark/2/text/${textBase64}/fontsize/34/fill/${fillBase64}/dissolve/62/gravity/SouthEast/dx/24/dy/24`
  );
}

export function buildDownloadWatermarkRule(watermarkImageUrl: string) {
  const imageBase64 = toUrlSafeBase64(watermarkImageUrl);
  const textBase64 = toUrlSafeBase64(getWatermarkText());
  const fillBase64 = toUrlSafeBase64("#FFFFFF");
  return (
    `imageMogr2/quality/92/format/jpg` +
    `/watermark/1/image/${imageBase64}/dissolve/78/gravity/SouthEast/dx/28/dy/28` +
    `/watermark/2/text/${textBase64}/fontsize/38/fill/${fillBase64}/dissolve/65/gravity/SouthEast/dx/28/dy/28`
  );
}
