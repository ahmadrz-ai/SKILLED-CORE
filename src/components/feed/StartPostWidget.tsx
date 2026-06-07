"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image as ImageIcon, Calendar, FileText, X, BarChart2, Smile, Loader2, Edit, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link2, Code2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getCloudinarySignature } from "@/app/actions/cloudinary";
import ImageEditorModal from "@/components/feed/ImageEditorModal";
import CustomEmojiPicker from "@/components/feed/CustomEmojiPicker";

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
    // contenteditable ref – source of truth for post HTML
    const editorRef = useRef<HTMLDivElement>(null);
    const [htmlContent, setHtmlContent] = useState("");
    const [textLength, setTextLength] = useState(0);
    const [isPollMode, setIsPollMode] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const [emojiPickerPos, setEmojiPickerPos] = useState<{ top: number; left: number } | null>(null);
    const [pollOptions, setPollOptions] = useState(["", ""]);
    // saved selection range so link dialog doesn't lose cursor
    const savedRangeRef = useRef<Range | null>(null);

    // Multi-Image & Editor State
    const [draftImage, setDraftImage] = useState<DraftImage | null>(null);
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
    
    // Text Formatting State
    const [showFormatting, setShowFormatting] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkText, setLinkText] = useState("");
    const [linkUrl, setLinkUrl] = useState("");

    // Sync html/text length from editor changes
    const syncEditorState = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        setHtmlContent(el.innerHTML);
        setTextLength(el.innerText.replace(/\n/g, "").length);
    }, []);



    // ── WYSIWYG execCommand helpers ──────────────────────────────────────────
    const execFormat = useCallback((command: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        syncEditorState();
    }, [syncEditorState]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        // Bold: Ctrl+B
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            execFormat("bold");
            return;
        }
        // Italic: Ctrl+I
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
            e.preventDefault();
            execFormat("italic");
            return;
        }
        // Underline: Ctrl+U
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
            e.preventDefault();
            execFormat("underline");
            return;
        }
        // Strikethrough: Ctrl+Shift+S
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
            e.preventDefault();
            execFormat("strikeThrough");
            return;
        }
        // Bullet list: * Space at line start
        if (e.key === " ") {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const container = range.startContainer;
                const textBefore = container.textContent?.slice(0, range.startOffset) ?? "";
                if (textBefore === "*" || textBefore === "-") {
                    e.preventDefault();
                    // Delete the trigger character
                    document.execCommand("selectAll", false);
                    const newRange = document.createRange();
                    newRange.setStart(container, 0);
                    newRange.setEnd(container, range.startOffset);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                    document.execCommand("delete", false);
                    document.execCommand("insertUnorderedList", false);
                    syncEditorState();
                    return;
                }
            }
        }
    };

    // Save selection before opening link dialog (focus shifts to input)
    const openLinkDialog = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
            const selected = sel.toString();
            setLinkText(selected);
        } else {
            savedRangeRef.current = null;
            setLinkText("");
        }
        setLinkUrl("");
        setIsLinkDialogOpen(true);
    }, []);

    const handleInsertLink = useCallback(() => {
        const displayName = linkText.trim() || "link";
        const url = linkUrl.trim();
        if (!url) { setIsLinkDialogOpen(false); return; }
        const href = url.startsWith("http") ? url : `https://${url}`;

        editorRef.current?.focus();

        // Restore selection
        const sel = window.getSelection();
        if (sel && savedRangeRef.current) {
            sel.removeAllRanges();
            sel.addRange(savedRangeRef.current);
        }

        // Insert anchor
        const html = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#5B35D5;text-decoration:underline;">${displayName}</a>`;
        document.execCommand("insertHTML", false, html);
        syncEditorState();
        setIsLinkDialogOpen(false);
    }, [linkText, linkUrl, syncEditorState]);

    // ── Toolbar format dispatcher (non-link actions) ─────────────────────────
    const formatText = useCallback((style: string) => {
        switch (style) {
            case "bold":          execFormat("bold"); break;
            case "italic":        execFormat("italic"); break;
            case "underline":     execFormat("underline"); break;
            case "strikethrough": execFormat("strikeThrough"); break;
            case "bullet":        execFormat("insertUnorderedList"); break;
            case "number":        execFormat("insertOrderedList"); break;
            case "quote":
                // Wrap selection in a blockquote via insertHTML
                editorRef.current?.focus();
                document.execCommand("formatBlock", false, "blockquote");
                syncEditorState();
                break;
            case "code": {
                const sel = window.getSelection();
                const selected = sel?.toString() || "code";
                document.execCommand("insertHTML", false,
                    `<code style="background:#F3F4F6;border:1px solid #E5E7EB;border-radius:4px;padding:2px 6px;font-family:monospace;font-size:0.85em;color:#DC2626;">${selected}</code>`);
                syncEditorState();
                break;
            }
            case "link": openLinkDialog(); break;
            default: break;
        }
    }, [execFormat, openLinkDialog, syncEditorState]);

    // Insert emoji at cursor position inside contenteditable
    const insertEmoji = useCallback((emoji: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();

        // Restore the saved cursor position.
        // savedRangeRef is set on mousedown of any insert button BEFORE focus can leave the editor.
        if (savedRangeRef.current) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedRangeRef.current);
            }
            savedRangeRef.current = null;
        }

        document.execCommand("insertText", false, emoji);
        syncEditorState();
    }, [syncEditorState]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (draftImage?.previewUrl) URL.revokeObjectURL(draftImage.previewUrl);
            if (articleCoverPreview) URL.revokeObjectURL(articleCoverPreview);
        };
    }, [draftImage, articleCoverPreview]);

    // Focus editor when dialog opens & set default block element to div
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                editorRef.current?.focus();
                // Ensure paragraphs use <div> not <p> for simpler serialization
                document.execCommand("defaultParagraphSeparator", false, "div");
            }, 100);
        }
        // Clear editor state when dialog closes
        if (!isOpen && editorRef.current) {
            editorRef.current.innerHTML = "";
            setHtmlContent("");
            setTextLength(0);
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 4 * 1024 * 1024;
        if (file.size >= MAX_SIZE) {
            toast.error("Images must be strictly under 4MB.");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setEditorInitialFiles([file]);
        setIsEditorOpen(true);
    };

    const handleApplyEditorChanges = (editedImages: DraftImage[]) => {
        if (editedImages.length > 0) {
            setDraftImage(prev => {
                if (prev?.previewUrl) {
                    URL.revokeObjectURL(prev.previewUrl);
                }
                return editedImages[0];
            });
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveDraftImage = () => {
        setDraftImage(prev => {
            if (prev?.previewUrl) {
                URL.revokeObjectURL(prev.previewUrl);
            }
            return null;
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
        const rawHtml = editorRef.current?.innerHTML ?? "";
        const textOnly = editorRef.current?.innerText?.trim() ?? "";
        if (!textOnly && !draftImage) return;

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

        if (draftImage) {
            setIsUploading(true);
            try {
                const secureUrl = await uploadSingleToCloudinary(draftImage.file);
                imageUrl = JSON.stringify([{
                    url: secureUrl,
                    alt: draftImage.alt || "",
                    tags: draftImage.tags || []
                }]);
            } catch (err: any) {
                console.error("Cloudinary upload failed:", err);
                toast.error("Failed to upload image. Please try again.");
                setIsUploading(false);
                return;
            }
        }

        onPostCreated?.(rawHtml, validOptions, imageUrl);

        // Reset and close
        if (editorRef.current) editorRef.current.innerHTML = "";
        setHtmlContent("");
        setTextLength(0);
        setPollOptions(["", ""]);
        setIsPollMode(false);
        setDraftImage(null);
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
                    <AvatarFallback className="bg-[#EAE6FD] text-[#5B35D5] font-semibold">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
 
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button className="flex-1 text-left bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-full px-5 py-3 text-sm font-semibold text-[#6B7280] transition-colors duration-200">
                            Start a post...
                        </button>
                    </DialogTrigger>
 
                    {/* The Posting Dialog */}
                    <DialogContent
                        className="bg-white border-[#E5E7EB] text-[#111827] w-[calc(100%-1rem)] sm:max-w-4xl p-0 overflow-visible shadow-xl"
                        onOpenAutoFocus={(e) => {
                            e.preventDefault();
                            editorRef.current?.focus();
                        }}
                    >
                        <DialogHeader className="p-4 border-b border-[#E5E7EB] flex flex-row items-center justify-between shrink-0">
                            <DialogTitle className="text-lg font-bold text-[#111827]">Create a post</DialogTitle>
                        </DialogHeader>
 
                        {/* Scrollable body – max-height keeps toolbar+footer always visible */}
                        <div className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(90vh - 60px)" }}>
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                                disabled={isUploading}
                            />

                            {/* Text Formatting Toolbar – always visible at top */}
                            <div className="px-4 pt-3 shrink-0">
                                {/* User Info */}
                                <div className="flex items-center gap-3 mb-3">
                                    <Avatar className="w-10 h-10 border border-[#E5E7EB]">
                                        <AvatarImage src={user?.image || ""} />
                                        <AvatarFallback className="bg-[#EAE6FD] text-[#5B35D5] font-bold">{user?.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold text-sm text-[#111827]">{user?.name}</div>
                                        <div className="text-xs text-[#6B7280] font-medium">Post to Anyone</div>
                                    </div>
                                </div>

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
                            </div>

                            {/* SPLIT PANE: text left, image right (or full-width if no image) */}
                            <div className={cn(
                                "flex overflow-y-auto flex-1",
                                draftImage ? "divide-x divide-[#F3F4F6]" : ""
                            )}>
                                {/* Left: WYSIWYG editor – scrolls independently */}
                                <div className={cn(
                                    "flex flex-col overflow-y-auto",
                                    draftImage ? "w-1/2 px-4 pb-3" : "w-full px-4 pb-3"
                                )}>
                                    {/* WYSIWYG Content Editable */}
                                    <div
                                        ref={editorRef}
                                        contentEditable={!isUploading}
                                        suppressContentEditableWarning
                                        onInput={syncEditorState}
                                        onKeyDown={handleKeyDown}
                                        data-placeholder="What do you want to talk about?"
                                        className={cn(
                                            "w-full bg-transparent text-[#111827] text-base min-h-[120px] outline-none caret-[#5B35D5] cursor-text mt-2",
                                            "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline",
                                            "[&_a]:text-[#5B35D5] [&_a]:underline [&_a]:cursor-pointer",
                                            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
                                            "[&_blockquote]:border-l-4 [&_blockquote]:border-[#5B35D5]/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#6B7280] [&_blockquote]:my-1",
                                            "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#9CA3AF] [&:empty]:before:pointer-events-none"
                                        )}
                                        style={{ whiteSpace: "pre-wrap" }}
                                    />

                                    {/* Poll Editor (inside left pane) */}
                                    {isPollMode && (
                                        <div className="mt-3 p-3 border border-[#E5E7EB] rounded-xl bg-[#F9FAFB]">
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
                                                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#5B35D5] focus:outline-none transition-colors"
                                                    />
                                                ))}
                                            </div>
                                            {pollOptions.length < 4 && (
                                                <button
                                                    onClick={() => setPollOptions([...pollOptions, ""])}
                                                    className="mt-2 text-xs font-bold text-[#5B35D5] hover:text-[#4A28C9] transition-colors"
                                                >
                                                    + Add Option
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right: Image preview panel – only when image is attached */}
                                {draftImage && (
                                    <div className="w-1/2 flex items-center justify-center p-3 bg-[#F9FAFB] relative overflow-hidden">
                                        <div className="relative w-full rounded-xl overflow-hidden border border-[#E5E7EB] bg-black/5" style={{ maxHeight: "280px" }}>
                                            <img
                                                src={draftImage.previewUrl}
                                                alt="Draft attachment"
                                                className="w-full h-full object-contain"
                                                style={{ maxHeight: "280px" }}
                                            />
                                            {/* Edit button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditorInitialFiles([draftImage.file]);
                                                    setIsEditorOpen(true);
                                                }}
                                                disabled={isUploading}
                                                className="absolute top-2 left-2 bg-black/60 hover:bg-[#5B35D5] text-white p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-md z-20"
                                                title="Edit Image"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={handleRemoveDraftImage}
                                                disabled={isUploading}
                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-md z-20"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            {/* Upload overlay */}
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-[1px] text-white gap-2 z-30 rounded-xl">
                                                    <Loader2 className="w-8 h-8 animate-spin text-[#5B35D5]" />
                                                    <span className="text-xs font-semibold tracking-wide">Uploading...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
 
                            {/* Bottom Bar: Tools & Post Button */}
                            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] shrink-0">
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isUploading}
                                        onMouseDown={(e) => {
                                            // Capture cursor BEFORE mousedown steals focus from the editor
                                            e.preventDefault();
                                            const sel = window.getSelection();
                                            if (sel && sel.rangeCount > 0) {
                                                savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                                            }
                                        }}
                                        onClick={() => insertEmoji(" #")}
                                        className="text-[#5B35D5] hover:bg-[#EAE6FD] font-bold px-2.5 rounded-full text-xs h-8 animate-none"
                                    >
                                        # Hashtag
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isUploading}
                                        onMouseDown={(e) => {
                                            // Capture cursor BEFORE mousedown steals focus from the editor
                                            e.preventDefault();
                                            const sel = window.getSelection();
                                            if (sel && sel.rangeCount > 0) {
                                                savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                                            }
                                        }}
                                        onClick={() => insertEmoji(" @")}
                                        className="text-[#5B35D5] hover:bg-[#EAE6FD] font-bold px-2.5 rounded-full text-xs h-8 animate-none"
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
                                        className={cn("rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none", isPollMode ? "text-[#5B35D5] bg-[#EAE6FD] hover:bg-[#EAE6FD]" : "text-[#6B7280]")}
                                    >
                                        <BarChart2 className="w-5 h-5" />
                                    </Button>
 
                                    <div className="relative">
                                        <Button
                                            ref={emojiButtonRef}
                                            variant="ghost"
                                            size="icon"
                                            disabled={isUploading}
                                            className={cn("rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none", showEmojiPicker ? "text-[#D97706] bg-[#FFFBEB] hover:bg-[#FFFBEB]" : "text-[#6B7280]")}
                                            onMouseDown={(e) => {
                                                // Capture cursor position on mousedown — BEFORE browser shifts focus away from the editor.
                                                // This must happen on mousedown, not click, because mousedown fires first and can blur the editor.
                                                if (!showEmojiPicker) {
                                                    e.preventDefault(); // prevent focus theft
                                                    const sel = window.getSelection();
                                                    if (sel && sel.rangeCount > 0) {
                                                        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                                                    }
                                                    if (emojiButtonRef.current) {
                                                        const rect = emojiButtonRef.current.getBoundingClientRect();
                                                        const PICKER_H = 398;
                                                        const PICKER_W = 340;
                                                        const GAP = 8;
                                                        // Smart placement: prefer above, fall back to below, clamp to viewport
                                                        const spaceAbove = rect.top - GAP;
                                                        const spaceBelow = window.innerHeight - rect.bottom - GAP;
                                                        const top = spaceAbove >= PICKER_H
                                                            ? rect.top - PICKER_H - GAP
                                                            : spaceBelow >= PICKER_H
                                                                ? rect.bottom + GAP
                                                                : Math.max(GAP, window.innerHeight - PICKER_H - GAP);
                                                        const left = Math.min(
                                                            Math.max(GAP, rect.right - PICKER_W),
                                                            window.innerWidth - PICKER_W - GAP
                                                        );
                                                        setEmojiPickerPos({ top, left });
                                                    }
                                                    setShowEmojiPicker(true);
                                                } else {
                                                    setShowEmojiPicker(false);
                                                }
                                            }}
                                        >
                                            <Smile className="w-5 h-5" />
                                        </Button>
                                    </div>
 


                                    {/* Text Formatting Toggle Button ("A with Pencil") */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isUploading}
                                        className={cn(
                                            "rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none border transition-all duration-200", 
                                            showFormatting 
                                                ? "text-[#5B35D5] bg-[#EAE6FD] border-[#5B35D5]/30 hover:bg-[#EAE6FD]" 
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
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isUploading}
                                        className={cn("rounded-full hover:bg-[#F3F4F6] w-9 h-9 animate-none text-[#6B7280]", draftImage ? "text-[#5B35D5] bg-[#EAE6FD]" : "")}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </Button>
                                </div>
 
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-xs font-mono font-bold transition-colors hidden sm:inline",
                                        (3000 - textLength) < 0 ? "text-red-500" :
                                            (3000 - textLength) < 200 ? "text-yellow-500" : "text-[#9CA3AF]"
                                    )}>
                                        {3000 - textLength} chars
                                    </span>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isUploading || (textLength === 0 && !draftImage) || textLength > 3000}
                                        className="rounded-full px-6 bg-[#5B35D5] hover:bg-[#4A28C9] text-white font-bold h-9 transition-colors shadow-sm animate-none flex items-center gap-2"
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

                        {/* Beautiful Custom Insert Link Dialog Overlay (Absolute constrained inside DialogContent portal) */}
                        {isLinkDialogOpen && (
                            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#5B35D5]/10 backdrop-blur-[2px] p-4 rounded-2xl animate-in fade-in duration-200">
                                <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl max-w-sm w-full p-6 text-[#111827] transform scale-100 transition-all border-t-4 border-t-[#5B35D5] z-50">
                                    <h3 className="text-base font-extrabold text-[#111827] mb-4 tracking-tight flex items-center gap-2">
                                        <Link2 className="w-4.5 h-4.5 text-[#5B35D5]" />
                                        Insert link
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Text to display</label>
                                            <input
                                                type="text"
                                                value={linkText}
                                                onChange={(e) => setLinkText(e.target.value)}
                                                placeholder="Text to display"
                                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] placeholder-gray-400 focus:border-[#5B35D5] focus:bg-white focus:outline-none transition-all"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">Address</label>
                                            <input
                                                type="text"
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                                placeholder="Link to an existing file or web page"
                                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-sm text-[#111827] placeholder-gray-400 focus:border-[#5B35D5] focus:bg-white focus:outline-none transition-all"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleInsertLink();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2.5 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsLinkDialogOpen(false)}
                                            className="px-4 py-2 text-xs font-bold text-[#4B5563] hover:text-[#111827] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-xl transition-colors cursor-pointer animate-none"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleInsertLink}
                                            className="px-5 py-2 text-xs font-bold text-white bg-[#5B35D5] hover:bg-[#4A28C9] rounded-xl transition-all shadow-md shadow-[#5B35D5]/10 cursor-pointer animate-none"
                                        >
                                            Insert
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}


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
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-[#EAE6FD] transition-all duration-200 text-[#6B7280] hover:text-[#5B35D5] font-semibold text-xs sm:text-sm group flex-1 cursor-pointer"
                >
                    <ImageIcon className="w-5 h-5 text-[#5B35D5] group-hover:scale-110 transition-transform duration-200" />
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
                <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] w-[calc(100%-1rem)] sm:max-w-xl p-0 overflow-visible shadow-2xl rounded-2xl">
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
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#5B35D5] focus:bg-white focus:outline-none transition-colors"
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
                                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#5B35D5] focus:bg-white focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Time</label>
                                <input
                                    type="time"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#5B35D5] focus:bg-white focus:outline-none transition-colors"
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
                                            ? "bg-[#EAE6FD] border-[#5B35D5] text-[#5B35D5] shadow-sm" 
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
                                            ? "bg-[#EAE6FD] border-[#5B35D5] text-[#5B35D5] shadow-sm" 
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
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#5B35D5] focus:bg-white focus:outline-none transition-colors"
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
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm text-[#111827] focus:border-[#5B35D5] focus:bg-white focus:outline-none min-h-[100px] resize-none"
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
                                className="rounded-full px-6 bg-gradient-to-r from-[#5B35D5] to-[#4A28C9] text-white font-bold text-sm shadow-md hover:opacity-95 transition-opacity"
                            >
                                {isEventSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Event"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Article Creation Modal */}
            <Dialog open={isArticleOpen} onOpenChange={setIsArticleOpen}>
                <DialogContent className="bg-white border-[#E5E7EB] text-[#111827] w-[calc(100%-1rem)] sm:max-w-2xl p-0 overflow-visible shadow-2xl rounded-2xl">
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
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:border-[#5B35D5] focus:bg-white focus:outline-none transition-colors"
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
                                    className="border-2 border-dashed border-[#E5E7EB] hover:border-[#5B35D5] rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-[#F9FAFB] cursor-pointer transition-colors group"
                                >
                                    <ImageIcon className="w-8 h-8 text-[#9CA3AF] group-hover:text-[#5B35D5] transition-colors" />
                                    <span className="text-xs font-bold text-[#4B5563] group-hover:text-[#5B35D5] transition-colors">
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
                                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm text-[#111827] focus:border-[#5B35D5] focus:bg-white focus:outline-none min-h-[160px] resize-none"
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

            {/* Portal-rendered Emoji Picker — floats above everything including Radix Dialog overlays */}
            {showEmojiPicker && emojiPickerPos && typeof document !== "undefined" && createPortal(
                <>
                    {/* Backdrop – closes picker when clicking outside it.
                        stopPropagation prevents Radix DismissableLayer from also closing the dialog. */}
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 2147483646 }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setShowEmojiPicker(false)}
                    />
                    {/* Picker panel – max z-index + stopPropagation so Radix Dialog never
                        sees these pointer events as "outside the dialog" and dismisses it. */}
                    <div
                        style={{
                            position: "fixed",
                            zIndex: 2147483647,
                            top: emojiPickerPos.top,
                            left: emojiPickerPos.left,
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CustomEmojiPicker
                            onEmojiSelect={(emoji) => {
                                insertEmoji(emoji);
                                setShowEmojiPicker(false);
                            }}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}

