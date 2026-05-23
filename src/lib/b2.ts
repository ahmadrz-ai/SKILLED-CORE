import crypto from "crypto";

const bucketName = process.env.B2_BUCKET_NAME || '';
const endpoint = process.env.B2_ENDPOINT || '';
const keyId = process.env.B2_APPLICATION_KEY_ID || '';
const applicationKey = process.env.B2_APPLICATION_KEY || '';

export const B2_BUCKET = bucketName;

interface B2AuthResponse {
    apiUrl: string;
    authorizationToken: string;
}

async function getB2Auth(): Promise<B2AuthResponse> {
    if (!keyId || !applicationKey) {
        throw new Error("Missing Backblaze B2 credentials in environment.");
    }
    const authHeader = Buffer.from(`${keyId}:${applicationKey}`).toString("base64");
    const res = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
        headers: {
            Authorization: `Basic ${authHeader}`,
        },
    });
    if (!res.ok) {
        throw new Error(`B2 Authorization failed: ${res.statusText} - ${await res.text()}`);
    }
    return await res.json();
}

async function getBucketId(apiUrl: string, token: string): Promise<string> {
    const res = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
        method: "POST",
        headers: {
            Authorization: token,
        },
        body: JSON.stringify({ accountId: keyId }),
    });
    if (!res.ok) {
        throw new Error(`B2 List Buckets failed: ${res.statusText}`);
    }
    const data = await res.json();
    const bucket = data.buckets.find((b: any) => b.bucketName === bucketName);
    if (!bucket) {
        throw new Error(`B2 Bucket not found: ${bucketName}`);
    }
    return bucket.bucketId;
}

export async function nativeUploadB2File(buffer: Buffer, fileName: string, contentType: string) {
    const { apiUrl, authorizationToken } = await getB2Auth();
    const bucketId = await getBucketId(apiUrl, authorizationToken);

    // Get upload URL
    const uploadUrlRes = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
        method: "POST",
        headers: {
            Authorization: authorizationToken,
        },
        body: JSON.stringify({ bucketId }),
    });
    if (!uploadUrlRes.ok) {
        throw new Error(`B2 Get Upload URL failed: ${uploadUrlRes.statusText}`);
    }
    const uploadUrlData = await uploadUrlRes.json();
    const { uploadUrl, authorizationToken: uploadAuthToken } = uploadUrlData;

    // Upload
    const sha1 = crypto.createHash("sha1").update(buffer).digest("hex");
    const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            Authorization: uploadAuthToken,
            "X-Bz-File-Name": fileName,
            "Content-Type": contentType,
            "Content-Length": buffer.length.toString(),
            "X-Bz-Content-Sha1": sha1,
        },
        body: buffer as any,
    });
    if (!uploadRes.ok) {
        throw new Error(`B2 Upload failed: ${uploadRes.statusText} - ${await uploadRes.text()}`);
    }
    const uploadData = await uploadRes.json();

    const fileUrl = `https://${endpoint}/${bucketName}/${fileName}`;
    return {
        success: true,
        url: fileUrl,
        key: fileName,
        fileId: uploadData.fileId,
    };
}

export async function nativeListB2Files(maxKeys: number = 50) {
    const { apiUrl, authorizationToken } = await getB2Auth();
    const bucketId = await getBucketId(apiUrl, authorizationToken);

    const res = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
        method: "POST",
        headers: {
            Authorization: authorizationToken,
        },
        body: JSON.stringify({ bucketId, maxFileCount: maxKeys }),
    });
    if (!res.ok) {
        throw new Error(`B2 List Files failed: ${res.statusText}`);
    }
    const data = await res.json();
    return (data.files || []).map((file: any) => ({
        key: file.fileName,
        name: file.fileName.split('/').pop() || file.fileName,
        url: `https://${endpoint}/${bucketName}/${file.fileName}`,
        size: file.contentLength || 0,
        type: 'image',
        createdAt: file.uploadTimestamp || Date.now(),
    }));
}

export async function nativeDeleteB2File(fileName: string) {
    const { apiUrl, authorizationToken } = await getB2Auth();
    const bucketId = await getBucketId(apiUrl, authorizationToken);

    // List versions to get fileId
    const res = await fetch(`${apiUrl}/b2api/v2/b2_list_file_versions`, {
        method: "POST",
        headers: {
            Authorization: authorizationToken,
        },
        body: JSON.stringify({
            bucketId,
            startFileName: fileName,
            maxFileCount: 1,
        }),
    });
    if (!res.ok) {
        throw new Error(`B2 List Versions failed: ${res.statusText}`);
    }
    const data = await res.json();
    const match = (data.files || []).find((f: any) => f.fileName === fileName);
    if (!match) {
        throw new Error(`B2 file not found for deletion: ${fileName}`);
    }

    // Delete version
    const delRes = await fetch(`${apiUrl}/b2api/v2/b2_delete_file_version`, {
        method: "POST",
        headers: {
            Authorization: authorizationToken,
        },
        body: JSON.stringify({
            fileName: match.fileName,
            fileId: match.fileId,
        }),
    });
    if (!delRes.ok) {
        throw new Error(`B2 Delete Version failed: ${delRes.statusText}`);
    }
    return { success: true };
}
