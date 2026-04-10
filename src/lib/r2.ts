import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "dstash"

export const r2 = accountId && accessKeyId && secretAccessKey
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  if (!r2) throw new Error("R2 not configured")
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType }))
}

export async function deleteFromR2(key: string): Promise<void> {
  if (!r2) return
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}

export async function getFromR2(key: string): Promise<{ body: ReadableStream; contentType: string | undefined }> {
  if (!r2) throw new Error("R2 not configured")
  const res = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }))
  if (!res.Body) throw new Error("Empty response from R2")
  // @aws-sdk/client-s3 returns a SdkStreamMixin which has .transformToWebStream()
  const stream = (res.Body as unknown as { transformToWebStream(): ReadableStream }).transformToWebStream()
  return { body: stream, contentType: res.ContentType }
}
