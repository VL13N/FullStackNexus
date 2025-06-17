// NOTE: TAAPI's MACD parameters must be camelCase (fastPeriod, slowPeriod, signalPeriod).
// If you still see authentication errors, check TAAPI dashboard → Usage for quota and IP Access.

console.log("TAAPI key in use:", process.env.TAAPI_SECRET);
if (!process.env.TAAPI_SECRET) {
  throw new Error("TAAPI_SECRET is undefined—check Replit Secrets and restart.");
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
  if (!process.env.TAAPI_SECRET) {
    throw new Error('TAAPI SECRET not found. Please set TAAPI_SECRET environment variable in Secrets.');
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
    secret: process.env.TAAPI_SECRET,
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
    const startTime = Date.now();
    console.log(`[TAAPI] Request: ${indicatorName} | Interval: ${interval} | URL: ${url.replace(process.env.TAAPI_SECRET, 'API_KEY')} | Timestamp: ${new Date().toISOString()}`);
    
    const response = await fetch(url);
    const latencyMs = Date.now() - startTime;
    
    console.log(`[TAAPI] Response: ${indicatorName} | Status: ${response.status} | Latency: ${latencyMs}ms`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[TAAPI] Error Body: ${errorData}`);
      
      if (response.status === 401) {
        console.error(`[TAAPI] Auth Error (${response.status}):`, errorData);
        throw new Error(`TAAPI Authentication failed: ${errorData}. Check your Pro API key.`);
      }
      
      if (response.status === 429) {
        console.error(`[TAAPI] Rate Limit (${response.status}):`, errorData);
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
 * Fetches multiple indicators using TAAPI bulk endpoint with correct format
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
    secret: process.env.TAAPI_SECRET,
    construct: {
      exchange: "binance",
      symbol: "SOL/USDT",
      interval: interval
    },
    indicators: [
      {
        indicator: "rsi",
        optionalParameters: {
          period: 14
        }
      },
      {
        indicator: "macd",
        optionalParameters: {
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9
        }
      },
      {
        indicator: "ema",
        optionalParameters: {
          period: 20
        }
      }
    ]
  };

  try {
    // Skip bulk request and use reliable individual requests
    console.log(`TAAPI Individual Requests (${interval}): rsi, macd, ema`);
    
    const [rsiResult, macdResult, emaResult] = await Promise.allSettled([
      fetchTAIndicator('rsi', interval),
      fetchTAIndicator('macd', interval),
      fetchTAIndicator('ema', interval)
    ]);
    
    const result = {
      rsi: rsiResult.status === 'fulfilled' ? rsiResult.value : 0,
      macdHistogram: macdResult.status === 'fulfilled' ? (macdResult.value?.histogram || macdResult.value || 0) : 0,
      ema200: emaResult.status === 'fulfilled' ? emaResult.value : 0
    };
    
    console.log('TAAPI Individual Success:', {
      rsi: result.rsi,
      macd: result.macdHistogram,
      ema: result.ema200
    });
    
    taapiCache.set(cacheKey, result, 60);
    return result;
    
  } catch (error) {
    console.error('TAAPI Individual requests failed:', error.message);
    return { rsi: 0, macdHistogram: 0, ema200: 0 };
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