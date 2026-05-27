import * as React from "react"
import { cn } from "@/lib/utils"

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "branded" | "neutral"
}

export function Tag({ className, variant = "branded", ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium",
        variant === "branded" && "bg-sc-purple-50 text-sc-purple-700 border border-sc-purple-200",
        variant === "neutral" && "bg-sc-gray-100 text-text-body border border-border-default",
        className
      )}
      {...props}
    />
  )
}
