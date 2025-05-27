/**
 * Client-side caching utility for AI responses and analysis data
 * Uses localStorage with TTL (time-to-live) for efficient caching
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ClientCache {
  private readonly prefix = 'mitr_ai_cache_';
  
  /**
   * Set an item in cache with TTL
   */
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000, // Convert minutes to milliseconds
      };
      
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Failed to cache item:', error);
    }
  }
  
  /**
   * Get an item from cache if it hasn't expired
   */
  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${this.prefix}${key}`);
      if (!cached) return null;
      
      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if item has expired
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        this.remove(key);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to retrieve cached item:', error);
      return null;
    }
  }
  
  /**
   * Remove an item from cache
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.warn('Failed to remove cached item:', error);
    }
  }
  
  /**
   * Clear all cache items for this app
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
  
  /**
   * Generate a cache key from user input and context
   */
  generateKey(userMessage: string, context?: any): string {
    // Create a hash-like key from the message and minimal context
    const contextString = context ? JSON.stringify(context) : '';
    const combined = `${userMessage}_${contextString}`;
    
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `response_${Math.abs(hash)}`;
  }
  
  /**
   * Clean up expired cache items
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const cacheItem: CacheItem<any> = JSON.parse(cached);
              if (now - cacheItem.timestamp > cacheItem.ttl) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Remove corrupted cache items
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }
}

// Export singleton instance
export const clientCache = new ClientCache();

// Run cleanup on module load
if (typeof window !== 'undefined') {
  clientCache.cleanup();
}
