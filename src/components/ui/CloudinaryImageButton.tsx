"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";
import { toast } from "sonner";

/**
 * Minimal click-to-upload image button backed by Cloudinary. Drop-in replacement
 * for the old UploadThing <UploadButton> on image surfaces. Renders `children`
 * as the button face (swapped for a spinner while uploading).
 */
export function CloudinaryImageButton({
    folder,
    onUploaded,
    className,
    title,
    children,
}: {
    folder: string;
    onUploaded: (url: string) => void;
    className?: string;
    title?: string;
    children?: React.ReactNode;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);

    return (
        <>
            <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setBusy(true);
                    try {
                        const r = await uploadToCloudinary(file, { folder });
                        onUploaded(r.url);
                        toast.success("Image uploaded!");
                    } catch (err: any) {
                        toast.error(err?.message || "Upload failed");
                    } finally {
                        setBusy(false);
                    }
                }}
            />
            <button type="button" title={title} disabled={busy} onClick={() => ref.current?.click()} className={className}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
            </button>
        </>
    );
}
