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

  if (!bucket) {
    throw new Error("TENCENT_COS_BUCKET is not configured");
  }
  if (!region) {
    throw new Error("TENCENT_COS_REGION is not configured");
  }
  if (!secretId) {
    throw new Error("TENCENT_SECRET_ID is not configured");
  }
  if (!secretKey) {
    throw new Error("TENCENT_SECRET_KEY is not configured");
  }

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
  queryString?: string
) {
  return cos.getObjectUrl({
    Bucket: config.bucket,
    Region: config.region,
    Key: key,
    Sign: true,
    Expires: expires,
    Method: "GET",
    QueryString: queryString
  });
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
