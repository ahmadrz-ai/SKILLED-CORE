"use client";

import { useState, useEffect, useRef } from "react";
import { X, Crop, UserPlus, FileText, ChevronLeft, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Trash2, Copy, Plus, Loader2 } from "lucide-react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import getCroppedImg from "@/lib/canvasUtils";
import { searchUsers } from "@/app/(app)/feed/actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EmojiPicker from "emoji-picker-react";
import { cn } from "@/lib/utils";

interface TagItem {
    userId: string;
    name: string;
    username: string;
    image?: string | null;
    x: number; // percentage width (0-100)
    y: number; // percentage height (0-100)
}

interface ImageState {
    id: string;
    file: File;
    previewUrl: string;
    croppedUrl?: string;
    crop: { x: number; y: number };
    zoom: number;
    rotation: number;
    straighten: number; // custom straighten slider value (-45 to 45)
    flip: { horizontal: boolean; vertical: boolean };
    aspectRatio: number | undefined; // aspect decimal, e.g. 1, 16/9, 4/3, etc. or undefined for freeform
    aspectRatioName: string; // 'Original' | 'Square' | '4:1' | '3:4' | '16:9'
    alt: string;
    tags: TagItem[];
    croppedAreaPixels?: { x: number; y: number; width: number; height: number };
}

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFiles: File[];
    onApply: (editedImages: Array<{ file: File; previewUrl: string; alt: string; tags: TagItem[] }>) => void;
}

export default function ImageEditorModal({ isOpen, onClose, initialFiles, onApply }: ImageEditorModalProps) {
    const [images, setImages] = useState<ImageState[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [sidebarTab, setSidebarTab] = useState<"sequence" | "crop" | "tag" | "alt">("sequence");
    const [isGeneratingCrop, setIsGeneratingCrop] = useState(false);

    // Crop Panel State (active cropped parameters)
    const [zoom, setZoom] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [straighten, setStraighten] = useState(0);
    const [flip, setFlip] = useState({ horizontal: false, vertical: false });
    const [aspectRatioName, setAspectRatioName] = useState("Original");
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);

    // Tag Panel State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Alt Panel State
    const [altText, setAltText] = useState("");

    // Initialize Images State on mount or files update
    useEffect(() => {
        if (isOpen && initialFiles.length > 0) {
            const mapped = initialFiles.map((file, i) => {
                const url = URL.createObjectURL(file);
                return {
                    id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                    file,
                    previewUrl: url,
                    croppedUrl: url,
                    crop: { x: 0, y: 0 },
                    zoom: 1,
                    rotation: 0,
                    straighten: 0,
                    flip: { horizontal: false, vertical: false },
                    aspectRatio: undefined, // fallback to free-form initially or keep original
                    aspectRatioName: "Original",
                    alt: "",
                    tags: [],
                };
            });
            setImages(mapped);
            setActiveIdx(0);
            setSidebarTab("sequence");
        }

        return () => {
            // cleanup previews on unmount
            images.forEach(img => {
                if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
                if (img.croppedUrl && img.croppedUrl !== img.previewUrl) URL.revokeObjectURL(img.croppedUrl);
            });
        };
    }, [isOpen, initialFiles]);

    const activeImg = images[activeIdx];

    // Sync state to sliders when active image index or sequencer length changes
    useEffect(() => {
        const img = images[activeIdx];
        if (img) {
            setZoom(img.zoom);
            setCrop(img.crop);
            setRotation(img.rotation);
            setStraighten(img.straighten);
            setFlip(img.flip);
            setAspectRatioName(img.aspectRatioName);
            setAspectRatio(img.aspectRatio);
            setAltText(img.alt);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIdx, images.length]);

    // Handle User Search for Tagging
    useEffect(() => {
        const fetchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const results = await searchUsers(searchQuery);
                setSearchResults(results || []);
            } catch (err) {
                console.error("Failed to search community users:", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (!isOpen || images.length === 0 || !activeImg) return null;

    // Sidebar navigation helper
    const navigateSidebar = (tab: "sequence" | "crop" | "tag" | "alt") => {
        setSidebarTab(tab);
    };

    // Crop Complete Handler
    const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setImages(prev => prev.map((img, i) => {
            if (i === activeIdx) {
                return {
                    ...img,
                    croppedAreaPixels
                };
            }
            return img;
        }));
    };

    // Apply Crop/Transform Transformations
    const handleApplyTransform = async () => {
        if (!activeImg.croppedAreaPixels) {
            toast.error("Please adjust crop first.");
            return;
        }

        setIsGeneratingCrop(true);
        try {
            // Apply current slider values to images state first
            let currentImg = {
                ...activeImg,
                zoom,
                crop,
                rotation,
                straighten,
                flip,
                aspectRatioName,
                aspectRatio: aspectRatio,
            };

            const totalRotation = currentImg.rotation + currentImg.straighten;
            const croppedBlob = await getCroppedImg(
                currentImg.previewUrl,
                currentImg.croppedAreaPixels!,
                totalRotation,
                currentImg.flip
            );

            if (croppedBlob) {
                const croppedUrl = URL.createObjectURL(croppedBlob);
                // Convert blob back to a File object to save inside state
                const croppedFile = new File([croppedBlob], activeImg.file.name, {
                    type: "image/jpeg",
                });

                setImages(prev => prev.map((img, i) => {
                    if (i === activeIdx) {
                        return {
                            ...currentImg,
                            file: croppedFile,
                            croppedUrl
                        };
                    }
                    return img;
                }));
                toast.success("Crop applied successfully.");
                setSidebarTab("sequence");
            } else {
                throw new Error("Canvas crop failure");
            }
        } catch (err) {
            console.error("Failed to generate cropped image:", err);
            toast.error("Failed to apply crop transforms.");
        } finally {
            setIsGeneratingCrop(false);
        }
    };

    // Aspect Ratio Presets
    const handleSelectAspectRatio = (name: string, ratio?: number) => {
        setAspectRatioName(name);
        setAspectRatio(ratio);
    };

    // Click on canvas to trigger tag positioning
    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (sidebarTab !== "tag") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setSelectedCoords({ x, y });
        setSearchQuery("");
        setSearchResults([]);
    };

    // Add Tag
    const handleAddTag = (user: any) => {
        if (!selectedCoords) return;

        const newTag: TagItem = {
            userId: user.id,
            name: user.name || "Community Member",
            username: user.username || "user",
            image: user.image || "",
            x: parseFloat(selectedCoords.x.toFixed(2)),
            y: parseFloat(selectedCoords.y.toFixed(2))
        };

        // Prevent duplicate user tags on the same image
        if (activeImg.tags.some(t => t.userId === user.id)) {
            toast.info(`${user.name} is already tagged on this image.`);
            setSelectedCoords(null);
            return;
        }

        setImages(prev => prev.map((img, i) => {
            if (i === activeIdx) {
                return {
                    ...img,
                    tags: [...img.tags, newTag]
                };
            }
            return img;
        }));

        toast.success(`Tagged ${user.name}`);
        setSelectedCoords(null);
    };

    // Remove Tag
    const handleRemoveTag = (userId: string) => {
        setImages(prev => prev.map((img, i) => {
            if (i === activeIdx) {
                return {
                    ...img,
                    tags: img.tags.filter(t => t.userId !== userId)
                };
            }
            return img;
        }));
    };

    // Alt text update
    const handleSaveAltText = () => {
        setImages(prev => prev.map((img, i) => {
            if (i === activeIdx) {
                return {
                    ...img,
                    alt: altText
                };
            }
            return img;
        }));
        toast.success("Alt text saved.");
        setSidebarTab("sequence");
    };



    // Final Post Draft Approval
    const handleFinishEditing = () => {
        // Map images state to post submission layout
        const finished = images.map(img => ({
            file: img.file,
            previewUrl: img.croppedUrl || img.previewUrl,
            alt: img.alt,
            tags: img.tags
        }));
        onApply(finished);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent 
                showCloseButton={false}
                className="w-[calc(100%-1rem)] sm:max-w-5xl p-0 overflow-hidden bg-white text-[#111827] border-[#E5E7EB] shadow-2xl flex flex-col md:flex-row h-[85vh] max-h-[90vh] sm:max-h-[680px] outline-none rounded-2xl"
            >
                <DialogTitle className="sr-only">Edit Uploaded Images</DialogTitle>
                <DialogDescription className="sr-only">
                    Adjust crops, rotate, flip, tag community members, or add accessibility alt text to your images.
                </DialogDescription>
                {/* Main Image Editor Stage (Left) */}
                <div className="flex-1 bg-[#111827] relative flex flex-col items-center justify-center p-4">
                    {/* Stage Header */}
                    <div className="absolute top-4 left-4 z-20 text-white font-semibold text-sm drop-shadow-md">
                        Single Image Editor
                    </div>
                    
                    {/* Stage Exit */}
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-sm transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Editor Canvas Area */}
                    <div className="w-full flex-1 relative flex items-center justify-center min-h-[350px]">
                        {sidebarTab === "crop" ? (
                            <div className="absolute inset-0 select-none">
                                <Cropper
                                    image={activeImg.previewUrl}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation + straighten}
                                    aspect={aspectRatio}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onRotationChange={setRotation}
                                    onCropComplete={handleCropComplete}
                                    style={{
                                        containerStyle: { background: "#111827" },
                                    }}
                                />
                            </div>
                        ) : (
                            <div 
                                className="relative max-w-full max-h-[450px] overflow-hidden rounded-xl border border-white/10 group cursor-crosshair"
                                onClick={handleCanvasClick}
                            >
                                <img
                                    src={activeImg.croppedUrl || activeImg.previewUrl}
                                    alt="Active edit view"
                                    className="max-w-full max-h-[450px] object-contain select-none pointer-events-none"
                                />

                                {/* Render interactive tags on preview */}
                                {activeImg.tags.map((t, idx) => (
                                    <div 
                                        key={idx}
                                        className="absolute z-30 group/tag cursor-pointer translate-x-[-50%] translate-y-[-50%]"
                                        style={{ left: `${t.x}%`, top: `${t.y}%` }}
                                    >
                                        <div className="relative">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                                            </span>
                                            
                                            {/* Hover bubble */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-white/15 shadow-xl whitespace-nowrap opacity-100 md:opacity-0 group-hover/tag:opacity-100 transition-opacity">
                                                <span>{t.name}</span>
                                                {sidebarTab === "tag" && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveTag(t.userId);
                                                        }}
                                                        className="hover:text-red-400 p-0.5 rounded transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Visual plus sign indicator for clicked tag position */}
                                {selectedCoords && sidebarTab === "tag" && (
                                    <div 
                                        className="absolute z-40 bg-emerald-500 text-white p-1 rounded-full shadow-lg translate-x-[-50%] translate-y-[-50%] scale-110"
                                        style={{ left: `${selectedCoords.x}%`, top: `${selectedCoords.y}%` }}
                                    >
                                        <Plus className="w-4 h-4 animate-spin-once" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lower Main Stage Navigation (Only when not in specific edit/crop side views) */}
                    {sidebarTab !== "crop" && sidebarTab !== "tag" && sidebarTab !== "alt" && (
                        <div className="flex justify-center gap-6 mt-4 z-10 w-full">
                            <button 
                                onClick={() => navigateSidebar("crop")}
                                className="flex flex-col items-center gap-1 text-white/70 hover:text-white text-xs font-semibold px-4 py-2 hover:bg-white/5 rounded-xl transition-all"
                            >
                                <div className="p-2.5 bg-white/10 rounded-full mb-1 group-hover:scale-110 transition-transform">
                                    <Crop className="w-5 h-5 text-white" />
                                </div>
                                <span>Crop</span>
                            </button>

                            <button 
                                onClick={() => navigateSidebar("tag")}
                                className="flex flex-col items-center gap-1 text-white/70 hover:text-white text-xs font-semibold px-4 py-2 hover:bg-white/5 rounded-xl transition-all"
                            >
                                <div className="p-2.5 bg-white/10 rounded-full mb-1">
                                    <UserPlus className="w-5 h-5 text-white" />
                                </div>
                                <span>Tag</span>
                            </button>

                            <button 
                                onClick={() => navigateSidebar("alt")}
                                className="flex flex-col items-center gap-1 text-white/70 hover:text-white text-xs font-semibold px-4 py-2 hover:bg-white/5 rounded-xl transition-all"
                            >
                                <div className="p-2.5 bg-white/10 rounded-full mb-1">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <span>ALT</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar Workspace Controls (Right) */}
                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#E5E7EB] bg-[#F9FAFB] flex flex-col max-h-full">
                    
                    {/* Sidebar Sequencer Tab */}
                    {sidebarTab === "sequence" && (
                        <div className="flex flex-col flex-1 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-sm text-[#4B5563] uppercase tracking-wider">Image Options</h3>
                            </div>

                            {/* Single Image Details Panel */}
                            <div className="flex-1 flex flex-col justify-center items-center py-4">
                                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm text-center w-full max-w-[240px] flex flex-col items-center">
                                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#E5E7EB] mb-4 bg-zinc-50 flex items-center justify-center flex-shrink-0">
                                        <img 
                                            src={activeImg.croppedUrl || activeImg.previewUrl} 
                                            alt="Edit preview" 
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <div className="space-y-2 w-full">
                                        <div className="text-[10px] bg-[#EAE6FD] text-[#5B35D5] font-bold px-2.5 py-0.5 rounded-full inline-block">
                                            Single Image Mode
                                        </div>
                                        <div className="text-xs text-[#374151] font-bold">
                                            {activeImg.tags.length > 0 ? `${activeImg.tags.length} member(s) tagged` : "No members tagged"}
                                        </div>
                                        <div className="text-[10px] text-[#6B7280] font-medium leading-relaxed truncate px-1 max-w-full">
                                            {activeImg.alt ? `Alt: "${activeImg.alt}"` : "No alt text added"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Footer */}
                            <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex justify-between gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={onClose}
                                    className="flex-1 rounded-full font-bold border-[#D1D5DB] text-[#4B5563] hover:bg-[#F3F4F6]"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleFinishEditing}
                                    className="flex-1 rounded-full font-bold bg-[#5B35D5] hover:bg-[#4A28C9] text-white shadow-sm"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Sidebar Crop Tab */}
                    {sidebarTab === "crop" && (
                        <div className="flex flex-col flex-1 p-4">
                            <button 
                                onClick={() => setSidebarTab("sequence")}
                                className="flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#374151] mb-4 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Back to edit
                            </button>

                            <h3 className="font-bold text-sm text-[#4B5563] uppercase tracking-wider mb-4">Transforms</h3>
                            
                            {/* Flip & Rotate Buttons */}
                            <div className="grid grid-cols-4 gap-2 mb-6">
                                <button 
                                    title="Rotate Left"
                                    onClick={() => setRotation(r => r - 90)}
                                    className="p-2.5 bg-white border border-[#E5E7EB] hover:bg-zinc-50 rounded-lg flex justify-center text-[#4B5563] hover:text-black transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button 
                                    title="Rotate Right"
                                    onClick={() => setRotation(r => r + 90)}
                                    className="p-2.5 bg-white border border-[#E5E7EB] hover:bg-zinc-50 rounded-lg flex justify-center text-[#4B5563] hover:text-black transition-colors"
                                >
                                    <RotateCw className="w-4 h-4" />
                                </button>
                                <button 
                                    title="Flip Horizontal"
                                    onClick={() => setFlip(f => ({ ...f, horizontal: !f.horizontal }))}
                                    className={cn(
                                        "p-2.5 border rounded-lg flex justify-center transition-all",
                                        flip.horizontal 
                                            ? "bg-[#EAE6FD] border-[#5B35D5] text-[#5B35D5]" 
                                            : "bg-white border-[#E5E7EB] hover:bg-zinc-50 text-[#4B5563] hover:text-black"
                                    )}
                                >
                                    <FlipHorizontal className="w-4 h-4" />
                                </button>
                                <button 
                                    title="Flip Vertical"
                                    onClick={() => setFlip(f => ({ ...f, vertical: !f.vertical }))}
                                    className={cn(
                                        "p-2.5 border rounded-lg flex justify-center transition-all",
                                        flip.vertical 
                                            ? "bg-[#EAE6FD] border-[#5B35D5] text-[#5B35D5]" 
                                            : "bg-white border-[#E5E7EB] hover:bg-zinc-50 text-[#4B5563] hover:text-black"
                                    )}
                                >
                                    <FlipVertical className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Aspect Ratios Preset */}
                            <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Aspect Ratio</h4>
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {[
                                    { name: "Original", ratio: undefined },
                                    { name: "Square", ratio: 1 },
                                    { name: "4:1", ratio: 4 },
                                    { name: "3:4", ratio: 3/4 },
                                    { name: "16:9", ratio: 16/9 },
                                ].map((r) => (
                                    <button 
                                        key={r.name}
                                        onClick={() => handleSelectAspectRatio(r.name, r.ratio)}
                                        className={cn(
                                            "text-xs font-bold px-3 py-1.5 rounded-full border transition-all",
                                            aspectRatioName === r.name 
                                                ? "bg-[#10B981] border-[#10B981] text-white" 
                                                : "bg-white border-[#E5E7EB] hover:border-[#D1D5DB] text-[#4B5563] hover:text-black"
                                        )}
                                    >
                                        {r.name}
                                    </button>
                                ))}
                            </div>

                            {/* Zoom Slider */}
                            <div className="space-y-1.5 mb-4">
                                <div className="flex justify-between text-xs font-bold text-[#4B5563]">
                                    <span>Zoom</span>
                                    <span>{zoom.toFixed(1)}x</span>
                                </div>
                                <input 
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#5B35D5]"
                                />
                            </div>

                            {/* Straighten Slider */}
                            <div className="space-y-1.5 mb-6">
                                <div className="flex justify-between text-xs font-bold text-[#4B5563]">
                                    <span>Straighten</span>
                                    <span>{straighten}°</span>
                                </div>
                                <input 
                                    type="range"
                                    min="-45"
                                    max="45"
                                    step="1"
                                    value={straighten}
                                    onChange={(e) => setStraighten(parseInt(e.target.value))}
                                    className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#5B35D5]"
                                />
                            </div>

                            <div className="mt-auto pt-4 border-t border-[#E5E7EB]">
                                <Button 
                                    onClick={handleApplyTransform}
                                    disabled={isGeneratingCrop}
                                    className="w-full rounded-full font-bold bg-[#5B35D5] hover:bg-[#4A28C9] text-white py-2.5 flex items-center justify-center gap-2"
                                >
                                    {isGeneratingCrop ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Applying...
                                        </>
                                    ) : (
                                        "Apply"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Sidebar Tagging Tab */}
                    {sidebarTab === "tag" && (
                        <div className="flex flex-col flex-1 p-4">
                            <button 
                                onClick={() => setSidebarTab("sequence")}
                                className="flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#374151] mb-4 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Back to edit
                            </button>

                            <h3 className="font-bold text-sm text-[#4B5563] uppercase tracking-wider mb-2">Tag user</h3>
                            <p className="text-[11px] text-[#6B7280] mb-4">
                                Click anywhere on the image on the left, then search and select a community member to tag.
                            </p>

                            {selectedCoords ? (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="bg-[#ECFDF5] border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800 font-semibold mb-3 flex items-center justify-between">
                                        <span>Click set: X:{Math.round(selectedCoords.x)}% Y:{Math.round(selectedCoords.y)}%</span>
                                        <button onClick={() => setSelectedCoords(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">Clear</button>
                                    </div>

                                    {/* User autocomplete search box */}
                                    <input 
                                        type="text"
                                        placeholder="Type a name or names"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#5B35D5] focus:ring-0 focus:outline-none transition-colors mb-3"
                                        autoFocus
                                    />

                                    {/* Search Results */}
                                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] md:max-h-none pr-1">
                                        {isSearching ? (
                                            <div className="flex items-center justify-center p-4 text-xs font-bold text-[#6B7280] gap-1.5">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#5B35D5]" />
                                                Searching...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map((user) => (
                                                <div 
                                                    key={user.id}
                                                    onClick={() => handleAddTag(user)}
                                                    className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#5B35D5] hover:bg-slate-50 cursor-pointer transition-all"
                                                >
                                                    <Avatar className="w-8 h-8 border border-[#E5E7EB]">
                                                        <AvatarImage src={user.image || ""} />
                                                        <AvatarFallback className="bg-[#EAE6FD] text-[#5B35D5] text-[10px] font-bold">
                                                            {user.name?.charAt(0) || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <div className="text-xs font-bold text-[#111827] truncate">{user.name}</div>
                                                        <div className="text-[10px] text-[#6B7280] truncate">@{user.username || "user"}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : searchQuery.trim() ? (
                                            <div className="text-center p-4 text-xs font-semibold text-[#6B7280]">
                                                No community members found matching "{searchQuery}"
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-dashed border-[#D1D5DB] rounded-xl bg-white/50 text-[#6B7280] min-h-[180px]">
                                    <UserPlus className="w-8 h-8 text-[#9CA3AF] mb-2" />
                                    <div className="text-xs font-bold text-[#374151] mb-1">Click to Tag</div>
                                    <div className="text-[10px] leading-relaxed">
                                        Interact with the image preview to place a tagging pin.
                                    </div>
                                </div>
                            )}

                            {/* List of current tags */}
                            {activeImg.tags.length > 0 && (
                                <div className="mt-4 border-t border-[#E5E7EB] pt-3">
                                    <div className="text-xs font-bold text-[#4B5563] mb-2">Tagged in this photo:</div>
                                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                                        {activeImg.tags.map((t) => (
                                            <div 
                                                key={t.userId}
                                                className="flex items-center gap-1 bg-[#EAE6FD] text-[#5B35D5] text-[10px] font-bold pl-2 pr-1.5 py-0.5 rounded-full border border-[#B4A3F3] shadow-sm"
                                            >
                                                <span>{t.name}</span>
                                                <button 
                                                    onClick={() => handleRemoveTag(t.userId)}
                                                    className="hover:text-red-500 hover:bg-[#B4A3F3]/50 p-0.5 rounded-full transition-colors ml-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-[#E5E7EB]">
                                <Button 
                                    onClick={() => setSidebarTab("sequence")}
                                    className="w-full rounded-full font-bold bg-[#5B35D5] hover:bg-[#4A28C9] text-white"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Sidebar Alt Tab */}
                    {sidebarTab === "alt" && (
                        <div className="flex flex-col flex-1 p-4">
                            <button 
                                onClick={() => setSidebarTab("sequence")}
                                className="flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#374151] mb-4 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" /> Back to edit
                            </button>

                            <h3 className="font-bold text-sm text-[#4B5563] uppercase tracking-wider mb-2">Alt Text</h3>
                            <p className="text-[11px] text-[#6B7280] mb-4 leading-relaxed">
                                Alt text describes images for people with visual impairments. Provide a brief, clear description of what's happening in the photo.
                            </p>

                            <Textarea 
                                placeholder="Describe this photo..."
                                value={altText}
                                onChange={(e: any) => setAltText(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:border-[#5B35D5] focus:ring-0 focus:outline-none transition-colors min-h-[120px] resize-none mb-4"
                                maxLength={300}
                            />

                            <div className="text-right text-[10px] font-mono text-[#9CA3AF] mb-6">
                                {300 - altText.length} characters left
                            </div>

                            <div className="mt-auto pt-4 border-t border-[#E5E7EB]">
                                <Button 
                                    onClick={handleSaveAltText}
                                    className="w-full rounded-full font-bold bg-[#5B35D5] hover:bg-[#4A28C9] text-white"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
