// NOTE: We are now using CryptoRank V2 exclusively. 
// Ensure CRYPTORANK_API_KEY is set in environment variables.

/**
 * CryptoRank API Integration for Solana Fundamental Data
 * Fetches current prices, market cap, and trading volume data using V2 API exclusively
 */

import { LRUCache } from 'lru-cache';

const CR_API_KEY = process.env.CRYPTORANK_API_KEY;
if (!CR_API_KEY) {
  throw new Error("CRYPTORANK_API_KEY is undefined—check Replit Secrets and restart.");
}

const crCache = new LRUCache({ max: 20, ttl: 1000 * 60 * 60 }); // 1 hour cache

export async function fetchSolanaCurrent() {
  const cacheKey = 'solCurrent';
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  const url = `https://api.cryptorank.io/v2/coins/solana`;
  
  try {
    const response = await fetch(url + `?api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('CryptoRank current fetch failed:', errorData);
      throw new Error(`CryptoRank HTTP ${response.status}: ${errorData}`);
    }

    const responseData = await response.json();
    const data = responseData.data;
    
    const simplified = {
      priceUsd: data.priceUsd,
      marketCapUsd: data.marketCapUsd,
      volume24hUsd: data.volume24hUsd
    };
    
    crCache.set(cacheKey, simplified);
    return simplified;
  } catch (err) {
    console.error('CryptoRank current fetch failed:', err.message);
    throw err;
  }
}

export async function fetchSolanaHistorical(interval = '1h') {
  const cacheKey = `solHist@${interval}`;
  if (crCache.has(cacheKey)) return crCache.get(cacheKey);
  
  const url = `https://api.cryptorank.io/v2/hist_price/solana`;
  
  try {
    const response = await fetch(url + `?interval=${interval}&api_key=${CR_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('CryptoRank historical fetch failed:', errorData);
      throw new Error(`CryptoRank HTTP ${response.status}: ${errorData}`);
    }

    const responseData = await response.json();
    const hist = responseData.data;
    
    crCache.set(cacheKey, hist);
    return hist;
  } catch (err) {
    console.error('CryptoRank historical fetch failed:', err.message);
    throw err;
  }
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

export default CryptoRankService;