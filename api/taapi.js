// NOTE: TAAPI's MACD parameters must be camelCase (fastPeriod, slowPeriod, signalPeriod).
// If you still see authentication errors, check TAAPI dashboard → Usage for quota and IP Access.

console.log("TAAPI key in use:", process.env.TAAPI_API_KEY);
if (!process.env.TAAPI_API_KEY) {
  throw new Error("TAAPI_API_KEY is undefined—check Replit Secrets and restart.");
}

/**
 * TAAPI Pro Technical Analysis Integration
 * Fetches real-time technical indicators for cryptocurrency trading using bulk endpoints and caching
 */

import { LRUCache } from "lru-cache";

const taapiCache = new LRUCache({ max: 50, ttl: 1000 * 60 * 15 }); // 15 min cache

/**
 * Validates API key availability
 */
function validateApiKey() {
  if (!process.env.TAAPI_API_KEY) {
    throw new Error('TAAPI API key not found. Please set TAAPI_API_KEY environment variable in Secrets.');
  }
}

/**
 * Fetches a single technical indicator
 * @param {string} indicatorName - Name of the indicator (rsi, macd, ema, etc.)
 * @param {string} interval - Time interval (default: "1h")
 * @returns {Promise<number>} The indicator value
 */
export async function fetchTAIndicator(indicatorName, interval = "1h") {
  validateApiKey();
  
  const cacheKey = `${indicatorName}@${interval}`;
  const cached = taapiCache.get(cacheKey);
  if (cached !== undefined) {
    console.log(`TAAPI Cache hit: ${cacheKey} = ${cached}`);
    return cached;
  }

  const params = new URLSearchParams({
    secret: process.env.TAAPI_API_KEY,
    exchange: "binance",
    symbol: "SOL/USDT",
    interval
  });

  // Add indicator-specific parameters with correct TAAPI naming
  if (indicatorName === 'rsi') {
    params.append('period', '14');
  } else if (indicatorName === 'ema') {
    params.append('period', '20');
  } else if (indicatorName === 'macd') {
    params.append('fastPeriod', '12');
    params.append('slowPeriod', '26');
    params.append('signalPeriod', '9');
  }

  const url = `https://api.taapi.io/${indicatorName}?${params}`;

  try {
    console.log(`TAAPI Request: ${indicatorName} (${interval}) with params:`, params.toString());
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.text();
      
      if (response.status === 401) {
        console.error(`TAAPI Auth Error (${response.status}):`, errorData);
        throw new Error(`TAAPI Authentication failed: ${errorData}. Check your Pro API key.`);
      }
      
      if (response.status === 429) {
        console.error(`TAAPI Rate Limit (${response.status}):`, errorData);
        throw new Error(`TAAPI Rate limit exceeded: ${errorData}. Consider using bulk endpoint.`);
      }
      
      throw new Error(`TAAPI HTTP ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    let value;

    // Handle different indicator response formats
    if (indicatorName === 'macd') {
      // MACD has multiple possible response formats
      value = data.valueMACD || data.histogram?.value || data.histogram || data.value;
    } else {
      // Standard indicators (RSI, EMA, SMA, etc.)
      value = data.value;
    }
    
    if (typeof value === 'number') {
      taapiCache.set(cacheKey, value);
      console.log(`TAAPI Success: ${indicatorName} = ${value}`);
      return value;
    }
    
    throw new Error(`Invalid response format: expected number, got ${typeof value}`);
    
  } catch (error) {
    console.error(`TAAPI ${indicatorName} request failed:`, error.message);
    throw error;
  }
}

/**
 * Fetches multiple indicators in a single bulk request (more efficient)
 * @param {string} interval - Time interval (default: "1h")
 * @returns {Promise<{rsi: number, macdHistogram: number, ema200: number}>}
 */
export async function fetchBulkIndicators(interval = "1h") {
  validateApiKey();
  
  const cacheKey = `bulk@${interval}`;
  const cached = taapiCache.get(cacheKey);
  if (cached !== undefined) {
    console.log(`TAAPI Bulk cache hit: ${cacheKey}`);
    return cached;
  }

  const requestBody = {
    secret: process.env.TAAPI_API_KEY,
    construct: { 
      exchange: "binance", 
      symbol: "SOL/USDT", 
      interval 
    },
    indicators: [
      { name: "rsi" },
      { name: "macd" },
      { name: "ema", params: { period: 20 } }
    ]
  };

  try {
    console.log(`TAAPI Bulk Request (${interval}):`, requestBody.indicators);
    
    const response = await fetch('https://api.taapi.io/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      
      if (response.status === 401) {
        console.error(`TAAPI Bulk Auth Error (${response.status}):`, errorData);
        throw new Error(`TAAPI Bulk Authentication failed: ${errorData}. Check your Pro API key.`);
      }
      
      if (response.status === 429) {
        console.error(`TAAPI Bulk Rate Limit (${response.status}):`, errorData);
        throw new Error(`TAAPI Bulk Rate limit exceeded: ${errorData}.`);
      }
      
      throw new Error(`TAAPI Bulk HTTP ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log('TAAPI Bulk Response:', data);
    
    // Extract values from bulk response with defensive parsing
    const result = {
      rsi: data.data?.[0]?.result?.value || 0,
      macdHistogram: 0,
      ema200: data.data?.[2]?.result?.value || 0
    };

    // Defensive MACD parsing
    try {
      const macdData = data.data?.[1]?.result;
      if (macdData) {
        // Try multiple possible MACD response formats
        result.macdHistogram = 
          macdData.valueMACD || 
          macdData.histogram?.value || 
          macdData.histogram || 
          macdData.value || 
          0;
      }
    } catch (macdError) {
      console.warn('MACD histogram format unexpected:', data.data?.[1]);
      result.macdHistogram = 0;
    }
    
    // Validate we got numeric values
    Object.entries(result).forEach(([key, value]) => {
      if (typeof value !== 'number' || isNaN(value)) {
        console.warn(`TAAPI Bulk: Invalid ${key} value:`, value);
        result[key] = 0; // Fallback to 0 for invalid values
      }
    });
    
    // Persist technical data for ML/backtesting
    try {
      const { persistTechnicalData } = await import('../services/dataPersistence.js');
      await persistTechnicalData(data, 'SOL/USDT', interval);
    } catch (persistError) {
      console.warn('Failed to persist technical data:', persistError.message);
      // Continue without failing the main request
    }
    
    taapiCache.set(cacheKey, result);
    console.log(`TAAPI Bulk Success:`, result);
    return result;
    
  } catch (error) {
    console.error(`TAAPI Bulk request failed:`, error.message);
    throw error;
  }
}

// Legacy class for backward compatibility
class TaapiService {
  constructor() {
    this.baseURL = 'https://api.taapi.io';
    this.apiKey = process.env.TAAPI_API_KEY;
  }

  validateApiKey() {
    validateApiKey();
  }

  async makeRequest(indicator, params = {}) {
    return await fetchTAIndicator(indicator, params.interval || '1h');
  }

  async getRSI(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', period = 14) {
    return await fetchTAIndicator('rsi', interval);
  }

  async getMACD(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h') {
    return await fetchTAIndicator('macd', interval);
  }

  async getEMA(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', period = 20) {
    return await fetchTAIndicator('ema', interval);
  }

  async getSMA(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', period = 20) {
    return await fetchTAIndicator('sma', interval);
  }

  async getBollingerBands(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h') {
    return await fetchTAIndicator('bbands', interval);
  }

  async getStochasticRSI(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h') {
    return await fetchTAIndicator('stochrsi', interval);
  }

  async getWilliamsR(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', period = 14) {
    return await fetchTAIndicator('willr', interval);
  }

  async getBulkIndicators(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', indicators = []) {
    return await fetchBulkIndicators(interval);
  }

  async getSolanaAnalysis(exchange = 'binance', interval = '1h') {
    return await fetchBulkIndicators(interval);
  }

  async getPriceData(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h') {
    return await fetchTAIndicator('price', interval);
  }

  async getCustomAnalysis(config = {}) {
    const interval = config.interval || '1h';
    return await fetchBulkIndicators(interval);
  }
}

export default TaapiService;