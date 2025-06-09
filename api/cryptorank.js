// CryptoRank V2 API Integration for Basic Plan
// Using v2 endpoints with query parameter authentication
// Basic plan quotas: 100 calls/min, 5,000 credits/day

/**
 * CryptoRank API V2 Integration for Solana Fundamental Data
 * Fetches current prices, market cap, and trading volume data using v2 endpoints
 */

import { rateLimit } from '../services/cryptoRankLimiter.js';
import { LRUCache } from 'lru-cache';

const CR_API_KEY = process.env.CRYPTORANK_API_KEY;
if (!CR_API_KEY) {
  throw new Error("CRYPTORANK_API_KEY is undefined—check Replit Secrets and restart.");
}

const crCache = new LRUCache({ max: 20, ttl: 1000 * 60 * 60 }); // 1 hour cache

/**
 * Makes authenticated request to CryptoRank v2 endpoint with retry logic
 */
async function makeV2Request(endpoint, maxRetries = 3) {
  // v2 API uses query parameter authentication as per documentation
  const url = `https://api.cryptorank.io/v2/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${CR_API_KEY}`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`CryptoRank v2 API Request (attempt ${attempt}): ${endpoint}`);
      
      await rateLimit(); // Respect rate limits
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoAnalytics/1.0'
        },
        timeout: 15000
      });
      
      if (!response.ok) {
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
        
        // Client error - don't retry
        const errorText = await response.text();
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

export async function fetchSolanaCurrent() {
  const cacheKey = 'solCurrent';
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  try {
    // Use v2 endpoint with currency slug as per documentation
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
 * This function is no longer available because the current plan does not include hist_price.
 */
export async function fetchSolanaHistorical(interval) {
  throw new Error(
    "Historical price data is not available on your CryptoRank plan. " +
    "Allowed endpoints: /global, /currencies/map, /currencies/categories, /currencies/tags, /currencies/fiat, /currencies, /currencies/:id."
  );
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
    // For now, just return Solana data - can be extended later
    return await fetchSolanaCurrent();
  }

  async getMarketOverview(limit = 100) {
    return await fetchSolanaCurrent();
  }

  async getComprehensiveSolanaAnalysis() {
    const [current, historical] = await Promise.all([
      fetchSolanaCurrent(),
      fetchSolanaHistorical('1h')
    ]);
    
    return {
      current,
      historical: historical.slice(-24) // Last 24 hours
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