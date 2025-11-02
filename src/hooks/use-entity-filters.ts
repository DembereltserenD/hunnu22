import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface UseEntityFiltersOptions {
  defaultFilters?: Record<string, string>;
  persistInUrl?: boolean;
  storageKey?: string;
}

export function useEntityFilters(options: UseEntityFiltersOptions = {}) {
  const { defaultFilters = {}, persistInUrl = true, storageKey } = options;
  const router = useRouter();
  
  // Safely get search params - handle SSR/static generation
  let searchParams: URLSearchParams | null = null;
  try {
    searchParams = useSearchParams();
  } catch (error) {
    // During static generation, useSearchParams might not be available
    console.warn('useSearchParams not available during static generation');
  }
  
  // Initialize filters from URL params or default values
  const initializeFilters = useCallback(() => {
    const filters: Record<string, string> = { ...defaultFilters };
    
    if (persistInUrl && searchParams) {
      // Load from URL search params
      try {
        searchParams.forEach((value, key) => {
          if (key !== 'page') { // Don't include page in filters
            filters[key] = value;
          }
        });
      } catch (error) {
        console.warn('Error reading search params:', error);
      }
    } else if (storageKey && typeof window !== 'undefined') {
      // Load from localStorage
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedFilters = JSON.parse(stored);
          Object.assign(filters, parsedFilters);
        }
      } catch (error) {
        console.warn('Failed to load filters from localStorage:', error);
      }
    }
    
    return filters;
  }, [defaultFilters, persistInUrl, searchParams, storageKey]);

  const [filters, setFilters] = useState<Record<string, string>>(initializeFilters);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (persistInUrl && searchParams) {
      try {
        return searchParams.get('query') || '';
      } catch (error) {
        console.warn('Error getting query from search params:', error);
        return '';
      }
    }
    return '';
  });

  // Update URL when filters change
  useEffect(() => {
    if (!persistInUrl || typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams();
      
      // Add search query
      if (searchQuery.trim()) {
        params.set('query', searchQuery);
      }
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.set(key, value);
        }
      });

      // Update URL without triggering navigation
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      if (newUrl !== window.location.search && newUrl !== window.location.pathname) {
        router.replace(newUrl, { scroll: false });
      }
    } catch (error) {
      console.warn('Error updating URL:', error);
    }
  }, [filters, searchQuery, persistInUrl, router]);

  // Save to localStorage when filters change
  useEffect(() => {
    if (!storageKey || persistInUrl || typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [filters, storageKey, persistInUrl]);

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Update a single filter
  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchQuery('');
  }, [defaultFilters]);

  // Clear a specific filter
  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(value => value && value.trim()).length;
  const hasActiveFilters = activeFilterCount > 0 || searchQuery.trim();

  // Get filter values for API calls
  const getApiFilters = useCallback(() => {
    const apiFilters: Record<string, any> = {};
    
    if (searchQuery.trim()) {
      apiFilters.query = searchQuery.trim();
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim()) {
        // Convert string values to appropriate types
        if (key === 'page' || key === 'limit' || key === 'floor') {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            apiFilters[key] = numValue;
          }
        } else {
          apiFilters[key] = value;
        }
      }
    });
    
    return apiFilters;
  }, [filters, searchQuery]);

  return {
    // State
    filters,
    searchQuery,
    activeFilterCount,
    hasActiveFilters,
    
    // Actions
    updateFilter,
    updateFilters,
    updateSearchQuery,
    clearFilters,
    clearFilter,
    getApiFilters
  };
}