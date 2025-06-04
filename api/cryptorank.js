// NOTE: This integration uses CryptoRank V2 API with proper authentication and caching
// Ensure your CRYPTORANK_API_KEY is valid and has sufficient quota for V2 endpoints

/**
 * CryptoRank V2 API Integration for Solana Fundamental Data
 * Fetches market cap, 24h volume, and historical prices using authenticated endpoints
 */

import { LRUCache } from "lru-cache";

const crCache = new LRUCache({ max: 20, ttl: 1000 * 60 * 60 }); // 1 hour cache

/**
 * Validates API key availability
 */
function validateApiKey() {
  if (!process.env.CRYPTORANK_API_KEY) {
    throw new Error('CryptoRank API key not found. Please set CRYPTORANK_API_KEY environment variable.');
  }
}

/**
 * Fetches current Solana market data
 * @returns {Promise<{priceUsd: number, marketCapUsd: number, volume24hUsd: number}>}
 */
export async function fetchSolanaCurrent() {
  validateApiKey();
  
  const cacheKey = "solCurrent";
  const cached = crCache.get(cacheKey);
  if (cached !== undefined) {
    console.log(`CryptoRank Cache hit: ${cacheKey}`);
    return cached;
  }

  const url = `https://api.cryptorank.io/v2/currencies/5426`;

  try {
    console.log('CryptoRank V2 Request: Solana current data');
    
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': process.env.CRYPTORANK_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      
      if (response.status === 401) {
        console.error(`CryptoRank Auth Error (${response.status}):`, errorData);
        throw new Error(`CryptoRank Authentication failed: ${errorData}. Check your V2 API key.`);
      }
      
      throw new Error(`CryptoRank HTTP ${response.status}: ${errorData}`);
    }

    const responseData = await response.json();
    const data = responseData.data;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response format: missing data array');
    }

    const solanaData = data[0]; // First item should be Solana (ID 5426)
    
    const result = {
      priceUsd: solanaData.price || 0,
      marketCapUsd: solanaData.marketCap || 0,
      volume24hUsd: solanaData.volume24h || 0
    };
    
    // Validate we got numeric values
    Object.entries(result).forEach(([key, value]) => {
      if (typeof value !== 'number' || isNaN(value)) {
        console.warn(`CryptoRank: Invalid ${key} value:`, value);
        result[key] = 0; // Fallback to 0 for invalid values
      }
    });
    
    crCache.set(cacheKey, result);
    console.log('CryptoRank Success:', result);
    return result;
    
  } catch (error) {
    console.error('CryptoRank Current request failed:', error.message);
    throw error;
  }
}

/**
 * Fetches historical price data for Solana
 * @param {string} interval - Time interval (1h, 1d, 1w, etc.)
 * @returns {Promise<Array<{date: number, open: number, high: number, low: number, close: number, volume: number}>>}
 */
export async function fetchSolanaHistorical(interval = "1h") {
  validateApiKey();
  
  const cacheKey = `solHist@${interval}`;
  const cached = crCache.get(cacheKey);
  if (cached !== undefined) {
    console.log(`CryptoRank Cache hit: ${cacheKey}`);
    return cached;
  }

  const url = `https://api.cryptorank.io/v2/hist_price/solana?interval=${interval}&api_key=${process.env.CRYPTORANK_API_KEY}`;

  try {
    console.log(`CryptoRank V2 Request: Solana historical data (${interval})`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.text();
      
      if (response.status === 401) {
        console.error(`CryptoRank Historical Auth Error (${response.status}):`, errorData);
        throw new Error(`CryptoRank Authentication failed: ${errorData}. Check your V2 API key.`);
      }
      
      throw new Error(`CryptoRank Historical HTTP ${response.status}: ${errorData}`);
    }

    const responseData = await response.json();
    const data = responseData.data;
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array of historical data');
    }
    
    crCache.set(cacheKey, data);
    console.log(`CryptoRank Historical Success: ${data.length} records`);
    return data;
    
  } catch (error) {
    console.error('CryptoRank Historical request failed:', error.message);
    throw error;
  }
}

// Legacy class for backward compatibility
class CryptoRankService {
  constructor() {
    this.baseURL = 'https://api.cryptorank.io/v2';
    this.apiKey = process.env.CRYPTORANK_API_KEY;
  }

  validateApiKey() {
    validateApiKey();
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

export default CryptoRankService;