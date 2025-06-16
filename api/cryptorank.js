// CryptoRank V2 API Integration for Basic Plan
// Using v2 endpoints with query parameter authentication
// Basic plan quotas: 100 calls/min, 5,000 credits/day

/**
 * CryptoRank API V2 Integration for Solana Fundamental Data
 * Fetches current prices, market cap, and trading volume data using v2 endpoints
 */

import { rateLimit } from '../services/cryptoRankLimiter.js';
import { LRUCache } from 'lru-cache';

console.log("CRYPTORANK_API_KEY loaded:", Boolean(process.env.CRYPTORANK_API_KEY));

const CR_API_KEY = process.env.CRYPTORANK_API_KEY;
if (!CR_API_KEY) {
  console.error("❌ Missing CRYPTORANK_API_KEY – set it in Replit Secrets");
  process.exit(1);
}

const crCache = new LRUCache({ max: 20, ttl: 1000 * 60 * 60 }); // 1 hour cache

// Export the makeV2Request function for use in other modules
export { makeV2Request };

/**
 * Makes authenticated request to CryptoRank v2 endpoint with retry logic
 * Uses X-API-KEY header authentication for Basic plan endpoints
 */
async function makeV2Request(endpoint, maxRetries = 3) {
  // Use clean endpoint without query parameter authentication - use header instead
  const url = `https://api.cryptorank.io/v2/${endpoint}`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`CryptoRank v2 API Request (attempt ${attempt}): ${endpoint}`);
      
      await rateLimit(); // Respect rate limits
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoAnalytics/1.0',
          'X-API-KEY': CR_API_KEY  // Use header authentication
        },
        timeout: 15000
      });
      
      if (!response.ok) {
        // Enhanced error logging for 401 and 400 responses
        if (response.status === 401 || response.status === 400) {
          let errorDetails;
          try {
            errorDetails = await response.json();
            console.error(`CryptoRank API Error ${response.status}:`, errorDetails);
          } catch (parseError) {
            const errorText = await response.text();
            console.error(`CryptoRank API Error ${response.status}:`, errorText);
            errorDetails = { message: errorText };
          }
          throw new Error(`HTTP ${response.status}: ${errorDetails.message || 'Authentication/Request error'}`);
        }
        
        if (response.status === 429) {
          // Rate limit - exponential backoff
          const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          console.warn(`CryptoRank rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (response.status >= 500) {
          // Server error - retry with backoff
          const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.warn(`CryptoRank server error ${response.status}, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Other client errors - don't retry
        const errorText = await response.text();
        console.error(`CryptoRank API Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log(`CryptoRank v2 API Success: ${endpoint}`);
      return data;
      
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`CryptoRank API failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }
      
      // Network error - retry with exponential backoff
      const waitTime = Math.pow(2, attempt) * 1000;
      console.warn(`CryptoRank network error, retrying in ${waitTime}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// v2 API uses currency slugs directly, so we can use 'solana' instead of numeric IDs

/**
 * Fetch Solana current data using Basic plan /currencies/:id endpoint
 */
export async function fetchSolanaCurrent() {
  const cacheKey = 'solCurrent';
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  try {
    // Use Basic plan endpoint: /v2/currencies/:id
    const responseData = await makeV2Request('currencies/solana');
    
    if (responseData.data) {
      const coinData = responseData.data;
      const result = {
        id: coinData.id,
        symbol: coinData.symbol,
        name: coinData.name,
        price: coinData.values?.USD?.price || null,
        market_cap: coinData.values?.USD?.marketCap || null,
        volume_24h: coinData.values?.USD?.volume24h || null,
        price_change_1h: coinData.values?.USD?.percentChange1h || null,
        price_change_24h: coinData.values?.USD?.percentChange24h || null,
        price_change_7d: coinData.values?.USD?.percentChange7d || null,
        price_change_30d: coinData.values?.USD?.percentChange30d || null,
        market_cap_rank: coinData.rank || null,
        circulating_supply: coinData.circulatingSupply || null,
        total_supply: coinData.totalSupply || null,
        max_supply: coinData.maxSupply || null
      };
      
      crCache.set(cacheKey, result);
      return result;
    }
    
    throw new Error('No Solana data found in v2 response');
    
  } catch (err) {
    console.error('CryptoRank current fetch failed:', err.message);
    throw err;
  }
}

/**
 * Fetch Solana sparkline data using Basic plan /currencies/:id/sparkline endpoint
 * Computes ISO timestamps: from=now-24h, to=now
 */
export async function fetchSolanaSparkline(interval = '1h') {
  const cacheKey = `solSparkline_${interval}`;
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  try {
    // Compute Unix timestamps: from=now-24h, to=now (CryptoRank expects Unix timestamps)
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const fromUnix = Math.floor(from.getTime() / 1000);
    const toUnix = Math.floor(now.getTime() / 1000);
    
    // Use Basic plan endpoint: /v2/currencies/:id/sparkline (requires numeric ID and Unix timestamps)
    const endpoint = `currencies/5663/sparkline?from=${fromUnix}&to=${toUnix}&interval=${interval}`;
    const responseData = await makeV2Request(endpoint);
    
    if (responseData.data && Array.isArray(responseData.data)) {
      const result = {
        interval,
        from: fromISO,
        to: toISO,
        data: responseData.data.map(point => ({
          timestamp: point.timestamp,
          price: point.price || point.value,
          volume: point.volume || null
        }))
      };
      
      crCache.set(cacheKey, result);
      return result;
    }
    
    throw new Error('No sparkline data found in v2 response');
    
  } catch (err) {
    console.error('CryptoRank sparkline fetch failed:', err.message);
    throw err;
  }
}

/**
 * Fetch global market data using Basic plan /global endpoint
 */
export async function fetchGlobalData() {
  const cacheKey = 'globalData';
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  try {
    const responseData = await makeV2Request('global');
    
    if (responseData.data) {
      const result = {
        marketCap: responseData.data.marketCap,
        volume24h: responseData.data.volume24h,
        btcDominance: responseData.data.btcDominance,
        ethDominance: responseData.data.ethDominance,
        marketCapChange24h: responseData.data.marketCapChange24h,
        volumeChange24h: responseData.data.volumeChange24h
      };
      
      crCache.set(cacheKey, result);
      return result;
    }
    
    throw new Error('No global data found in v2 response');
    
  } catch (err) {
    console.error('CryptoRank global fetch failed:', err.message);
    throw err;
  }
}

/**
 * Fetch currencies list using Basic plan /currencies endpoint
 */
export async function fetchCurrencies(limit = 100) {
  const cacheKey = `currencies_${limit}`;
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  try {
    const responseData = await makeV2Request(`currencies?limit=${limit}`);
    
    if (responseData.data && Array.isArray(responseData.data)) {
      const result = responseData.data.map(currency => ({
        id: currency.id,
        symbol: currency.symbol,
        name: currency.name,
        rank: currency.rank,
        price: currency.values?.USD?.price || null,
        marketCap: currency.values?.USD?.marketCap || null,
        volume24h: currency.values?.USD?.volume24h || null,
        percentChange24h: currency.values?.USD?.percentChange24h || null
      }));
      
      crCache.set(cacheKey, result);
      return result;
    }
    
    throw new Error('No currencies data found in v2 response');
    
  } catch (err) {
    console.error('CryptoRank currencies fetch failed:', err.message);
    throw err;
  }
}

/**
 * Fetch currency tags using Basic plan /currencies/tags endpoint
 */
export async function fetchCurrencyTags() {
  const cacheKey = 'currencyTags';
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  try {
    const responseData = await makeV2Request('currencies/tags');
    
    if (responseData.data && Array.isArray(responseData.data)) {
      crCache.set(cacheKey, responseData.data);
      return responseData.data;
    }
    
    throw new Error('No tags data found in v2 response');
    
  } catch (err) {
    console.error('CryptoRank tags fetch failed:', err.message);
    throw err;
  }
}

/**
 * Historical price data now uses sparkline endpoint for Basic plan compatibility
 */
export async function fetchSolanaHistorical(interval = '1h') {
  console.log('Fetching Solana historical data using sparkline endpoint...');
  return await fetchSolanaSparkline(interval);
}

// Legacy class for backward compatibility
class CryptoRankService {
  constructor() {
    this.baseURL = 'https://api.cryptorank.io/v2';
    this.apiKey = process.env.CRYPTORANK_API_KEY;
  }

  validateApiKey() {
    if (!this.apiKey) {
      throw new Error('CRYPTORANK_API_KEY is undefined—check Replit Secrets and restart.');
    }
  }

  async makeRequest(endpoint, params = {}) {
    // Legacy method - redirect to new functions
    if (endpoint === 'currencies/solana' || endpoint.includes('solana')) {
      return await fetchSolanaCurrent();
    }
    
    throw new Error(`Legacy endpoint ${endpoint} not supported. Use fetchSolanaCurrent() or fetchSolanaHistorical() instead.`);
  }

  async getSolanaData() {
    return await fetchSolanaCurrent();
  }

  async getSolanaHistoricalPrices(timeframe = '1h', currency = 'USD') {
    return await fetchSolanaHistorical(timeframe);
  }

  async getSolanaMarketStats() {
    return await fetchSolanaCurrent();
  }

  async getMultiCoinComparison(symbols = ['solana', 'bitcoin', 'ethereum', 'cardano', 'polkadot']) {
    // Use Basic plan currencies endpoint
    const currencies = await fetchCurrencies(100);
    return currencies.filter(currency => 
      symbols.some(symbol => currency.name.toLowerCase().includes(symbol) || currency.symbol.toLowerCase() === symbol.slice(0, 3).toUpperCase())
    );
  }

  async getMarketOverview(limit = 100) {
    // Use Basic plan endpoints for comprehensive market overview
    const [global, currencies, tags] = await Promise.allSettled([
      fetchGlobalData(),
      fetchCurrencies(limit),
      fetchCurrencyTags()
    ]);
    
    return {
      global: global.status === 'fulfilled' ? global.value : null,
      currencies: currencies.status === 'fulfilled' ? currencies.value : [],
      tags: tags.status === 'fulfilled' ? tags.value : [],
      timestamp: new Date().toISOString()
    };
  }

  async getComprehensiveSolanaAnalysis() {
    const [current, sparkline, global] = await Promise.allSettled([
      fetchSolanaCurrent(),
      fetchSolanaSparkline('1h'),
      fetchGlobalData()
    ]);
    
    return {
      current: current.status === 'fulfilled' ? current.value : null,
      sparkline: sparkline.status === 'fulfilled' ? sparkline.value : null,
      global: global.status === 'fulfilled' ? global.value : null,
      timestamp: new Date().toISOString()
    };
  }

  async getSolanaRealTimePrice() {
    const data = await fetchSolanaCurrent();
    return {
      price: data.priceUsd,
      volume24h: data.volume24hUsd,
      marketCap: data.marketCapUsd
    };
  }
}

export { CryptoRankService };
export default new CryptoRankService();