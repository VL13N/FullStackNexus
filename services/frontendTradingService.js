// Frontend service for trading API integration

import apiService from './api';

class FrontendTradingService {
  constructor() {
    this.baseEndpoint = '/trading';
  }

  // Technical Analysis
  async getTechnicalIndicators(symbol, options = {}) {
    const { exchange = 'binance', interval = '1h', indicators } = options;
    const params = new URLSearchParams({
      exchange,
      interval,
      ...(indicators && { indicators: indicators.join(',') })
    });
    
    return apiService.get(`${this.baseEndpoint}/indicators/${symbol}?${params}`);
  }

  async getBulkIndicators(symbol, options = {}) {
    const { exchange = 'binance', interval = '1h' } = options;
    const params = new URLSearchParams({ exchange, interval });
    
    return apiService.get(`${this.baseEndpoint}/bulk/${symbol}?${params}`);
  }

  // Social Intelligence
  async getSocialMetrics(symbol) {
    return apiService.get(`${this.baseEndpoint}/social/${symbol}`);
  }

  async getInfluencers(symbol, limit = 10) {
    const params = new URLSearchParams({ limit: limit.toString() });
    return apiService.get(`${this.baseEndpoint}/influencers/${symbol}?${params}`);
  }

  // Market Data
  async getMarketData(symbol) {
    return apiService.get(`${this.baseEndpoint}/market/${symbol}`);
  }

  async getHistoricalData(symbol, options = {}) {
    const { timeframe = '1D', limit = 100 } = options;
    const params = new URLSearchParams({
      timeframe,
      limit: limit.toString()
    });
    
    return apiService.get(`${this.baseEndpoint}/historical/${symbol}?${params}`);
  }

  async getMarketList(options = {}) {
    const { limit = 100, sortBy = 'rank' } = options;
    const params = new URLSearchParams({
      limit: limit.toString(),
      sortBy
    });
    
    return apiService.get(`${this.baseEndpoint}/markets?${params}`);
  }

  // Complete Analysis
  async getCompleteAnalysis(symbol, exchange = 'binance') {
    const params = new URLSearchParams({ exchange });
    return apiService.get(`${this.baseEndpoint}/analysis/${symbol}?${params}`);
  }

  // AI-Powered Analysis
  async getAIAnalysis(marketData, symbol) {
    return apiService.post(`${this.baseEndpoint}/ai-analysis`, {
      marketData,
      symbol
    });
  }

  async generateTradingStrategy(symbol, timeframe, riskTolerance = 'medium') {
    return apiService.post(`${this.baseEndpoint}/strategy`, {
      symbol,
      timeframe,
      riskTolerance
    });
  }

  async getPricePrediction(historicalData, technicalIndicators, symbol) {
    return apiService.post(`${this.baseEndpoint}/price-prediction`, {
      historicalData,
      technicalIndicators,
      symbol
    });
  }

  // Combined data fetching
  async getComprehensiveData(symbol, options = {}) {
    const { exchange = 'binance', includeAI = false } = options;
    
    try {
      // Fetch all data in parallel
      const [
        technical,
        social,
        market,
        historical
      ] = await Promise.allSettled([
        this.getBulkIndicators(symbol, { exchange }),
        this.getSocialMetrics(symbol),
        this.getMarketData(symbol),
        this.getHistoricalData(symbol, { limit: 50 })
      ]);

      const results = {
        symbol,
        timestamp: new Date().toISOString(),
        technical: technical.status === 'fulfilled' ? technical.value : null,
        social: social.status === 'fulfilled' ? social.value : null,
        market: market.status === 'fulfilled' ? market.value : null,
        historical: historical.status === 'fulfilled' ? historical.value : null,
        errors: []
      };

      // Collect any errors
      if (technical.status === 'rejected') results.errors.push({ type: 'technical', error: technical.reason });
      if (social.status === 'rejected') results.errors.push({ type: 'social', error: social.reason });
      if (market.status === 'rejected') results.errors.push({ type: 'market', error: market.reason });
      if (historical.status === 'rejected') results.errors.push({ type: 'historical', error: historical.reason });

      // Optional AI analysis
      if (includeAI && results.technical && results.social && results.market) {
        try {
          const aiAnalysis = await this.getAIAnalysis({
            technical: results.technical.data,
            social: results.social.data,
            market: results.market.data
          }, symbol);
          results.aiAnalysis = aiAnalysis;
        } catch (error) {
          results.errors.push({ type: 'ai', error: error.message });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to fetch comprehensive data: ${error.message}`);
    }
  }

  // Real-time data subscription simulation
  startRealTimeData(symbol, callback, interval = 30000) {
    const fetchData = async () => {
      try {
        const data = await this.getBulkIndicators(symbol);
        callback(null, data);
      } catch (error) {
        callback(error, null);
      }
    };

    // Initial fetch
    fetchData();

    // Set up interval
    const intervalId = setInterval(fetchData, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Price alert checker
  checkPriceAlert(currentPrice, alert) {
    const { type, targetPrice, symbol } = alert;
    
    switch (type) {
      case 'above':
        return currentPrice >= targetPrice;
      case 'below':
        return currentPrice <= targetPrice;
      case 'change':
        const changePercent = ((currentPrice - alert.basePrice) / alert.basePrice) * 100;
        return Math.abs(changePercent) >= alert.threshold;
      default:
        return false;
    }
  }
}

export default new FrontendTradingService();