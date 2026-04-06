import COS from "cos-nodejs-sdk-v5";

export type CosConfig = {
  bucket: string;
  region: string;
  secretId: string;
  secretKey: string;
};

export function readCosConfig(): CosConfig {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!bucket) throw new Error("TENCENT_COS_BUCKET is not configured");
  if (!region) throw new Error("TENCENT_COS_REGION is not configured");
  if (!secretId) throw new Error("TENCENT_SECRET_ID is not configured");
  if (!secretKey) throw new Error("TENCENT_SECRET_KEY is not configured");
  return { bucket, region, secretId, secretKey };
}

export function createCosClient(config: CosConfig) {
  return new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey
  });
}

export function createSignedObjectUrl(
  cos: COS,
  config: CosConfig,
  key: string,
  expires = 10 * 60,
  ciParams?: string
): string {
  // 只对对象本身签名，不带任何 CI 参数
  const signedUrl = cos.getObjectUrl({
    Bucket: config.bucket,
    Region: config.region,
    Key: key,
    Sign: true,
    Expires: expires,
    Method: "GET"
  });

  // CI 处理参数直接拼在签名 URL 后面，不纳入签名
  // COS 数据万象对已签名对象的 CI 参数不需要额外签名
  return ciParams ? `${signedUrl}&${ciParams}` : signedUrl;
}

export async function checkObjectExists(cos: COS, config: CosConfig, key: string) {
  try {
    await cos.headObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key
    });
    return true;
  } catch {
    return false;
  }
}
