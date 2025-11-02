"use client";

import React, { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Edit, Trash2, Loader2, X } from "lucide-react";
import { useDebounceSearch } from "@/hooks/use-debounced-search";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export interface ColumnDef<T> {
    key: keyof T | string;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
    sortable?: boolean;
    searchable?: boolean;
}

export interface EntityTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    title: string;
    loading?: boolean;
    searchPlaceholder?: string;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onAdd?: () => void;
    // Pagination props
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    // Search props
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    // Additional props
    emptyMessage?: string;
    className?: string;
    hideTitle?: boolean;
    hideAddButton?: boolean;
}

export function EntityTable<T extends { id: string }>({
    data,
    columns,
    title,
    loading = false,
    searchPlaceholder = "Search...",
    onEdit,
    onDelete,
    onAdd,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    searchQuery = "",
    onSearchChange,
    emptyMessage = "No data found",
    className,
    hideTitle = false,
    hideAddButton = false,
}: EntityTableProps<T>) {
    // Use debounced search hook for better performance
    const {
        searchValue,
        debouncedValue,
        isSearching,
        updateSearchValue,
        clearSearch
    } = useDebounceSearch(searchQuery, { delay: 300, minLength: 0 });

    // Sync external search query changes with internal state
    useEffect(() => {
        if (searchQuery !== searchValue) {
            updateSearchValue(searchQuery);
        }
    }, [searchQuery, searchValue, updateSearchValue]);

    // Call external search handler when debounced value changes
    useEffect(() => {
        if (onSearchChange && debouncedValue !== searchQuery) {
            onSearchChange(debouncedValue);
        }
    }, [debouncedValue, onSearchChange, searchQuery]);

    // Handle search input changes
    const handleSearchChange = (value: string) => {
        updateSearchValue(value);
    };

    // Handle clear search
    const handleClearSearch = () => {
        clearSearch();
        if (onSearchChange) {
            onSearchChange('');
        }
    };

    // Filter data locally if no external search handler is provided
    const filteredData = useMemo(() => {
        if (onSearchChange || !searchValue) {
            return data;
        }

        return data.filter((item) => {
            return columns.some((column) => {
                if (column.searchable === false) return false;

                const value = column.key === 'id' ? item.id : (item as any)[column.key];
                if (value == null) return false;

                return String(value).toLowerCase().includes(searchValue.toLowerCase());
            });
        });
    }, [data, searchValue, columns, onSearchChange]);

    // Generate pagination items
    const generatePaginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(i);
            }
        } else {
            if (currentPage <= 3) {
                items.push(1, 2, 3, 4, "ellipsis", totalPages);
            } else if (currentPage >= totalPages - 2) {
                items.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                items.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages);
            }
        }

        return items;
    };

    return (
        <Card className={className}>
            {!hideTitle && (
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder={searchPlaceholder}
                                    value={searchValue}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10 pr-10 w-full sm:w-64"
                                />
                                {searchValue && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearSearch}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                                    >
                                        <X className="h-3 w-3" />
                                        <span className="sr-only">Clear search</span>
                                    </Button>
                                )}
                                {isSearching && (
                                    <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            {onAdd && !hideAddButton && (
                                <Button onClick={onAdd} className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add New
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            )}
            {hideTitle && (
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchValue}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-10 pr-10 w-full"
                            />
                            {searchValue && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSearch}
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                                >
                                    <X className="h-3 w-3" />
                                    <span className="sr-only">Clear search</span>
                                </Button>
                            )}
                            {isSearching && (
                                <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                        </div>
                        {onAdd && !hideAddButton && (
                            <Button onClick={onAdd} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add New
                            </Button>
                        )}
                    </div>
                </CardHeader>
            )}
            <CardContent>
                {loading ? (
                    <LoadingSpinner size="lg" text="Loading data..." />
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {columns.map((column) => (
                                            <TableHead key={String(column.key)} className="font-medium">
                                                {column.header}
                                            </TableHead>
                                        ))}
                                        {(onEdit || onDelete) && (
                                            <TableHead className="text-right font-medium">Actions</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                {emptyMessage}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredData.map((item) => (
                                            <TableRow key={item.id}>
                                                {columns.map((column) => {
                                                    const value = column.key === 'id' ? item.id : (item as any)[column.key];
                                                    return (
                                                        <TableCell key={String(column.key)}>
                                                            {column.render ? column.render(value, item) : String(value || "")}
                                                        </TableCell>
                                                    );
                                                })}
                                                {(onEdit || onDelete) && (
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {onEdit && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => onEdit(item)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    <span className="sr-only">Edit</span>
                                                                </Button>
                                                            )}
                                                            {onDelete && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => onDelete(item)}
                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span className="sr-only">Delete</span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && onPageChange && (
                            <div className="mt-4">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                                                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>

                                        {generatePaginationItems().map((item, index) => (
                                            <PaginationItem key={index}>
                                                {item === "ellipsis" ? (
                                                    <PaginationEllipsis />
                                                ) : (
                                                    <PaginationLink
                                                        onClick={() => onPageChange(item as number)}
                                                        isActive={currentPage === item}
                                                        className="cursor-pointer"
                                                    >
                                                        {item}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                                                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}