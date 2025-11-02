"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter, RotateCcw } from "lucide-react";
import { useDebounceSearch } from "@/hooks/use-debounced-search";

export interface FilterOption {
    key: string;
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: 'select' | 'text' | 'number';
    options?: FilterOption[];
    placeholder?: string;
}

export interface EntityFiltersProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filters?: FilterConfig[];
    filterValues?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;
    onClearFilters?: () => void;
    showFilterCount?: boolean;
    className?: string;
}

export function EntityFilters({
    searchPlaceholder = "Search...",
    searchValue = "",
    onSearchChange,
    filters = [],
    filterValues = {},
    onFilterChange,
    onClearFilters,
    showFilterCount = true,
    className
}: EntityFiltersProps) {
    // Use debounced search hook for better performance
    const {
        searchValue: localSearchValue,
        debouncedValue,
        isSearching,
        updateSearchValue,
        clearSearch
    } = useDebounceSearch(searchValue, { delay: 300, minLength: 0 });

    // Sync external search value changes with internal state
    React.useEffect(() => {
        if (searchValue !== localSearchValue) {
            updateSearchValue(searchValue);
        }
    }, [searchValue, localSearchValue, updateSearchValue]);

    // Call external search handler when debounced value changes
    React.useEffect(() => {
        if (onSearchChange && debouncedValue !== searchValue) {
            onSearchChange(debouncedValue);
        }
    }, [debouncedValue, onSearchChange, searchValue]);

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

    // Handle filter changes
    const handleFilterChange = (key: string, value: string) => {
        if (onFilterChange) {
            onFilterChange(key, value);
        }
    };

    // Count active filters
    const activeFilterCount = Object.values(filterValues).filter(value => value && value.trim() && value !== "__all__").length;
    const hasActiveFilters = activeFilterCount > 0 || localSearchValue.trim();

    return (
        <Card className={className}>
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* Search and Filter Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filters</span>
                            {showFilterCount && hasActiveFilters && (
                                <Badge variant="secondary" className="text-xs">
                                    {activeFilterCount + (localSearchValue.trim() ? 1 : 0)} active
                                </Badge>
                            )}
                        </div>
                        {hasActiveFilters && onClearFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    handleClearSearch();
                                    onClearFilters();
                                }}
                                className="h-8 px-2 text-xs"
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Clear All
                            </Button>
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={localSearchValue}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {localSearchValue && (
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
                            <div className="absolute right-8 top-1/2 transform -translate-y-1/2 h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                        )}
                    </div>

                    {/* Filter Controls */}
                    {filters.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filters.map((filter) => (
                                <div key={filter.key} className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        {filter.label}
                                    </label>
                                    {filter.type === 'select' && filter.options ? (
                                        <Select
                                            value={filterValues[filter.key] || "__all__"}
                                            onValueChange={(value) => handleFilterChange(filter.key, value === "__all__" ? "" : value)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder={filter.placeholder || `All ${filter.label}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">All {filter.label}</SelectItem>
                                                {filter.options.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            type={filter.type === 'number' ? 'number' : 'text'}
                                            placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}`}
                                            value={filterValues[filter.key] || ""}
                                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                            className="h-9"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Active Filter Tags */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2">
                            {localSearchValue.trim() && (
                                <Badge variant="outline" className="text-xs">
                                    Search: "{localSearchValue}"
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearSearch}
                                        className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                                    >
                                        <X className="h-2 w-2" />
                                    </Button>
                                </Badge>
                            )}
                            {Object.entries(filterValues).map(([key, value]) => {
                                if (!value || !value.trim() || value === "__all__") return null;
                                const filter = filters.find(f => f.key === key);
                                const filterLabel = filter?.label || key;
                                const displayValue = filter?.options?.find(opt => opt.value === value)?.label || value;

                                return (
                                    <Badge key={key} variant="outline" className="text-xs">
                                        {filterLabel}: {displayValue}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleFilterChange(key, "")}
                                            className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                                        >
                                            <X className="h-2 w-2" />
                                        </Button>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}