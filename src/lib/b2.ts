import { S3Client } from "@aws-sdk/client-s3";

const bucketName = process.env.B2_BUCKET_NAME;
const endpoint = process.env.B2_ENDPOINT;
const keyId = process.env.B2_APPLICATION_KEY_ID;
const applicationKey = process.env.B2_APPLICATION_KEY;

export const s3 = new S3Client({
    endpoint: endpoint ? `https://${endpoint}` : undefined,
    credentials: {
        accessKeyId: keyId || '',
        secretAccessKey: applicationKey || '',
    },
    region: "us-east-1", // AWS SDK requires a region, Backblaze B2 ignores it
    forcePathStyle: true, // Backblaze B2 requires path-style addressing
});

export const B2_BUCKET = bucketName || '';
