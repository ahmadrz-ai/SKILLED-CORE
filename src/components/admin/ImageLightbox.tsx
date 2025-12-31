'use client';

import { X, ZoomIn, Download } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    title?: string;
}

export function ImageLightbox({ isOpen, onClose, imageUrl, title }: ImageLightboxProps) {
    const isVideo = imageUrl.startsWith('data:video/') || imageUrl.match(/\.(mp4|webm|mov)($|\?)/i);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl h-[90vh] bg-black/95 border-white/10 p-0 overflow-hidden">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">{title || 'Attachment Preview'}</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = imageUrl;
                                    link.download = title || 'attachment';
                                    link.click();
                                }}
                                className="text-white hover:bg-white/10"
                                title="Download"
                            >
                                <Download className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full h-full flex items-center justify-center p-4">
                    {isVideo ? (
                        <video
                            src={imageUrl}
                            controls
                            autoPlay
                            className="max-w-full max-h-full rounded-lg shadow-2xl"
                        />
                    ) : (
                        <img
                            src={imageUrl}
                            alt={title || 'Attachment'}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
