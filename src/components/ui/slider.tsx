"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
        )}
        {...props}
    >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-800">
            <SliderPrimitive.Range className="absolute h-full bg-violet-500" />
        </SliderPrimitive.Track>
        {/* Support Multiple Thumbs if value/defaultValue is array */}
        {(props.value || props.defaultValue || [0]).length > 1 ? (
            // Heuristic: If it's an array > 1, render that many thumbs
            // Note: Radix handles the logic, we just need to render the Thumbs.
            // We can render 2 hardcoded if we expect dual range, or map.
            // For strict dual range support:
            <>
                <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-violet-500 bg-black ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
                <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-violet-500 bg-black ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
            </>
        ) : (
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-violet-500 bg-black ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        )}
    </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
