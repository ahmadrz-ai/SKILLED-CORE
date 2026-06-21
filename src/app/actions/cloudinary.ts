'use server';

import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface SignatureResponse {
    success: boolean;
    signature?: string;
    timestamp?: number;
    apiKey?: string;
    cloudName?: string;
    folder?: string;
    message?: string;
}

/**
 * Generates a secure, cryptographic signature for client-side direct uploads to Cloudinary.
 * Expiry is set automatically by Cloudinary (typically 1 hour).
 */
export async function getCloudinarySignature(folderName: string = "skilledcore"): Promise<SignatureResponse> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized: Please log in to upload assets." };
    }

    // V10: bound how fast a single user can mint upload signatures so a compromised
    // or abusive account can't flood Cloudinary storage. (Per-file size/type caps are
    // enforced at the Cloudinary account/upload-preset level.) 40 uploads / minute.
    const rl = await checkRateLimit("cloudinary-sign", session.user.id, 40, 60);
    if (!rl.success) {
        return { success: false, message: "Too many uploads — please slow down and try again shortly." };
    }

    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = `skilledcore/${folderName}`;
        
        // Define parameters to sign. 
        // IMPORTANT: These exact parameters must match the client-side upload payload!
        const paramsToSign = {
            timestamp: timestamp,
            folder: folder,
        };

        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        if (!apiSecret) {
            console.error("[Cloudinary Server Action] Missing CLOUDINARY_API_SECRET in environment.");
            return { success: false, message: "Storage provider credentials not configured." };
        }

        // Generate the signature
        const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

        return {
            success: true,
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            folder,
        };
    } catch (error: any) {
        console.error("[Cloudinary Server Action] Failed to generate secure upload signature:", error);
        return { success: false, message: error?.message || "Failed to generate security signature." };
    }
}
