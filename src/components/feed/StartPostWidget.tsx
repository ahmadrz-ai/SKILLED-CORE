"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image as ImageIcon, Calendar, FileText, X, BarChart2, Smile, Send, Loader2, Edit, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link2, Code2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCloudinarySignature } from "@/app/actions/cloudinary";
import ImageEditorModal from "@/components/feed/ImageEditorModal";
import EmojiPicker from "emoji-picker-react";

interface StartPostWidgetProps {
    onPostCreated?: (content: string, pollOptions?: string[], imageUrl?: string) => void;
}

interface DraftImage {
    file: File;
    previewUrl: string;
    alt: string;
    tags: any[];
}

export function StartPostWidget({ onPostCreated }: StartPostWidgetProps) {
    const { data: session } = useSession();
    const user = session?.user;
    
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");
    const [isPollMode, setIsPollMode] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""]);

    // Multi-Image & Editor State
    const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
    const [editorInitialFiles, setEditorInitialFiles] = useState<File[]>([]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Event State
    const [isEventOpen, setIsEventOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventTime, setEventTime] = useState("");
    const [eventFormat, setEventFormat] = useState<"online" | "in-person">("online");
    const [eventLocation, setEventLocation] = useState("");
    const [eventDescription, setEventDescription] = useState("");
    const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
    const [isEventSubmitting, setIsEventSubmitting] = useState(false);

    // Article State
    const [isArticleOpen, setIsArticleOpen] = useState(false);
    const [articleTitle, setArticleTitle] = useState("");
    const [articleCoverFile, setArticleCoverFile] = useState<File | null>(null);
    const [articleCoverPreview, setArticleCoverPreview] = useState("");
    const [articleBody, setArticleBody] = useState("");
    const [articleErrors, setArticleErrors] = useState<Record<string, string>>({});
    const [isArticleSubmitting, setIsArticleSubmitting] = useState(false);
    
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Text Formatting State
    const [showFormatting, setShowFormatting] = useState(false);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            draftImages.forEach(img => {
                if (img.previewUrl) {
                    URL.revokeObjectURL(img.previewUrl);
                }
            });
            if (articleCoverPreview) {
                URL.revokeObjectURL(articleCoverPreview);
            }
        };
    }, [draftImages, articleCoverPreview]);

    // Force focus when dialog opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Format Selected Text with Markdown-like tags
    const formatText = (style: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let replacement = "";

        switch (style) {
            case "bold":
                replacement = `**${selectedText || "bold text"}**`;
                break;
            case "italic":
                replacement = `*${selectedText || "italic text"}*`;
                break;
            case "underline":
                replacement = `__${selectedText || "underlined text"}__`;
                break;
            case "strikethrough":
                replacement = `~~${selectedText || "strikethrough text"}~~`;
                break;
            case "bullet":
                replacement = `${start === 0 || text[start - 1] === "\n" ? "" : "\n"}- ${selectedText || "list item"}`;
                break;
            case "number":
                replacement = `${start === 0 || text[start - 1] === "\n" ? "" : "\n"}1. ${selectedText || "list item"}`;
                break;
            case "quote":
                replacement = `${start === 0 || text[start - 1] === "\n" ? "" : "\n"}> ${selectedText || "quote text"}`;
                break;
            case "code":
                replacement = selectedText.includes("\n")
                    ? `${start === 0 || text[start - 1] === "\n" ? "" : "\n"}\`\`\`typescript\n${selectedText}\n\`\`\`\n`
                    : `\`${selectedText || "code"}\``;
                break;
            case "link":
                replacement = `[${selectedText || "link text"}](https://skilledcore.com)`;
                break;
            default:
                return;
        }

        const newContent = text.substring(0, start) + replacement + text.substring(end);
        setContent(newContent);

        // Refocus and place cursor in the middle if no text was selected
        setTimeout(() => {
            textarea.focus();
            if (!selectedText) {
                const backOffset = style === "bold" || style === "underline" || style === "strikethrough" ? 2 : style === "italic" ? 1 : 0;
                const newCursorPos = start + replacement.length - backOffset;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                const newCursorPos = start + replacement.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 50);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const MAX_SIZE = 4 * 1024 * 1024;
        const oversized = files.some(f => f.size >= MAX_SIZE);
        if (oversized) {
            toast.error("Images must be strictly under 4MB.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        const totalImages = draftImages.length + files.length;
        if (totalImages > 4) {
            toast.error("You can upload up to 4 images maximum.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setEditorInitialFiles(files);
        setIsEditorOpen(true);
    };

    const handleApplyEditorChanges = (editedImages: DraftImage[]) => {
        // Append or replace
        setDraftImages(prev => {
            // revoke old urls
            prev.forEach(p => URL.revokeObjectURL(p.previewUrl));
            return editedImages;
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveDraftImage = (indexToRemove: number) => {
        setDraftImages(prev => {
            const img = prev[indexToRemove];
            if (img && img.previewUrl) {
                URL.revokeObjectURL(img.previewUrl);
            }
            return prev.filter((_, idx) => idx !== indexToRemove);
        });
    };

    const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (eventTitle.trim().length < 3) {
            errors.title = "Event name must be at least 3 characters.";
        }
        if (!eventDate || !eventTime) {
            errors.dateTime = "Please select both date and time.";
        } else {
            const eventDateTime = new Date(`${eventDate}T${eventTime}`);
            if (eventDateTime.getTime() <= Date.now()) {
                errors.dateTime = "Event date and time must be in the future.";
            }
        }
        if (!eventLocation.trim()) {
            errors.location = "Location or Link is required.";
        } else if (eventFormat === "online") {
            const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(eventLocation.trim());
            if (!isUrl) {
                errors.location = "Please enter a valid URL for online format.";
            }
        }
        if (eventDescription.trim().length < 10) {
            errors.description = "Description must be at least 10 characters.";
        }

        if (Object.keys(errors).length > 0) {
            setEventErrors(errors);
            toast.error("Please resolve all validation errors.");
            return;
        }

        setEventErrors({});
        setIsEventSubmitting(true);

        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        const formattedPostContent = `📅 **EVENT: ${eventTitle.trim()}**\n\n🕒 **Date & Time:** ${eventDateTime.toLocaleString()}\n📍 **Location:** ${eventFormat === "online" ? "🌐 Online" : "📍 In-Person"} - ${eventLocation.trim()}\n\n📝 **Details:**\n${eventDescription.trim()}`;

        try {
            onPostCreated?.(formattedPostContent, undefined, undefined);
            
            // Reset & Close
            setEventTitle("");
            setEventDate("");
            setEventTime("");
            setEventFormat("online");
            setEventLocation("");
            setEventDescription("");
            setIsEventOpen(false);
            toast.success("Event created successfully!");
        } catch (err) {
            toast.error("Failed to create event post.");
        } finally {
            setIsEventSubmitting(false);
        }
    };

    const handleArticleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (articleTitle.trim().length < 5) {
            errors.title = "Article title must be at least 5 characters.";
        }
        if (articleBody.trim().length < 20) {
            errors.body = "Article body must be at least 20 characters.";
        }

        if (Object.keys(errors).length > 0) {
            setArticleErrors(errors);
            toast.error("Please resolve all validation errors.");
            return;
        }

        setArticleErrors({});
        setIsArticleSubmitting(true);

        let imageUrl: string | undefined;

        try {
            if (articleCoverFile) {
                const secureUrl = await uploadSingleToCloudinary(articleCoverFile);
                imageUrl = JSON.stringify([{ url: secureUrl, alt: "Article Cover Image", tags: [] }]);
            }

            const formattedPostContent = `📝 **ARTICLE: ${articleTitle.trim()}**\n\n${articleBody.trim()}`;
            onPostCreated?.(formattedPostContent, undefined, imageUrl);

            // Reset & Close
            setArticleTitle("");
            setArticleCoverFile(null);
            if (articleCoverPreview) {
                URL.revokeObjectURL(articleCoverPreview);
                setArticleCoverPreview("");
            }
            setArticleBody("");
            setIsArticleOpen(false);
            toast.success("Article published successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to upload cover image.");
        } finally {
            setIsArticleSubmitting(false);
        }
    };

    const handleFeatureDisabled = (feature: string) => {
        toast.info(`${feature} is currently disabled.`);
    };

    // Client-side Direct Cloudinary signed upload
    const uploadSingleToCloudinary = async (file: File): Promise<string> => {
        // 1. Fetch Secure Signature from Server
        const sigRes = await getCloudinarySignature("feed");
        if (!sigRes.success || !sigRes.signature || !sigRes.timestamp || !sigRes.apiKey || !sigRes.cloudName || !sigRes.folder) {
            throw new Error(sigRes.message || "Failed to retrieve secure signature from server.");
        }

        // 2. Construct Signed Upload Payload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigRes.apiKey);
        formData.append("timestamp", sigRes.timestamp.toString());
        formData.append("signature", sigRes.signature);
        formData.append("folder", sigRes.folder);

        // 3. Perform AJAX Request
        const uploadUrl = `https://api.cloudinary.com/v1_1/${sigRes.cloudName}/image/upload`;
        const res = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            let errMsg = "Upload failed.";
            try {
                const errResponse = await res.json();
                if (errResponse.error?.message) {
                    errMsg = errResponse.error.message;
                }
            } catch (e) {}
            throw new Error(errMsg);
        }

        const responseData = await res.json();
        return responseData.secure_url;
    };

    const handleSubmit = async () => {
        if (!content.trim() && draftImages.length === 0) return;

        // Validation logic
        let validOptions: string[] | undefined;
        if (isPollMode) {
            validOptions = pollOptions.filter(o => o.trim().length > 0);
            if (validOptions.length < 2) {
                toast.error("Poll needs at least 2 options");
                return;
            }
        }

        let imageUrl: string | undefined;

        if (draftImages.length > 0) {
            setIsUploading(true);
            try {
                // Upload all images concurrently to Cloudinary
                const uploadedAssets = await Promise.all(
                    draftImages.map(async (img) => {
                        const secureUrl = await uploadSingleToCloudinary(img.file);
                        return {
                            url: secureUrl,
                            alt: img.alt || "",
                            tags: img.tags || []
                        };
                    })
                );
                // Serialize as JSON string to support multi-images and metadata in single column
                imageUrl = JSON.stringify(uploadedAssets);
            } catch (err: any) {
                console.error("Cloudinary upload failed:", err);
                toast.error("Failed to upload image. Please try again.");
                setIsUploading(false);
                return;
            }
        }

        onPostCreated?.(content, validOptions, imageUrl);

        // Reset and close
        setContent("");
        setPollOptions(["", ""]);
        setIsPollMode(false);
        setDraftImages([]);
        setIsUploading(false);
        setIsOpen(false);
        toast.success("Post sent.");
    };

    return (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Top Row: Avatar + Input Trigger */}
            <div className="flex gap-3 mb-3">
                <Avatar className="w-12 h-12 cursor-pointer border border-[#E5E7EB]">
                    <AvatarImage src={user?.image || ""} />
                    <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-semibold">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
 
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button className="flex-1 text-left bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-full px-5 py-3 text-sm font-semibold text-[#6B7280] transition-colors duration-200">
                            Start a post...
                        </button>
                    </DialogTrigger>
 
                    {/* The Posting Dialog */}
                    <DialogContent
                        className="bg-white border-[#E5E7EB] text-[#111827] sm:max-w-4xl p-0 overflow-visible shadow-xl"
                        onOpenAutoFocus={(e) => {
                            e.preventDefault();
                            textareaRef.current?.focus();
                        }}
                    >
                        <DialogHeader className="p-4 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
                            <DialogTitle className="text-lg font-bold text-[#111827]">Create a post</DialogTitle>
                        </DialogHeader>
 
                        <div className="p-4">
                            {/* User Info in Dialog */}
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="w-10 h-10 border border-[#E5E7EB]">
                                    <AvatarImage src={user?.image || ""} />
                                    <AvatarFallback className="bg-[#EEF2FF] text-[#6366F1] font-bold">{user?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-sm text-[#111827]">{user?.name}</div>
                                    <div className="text-xs text-[#6B7280] font-medium">Post to Anyone</div>
                                </div>
                            </div>
 
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={isUploading}
                            />

                            {/* Text Formatting Toolbar */}
                            {showFormatting && (
                                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("bold")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Bold"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("italic")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Italic"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("underline")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Underline"
                                    >
                                        <Underline className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("strikethrough")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Strikethrough"
                                    >
                                        <Strikethrough className="w-4 h-4" />
                                    </Button>

                                    <div className="w-px h-5 bg-gray-200 mx-1" />

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("bullet")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Bullet List"
                                    >
                                        <List className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("number")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Numbered List"
                                    >
                                        <ListOrdered className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("quote")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Blockquote"
                                    >
                                        <Quote className="w-4 h-4" />
                                    </Button>

                                    <div className="w-px h-5 bg-gray-200 mx-1" />

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("link")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Insert Link"
                                    >
                                        <Link2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => formatText("code")}
                                        className="w-8 h-8 rounded-lg text-zinc-700 hover:text-black hover:bg-gray-100"
                                        title="Code Block"
                                    >
                                        <Code2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {/* Text Area */}
                            <Textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What do you want to talk about?"
                                disabled={isUploading}
                                className="w-full bg-transparent border-none focus-visible:ring-0 text-[#111827] text-lg min-h-[150px] md:min-h-[200px] resize-none placeholder:text-[#9CA3AF] caret-[#6366F1] relative cursor-text display-block focus-visible:ring-offset-0 focus:ring-0"
                            />

                            {/* Multiple Draft Images Collage Previews */}
                            {draftImages.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] p-2 relative">
                                    {draftImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-video bg-black/5 rounded-lg overflow-hidden group">
                                            <img
                                                src={img.previewUrl}
                                                alt={`Draft attachment ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {img.tags.length > 0 && (
                                                <span className="absolute bottom-2 left-2 bg-violet-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm shadow border border-white/10 z-10">
                                                    {img.tags.length} Tag{img.tags.length > 1 ? "s" : ""}
                                                </span>
                                            )}
                                            {img.alt && (
                                                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm z-10">
                                                    ALT
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const files = draftImages.map(img => img.file);
                                                    setEditorInitialFiles(files);
                                                    setIsEditorOpen(true);
                                                }}
                                                disabled={isUploading}
                                                className="absolute top-2 left-2 bg-black/60 hover:bg-[#6366F1] text-white p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-md z-20"
                                                title="Edit Image"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDraftImage(idx)}
                                                disabled={isUploading}
                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-md z-20"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-[1px] text-white gap-2 z-30">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
                                            <span className="text-xs font-semibold tracking-wide">Uploading...</span>
                                        </div>
                                    )}
                                </div>
                            )}
 
                            {/* Poll Editor */}
                            {isPollMode && (
                                <div className="mt-4 p-4 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB]">
                                    <label className="text-xs font-bold text-[#6B7280] uppercase mb-2 block tracking-wider">Poll Options</label>
                                    <div className="space-y-2">
                                        {pollOptions.map((opt, idx) => (
                                            <input
                                                key={idx}
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...pollOptions];
                                                    newOpts[idx] = e.target.value;
                                                    setPollOptions(newOpts);
                                                }}
                                                placeholder={`Option ${idx + 1}`}
                                                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#6366F1] focus:outline-none transition-colors"
                                            />
                                        ))}
                                    </div>
                                    {pollOptions.length < 4 && (
                                        <button
                                            onClick={() => setPollOptions([...pollOptions, ""])}
                                            className="mt-2.5 text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] transition-colors"
                                        >
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            )}
 
                            {/* Bottom Bar: Tools & Post Button */}
                            <div className="flex items-center justify-between mt-6 pt-3 border-t border-[#E5E7EB]">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isUploading}
                                        onClick={() => setContent(prev => prev + " #")}
                                        className="text-[#6366F1] hover:bg-[#EEF2FF] font-bold px-2.5 rounded-full text-xs h-8 animate-none"
                                    >
                                        # Hashtag
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isUploading}
                                        onClick={() => setContent(prev => prev + " @")}
                                        className="text-[#2563EB] hover:bg-[#EFF6FF] font-bold px-2.5 rounded-full text-xs h-8 animate-none"
                                    >
                                        @ Mention
                                    </Button>
 
                                    <div className="w-px h-6 bg-[#E5E7EB] mx-2" />
 
                                    {/* Real Tools inside Dialog */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isUploading}
                                        onClick={() => setIsPollMode(!isPollMode)}
                                        className={cn("rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none", isPollMode ? "text-[#6366F1] bg-[#EEF2FF] hover:bg-[#EEF2FF]" : "text-[#6B7280]")}
                                    >
                                        <BarChart2 className="w-5 h-5" />
                                    </Button>
 
                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isUploading}
                                            className={cn("rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none", showEmojiPicker ? "text-[#D97706] bg-[#FFFBEB] hover:bg-[#FFFBEB]" : "text-[#6B7280]")}
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        >
                                            <Smile className="w-5 h-5" />
                                        </Button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 z-50 mb-2">
                                                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                                <div className="relative z-50 shadow-2xl rounded-lg overflow-hidden border border-[#E5E7EB]">
                                                    <EmojiPicker
                                                        theme={"light" as any}
                                                        onEmojiClick={(emojiData) => {
                                                            setContent(prev => prev + emojiData.emoji);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
 
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isUploading}
                                        className={cn("rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none text-[#6B7280]", draftImages.length > 0 ? "text-[#6366F1] bg-[#EEF2FF]" : "")}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </Button>

                                    {/* Text Formatting Toggle Button ("A with Pencil") */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isUploading}
                                        className={cn(
                                            "rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none border transition-all duration-200", 
                                            showFormatting 
                                                ? "text-[#6366F1] bg-[#EEF2FF] border-[#6366F1]/30 hover:bg-[#EEF2FF]" 
                                                : "text-zinc-500 border-zinc-200/80 hover:border-zinc-300"
                                        )}
                                        onClick={() => setShowFormatting(!showFormatting)}
                                        title="Text Formatting"
                                    >
                                        <span className="font-serif font-extrabold text-sm relative flex items-center justify-center">
                                            A
                                            <span className="absolute -bottom-1 -right-1 text-[8px]">✎</span>
                                        </span>
                                    </Button>
                                </div>
 
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-xs font-mono font-bold transition-colors hidden sm:inline",
                                        (3000 - content.length) < 0 ? "text-red-500" :
                                            (3000 - content.length) < 200 ? "text-yellow-500" : "text-[#9CA3AF]"
                                    )}>
                                        {3000 - content.length} chars
                                    </span>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isUploading || (!content.trim() && draftImages.length === 0) || content.length > 3000}
                                        className="rounded-full px-6 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold h-9 transition-colors shadow-sm animate-none flex items-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Posting...
                                            </>
                                        ) : (
                                            "Post"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
 
            {/* Bottom Row: Media Buttons */}
            <div className="flex justify-between px-2 pt-2 border-t border-[#F3F4F6]">
                <button
                    onClick={() => {
                        setIsOpen(true);
                        setTimeout(() => fileInputRef.current?.click(), 250);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-[#EFF6FF] transition-all duration-200 text-[#6B7280] hover:text-[#2563EB] font-semibold text-xs sm:text-sm group flex-1 cursor-pointer"
                >
                    <ImageIcon className="w-5 h-5 text-[#2563EB] group-hover:scale-110 transition-transform duration-200" />
                    <span>Media</span>
                </button>
 
                <button
                    onClick={() => setIsEventOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-[#FFFBEB] transition-all duration-200 text-[#6B7280] hover:text-[#D97706] font-semibold text-xs sm:text-sm group flex-1 cursor-pointer"
                >
                    <Calendar className="w-5 h-5 text-[#D97706] group-hover:scale-110 transition-transform duration-200" />
                    <span>Event</span>
                </button>
 
                <button
                    onClick={() => setIsArticleOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-[#FEF2F2] transition-all duration-200 text-[#6B7280] hover:text-[#EF4444] font-semibold text-xs sm:text-sm group flex-1 cursor-pointer"
                >
                    <FileText className="w-5 h-5 text-[#EF4444] group-hover:scale-110 transition-transform duration-200" />
                    <span>Write article</span>
                </button>
            </div>
 
            {/* Event Creation Modal */}
            <Dialog open={isEventOpen} onOpenChange={setIsEventOpen}>
                <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] sm:max-w-xl p-0 overflow-visible shadow-2xl rounded-2xl">
                    <DialogHeader className="p-5 border-b border-[#E5E7EB]">
                        <DialogTitle className="text-xl font-extrabold text-[#111827]">Create an Event</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEventSubmit} className="p-6 space-y-4">
                        {/* Title */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Event Name</label>
                            <input
                                type="text"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                placeholder="e.g. SkilledCore AI Hackathon 2026"
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:bg-white focus:outline-none transition-colors"
                            />
                            {eventErrors.title && <p className="text-[11px] text-red-500 font-semibold">{eventErrors.title}</p>}
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Date</label>
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:bg-white focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Time</label>
                                <input
                                    type="time"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:bg-white focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                        {eventErrors.dateTime && <p className="text-[11px] text-red-500 font-semibold">{eventErrors.dateTime}</p>}

                        {/* Format Picker */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block mb-1">Event Format</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEventFormat("online")}
                                    className={cn("px-4 py-2.5 text-sm font-bold border rounded-xl flex items-center justify-center gap-2 transition-all duration-200",
                                        eventFormat === "online" 
                                            ? "bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] shadow-sm" 
                                            : "bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6]"
                                    )}
                                >
                                    🌐 Online
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEventFormat("in-person")}
                                    className={cn("px-4 py-2.5 text-sm font-bold border rounded-xl flex items-center justify-center gap-2 transition-all duration-200",
                                        eventFormat === "in-person" 
                                            ? "bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] shadow-sm" 
                                            : "bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:bg-[#F3F4F6]"
                                    )}
                                >
                                    📍 In-Person
                                </button>
                            </div>
                        </div>

                        {/* Location / Link */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">
                                {eventFormat === "online" ? "Meeting URL Link" : "Physical Address / Venue"}
                            </label>
                            <input
                                type="text"
                                value={eventLocation}
                                onChange={(e) => setEventLocation(e.target.value)}
                                placeholder={eventFormat === "online" ? "https://meet.google.com/abc-defg-hij" : "123 Technology Park, London"}
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:bg-white focus:outline-none transition-colors"
                            />
                            {eventErrors.location && <p className="text-[11px] text-red-500 font-semibold">{eventErrors.location}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Event Details</label>
                            <Textarea
                                value={eventDescription}
                                onChange={(e: any) => setEventDescription(e.target.value)}
                                placeholder="Describe the topics, timeline, speakers, and instructions for participants..."
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm text-[#111827] focus:border-[#6366F1] focus:bg-white focus:outline-none min-h-[100px] resize-none"
                            />
                            {eventErrors.description && <p className="text-[11px] text-red-500 font-semibold">{eventErrors.description}</p>}
                        </div>

                        {/* Submit Row */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEventOpen(false)}
                                className="rounded-full px-5 text-sm font-bold text-[#6B7280] hover:bg-[#F3F4F6]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isEventSubmitting}
                                className="rounded-full px-6 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity"
                            >
                                {isEventSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Event"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Article Creation Modal */}
            <Dialog open={isArticleOpen} onOpenChange={setIsArticleOpen}>
                <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] sm:max-w-2xl p-0 overflow-visible shadow-2xl rounded-2xl">
                    <DialogHeader className="p-5 border-b border-[#E5E7EB]">
                        <DialogTitle className="text-xl font-extrabold text-[#111827]">Write an Article</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleArticleSubmit} className="p-6 space-y-4">
                        {/* Title */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Article Title</label>
                            <input
                                type="text"
                                value={articleTitle}
                                onChange={(e) => setArticleTitle(e.target.value)}
                                placeholder="Give your article a catchy, high-engagement headline..."
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#6366F1] focus:bg-white focus:outline-none transition-colors"
                            />
                            {articleErrors.title && <p className="text-[11px] text-red-500 font-semibold">{articleErrors.title}</p>}
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Cover Image (Optional)</label>
                            <input
                                type="file"
                                id="article-cover-input"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        if (file.size >= 4 * 1024 * 1024) {
                                            toast.error("Cover image must be under 4MB.");
                                            return;
                                        }
                                        setArticleCoverFile(file);
                                        setArticleCoverPreview(URL.createObjectURL(file));
                                    }
                                }}
                                accept="image/*"
                                className="hidden"
                            />
                            
                            {articleCoverPreview ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] group">
                                    <img
                                        src={articleCoverPreview}
                                        alt="Article Cover Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setArticleCoverFile(null);
                                            URL.revokeObjectURL(articleCoverPreview);
                                            setArticleCoverPreview("");
                                        }}
                                        className="absolute top-3 right-3 bg-black/60 hover:bg-black/85 text-white p-2 rounded-full backdrop-blur-sm shadow transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label
                                    htmlFor="article-cover-input"
                                    className="border-2 border-dashed border-[#E5E7EB] hover:border-[#6366F1] rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-[#F9FAFB] cursor-pointer transition-colors group"
                                >
                                    <ImageIcon className="w-8 h-8 text-[#9CA3AF] group-hover:text-[#6366F1] transition-colors" />
                                    <span className="text-xs font-bold text-[#4B5563] group-hover:text-[#6366F1] transition-colors">
                                        Upload cover image (Under 4MB)
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Article Content</label>
                            <Textarea
                                value={articleBody}
                                onChange={(e: any) => setArticleBody(e.target.value)}
                                placeholder="Share your professional insights, technical guides, or industry learnings..."
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm text-[#111827] focus:border-[#6366F1] focus:bg-white focus:outline-none min-h-[160px] resize-none"
                            />
                            {articleErrors.body && <p className="text-[11px] text-red-500 font-semibold">{articleErrors.body}</p>}
                        </div>

                        {/* Submit Row */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsArticleOpen(false)}
                                className="rounded-full px-5 text-sm font-bold text-[#6B7280] hover:bg-[#F3F4F6]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isArticleSubmitting}
                                className="rounded-full px-6 bg-gradient-to-r from-[#EC4899] to-[#D946EF] hover:opacity-95 text-white font-bold text-sm shadow-md transition-opacity"
                            >
                                {isArticleSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Article"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* LinkedIn-Style Image Editor Modal */}
            <ImageEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                initialFiles={editorInitialFiles}
                onApply={handleApplyEditorChanges}
            />
        </div>
    );
}

