'use client';

import { useState, useRef } from 'react';
import { Upload, ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getCloudinarySignature } from '@/app/actions/cloudinary';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CloudinaryUploadProps {
    onUploadSuccess: (url: string) => void;
    onUploadError?: (error: string) => void;
    folder?: string;
    allowedTypes?: string[]; // e.g. ['image/png', 'image/jpeg', 'image/webp']
    maxSizeMB?: number;
    className?: string;
    label?: string;
}

export default function CloudinaryUpload({
    onUploadSuccess,
    onUploadError,
    folder = "profile",
    allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    maxSizeMB = 4,
    className,
    label = "Upload Image"
}: CloudinaryUploadProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const processFile = async (file: File) => {
        // 1. Validation
        if (!allowedTypes.includes(file.type)) {
            const err = "Unsupported file type. Please upload a standard image.";
            toast.error(err);
            onUploadError?.(err);
            return;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            const err = `File is too large. Max size is ${maxSizeMB}MB.`;
            toast.error(err);
            onUploadError?.(err);
            return;
        }

        // Generate client-side preview
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        setProgress(0);

        try {
            // 2. Fetch Secure Signature from Server
            const sigRes = await getCloudinarySignature(folder);
            if (!sigRes.success || !sigRes.signature || !sigRes.timestamp || !sigRes.apiKey || !sigRes.cloudName || !sigRes.folder) {
                throw new Error(sigRes.message || "Failed to retrieve secure signature from server.");
            }

            // 3. Construct Signed Upload Payload
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", sigRes.apiKey);
            formData.append("timestamp", sigRes.timestamp.toString());
            formData.append("signature", sigRes.signature);
            formData.append("folder", sigRes.folder);

            // 4. Perform AJAX Request with Progress Reporting
            const xhr = new XMLHttpRequest();
            const uploadUrl = `https://api.cloudinary.com/v1_1/${sigRes.cloudName}/image/upload`;

            xhr.open("POST", uploadUrl, true);

            // Track Upload Progress
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    const secureUrl = response.secure_url;
                    
                    setIsUploading(false);
                    setProgress(100);
                    toast.success("Image uploaded successfully!");
                    onUploadSuccess(secureUrl);
                } else {
                    let errMsg = "Upload failed. Please check your credentials.";
                    try {
                        const errResponse = JSON.parse(xhr.responseText);
                        if (errResponse.error?.message) {
                            errMsg = errResponse.error.message;
                        }
                    } catch (e) {}
                    
                    setIsUploading(false);
                    setPreviewUrl(null);
                    toast.error(errMsg);
                    onUploadError?.(errMsg);
                }
            };

            xhr.onerror = () => {
                const errMsg = "Network error occurred during image upload.";
                setIsUploading(false);
                setPreviewUrl(null);
                toast.error(errMsg);
                onUploadError?.(errMsg);
            };

            xhr.send(formData);

        } catch (error: any) {
            console.error("[Cloudinary Component] Upload error:", error);
            setIsUploading(false);
            setPreviewUrl(null);
            const errMsg = error?.message || "Failed to process image upload.";
            toast.error(errMsg);
            onUploadError?.(errMsg);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn("w-full", className)}>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={allowedTypes.join(',')}
                onChange={handleChange}
                disabled={isUploading}
            />

            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={isUploading ? undefined : triggerFileInput}
                className={cn(
                    "relative border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 overflow-hidden min-h-[180px]",
                    isDragActive 
                        ? "border-teal-400 bg-teal-950/20 scale-[1.01]" 
                        : "border-white/10 bg-zinc-900/20 hover:border-white/20 hover:bg-zinc-900/30",
                    isUploading && "cursor-not-allowed hover:bg-zinc-900/20"
                )}
            >
                {/* Visual Glassmorphic Aura */}
                <div className="absolute -inset-x-20 -inset-y-20 bg-gradient-to-tr from-violet-600/5 to-teal-500/5 blur-3xl pointer-events-none" />

                {previewUrl ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 z-10">
                        {/* Preview thumbnail with premium styling */}
                        <div className="relative w-20 h-20 rounded-full border border-white/10 overflow-hidden shadow-2xl">
                            {/* raw img: previewUrl is a data: URI from FileReader (local upload preview) — next/image can't optimize these */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                                </div>
                            )}
                        </div>

                        {isUploading ? (
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between text-xs font-mono font-bold text-zinc-400">
                                    <span>UPLOADING</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-teal-400 to-violet-500 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold font-mono tracking-widest uppercase">
                                <CheckCircle2 className="w-4 h-4" /> UPLOAD COMPLETE
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 z-10">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 border border-white/10 hover:text-white transition-colors">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white tracking-wide">{label}</p>
                            <p className="text-xs text-zinc-500">Drag & drop or click to browse</p>
                        </div>
                        <span className="text-[10px] text-zinc-600 font-mono">
                            Max {maxSizeMB}MB • JPG, PNG, WEBP
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
