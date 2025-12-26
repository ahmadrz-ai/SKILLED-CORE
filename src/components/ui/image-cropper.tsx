'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { RotateCw, ZoomIn, Check, X } from 'lucide-react'
import getCroppedImg from '@/lib/canvasUtils'

interface ImageCropperProps {
    imageSrc: string | null
    aspectRatio: number // 1 for avatar, 16/9 for banner?
    isOpen: boolean
    onClose: () => void
    onCropComplete: (croppedBlob: Blob) => void
    isCircular?: boolean
}

export default function ImageCropper({
    imageSrc,
    aspectRatio,
    isOpen,
    onClose,
    onCropComplete,
    isCircular = false
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return

        try {
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            )
            if (croppedImageBlob) {
                onCropComplete(croppedImageBlob)
            }
        } catch (e) {
            console.error(e)
        }
    }

    if (!imageSrc) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[600px] h-[90vh] sm:h-[600px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-white/5 bg-zinc-900/50">
                    <DialogTitle className="font-cinzel text-lg flex items-center gap-2">
                        <RotateCw className="w-4 h-4 text-violet-500" />
                        Adjust Image
                    </DialogTitle>
                </DialogHeader>

                <div className="relative flex-1 bg-black w-full h-full">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspectRatio}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteCallback}
                        onZoomChange={onZoomChange}
                        onRotationChange={setRotation}
                        cropShape={isCircular ? 'round' : 'rect'}
                        showGrid={!isCircular}
                    />
                </div>

                <div className="p-6 bg-zinc-900/80 backdrop-blur-md border-t border-white/5 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-zinc-400 w-16">Zoom</span>
                            <Slider
                                value={[zoom]}
                                min={1}
                                max={3}
                                step={0.1}
                                onValueChange={(vals) => setZoom(vals[0])}
                                className="flex-1"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-zinc-400 w-16">Rotate</span>
                            <Slider
                                value={[rotation]}
                                min={0}
                                max={360}
                                step={1}
                                onValueChange={(vals) => setRotation(vals[0])}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-500 min-w-[120px]">
                            <Check className="w-4 h-4 mr-2" /> Apply
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
