// Trading and Market Data API Services

class TradingApiService {
  constructor() {
    this.taapiKey = process.env.TAAPI_API_KEY;
    this.lunarcrushKey = process.env.LUNARCRUSH_API_KEY;
    this.cryptorankKey = process.env.CRYPTORANK_API_KEY;
  }

  // TAAPI Technical Analysis API
  async getTechnicalIndicators(symbol, exchange = 'binance', interval = '1h', indicators = ['rsi', 'macd', 'sma']) {
    if (!this.taapiKey) throw new Error('TAAPI API key not configured');
    
    try {
      const requests = indicators.map(indicator => {
        const params = new URLSearchParams({
          secret: this.taapiKey,
          exchange,
          symbol,
          interval,
          ...(indicator === 'sma' && { period: '20' })
        });
        
        return fetch(`https://api.taapi.io/${indicator}?${params}`)
          .then(res => res.json())
          .then(data => ({ indicator, data }));
      });

      const results = await Promise.all(requests);
      return results.reduce((acc, { indicator, data }) => {
        acc[indicator] = data;
        return acc;
      }, {});
    } catch (error) {
      console.error('TAAPI API error:', error);
      throw error;
    }
  }

  async getBulkIndicators(symbol, exchange = 'binance', interval = '1h') {
    if (!this.taapiKey) throw new Error('TAAPI API key not configured');
    
    try {
      const params = new URLSearchParams({
        secret: this.taapiKey,
        exchange,
        symbol,
        interval,
        indicators: 'rsi,macd,sma,ema,bbands,stochrsi'
      });

      const response = await fetch(`https://api.taapi.io/bulk?${params}`);
      return await response.json();
    } catch (error) {
      console.error('TAAPI bulk API error:', error);
      throw error;
    }
  }

  // LunarCrush Social Intelligence API
  async getSocialMetrics(symbol) {
    if (!this.lunarcrushKey) throw new Error('LunarCrush API key not configured');
    
    try {
      const params = new URLSearchParams({
        data: 'assets',
        key: this.lunarcrushKey,
        symbol
      });

      const response = await fetch(`https://api.lunarcrush.com/v2?${params}`);
      const data = await response.json();
      return data.data?.[0] || null;
    } catch (error) {
      console.error('LunarCrush API error:', error);
      throw error;
    }
  }

  async getInfluencerData(symbol, limit = 10) {
    if (!this.lunarcrushKey) throw new Error('LunarCrush API key not configured');
    
    try {
      const params = new URLSearchParams({
        data: 'influencers',
        key: this.lunarcrushKey,
        symbol,
        limit: limit.toString()
      });

      const response = await fetch(`https://api.lunarcrush.com/v2?${params}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('LunarCrush influencer API error:', error);
      throw error;
    }
  }

  async getSocialFeed(symbol, limit = 20) {
    if (!this.lunarcrushKey) throw new Error('LunarCrush API key not configured');
    
    try {
      const params = new URLSearchParams({
        data: 'feeds',
        key: this.lunarcrushKey,
        symbol,
        limit: limit.toString()
      });

      const response = await fetch(`https://api.lunarcrush.com/v2?${params}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('LunarCrush feed API error:', error);
      throw error;
    }
  }

  // CryptoRank Market Data API
  async getCoinData(symbol) {
    if (!this.cryptorankKey) throw new Error('CryptoRank API key not configured');
    
    try {
      const response = await fetch(`https://api.cryptorank.io/v1/currencies/${symbol}`, {
        headers: {
          'X-API-KEY': this.cryptorankKey
        }
      });
      return await response.json();
    } catch (error) {
      console.error('CryptoRank API error:', error);
      throw error;
    }
  }

  async getMarketData(limit = 100, sortBy = 'rank') {
    if (!this.cryptorankKey) throw new Error('CryptoRank API key not configured');
    
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        sortBy
      });

      const response = await fetch(`https://api.cryptorank.io/v1/currencies?${params}`, {
        headers: {
          'X-API-KEY': this.cryptorankKey
        }
      });
      return await response.json();
    } catch (error) {
      console.error('CryptoRank market data API error:', error);
      throw error;
    }
  }

  async getHistoricalData(symbol, timeframe = '1D', limit = 100) {
    if (!this.cryptorankKey) throw new Error('CryptoRank API key not configured');
    
    try {
      const params = new URLSearchParams({
        timeframe,
        limit: limit.toString()
      });

      const response = await fetch(`https://api.cryptorank.io/v1/currencies/${symbol}/chart?${params}`, {
        headers: {
          'X-API-KEY': this.cryptorankKey
        }
      });
      return await response.json();
    } catch (error) {
      console.error('CryptoRank historical data API error:', error);
      throw error;
    }
  }

  // Combined market analysis
  async getCompleteAnalysis(symbol, exchange = 'binance') {
    try {
      const [technical, social, market] = await Promise.allSettled([
        this.getTechnicalIndicators(symbol, exchange),
        this.getSocialMetrics(symbol),
        this.getCoinData(symbol)
      ]);

      return {
        symbol,
        timestamp: new Date().toISOString(),
        technical: technical.status === 'fulfilled' ? technical.value : null,
        social: social.status === 'fulfilled' ? social.value : null,
        market: market.status === 'fulfilled' ? market.value : null,
        errors: [
          ...(technical.status === 'rejected' ? [{ type: 'technical', error: technical.reason.message }] : []),
          ...(social.status === 'rejected' ? [{ type: 'social', error: social.reason.message }] : []),
          ...(market.status === 'rejected' ? [{ type: 'market', error: market.reason.message }] : [])
        ]
      };
    } catch (error) {
      console.error('Complete analysis error:', error);
      throw error;
    }
  }
}

export default new TradingApiService();