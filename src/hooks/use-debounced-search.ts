import { useState, useEffect, useCallback } from 'react';

interface UseDebounceSearchOptions {
  delay?: number;
  minLength?: number;
}

export function useDebounceSearch(
  initialValue: string = '',
  options: UseDebounceSearchOptions = {}
) {
  const { delay = 300, minLength = 0 } = options;
  
  const [searchValue, setSearchValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchValue.length < minLength && searchValue.length > 0) {
      setDebouncedValue('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedValue(searchValue);
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchValue, delay, minLength]);

  const updateSearchValue = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchValue('');
    setDebouncedValue('');
    setIsSearching(false);
  }, []);

  return {
    searchValue,
    debouncedValue,
    isSearching,
    updateSearchValue,
    clearSearch
  };
}