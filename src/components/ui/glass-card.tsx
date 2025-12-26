import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    intensity?: "low" | "medium" | "high";
}

export function GlassCard({ children, className, intensity = "medium", ...props }: GlassCardProps) {
    const intensityStyles = {
        low: "bg-charcoal/40 backdrop-blur-sm border-white/5",
        medium: "bg-charcoal/60 backdrop-blur-md border-white/10",
        high: "bg-charcoal/80 backdrop-blur-xl border-white/20",
    };

    return (
        <motion.div
            className={cn(
                "rounded-xl border shadow-xl relative overflow-hidden",
                intensityStyles[intensity],
                className
            )}
            {...props}
        >
            {/* Subtle Gradient Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
