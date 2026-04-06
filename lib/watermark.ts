const DEFAULT_WATERMARK_IMAGE_KEY = "watermark/logo.png";

function toUrlSafeBase64(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getWatermarkImageBase64(bucket: string, region: string) {
  const imageUrl = `https://${bucket}.cos.${region}.myqcloud.com/${DEFAULT_WATERMARK_IMAGE_KEY}`;
  return toUrlSafeBase64(imageUrl);
}

function buildImageWatermarkSegment(bucket: string, region: string, dissolve: number, dx: number, dy: number) {
  const imageBase64 = getWatermarkImageBase64(bucket, region);
  return `watermark/1/image/${imageBase64}/dissolve/${dissolve}/gravity/SouthEast/dx/${dx}/dy/${dy}/blogo/1`;
}

// 用于 Pic-Operations 上传时生成衍生图（返回 rules 数组）
export function buildDisplayPicRules(bucket: string, region: string, displayKey: string, downloadKey: string) {
  const watermarkSegment = buildImageWatermarkSegment(bucket, region, 90, 30, 30);
  const downloadWatermarkSegment = buildImageWatermarkSegment(bucket, region, 90, 36, 36);
  return [
    {
      fileid: `/${displayKey}`,
      rule: `imageMogr2/thumbnail/2560x/quality/80/format/jpg`
    },
    {
      fileid: `/${displayKey}`,
      rule: watermarkSegment
    },
    {
      fileid: `/${downloadKey}`,
      rule: downloadWatermarkSegment
    }
  ];
}

// 用于签名 URL 实时处理
export function buildDisplayWatermarkRule(bucket: string, region: string) {
  return buildImageWatermarkSegment(bucket, region, 90, 30, 30);
}

export function buildDownloadWatermarkRule(bucket: string, region: string) {
  return buildImageWatermarkSegment(bucket, region, 90, 36, 36);
}
