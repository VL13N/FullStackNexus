/**
 * CryptoRank V2 Basic Plan Service
 * Implements all available endpoints with caching and retry logic
 */

import { LRUCache } from 'lru-cache';

const CRYPTORANK_BASE_URL = 'https://api.cryptorank.io/v2';
const API_KEY = process.env.CRYPTORANK_API_KEY;

// LRU Cache with 1 hour TTL
const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60 // 1 hour
});

/**
 * Makes authenticated request to CryptoRank V2 API with retry logic
 */
export async function makeV2Request(endpoint, params = {}, maxRetries = 3) {
  const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (!API_KEY) {
    throw new Error('CRYPTORANK_API_KEY is not configured');
  }

  const url = new URL(`${CRYPTORANK_BASE_URL}/${endpoint}`);
  
  // Add additional parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`CryptoRank v2 API Request (attempt ${attempt}): ${endpoint}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoAnalytics/1.0',
          'X-API-KEY': API_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Cache successful response
      cache.set(cacheKey, data);
      
      console.log(`CryptoRank v2 API Success: ${endpoint}`);
      return data;

    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      
      if (isLastAttempt) {
        console.error(`CryptoRank API failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
      console.warn(`CryptoRank network error, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Global market statistics
export const fetchGlobalStats = () => makeV2Request('global');

// Currency mapping and search
export const fetchCurrencyMap = () => makeV2Request('currencies/map');
export const searchCurrencies = (query) => makeV2Request('currencies/search', { q: query });

// Categories and tags
export const fetchCategories = () => makeV2Request('currencies/categories');
export const fetchTags = () => makeV2Request('currencies/tags');

// Fiat currencies
export const fetchFiatCurrencies = () => makeV2Request('currencies/fiat');

// All currencies list
export const fetchAllCurrencies = (limit = 100, offset = 0) => 
  makeV2Request('currencies', { limit, offset });

// Single currency data
export const fetchCurrencyById = (id) => makeV2Request(`currencies/${id}`);
export const fetchCurrencyMetadata = (id) => makeV2Request(`currencies/${id}/full-metadata`);
export const fetchCurrencySparkline = (id, interval = '24h') => 
  makeV2Request(`currencies/${id}/sparkline`, { interval });

// Solana-specific helpers (using numeric ID)
const SOLANA_ID = 325; // Solana's numeric ID in CryptoRank
export const fetchSolanaData = () => fetchCurrencyById(SOLANA_ID);
export const fetchSolanaMetadata = () => fetchCurrencyMetadata(SOLANA_ID);
export const fetchSolanaSparkline = (interval = '24h') => fetchCurrencySparkline(SOLANA_ID, interval);

// Funds and exchanges
export const fetchFundsMap = () => makeV2Request('funds/map');
export const fetchExchangesMap = () => makeV2Request('exchanges/map');

/**
 * CryptoRank Service Class for comprehensive data access
 */
export class CryptoRankV2Service {
  constructor() {
    this.cache = cache;
  }

  // Validate API key
  validateApiKey() {
    if (!API_KEY) {
      throw new Error('CryptoRank API key not found in environment variables');
    }
    return true;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.cache.ttl
    };
  }

  // Comprehensive market overview
  async getMarketOverview() {
    const [global, categories, topCurrencies] = await Promise.allSettled([
      fetchGlobalStats(),
      fetchCategories(),
      fetchAllCurrencies(50, 0)
    ]);

    return {
      global: global.status === 'fulfilled' ? global.value.data : null,
      categories: categories.status === 'fulfilled' ? categories.value.data : [],
      topCurrencies: topCurrencies.status === 'fulfilled' ? topCurrencies.value.data : []
    };
  }

  // Enhanced Solana analysis
  async getComprehensiveSolanaAnalysis() {
    const [data, metadata, sparkline] = await Promise.allSettled([
      fetchSolanaData(),
      fetchSolanaMetadata(),
      fetchSolanaSparkline('24h')
    ]);

    return {
      current: data.status === 'fulfilled' ? data.value.data : null,
      metadata: metadata.status === 'fulfilled' ? metadata.value.data : null,
      sparkline: sparkline.status === 'fulfilled' ? sparkline.value.data : null,
      timestamp: new Date().toISOString()
    };
  }

  // Search and discovery
  async searchAndDiscover(query, includeCategories = true) {
    const [searchResults, categories] = await Promise.allSettled([
      searchCurrencies(query),
      includeCategories ? fetchCategories() : Promise.resolve({ data: [] })
    ]);

    return {
      results: searchResults.status === 'fulfilled' ? searchResults.value.data : [],
      categories: categories.status === 'fulfilled' ? categories.value.data : []
    };
  }
}

export default CryptoRankV2Service;