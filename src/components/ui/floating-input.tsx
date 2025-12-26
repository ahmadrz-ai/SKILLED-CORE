'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input, InputProps } from '@/components/ui/input';

interface FloatingInputProps extends InputProps {
    label: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
    ({ className, label, value, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const hasValue = value !== undefined && value !== '';

        return (
            <div className="relative pt-2">
                <Input
                    ref={ref}
                    className={cn(
                        "h-14 pt-4 bg-zinc-900/50 border-white/10 focus:border-violet-500/50 transition-all",
                        className
                    )}
                    value={value}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    {...props}
                />
                <label
                    className={cn(
                        "absolute left-3 transition-all duration-200 pointer-events-none text-zinc-500",
                        (isFocused || hasValue)
                            ? "top-3 text-[10px] uppercase tracking-wider text-violet-400 font-bold"
                            : "top-5 text-sm"
                    )}
                >
                    {label}
                </label>
            </div>
        );
    }
);
FloatingInput.displayName = "FloatingInput";

export { FloatingInput };
