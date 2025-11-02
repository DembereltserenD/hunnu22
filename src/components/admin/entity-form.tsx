"use client";

import React from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, X } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/loading-spinner";

export type FieldType = "text" | "email" | "tel" | "number" | "textarea" | "select";

export interface SelectOption {
    value: string;
    label: string;
}

export interface FormFieldConfig {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    options?: SelectOption[]; // For select fields
    disabled?: boolean;
}

export interface EntityFormProps {
    title: string;
    fields: FormFieldConfig[];
    schema?: z.ZodSchema<any>;
    defaultValues?: Record<string, any>;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    className?: string;
    loadingText?: string;
    showLoadingOverlay?: boolean;
}

export function EntityForm({
    title,
    fields,
    schema,
    defaultValues,
    onSubmit,
    onCancel,
    loading = false,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    className,
    loadingText = "Saving...",
    showLoadingOverlay = false,
}: EntityFormProps) {
    const { useForm } = require("react-hook-form");
    const form = useForm({
        defaultValues: defaultValues || {},
    });

    const handleSubmit = async (data: any) => {
        try {
            // Validate with schema if provided
            if (schema) {
                const result = schema.safeParse(data);
                if (!result.success) {
                    // Set form errors
                    result.error.issues.forEach((error: any) => {
                        if (error.path.length > 0) {
                            form.setError(error.path[0] as string, {
                                type: "manual",
                                message: error.message,
                            });
                        }
                    });
                    return;
                }
            }
            await onSubmit(data);
        } catch (error) {
            // Error handling is managed by the parent component
            console.error("Form submission error:", error);
        }
    };

    const renderField = (fieldConfig: FormFieldConfig) => {
        const { name, label, type, placeholder, options, disabled } = fieldConfig;

        return (
            <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                            {type === "select" ? (
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={disabled || loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options?.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : type === "textarea" ? (
                                <Textarea
                                    placeholder={placeholder}
                                    disabled={disabled || loading}
                                    {...field}
                                />
                            ) : type === "number" ? (
                                <Input
                                    type="number"
                                    placeholder={placeholder}
                                    disabled={disabled || loading}
                                    {...field}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value === "" ? "" : Number(value));
                                    }}
                                />
                            ) : (
                                <Input
                                    type={type}
                                    placeholder={placeholder}
                                    disabled={disabled || loading}
                                    {...field}
                                />
                            )}
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    };

    const formContent = (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {fields.map((fieldConfig) => renderField(fieldConfig))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {loading ? loadingText : submitLabel}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                {cancelLabel}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );

    if (showLoadingOverlay) {
        return (
            <LoadingOverlay isLoading={loading} text={loadingText}>
                {formContent}
            </LoadingOverlay>
        );
    }

    return formContent;
}

// Helper function to create form field configurations
export function createFormField(
    name: string,
    label: string,
    type: FieldType,
    options?: {
        placeholder?: string;
        required?: boolean;
        selectOptions?: SelectOption[];
        disabled?: boolean;
    }
): FormFieldConfig {
    return {
        name,
        label,
        type,
        placeholder: options?.placeholder,
        required: options?.required,
        options: options?.selectOptions,
        disabled: options?.disabled,
    };
}

// Predefined field configurations for common entity types
export const createWorkerFormFields = (): FormFieldConfig[] => [
    createFormField("name", "Name", "text", {
        placeholder: "Enter worker name",
        required: true,
    }),
    createFormField("email", "Email", "email", {
        placeholder: "Enter email address",
    }),
    createFormField("phone", "Phone", "tel", {
        placeholder: "Enter phone number",
    }),
];

export const createBuildingFormFields = (): FormFieldConfig[] => [
    createFormField("name", "Building Name", "text", {
        placeholder: "Enter building name",
        required: true,
    }),
    createFormField("address", "Address", "textarea", {
        placeholder: "Enter building address",
        required: true,
    }),
    createFormField("total_units", "Total Units", "number", {
        placeholder: "Enter total number of units",
        required: true,
    }),
];

export const createApartmentFormFields = (
    buildings: SelectOption[]
): FormFieldConfig[] => [
        createFormField("building_id", "Building", "select", {
            placeholder: "Select a building",
            required: true,
            selectOptions: buildings,
        }),
        createFormField("unit_number", "Unit Number", "text", {
            placeholder: "Enter unit number (e.g., 101, 2A)",
            required: true,
        }),
    ];