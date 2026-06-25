import { UTApi } from "uploadthing/server";
import { v2 as cloudinary } from "cloudinary";
import { urlHostMatches } from "@/lib/urlAllow";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const utapi = new UTApi();

/**
 * Automatically parses a given asset URL (Cloudinary or UploadThing) 
 * and triggers the proper server-side deletion process for it.
 */
export async function deleteFileFromStorage(url: string) {
    if (!url) return { success: false, message: "No URL provided" };

    try {
        // 1. Cloudinary Asset Detection & Deletion
        if (urlHostMatches(url, ["cloudinary.com"])) {
            // Cloudinary URL format: 
            // https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[ext]
            // We need to parse out the public ID (excluding extension and version structure)
            const parts = url.split('/upload/');
            if (parts.length < 2) return { success: false, message: "Invalid Cloudinary URL" };
            
            // Remove the version segment (e.g. 'v12345678/') if it exists
            let pathAfterUpload = parts[1];
            if (pathAfterUpload.startsWith('v')) {
                const slashIndex = pathAfterUpload.indexOf('/');
                if (slashIndex !== -1) {
                    pathAfterUpload = pathAfterUpload.substring(slashIndex + 1);
                }
            }
            
            // Remove file extension (e.g. '.jpg', '.png')
            const lastDotIndex = pathAfterUpload.lastIndexOf('.');
            const publicId = lastDotIndex !== -1 
                ? pathAfterUpload.substring(0, lastDotIndex) 
                : pathAfterUpload;
                
            console.log(`[Storage Helper] Deleting Cloudinary asset: ${publicId}`);
            
            // Call Cloudinary SDK
            const result = await cloudinary.uploader.destroy(publicId);
            if (result.result === 'ok') {
                return { success: true, message: "Cloudinary asset deleted" };
            } else {
                console.error("[Storage Helper] Cloudinary destruction failed:", result);
                return { success: false, message: `Cloudinary returned: ${result.result}` };
            }
        }
        
        // 2. UploadThing Asset Detection & Deletion
        // Match ALL UploadThing domains. Older uploads use utfs.io / uploadthing.com,
        // but current SDK versions return the newer `<appId>.ufs.sh` domain — missing
        // that here is why old resumes/avatars were never actually deleted on re-upload.
        if (urlHostMatches(url, ["utfs.io", "ufs.sh", "uploadthing.com"])) {
            // URL formats: https://utfs.io/f/<key>, https://<appId>.ufs.sh/f/<key>,
            // or https://utfs.io/a/<appId>/<key>. The key is the last path segment.
            const fileKey = url.split("?")[0].split("/").filter(Boolean).pop();
            if (!fileKey) return { success: false, message: "Invalid UploadThing URL" };

            console.log(`[Storage Helper] Deleting UploadThing asset: ${fileKey}`);
            const res = await utapi.deleteFiles(fileKey);
            return { success: res.success, message: `UploadThing status: ${res.success}` };
        }
        
        return { success: false, message: "Unsupported storage provider URL" };
    } catch (error: any) {
        console.error("[Storage Helper] Unhandled exception during file deletion:", error);
        return { success: false, message: error?.message || "Internal deletion error" };
    }
}
