import { toast } from '@/components/ui/use-toast';

export interface ErrorDetails {
  message: string;
  code?: string;
  field?: string;
  constraint?: string;
}

export interface DatabaseError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
}

// Common database constraint error codes
export const DB_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
} as const;

// Parse database errors into user-friendly messages
export function parseDbError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    const dbError = error as DatabaseError;
    
    // Handle specific database constraint violations
    if (dbError.code === DB_ERROR_CODES.UNIQUE_VIOLATION) {
      if (dbError.constraint?.includes('email')) {
        return {
          message: 'This email address is already in use',
          code: dbError.code,
          field: 'email',
          constraint: dbError.constraint,
        };
      }
      if (dbError.constraint?.includes('unit_number')) {
        return {
          message: 'This unit number already exists in the building',
          code: dbError.code,
          field: 'unit_number',
          constraint: dbError.constraint,
        };
      }
      return {
        message: 'This value already exists and must be unique',
        code: dbError.code,
        constraint: dbError.constraint,
      };
    }
    
    if (dbError.code === DB_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
      if (dbError.constraint?.includes('building')) {
        return {
          message: 'Cannot delete building because it has associated apartments',
          code: dbError.code,
          constraint: dbError.constraint,
        };
      }
      return {
        message: 'Cannot perform this action due to related data dependencies',
        code: dbError.code,
        constraint: dbError.constraint,
      };
    }
    
    if (dbError.code === DB_ERROR_CODES.NOT_NULL_VIOLATION) {
      return {
        message: 'Required field is missing',
        code: dbError.code,
        constraint: dbError.constraint,
      };
    }
    
    if (dbError.code === DB_ERROR_CODES.CHECK_VIOLATION) {
      return {
        message: 'Invalid data format or value',
        code: dbError.code,
        constraint: dbError.constraint,
      };
    }
    
    // Handle validation errors
    if (error.message.includes('Validation failed')) {
      return {
        message: error.message.replace('Validation failed: ', ''),
        code: 'VALIDATION_ERROR',
      };
    }
    
    // Return original error message for other cases
    return {
      message: error.message,
    };
  }
  
  return {
    message: 'An unexpected error occurred',
  };
}

// Show error toast with appropriate styling and message
export function showErrorToast(error: unknown, defaultMessage?: string) {
  const errorDetails = parseDbError(error);
  
  toast({
    title: "Error",
    description: errorDetails.message || defaultMessage || 'An unexpected error occurred',
    variant: "destructive",
  });
  
  return errorDetails;
}

// Show success toast
export function showSuccessToast(message: string, description?: string) {
  toast({
    title: "Success",
    description: description || message,
  });
}

// Handle async operations with consistent error handling
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: ErrorDetails) => void;
    showToasts?: boolean;
  } = {}
): Promise<{ success: boolean; data?: T; error?: ErrorDetails }> {
  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    showToasts = true,
  } = options;
  
  try {
    const result = await operation();
    
    if (showToasts && successMessage) {
      showSuccessToast(successMessage);
    }
    
    if (onSuccess) {
      onSuccess(result);
    }
    
    return { success: true, data: result };
  } catch (error) {
    const errorDetails = parseDbError(error);
    
    if (showToasts) {
      showErrorToast(error, errorMessage);
    }
    
    if (onError) {
      onError(errorDetails);
    }
    
    return { success: false, error: errorDetails };
  }
}

// Retry mechanism for failed operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}