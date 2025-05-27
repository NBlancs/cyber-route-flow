// Cache management utilities to prevent stuck loading states

export const clearBrowserCache = async () => {
  try {
    // Clear local storage
    localStorage.clear();
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear service worker caches if available
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    console.log('Browser cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing browser cache:', error);
    return false;
  }
};

export const clearReactQueryCache = (queryClient: any) => {
  try {
    queryClient.clear();
    console.log('React Query cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing React Query cache:', error);
    return false;
  }
};

export const forceReload = () => {
  // Force reload without cache
  window.location.reload();
};

export const preventCaching = () => {
  // Add timestamp to prevent caching
  const timestamp = Date.now();
  const url = new URL(window.location.href);
  url.searchParams.set('_t', timestamp.toString());
  window.history.replaceState({}, '', url.toString());
};

export const detectStuckLoading = (callback: () => void, timeout: number = 10000) => {
  return setTimeout(() => {
    console.warn('Detected stuck loading state, executing callback');
    callback();
  }, timeout);
};
