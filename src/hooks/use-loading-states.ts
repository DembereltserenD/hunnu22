import { useState, useCallback } from 'react';

export interface LoadingStates {
  [key: string]: boolean;
}

export interface LoadingActions {
  setLoading: (key: string, loading: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
  clearAll: () => void;
}

export function useLoadingStates(
  initialStates: LoadingStates = {}
): [LoadingStates, LoadingActions] {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>(initialStates);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  const actions: LoadingActions = {
    setLoading,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    clearAll,
  };

  return [loadingStates, actions];
}