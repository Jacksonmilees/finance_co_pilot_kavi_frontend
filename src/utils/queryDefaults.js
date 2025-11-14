/**
 * Default query options for React Query
 * Ensures consistent caching across all queries
 */
export const defaultQueryOptions = {
  refetchOnMount: false, // Use cache, don't refetch when component mounts
  refetchOnWindowFocus: false, // Use cache, don't refetch when window regains focus
  refetchOnReconnect: false, // Use cache, don't refetch on reconnect
  staleTime: 30 * 60 * 1000, // 30 minutes - data is fresh for 30 minutes
  gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24 hours
  retry: 1, // Retry once on failure
};

/**
 * Helper to merge query options with defaults
 */
export function withCacheDefaults(options = {}) {
  return {
    ...defaultQueryOptions,
    ...options,
  };
}




