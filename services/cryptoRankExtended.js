// /services/cryptoRankExtended.js
// CryptoRank Extended Service with Rate Limiting and Caching
// Basic plan quotas: 100 calls/min, 5,000 credits/day. All calls must be cached or passed through rateLimit().

import { LRUCache } from 'lru-cache';
import { rateLimit } from './cryptoRankLimiter.js';

const CR_API_KEY = process.env.CRYPTORANK_API_KEY;
if (!CR_API_KEY) {
  throw new Error("CRYPTORANK_API_KEY is undefined—check Replit Secrets and restart.");
}

// Multiple cache instances with different TTLs
const globalCache = new LRUCache({ max: 50, ttl: 1000 * 60 * 30 }); // 30 minutes for frequently changing data
const staticCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 60 * 6 }); // 6 hours for rarely changing data
const currencyCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 60 }); // 1 hour for currency data
const historicalCache = new LRUCache({ max: 50, ttl: 1000 * 60 * 60 }); // 1 hour for historical data

/**
 * Fetch global market data
 * Cache TTL: 30 minutes (updates frequently)
 */
export async function fetchGlobalMarket() {
  const cacheKey = 'global_market';
  if (globalCache.has(cacheKey)) {
    return globalCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/global?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    globalCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank global market fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch currency map (rarely changes)
 * Cache TTL: 6 hours
 */
export async function fetchCurrencyMap() {
  const cacheKey = 'currency_map';
  if (staticCache.has(cacheKey)) {
    return staticCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies/map?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    staticCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank currency map fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch categories (rarely changes)
 * Cache TTL: 6 hours
 */
export async function fetchCategories() {
  const cacheKey = 'categories';
  if (staticCache.has(cacheKey)) {
    return staticCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies/categories?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    staticCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank categories fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch tags (rarely changes)
 * Cache TTL: 6 hours
 */
export async function fetchTags() {
  const cacheKey = 'tags';
  if (staticCache.has(cacheKey)) {
    return staticCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies/tags?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    staticCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank tags fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch fiat currencies list
 * Cache TTL: 30 minutes
 */
export async function fetchFiatList() {
  const cacheKey = 'fiat_list';
  if (globalCache.has(cacheKey)) {
    return globalCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies/fiat?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    globalCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank fiat list fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch currencies list
 * Warning: Using page=1,limit=50 costs 50 credits. 
 * Cache result for 30 minutes to avoid re-requesting too frequently.
 * Cache TTL: 30 minutes
 */
export async function fetchCurrencies(limit = 50, offset = 0) {
  const cacheKey = `currencies_${limit}_${offset}`;
  if (globalCache.has(cacheKey)) {
    return globalCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies?api_key=${CR_API_KEY}&limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    globalCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank currencies fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch currency by ID
 * Cache TTL: 1 hour
 */
export async function fetchCurrencyById(id) {
  const cacheKey = `currency_${id}`;
  if (currencyCache.has(cacheKey)) {
    return currencyCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies/${id}?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    currencyCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank currency by ID fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch full metadata for currency
 * Cache TTL: 1 hour
 */
export async function fetchFullMetadata(id) {
  const cacheKey = `metadata_${id}`;
  if (currencyCache.has(cacheKey)) {
    return currencyCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies/${id}/full-metadata?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    currencyCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank full metadata fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch sparkline data for currency
 * Basic plan supports:
 *   • "5m" for up to 30 days of 5-minute candles
 *   • "1d" for daily candles
 * Cache TTL: 1 hour
 */
export async function fetchSparkline(id, interval = '1d') {
  // Validate interval for Basic plan
  const allowed = ["5m", "1d"];
  if (!allowed.includes(interval)) {
    throw new Error(
      `Invalid interval "${interval}". Must be one of: ${allowed.join(", ")}`
    );
  }

  const cacheKey = `sparkline_${id}_${interval}`;
  if (historicalCache.has(cacheKey)) {
    return historicalCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies/${id}/sparkline?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    historicalCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank sparkline fetch failed:', error.message);
    throw error;
  }
}

/**
 * Search currencies
 * Cache TTL: 30 minutes
 */
export async function searchCurrencies(query) {
  const cacheKey = `search_${query}`;
  if (globalCache.has(cacheKey)) {
    return globalCache.get(cacheKey);
  }

  await rateLimit();
  
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies/search?query=${encodeURIComponent(query)}&api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const data = responseData.data;
    globalCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CryptoRank search currencies fetch failed:', error.message);
    throw error;
  }
}

/**
 * Fetch Solana historical data with rate limiting
 * Basic plan supports:
 *   • "5m" for up to 30 days of 5-minute candles
 *   • "1d" for daily candles
 */
export async function fetchSolanaHistorical(interval = '1d') {
  // Validate interval for Basic plan
  const allowed = ["5m", "1d"];
  if (!allowed.includes(interval)) {
    throw new Error(
      `Invalid interval "${interval}". Must be one of: ${allowed.join(", ")}`
    );
  }

  const solanaId = 5663; // Known Solana ID in CryptoRank system
  return await fetchSparkline(solanaId, interval);
}

/**
 * Fetch Solana current data with rate limiting
 */
export async function fetchSolanaCurrent() {
  const solanaId = 5663; // Known Solana ID in CryptoRank system
  return await fetchCurrencyById(solanaId);
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    global: {
      size: globalCache.size,
      max: globalCache.max,
      ttl: '30 minutes'
    },
    static: {
      size: staticCache.size,
      max: staticCache.max,
      ttl: '6 hours'
    },
    currency: {
      size: currencyCache.size,
      max: currencyCache.max,
      ttl: '1 hour'
    },
    historical: {
      size: historicalCache.size,
      max: historicalCache.max,
      ttl: '1 hour'
    }
  };
}