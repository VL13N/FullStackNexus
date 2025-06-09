// NOTE: Using CryptoRank V1 API with rate limiting for Basic plan compliance
// Solana ID in CryptoRank system: 5663
// Basic plan quotas: 100 calls/min, 5,000 credits/day. All calls must be cached or passed through rateLimit().

/**
 * CryptoRank API Integration for Solana Fundamental Data
 * Fetches current prices, market cap, and trading volume data with rate limiting
 */

import { rateLimit } from '../services/cryptoRankLimiter.js';
import { LRUCache } from 'lru-cache';

const CR_API_KEY = process.env.CRYPTORANK_API_KEY;
if (!CR_API_KEY) {
  throw new Error("CRYPTORANK_API_KEY is undefined—check Replit Secrets and restart.");
}

const crCache = new LRUCache({ max: 20, ttl: 1000 * 60 * 60 }); // 1 hour cache

async function findSolanaId() {
  // Search through currencies list to find Solana's correct ID
  try {
    const response = await fetch(`https://api.cryptorank.io/v1/currencies?api_key=${CR_API_KEY}&limit=500`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch currencies list: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (!responseData.status || !responseData.status.success) {
      throw new Error(`API error: ${responseData.status?.message || 'Unknown error'}`);
    }

    const currencies = responseData.data;
    
    // Find Solana in the list
    for (const currency of currencies) {
      if (currency.symbol === 'SOL' || currency.name?.toLowerCase().includes('solana')) {
        console.log(`Found Solana with ID: ${currency.id}`);
        return currency.id;
      }
    }
    
    throw new Error('Solana not found in currencies list');
  } catch (err) {
    console.error('Failed to find Solana ID:', err.message);
    throw err;
  }
}

export async function fetchSolanaCurrent() {
  const cacheKey = 'solCurrent';
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  await rateLimit();
  
  try {
    // Use known Solana ID (5663) directly to avoid double API calls
    const url = `https://api.cryptorank.io/v1/currencies/5663?api_key=${CR_API_KEY}`;
    
    const response = await fetch(url, {
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
    
    const simplified = {
      priceUsd: data.values?.USD?.price || 0,
      marketCapUsd: data.values?.USD?.marketCap || 0,
      volume24hUsd: data.values?.USD?.volume24h || 0
    };
    
    // Persist fundamental data for ML/backtesting
    try {
      const { persistFundamentalData } = await import('../services/dataPersistence.js');
      await persistFundamentalData(responseData, 'solana');
    } catch (persistError) {
      console.warn('Failed to persist fundamental data:', persistError.message);
      // Continue without failing the main request
    }
    
    crCache.set(cacheKey, simplified);
    return simplified;
    
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