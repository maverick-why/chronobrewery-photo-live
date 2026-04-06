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

// 用于 Pic-Operations 上传时生成 display 文件（缩图 + 单独水印两条规则）
export function buildDisplayPicRules(bucket: string, region: string, originalKey: string, activitySlug: string) {
  const { mapOriginalToDisplayKey, mapOriginalToDownloadKey } = require("@/lib/photo-keys");
  const displayKey = mapOriginalToDisplayKey(originalKey, activitySlug);
  const downloadKey = mapOriginalToDownloadKey(originalKey, activitySlug);
  const imageBase64 = getWatermarkImageUrl(bucket, region);

  return [
    {
      fileid: `/${displayKey}`,
      rule: `imageMogr2/thumbnail/2560x/quality/80/format/jpg`
    },
    {
      fileid: `/${displayKey}`,
      rule: `watermark/1/image/${imageBase64}/dissolve/90/gravity/SouthEast/dx/30/dy/30/blogo/1`
    },
    {
      fileid: `/${downloadKey}`,
      rule: `watermark/1/image/${imageBase64}/dissolve/90/gravity/SouthEast/dx/36/dy/36/blogo/1`
    }
  ];
}

// 用于签名 URL 实时处理（预览/下载时叠加水印）
export function buildDisplayWatermarkRule(bucket: string, region: string) {
  const imageBase64 = getWatermarkImageUrl(bucket, region);
  return `watermark/1/image/${imageBase64}/dissolve/90/gravity/SouthEast/dx/30/dy/30/blogo/1`;
}

export function buildDownloadWatermarkRule(bucket: string, region: string) {
  const imageBase64 = getWatermarkImageUrl(bucket, region);
  return `watermark/1/image/${imageBase64}/dissolve/90/gravity/SouthEast/dx/36/dy/36/blogo/1`;
}
