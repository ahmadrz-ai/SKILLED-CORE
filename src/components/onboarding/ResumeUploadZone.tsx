'use client';

import { useUploadThing } from "@/lib/uploadthing";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useState, useRef } from "react";

interface ResumeUploadZoneProps {
    onUploadSuccess?: (url: string, file: File) => void;
    className?: string;
}

export function ResumeUploadZone({ onUploadSuccess, className }: ResumeUploadZoneProps) {
    const [isUploading, setIsUploading] = useState(false);
    const uploadedFileRef = useRef<File | null>(null);

    const { startUpload } = useUploadThing("resumeUploader", {
        onClientUploadComplete: (res) => {
            setIsUploading(false);
            if (res && res.length > 0) {
                const url = res[0].url;
                toast.success("Resume uploaded successfully");
                if (uploadedFileRef.current) {
                    onUploadSuccess?.(url, uploadedFileRef.current);
                } else {
                    console.error("File reference missing in callback");
                }
            }
        },
        onUploadError: (error: Error) => {
            setIsUploading(false);
            toast.error(`Upload error: ${error.message}`);
        },
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setIsUploading(true);
            const file = acceptedFiles[0];
            uploadedFileRef.current = file;
            startUpload([file]);
        }
    }, [startUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        multiple: false,
        disabled: isUploading
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "w-full border-2 border-dashed border-zinc-700 bg-zinc-900/50 rounded-xl p-8 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center group outline-none",
                isDragActive && "border-amber-500 bg-amber-500/10",
                isUploading && "opacity-50 cursor-not-allowed pointer-events-none",
                !isUploading && "hover:bg-zinc-800/50 hover:border-zinc-500",
                className
            )}
        >
            <input {...getInputProps()} />

            {isUploading ? (
                <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-10 h-10 text-amber-500 mb-4 animate-spin" />
                    <p className="text-zinc-400 text-sm font-medium">Uploading firmware...</p>
                </div>
            ) : (
                <>
                    <div className={cn(
                        "p-4 rounded-full bg-zinc-800/50 mb-4 group-hover:bg-zinc-800 transition-colors",
                        isDragActive && "bg-amber-500/20"
                    )}>
                        <UploadCloud className={cn(
                            "w-8 h-8 text-zinc-400 transition-colors",
                            isDragActive ? "text-amber-500" : "group-hover:text-amber-400"
                        )} />
                    </div>
                    <p className="text-zinc-200 font-medium mb-1">
                        {isDragActive ? "Drop contents here" : "Click to deploy or drag PDF"}
                    </p>
                    <p className="text-zinc-500 text-xs">
                        PDF (max 4MB)
                    </p>
                </>
            )}
        </div>
    );
}
