"use client";

import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Trash2, CheckCircle, XCircle } from "lucide-react";

export type ConfirmDialogVariant = "destructive" | "warning" | "info" | "success";

export interface ConfirmDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
    variant?: ConfirmDialogVariant;
    icon?: React.ReactNode;
}

const variantConfig = {
    destructive: {
        icon: Trash2,
        confirmButtonClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        iconClass: "text-destructive",
        defaultConfirmLabel: "Delete",
    },
    warning: {
        icon: AlertTriangle,
        confirmButtonClass: "bg-yellow-600 text-white hover:bg-yellow-700",
        iconClass: "text-yellow-600",
        defaultConfirmLabel: "Continue",
    },
    info: {
        icon: AlertTriangle,
        confirmButtonClass: "bg-blue-600 text-white hover:bg-blue-700",
        iconClass: "text-blue-600",
        defaultConfirmLabel: "Confirm",
    },
    success: {
        icon: CheckCircle,
        confirmButtonClass: "bg-green-600 text-white hover:bg-green-700",
        iconClass: "text-green-600",
        defaultConfirmLabel: "Confirm",
    },
};

export function ConfirmDialog({
    isOpen,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    loading = false,
    variant = "destructive",
    icon,
}: ConfirmDialogProps) {
    const config = variantConfig[variant];
    const IconComponent = config.icon;
    const displayConfirmLabel = confirmLabel || config.defaultConfirmLabel;

    const handleConfirm = async () => {
        try {
            await onConfirm();
        } catch (error) {
            // Error handling should be managed by the parent component
            console.error("Confirm dialog action error:", error);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onOpenChange(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!loading) {
            onOpenChange(open);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        {icon || (
                            <div className={`flex-shrink-0 ${config.iconClass}`}>
                                <IconComponent className="h-6 w-6" />
                            </div>
                        )}
                        <div className="flex-1">
                            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
                        </div>
                    </div>
                    <AlertDialogDescription className="text-left mt-2">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel
                        onClick={handleCancel}
                        disabled={loading}
                        className="mt-2 sm:mt-0"
                    >
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading}
                        className={config.confirmButtonClass}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            displayConfirmLabel
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Predefined dialog configurations for common use cases
export interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    entityName: string;
    entityType: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
    warningMessage?: string;
}

export function DeleteConfirmDialog({
    isOpen,
    onOpenChange,
    entityName,
    entityType,
    onConfirm,
    onCancel,
    loading = false,
    warningMessage,
}: DeleteConfirmDialogProps) {
    const baseDescription = `Are you sure you want to delete "${entityName}"? This action cannot be undone.`;
    const description = warningMessage ? `${warningMessage}\n\n${baseDescription}` : baseDescription;

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={`Delete ${entityType}`}
            description={description}
            confirmLabel="Delete"
            onConfirm={onConfirm}
            onCancel={onCancel}
            loading={loading}
            variant="destructive"
        />
    );
}

export interface UnsavedChangesDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

export function UnsavedChangesDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    onCancel,
    loading = false,
}: UnsavedChangesDialogProps) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title="Unsaved Changes"
            description="You have unsaved changes. Are you sure you want to leave without saving?"
            confirmLabel="Leave without saving"
            onConfirm={onConfirm}
            onCancel={onCancel}
            loading={loading}
            variant="warning"
        />
    );
}

export interface CascadeDeleteWarningDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    entityName: string;
    entityType: string;
    relatedEntities: string[];
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

export function CascadeDeleteWarningDialog({
    isOpen,
    onOpenChange,
    entityName,
    entityType,
    relatedEntities,
    onConfirm,
    onCancel,
    loading = false,
}: CascadeDeleteWarningDialogProps) {
    const relatedEntitiesText = relatedEntities.length === 1
        ? relatedEntities[0]
        : `${relatedEntities.slice(0, -1).join(", ")} and ${relatedEntities[relatedEntities.length - 1]}`;

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={`Delete ${entityType} and Related Data`}
            description={`Deleting "${entityName}" will also permanently delete all related ${relatedEntitiesText}. This action cannot be undone.`}
            confirmLabel="Delete All"
            onConfirm={onConfirm}
            onCancel={onCancel}
            loading={loading}
            variant="destructive"
            icon={
                <div className="flex-shrink-0 text-destructive">
                    <XCircle className="h-6 w-6" />
                </div>
            }
        />
    );
}