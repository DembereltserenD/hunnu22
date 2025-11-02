import { toast } from '@/components/ui/use-toast';
import { parseDbError } from './error-handling';

// Toast notification helpers for consistent messaging across the admin dashboard

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

// Success toast notifications
export const showSuccessToast = {
  created: (entityType: string, entityName?: string) => {
    toast({
      title: "Success",
      description: `${entityType}${entityName ? ` "${entityName}"` : ''} created successfully`,
    });
  },

  updated: (entityType: string, entityName?: string) => {
    toast({
      title: "Success", 
      description: `${entityType}${entityName ? ` "${entityName}"` : ''} updated successfully`,
    });
  },

  deleted: (entityType: string, entityName?: string) => {
    toast({
      title: "Success",
      description: `${entityType}${entityName ? ` "${entityName}"` : ''} deleted successfully`,
    });
  },

  custom: (options: ToastOptions) => {
    toast({
      title: options.title || "Success",
      description: options.description,
      duration: options.duration,
    });
  },
};

// Error toast notifications
export const showErrorToast = {
  validation: (message: string) => {
    toast({
      title: "Validation Error",
      description: message,
      variant: "destructive",
    });
  },

  database: (error: unknown, fallbackMessage?: string) => {
    const errorDetails = parseDbError(error);
    toast({
      title: "Database Error",
      description: errorDetails.message || fallbackMessage || "A database error occurred",
      variant: "destructive",
    });
  },

  network: (message?: string) => {
    toast({
      title: "Network Error",
      description: message || "Unable to connect to the server. Please check your connection.",
      variant: "destructive",
    });
  },

  notFound: (entityType: string) => {
    toast({
      title: "Not Found",
      description: `${entityType} not found`,
      variant: "destructive",
    });
  },

  unauthorized: () => {
    toast({
      title: "Unauthorized",
      description: "You don't have permission to perform this action",
      variant: "destructive",
    });
  },

  constraint: (constraintType: 'unique' | 'foreign_key' | 'not_null' | 'check', details?: string) => {
    const messages = {
      unique: "This value already exists and must be unique",
      foreign_key: "Cannot perform this action due to related data dependencies",
      not_null: "Required field is missing",
      check: "Invalid data format or value"
    };

    toast({
      title: "Constraint Violation",
      description: details || messages[constraintType],
      variant: "destructive",
    });
  },

  custom: (options: ToastOptions & { variant?: "destructive" }) => {
    toast({
      title: options.title || "Error",
      description: options.description,
      variant: options.variant || "destructive",
      duration: options.duration,
    });
  },
};

// Loading toast notifications (for long operations)
export const showLoadingToast = {
  start: (message: string) => {
    return toast({
      title: "Loading",
      description: message,
      duration: Infinity, // Keep until manually dismissed
    });
  },

  update: (toastId: string, message: string) => {
    // Note: The current toast implementation doesn't support updating
    // This is a placeholder for future enhancement
    console.log(`Update toast ${toastId}: ${message}`);
  },

  finish: (toastId: string) => {
    // Note: The current toast implementation doesn't support manual dismissal by ID
    // This is a placeholder for future enhancement
    console.log(`Finish toast ${toastId}`);
  },
};

// Warning toast notifications
export const showWarningToast = {
  unsavedChanges: () => {
    toast({
      title: "Unsaved Changes",
      description: "You have unsaved changes. Are you sure you want to leave?",
      variant: "destructive",
    });
  },

  deleteConfirmation: (entityType: string, entityName?: string) => {
    toast({
      title: "Confirm Deletion",
      description: `Are you sure you want to delete ${entityType.toLowerCase()}${entityName ? ` "${entityName}"` : ''}? This action cannot be undone.`,
      variant: "destructive",
    });
  },

  custom: (options: ToastOptions) => {
    toast({
      title: options.title || "Warning",
      description: options.description,
      duration: options.duration,
    });
  },
};

// Info toast notifications
export const showInfoToast = {
  noData: (entityType: string) => {
    toast({
      title: "No Data",
      description: `No ${entityType.toLowerCase()} found`,
    });
  },

  custom: (options: ToastOptions) => {
    toast({
      title: options.title || "Info",
      description: options.description,
      duration: options.duration,
    });
  },
};

// Utility function to show appropriate error toast based on error type
export function showErrorForOperation(
  operation: 'create' | 'update' | 'delete' | 'fetch',
  entityType: string,
  error: unknown
) {
  const errorDetails = parseDbError(error);
  
  // Handle specific database constraints
  if (errorDetails.code) {
    switch (errorDetails.code) {
      case '23505': // Unique violation
        showErrorToast.constraint('unique', errorDetails.message);
        return;
      case '23503': // Foreign key violation
        showErrorToast.constraint('foreign_key', errorDetails.message);
        return;
      case '23502': // Not null violation
        showErrorToast.constraint('not_null', errorDetails.message);
        return;
      case '23514': // Check violation
        showErrorToast.constraint('check', errorDetails.message);
        return;
    }
  }

  // Handle validation errors
  if (errorDetails.code === 'VALIDATION_ERROR') {
    showErrorToast.validation(errorDetails.message);
    return;
  }

  // Default error messages based on operation
  const operationMessages = {
    create: `Failed to create ${entityType.toLowerCase()}`,
    update: `Failed to update ${entityType.toLowerCase()}`,
    delete: `Failed to delete ${entityType.toLowerCase()}`,
    fetch: `Failed to load ${entityType.toLowerCase()}`,
  };

  showErrorToast.custom({
    title: "Error",
    description: errorDetails.message || operationMessages[operation],
  });
}