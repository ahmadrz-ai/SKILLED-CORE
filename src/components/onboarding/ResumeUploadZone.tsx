'use client';

import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";
import { FileText, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeUploadZoneProps {
    onUploadSuccess?: (url: string) => void;
    className?: string;
}

export function ResumeUploadZone({ onUploadSuccess, className }: ResumeUploadZoneProps) {
    return (
        <div className={cn("w-full", className)}>
            <UploadDropzone
                endpoint="resumeUploader"
                onClientUploadComplete={(res) => {
                    // Do something with the response
                    console.log("Files: ", res);
                    if (res && res.length > 0) {
                        const url = res[0].url;
                        // alert("Upload Success: " + url); // User requested browser alert for testing
                        toast.success("Resume uploaded successfully");
                        onUploadSuccess?.(url);
                    }
                }}
                onUploadError={(error: Error) => {
                    // Do something with the error.
                    alert(`ERROR! ${error.message}`);
                    toast.error(`Upload error: ${error.message}`);
                }}
                appearance={{
                    container: "border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors rounded-xl p-8 cursor-pointer",
                    label: "text-zinc-400 hover:text-zinc-200 transition-colors",
                    allowedContent: "text-zinc-500 text-xs",
                    button: "bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-md mt-4 transition-colors",
                }}
                content={{
                    uploadIcon: <UploadCloud className="w-10 h-10 text-violet-500 mb-4" />,
                    label: "Drag & drop PDF here or click to browse",
                    allowedContent: "PDF only (max 4MB)"
                }}
            />
        </div>
    );
}
