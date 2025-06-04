/**
 * Caching Mechanism for API Responses
 * Implements intelligent caching with TTL, LRU eviction, and rate limiting protection
 * Stores API responses for defined intervals to improve performance and handle rate limits
 */

class ApiCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTtl = options.defaultTtl || 30 * 60 * 1000; // 30 minutes default
    this.maxSize = options.maxSize || 1000; // Maximum cache entries
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 5 minutes cleanup
    
    // API-specific TTL configurations (in milliseconds)
    this.apiTtlConfig = {
      taapi: 15 * 60 * 1000, // 15 minutes - technical indicators change frequently
      lunarcrush: 30 * 60 * 1000, // 30 minutes - social metrics update less frequently
      cryptorank: 20 * 60 * 1000, // 20 minutes - market data updates
      onchain: 10 * 60 * 1000, // 10 minutes - blockchain metrics are more dynamic
      astrology: 60 * 60 * 1000, // 60 minutes - astronomical data changes slowly
      ...options.apiTtlConfig
    };

    // Rate limiting configurations
    this.rateLimits = {
      taapi: { requests: 500, window: 60 * 60 * 1000 }, // 500 requests per hour
      lunarcrush: { requests: 1000, window: 24 * 60 * 60 * 1000 }, // 1000 requests per day
      cryptorank: { requests: 10000, window: 24 * 60 * 60 * 1000 }, // 10k requests per day
      onchain: { requests: 1000, window: 60 * 60 * 1000 }, // 1000 requests per hour
      astrology: { requests: Infinity, window: 60 * 60 * 1000 }, // No limit for local calculations
      ...options.rateLimits
    };

    // Request tracking for rate limiting
    this.requestCounts = new Map();

    // Start cleanup interval
    this.startCleanup();

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      rateLimitBlocks: 0
    };
  }

  /**
   * Generate cache key from endpoint and parameters
   * @param {string} api - API name (taapi, lunarcrush, etc.)
   * @param {string} endpoint - Endpoint path
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  generateKey(api, endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = params[key];
        return sorted;
      }, {});
    
    return `${api}:${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Get cached response if valid and not expired
   * @param {string} key - Cache key
   * @returns {Object|null} Cached response or null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time for LRU
    entry.lastAccessed = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Store response in cache with appropriate TTL
   * @param {string} key - Cache key
   * @param {Object} data - Response data to cache
   * @param {string} api - API name for TTL lookup
   * @param {number} customTtl - Custom TTL override
   */
  set(key, data, api, customTtl = null) {
    const ttl = customTtl || this.apiTtlConfig[api] || this.defaultTtl;
    const now = Date.now();
    
    const entry = {
      data,
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + ttl,
      api,
      size: this.estimateSize(data)
    };

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
  }

  /**
   * Check if API request is within rate limits
   * @param {string} api - API name
   * @returns {Object} Rate limit status
   */
  checkRateLimit(api) {
    const limit = this.rateLimits[api];
    if (!limit || limit.requests === Infinity) {
      return { allowed: true, remaining: Infinity };
    }

    const now = Date.now();
    const windowStart = now - limit.window;
    
    // Get or create request tracking for this API
    if (!this.requestCounts.has(api)) {
      this.requestCounts.set(api, []);
    }

    const requests = this.requestCounts.get(api);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.requestCounts.set(api, validRequests);

    const remaining = Math.max(0, limit.requests - validRequests.length);
    const allowed = validRequests.length < limit.requests;

    if (!allowed) {
      this.stats.rateLimitBlocks++;
    }

    return {
      allowed,
      remaining,
      resetTime: validRequests.length > 0 ? validRequests[0] + limit.window : now
    };
  }

  /**
   * Record an API request for rate limiting
   * @param {string} api - API name
   */
  recordRequest(api) {
    const now = Date.now();
    
    if (!this.requestCounts.has(api)) {
      this.requestCounts.set(api, []);
    }

    const requests = this.requestCounts.get(api);
    requests.push(now);
  }

  /**
   * Smart cache retrieval that considers rate limits and freshness
   * @param {string} api - API name
   * @param {string} endpoint - Endpoint path
   * @param {Object} params - Request parameters
   * @param {Object} options - Cache options
   * @returns {Object} Cache result with metadata
   */
  smartGet(api, endpoint, params = {}, options = {}) {
    const key = this.generateKey(api, endpoint, params);
    const cached = this.get(key);
    const rateLimit = this.checkRateLimit(api);

    // If we have cached data and rate limit is exceeded, return cached even if stale
    if (cached && !rateLimit.allowed) {
      return {
        data: cached,
        source: 'cache',
        reason: 'rate_limit_protection',
        fresh: false
      };
    }

    // If we have fresh cached data, return it
    if (cached) {
      const age = Date.now() - this.cache.get(key).createdAt;
      const maxAge = options.maxAge || this.apiTtlConfig[api] || this.defaultTtl;
      
      if (age < maxAge) {
        return {
          data: cached,
          source: 'cache',
          reason: 'fresh_data',
          fresh: true,
          age
        };
      }
    }

    // No cache or stale data, need fresh request
    return {
      data: null,
      source: 'api',
      reason: rateLimit.allowed ? 'cache_miss' : 'rate_limited',
      canRequest: rateLimit.allowed,
      rateLimit
    };
  }

  /**
   * Cache a successful API response
   * @param {string} api - API name
   * @param {string} endpoint - Endpoint path
   * @param {Object} params - Request parameters
   * @param {Object} response - API response to cache
   * @param {Object} options - Cache options
   */
  cacheResponse(api, endpoint, params, response, options = {}) {
    const key = this.generateKey(api, endpoint, params);
    
    // Don't cache error responses unless explicitly requested
    if (!options.cacheErrors && response.success === false) {
      return;
    }

    // Don't cache if response indicates rate limiting
    if (response.error && response.error.includes('rate limit')) {
      return;
    }

    this.set(key, response, api, options.ttl);
    this.recordRequest(api);
  }

  /**
   * Invalidate cache entries for a specific API
   * @param {string} api - API name to invalidate
   * @param {string} pattern - Optional pattern to match endpoints
   */
  invalidate(api, pattern = null) {
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.api === api) {
        if (!pattern || key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Bulk cache operations for multiple APIs
   * @param {Object} responses - Object with API responses
   * @param {Object} requests - Object with original request details
   */
  bulkCache(responses, requests) {
    for (const [api, response] of Object.entries(responses)) {
      if (requests[api]) {
        const { endpoint, params } = requests[api];
        this.cacheResponse(api, endpoint, params, response);
      }
    }
  }

  /**
   * Get cache statistics and health metrics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredEntries = 0;
    const apiBreakdown = {};

    for (const [key, entry] of this.cache.entries()) {
      totalSize += entry.size || 0;
      
      if (now > entry.expiresAt) {
        expiredEntries++;
      }

      if (!apiBreakdown[entry.api]) {
        apiBreakdown[entry.api] = { count: 0, size: 0 };
      }
      apiBreakdown[entry.api].count++;
      apiBreakdown[entry.api].size += entry.size || 0;
    }

    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalEntries: this.cache.size,
      expiredEntries,
      totalSize: this.formatBytes(totalSize),
      apiBreakdown,
      rateLimitStatus: this.getRateLimitStatus()
    };
  }

  /**
   * Get current rate limit status for all APIs
   * @returns {Object} Rate limit status by API
   */
  getRateLimitStatus() {
    const status = {};
    
    for (const api of Object.keys(this.rateLimits)) {
      status[api] = this.checkRateLimit(api);
    }

    return status;
  }

  /**
   * Manually trigger cache cleanup
   * @returns {number} Number of entries cleaned up
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    // Clean up old request tracking data
    for (const [api, requests] of this.requestCounts.entries()) {
      const limit = this.rateLimits[api];
      if (limit) {
        const windowStart = now - limit.window;
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        this.requestCounts.set(api, validRequests);
      }
    }

    return cleaned;
  }

  /**
   * Export cache data for persistence
   * @returns {Object} Serializable cache data
   */
  export() {
    const entries = {};
    
    for (const [key, entry] of this.cache.entries()) {
      entries[key] = entry;
    }

    return {
      entries,
      stats: this.stats,
      requestCounts: Object.fromEntries(this.requestCounts)
    };
  }

  /**
   * Import cache data from persistence
   * @param {Object} data - Previously exported cache data
   */
  import(data) {
    if (data.entries) {
      this.cache.clear();
      const now = Date.now();
      
      for (const [key, entry] of Object.entries(data.entries)) {
        // Only import non-expired entries
        if (entry.expiresAt > now) {
          this.cache.set(key, entry);
        }
      }
    }

    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }

    if (data.requestCounts) {
      this.requestCounts = new Map(Object.entries(data.requestCounts));
    }
  }

  /**
   * Clear all cache data
   */
  clear() {
    this.cache.clear();
    this.requestCounts.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      rateLimitBlocks: 0
    };
  }

  // Private methods

  /**
   * Evict least recently used entry
   * @private
   */
  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Estimate memory size of cached data
   * @param {Object} data - Data to estimate
   * @returns {number} Estimated size in bytes
   * @private
   */
  estimateSize(data) {
    return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per character
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   * @private
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Start automatic cleanup interval
   * @private
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop automatic cleanup interval
   * @private
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Destroy cache instance and cleanup resources
   */
  destroy() {
    this.stopCleanup();
    this.clear();
  }
}

// Create and export singleton instance with sensible defaults
const cache = new ApiCache({
  defaultTtl: 30 * 60 * 1000, // 30 minutes
  maxSize: 1000,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  
  // API-specific configurations optimized for trading analysis
  apiTtlConfig: {
    taapi: 10 * 60 * 1000,      // 10 minutes - technical indicators
    lunarcrush: 30 * 60 * 1000, // 30 minutes - social metrics
    cryptorank: 15 * 60 * 1000,  // 15 minutes - market data
    onchain: 5 * 60 * 1000,      // 5 minutes - blockchain metrics
    astrology: 60 * 60 * 1000    // 60 minutes - astronomical data
  },

  rateLimits: {
    taapi: { requests: 500, window: 60 * 60 * 1000 },        // 500/hour
    lunarcrush: { requests: 1000, window: 24 * 60 * 60 * 1000 }, // 1000/day
    cryptorank: { requests: 10000, window: 24 * 60 * 60 * 1000 }, // 10k/day
    onchain: { requests: 1000, window: 60 * 60 * 1000 },     // 1000/hour
    astrology: { requests: Infinity, window: 60 * 60 * 1000 } // No limit
  }
});

export default cache;