import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface OptimisticState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export interface OptimisticActions<T> {
  create: (item: Omit<T, 'id'>, serverAction: () => Promise<T>) => Promise<void>;
  update: (id: string, updates: Partial<T>, serverAction: () => Promise<T>) => Promise<void>;
  delete: (id: string, serverAction: () => Promise<void>) => Promise<void>;
  setData: (data: T[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export function useOptimisticUpdates<T extends { id: string }>(
  initialData: T[] = []
): [OptimisticState<T>, OptimisticActions<T>] {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const rollbackRef = useRef<T[]>([]);

  const create = useCallback(async (
    item: Omit<T, 'id'>,
    serverAction: () => Promise<T>
  ) => {
    // Store current state for rollback
    rollbackRef.current = [...data];
    
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...item, id: tempId } as T;
    
    // Optimistically add the item
    setData(prev => [optimisticItem, ...prev]);
    setError(null);
    
    try {
      setLoading(true);
      const createdItem = await serverAction();
      
      // Replace optimistic item with real item
      setData(prev => prev.map(i => i.id === tempId ? createdItem : i));
      
      toast({
        title: "Success",
        description: "Item created successfully",
      });
    } catch (err) {
      // Rollback on error
      setData(rollbackRef.current);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [data, toast]);

  const update = useCallback(async (
    id: string,
    updates: Partial<T>,
    serverAction: () => Promise<T>
  ) => {
    // Store current state for rollback
    rollbackRef.current = [...data];
    
    // Optimistically update the item
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    setError(null);
    
    try {
      setLoading(true);
      const updatedItem = await serverAction();
      
      // Replace optimistic update with real data
      setData(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
      
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (err) {
      // Rollback on error
      setData(rollbackRef.current);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [data, toast]);

  const deleteItem = useCallback(async (
    id: string,
    serverAction: () => Promise<void>
  ) => {
    // Store current state for rollback
    rollbackRef.current = [...data];
    
    // Optimistically remove the item
    setData(prev => prev.filter(item => item.id !== id));
    setError(null);
    
    try {
      setLoading(true);
      await serverAction();
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (err) {
      // Rollback on error
      setData(rollbackRef.current);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [data, toast]);

  const actions: OptimisticActions<T> = {
    create,
    update,
    delete: deleteItem,
    setData,
    setLoading,
    setError,
  };

  const state: OptimisticState<T> = {
    data,
    loading,
    error,
  };

  return [state, actions];
}