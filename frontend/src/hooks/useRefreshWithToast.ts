import { useCallback } from 'react';
import { useToast } from './useToast';

export function useRefreshWithToast() {
  const { showSuccess, showError } = useToast();

  const refreshWithSuccess = useCallback((message: string, delay: number = 500) => {
    showSuccess(message);
    setTimeout(() => {
      window.location.reload();
    }, delay);
  }, [showSuccess]);

  const refreshWithError = useCallback((message: string, delay: number = 500) => {
    showError(message);
    setTimeout(() => {
      window.location.reload();
    }, delay);
  }, [showError]);

  const handleAsyncWithRefresh = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    successMessage: string,
    errorMessage: string,
    delay: number = 500
  ): Promise<T | undefined> => {
    try {
      const result = await asyncFn();
      refreshWithSuccess(successMessage, delay);
      return result;
    } catch (error) {
      refreshWithError(errorMessage, delay);
      return undefined;
    }
  }, [refreshWithSuccess, refreshWithError]);

  return {
    refreshWithSuccess,
    refreshWithError,
    handleAsyncWithRefresh,
  };
}
