"use client";

import { getCloudinarySignature } from "@/app/actions/cloudinary";

export interface CloudinaryUploadResult {
    url: string;
    /** "image" | "video" | "raw" as reported by Cloudinary. */
    resourceType: string;
    bytes: number;
    format?: string;
}

/**
 * Single client-side helper for uploading any user media to Cloudinary
 * (signed direct upload). This is the ONE path for images/video/files across
 * the app — posts, messages, profile pictures, job images, company logos.
 * UploadThing is reserved exclusively for resume PDFs.
 *
 * Uses the `auto` upload endpoint so images, short videos, and raw files
 * (e.g. chat PDF attachments) all work through the same signed request.
 */
export async function uploadToCloudinary(
    file: File,
    opts: { folder?: string; onProgress?: (pct: number) => void } = {},
): Promise<CloudinaryUploadResult> {
    const folder = opts.folder || "misc";

    const sig = await getCloudinarySignature(folder);
    if (!sig.success || !sig.signature || !sig.timestamp || !sig.apiKey || !sig.cloudName || !sig.folder) {
        throw new Error(sig.message || "Could not start upload (signature failed).");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("folder", sig.folder);

    // `auto` resource type → Cloudinary routes image/video/raw correctly.
    const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint, true);
        if (opts.onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) opts.onProgress!(Math.round((e.loaded / e.total) * 100));
            };
        }
        xhr.onload = () => {
            if (xhr.status === 200) {
                try {
                    const r = JSON.parse(xhr.responseText);
                    resolve({ url: r.secure_url, resourceType: r.resource_type || "image", bytes: r.bytes || file.size, format: r.format });
                } catch {
                    reject(new Error("Upload succeeded but the response was unreadable."));
                }
            } else {
                let msg = "Upload failed. Please try again.";
                try {
                    const err = JSON.parse(xhr.responseText);
                    if (err?.error?.message) msg = err.error.message;
                } catch { /* keep generic */ }
                reject(new Error(msg));
            }
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(form);
    });
}
