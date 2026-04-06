const DEFAULT_WATERMARK_TEXT = "时光酿造所";

function toUrlSafeBase64(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function getWatermarkText() {
  return process.env.WATERMARK_TEXT || DEFAULT_WATERMARK_TEXT;
}

function buildTextWatermarkSegment(fontSize: number, dissolve: number, dx: number, dy: number) {
  const textBase64 = toUrlSafeBase64(getWatermarkText());
  const fillBase64 = toUrlSafeBase64("#FFFFFF");
  return (
    `watermark/2/text/${textBase64}` +
    `/fontsize/${fontSize}/fill/${fillBase64}` +
    `/dissolve/${dissolve}/gravity/SouthEast/dx/${dx}/dy/${dy}`
  );
}

export function buildDisplayWatermarkRule() {
  // 用 / 连接，不用 |，COS CI 的 Pic-Operations rule 不支持管道
  return (
    `imageMogr2/thumbnail/2560x/quality/80/format/jpg` +
    `/${buildTextWatermarkSegment(54, 70, 30, 30)}`
  );
}

export function buildDownloadWatermarkRule() {
  return (
    `imageMogr2/quality/92/format/jpg` +
    `/${buildTextWatermarkSegment(60, 72, 36, 36)}`
  );
}
