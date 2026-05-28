import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  ctaElement?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaText,
  ctaHref,
  onCtaClick,
  ctaElement
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[220px] p-8 bg-bg-card border border-border-card rounded-xl shadow-sm font-sans">
      <Icon className="w-12 h-12 text-sc-gray-300 shrink-0" />
      <h3 className="text-base font-semibold text-text-heading mt-4">{title}</h3>
      <p className="text-sm text-text-secondary mt-2 max-w-xs leading-relaxed">{description}</p>
      
      {ctaElement ? (
        <div className="mt-4">{ctaElement}</div>
      ) : (
        ctaText && (
          <div className="mt-4">
            {ctaHref ? (
              <Link href={ctaHref}>
                <Button className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white text-xs font-bold h-9 px-4 rounded-lg shadow-sm transition-colors cursor-pointer border-none">
                  {ctaText}
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={onCtaClick}
                className="bg-sc-purple-600 hover:bg-sc-purple-700 text-white text-xs font-bold h-9 px-4 rounded-lg shadow-sm transition-colors cursor-pointer border-none"
              >
                {ctaText}
              </Button>
            )}
          </div>
        )
      )}
    </div>
  );
}
