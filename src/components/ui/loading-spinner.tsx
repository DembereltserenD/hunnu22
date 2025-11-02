"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    text?: string;
    inline?: boolean;
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
};

export function LoadingSpinner({
    size = "md",
    className,
    text,
    inline = false
}: LoadingSpinnerProps) {
    const spinnerElement = (
        <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
    );

    if (inline) {
        return (
            <span className="inline-flex items-center gap-2">
                {spinnerElement}
                {text && <span className="text-sm text-muted-foreground">{text}</span>}
            </span>
        );
    }

    return (
        <div className="flex items-center justify-center gap-2 py-4">
            {spinnerElement}
            {text && <span className="text-sm text-muted-foreground">{text}</span>}
        </div>
    );
}

export interface LoadingOverlayProps {
    isLoading: boolean;
    text?: string;
    className?: string;
    children: React.ReactNode;
}

export function LoadingOverlay({
    isLoading,
    text = "Loading...",
    className,
    children
}: LoadingOverlayProps) {
    return (
        <div className={cn("relative", className)}>
            {children}
            {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <LoadingSpinner text={text} />
                </div>
            )}
        </div>
    );
}