const express = require('express');

/**
 * TAAPI Pro Technical Analysis Integration
 * Fetches real-time technical indicators for cryptocurrency trading
 */
class TaapiService {
  constructor() {
    this.baseUrl = 'https://api.taapi.io';
    this.apiKey = process.env.TAAPI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('TAAPI_API_KEY not found in environment variables');
    }
  }

  /**
   * Validates API key availability
   */
  validateApiKey() {
    if (!this.apiKey) {
      throw new Error('TAAPI API key not configured. Please set TAAPI_API_KEY environment variable.');
    }
  }

  /**
   * Makes authenticated request to TAAPI endpoint
   */
  async makeRequest(indicator, params = {}) {
    this.validateApiKey();
    
    const queryParams = new URLSearchParams({
      secret: this.apiKey,
      ...params
    });

    const url = `${this.baseUrl}/${indicator}?${queryParams}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error(`TAAPI ${indicator} request failed:`, error.message);
      throw error;
    }
  }

  /**
   * Fetches RSI (Relative Strength Index) for Solana
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   * @param {number} period - RSI period (default: 14)
   */
  async getRSI(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', period = 14) {
    return this.makeRequest('rsi', {
      exchange,
      symbol,
      interval,
      period: period.toString()
    });
  }

  /**
   * Fetches MACD (Moving Average Convergence Divergence) for Solana
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   * @param {number} fastPeriod - Fast EMA period (default: 12)
   * @param {number} slowPeriod - Slow EMA period (default: 26)
   * @param {number} signalPeriod - Signal line period (default: 9)
   */
  async getMACD(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', 
                fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    return this.makeRequest('macd', {
      exchange,
      symbol,
      interval,
      fast_period: fastPeriod.toString(),
      slow_period: slowPeriod.toString(),
      signal_period: signalPeriod.toString()
    });
  }

  /**
   * Fetches EMA (Exponential Moving Average) for Solana
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   * @param {number} period - EMA period (default: 20)
   */
  async getEMA(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', period = 20) {
    return this.makeRequest('ema', {
      exchange,
      symbol,
      interval,
      period: period.toString()
    });
  }

  /**
   * Fetches SMA (Simple Moving Average) for Solana
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   * @param {number} period - SMA period (default: 20)
   */
  async getSMA(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', period = 20) {
    return this.makeRequest('sma', {
      exchange,
      symbol,
      interval,
      period: period.toString()
    });
  }

  /**
   * Fetches Bollinger Bands for Solana
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   * @param {number} period - Period for calculation (default: 20)
   * @param {number} stdDev - Standard deviation multiplier (default: 2)
   */
  async getBollingerBands(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', 
                          period = 20, stdDev = 2) {
    return this.makeRequest('bbands', {
      exchange,
      symbol,
      interval,
      period: period.toString(),
      stddev: stdDev.toString()
    });
  }

  /**
   * Fetches Stochastic RSI for Solana
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   * @param {number} rsiPeriod - RSI period (default: 14)
   * @param {number} stochPeriod - Stochastic period (default: 14)
   * @param {number} kPeriod - K period (default: 3)
   * @param {number} dPeriod - D period (default: 3)
   */
  async getStochasticRSI(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h',
                         rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) {
    return this.makeRequest('stochrsi', {
      exchange,
      symbol,
      interval,
      rsi_period: rsiPeriod.toString(),
      stoch_period: stochPeriod.toString(),
      k_period: kPeriod.toString(),
      d_period: dPeriod.toString()
    });
  }

  /**
   * Fetches Williams %R indicator for Solana
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   * @param {number} period - Period for calculation (default: 14)
   */
  async getWilliamsR(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', period = 14) {
    return this.makeRequest('willr', {
      exchange,
      symbol,
      interval,
      period: period.toString()
    });
  }

  /**
   * Fetches multiple indicators in a single request for efficiency
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   * @param {Array} indicators - Array of indicator names to fetch
   */
  async getBulkIndicators(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h', 
                          indicators = ['rsi', 'macd', 'ema', 'sma']) {
    this.validateApiKey();
    
    const indicatorParams = indicators.join(',');
    const queryParams = new URLSearchParams({
      secret: this.apiKey,
      exchange,
      symbol,
      interval,
      indicators: indicatorParams
    });

    const url = `${this.baseUrl}/bulk?${queryParams}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error('TAAPI bulk request failed:', error.message);
      throw error;
    }
  }

  /**
   * Comprehensive Solana technical analysis
   * Fetches all major indicators in optimized bulk requests
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} interval - Time interval (default: 1h)
   */
  async getSolanaAnalysis(exchange = 'binance', interval = '1h') {
    const symbol = 'SOL/USDT';
    
    try {
      // Fetch primary indicators in bulk
      const primaryIndicators = await this.getBulkIndicators(
        exchange, symbol, interval,
        ['rsi', 'macd', 'ema', 'sma', 'bbands']
      );

      // Fetch additional indicators
      const [stochRsi, williamsR] = await Promise.allSettled([
        this.getStochasticRSI(exchange, symbol, interval),
        this.getWilliamsR(exchange, symbol, interval)
      ]);

      return {
        symbol,
        exchange,
        interval,
        timestamp: new Date().toISOString(),
        primary: primaryIndicators,
        additional: {
          stochRsi: stochRsi.status === 'fulfilled' ? stochRsi.value : null,
          williamsR: williamsR.status === 'fulfilled' ? williamsR.value : null
        },
        errors: [
          ...(stochRsi.status === 'rejected' ? [{ indicator: 'stochRsi', error: stochRsi.reason.message }] : []),
          ...(williamsR.status === 'rejected' ? [{ indicator: 'williamsR', error: williamsR.reason.message }] : [])
        ]
      };
    } catch (error) {
      throw new Error(`Solana analysis failed: ${error.message}`);
    }
  }

  /**
   * Gets current price and volume data for Solana
   * @param {string} exchange - Trading exchange (default: binance)
   * @param {string} symbol - Trading pair (default: SOL/USDT)
   * @param {string} interval - Time interval (default: 1h)
   */
  async getPriceData(exchange = 'binance', symbol = 'SOL/USDT', interval = '1h') {
    return this.makeRequest('price', {
      exchange,
      symbol,
      interval
    });
  }

  /**
   * Advanced analysis with custom parameters
   * @param {Object} config - Configuration object with analysis parameters
   */
  async getCustomAnalysis(config = {}) {
    const {
      exchange = 'binance',
      symbol = 'SOL/USDT',
      interval = '1h',
      rsiPeriod = 14,
      emaPeriod = 20,
      smaPeriod = 50,
      macdFast = 12,
      macdSlow = 26,
      macdSignal = 9
    } = config;

    try {
      const [rsi, ema, sma, macd] = await Promise.allSettled([
        this.getRSI(exchange, symbol, interval, rsiPeriod),
        this.getEMA(exchange, symbol, interval, emaPeriod),
        this.getSMA(exchange, symbol, interval, smaPeriod),
        this.getMACD(exchange, symbol, interval, macdFast, macdSlow, macdSignal)
      ]);

      return {
        symbol,
        exchange,
        interval,
        timestamp: new Date().toISOString(),
        config,
        indicators: {
          rsi: rsi.status === 'fulfilled' ? rsi.value : null,
          ema: ema.status === 'fulfilled' ? ema.value : null,
          sma: sma.status === 'fulfilled' ? sma.value : null,
          macd: macd.status === 'fulfilled' ? macd.value : null
        },
        errors: [
          ...(rsi.status === 'rejected' ? [{ indicator: 'rsi', error: rsi.reason.message }] : []),
          ...(ema.status === 'rejected' ? [{ indicator: 'ema', error: ema.reason.message }] : []),
          ...(sma.status === 'rejected' ? [{ indicator: 'sma', error: sma.reason.message }] : []),
          ...(macd.status === 'rejected' ? [{ indicator: 'macd', error: macd.reason.message }] : [])
        ]
      };
    } catch (error) {
      throw new Error(`Custom analysis failed: ${error.message}`);
    }
  }
}

// Create singleton instance
const taapiService = new TaapiService();

module.exports = {
  TaapiService,
  taapiService
};