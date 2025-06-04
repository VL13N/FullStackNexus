/**
 * CryptoRank API Integration for Solana Fundamental Data
 * Fetches market cap, 24h volume, and historical prices
 */
class CryptoRankService {
  constructor() {
    this.baseUrl = 'https://api.cryptorank.io/v0';
    this.apiKey = process.env.CRYPTORANK_API_KEY;
    
    if (!this.apiKey) {
      console.warn('CRYPTORANK_API_KEY not found in environment variables');
    }
  }

  /**
   * Validates API key availability
   */
  validateApiKey() {
    if (!this.apiKey) {
      throw new Error('CryptoRank API key not configured. Please set CRYPTORANK_API_KEY environment variable.');
    }
  }

  /**
   * Makes authenticated request to CryptoRank endpoint
   */
  async makeRequest(endpoint, params = {}) {
    this.validateApiKey();
    
    const queryParams = new URLSearchParams({
      api_key: this.apiKey,
      ...params
    });

    const url = `${this.baseUrl}${endpoint}?${queryParams}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('CryptoRank API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Get Solana fundamental data including market cap, volume, and price data
   */
  async getSolanaData() {
    const data = await this.makeRequest('/coins/solana');
    
    if (data.data) {
      const solana = data.data;
      
      return {
        id: solana.id,
        symbol: solana.symbol,
        name: solana.name,
        slug: solana.slug,
        category: solana.category,
        description: solana.description,
        currentPrice: {
          usd: solana.values?.USD?.price || null,
          btc: solana.values?.BTC?.price || null,
          eth: solana.values?.ETH?.price || null
        },
        marketCap: {
          usd: solana.values?.USD?.marketCap || null,
          rank: solana.values?.USD?.marketCapRank || null
        },
        volume24h: {
          usd: solana.values?.USD?.volume24h || null
        },
        priceChange: {
          percent1h: solana.values?.USD?.percentChange1h || null,
          percent24h: solana.values?.USD?.percentChange24h || null,
          percent7d: solana.values?.USD?.percentChange7d || null,
          percent30d: solana.values?.USD?.percentChange30d || null,
          percent1y: solana.values?.USD?.percentChange1y || null
        },
        supply: {
          circulating: solana.circulatingSupply || null,
          total: solana.totalSupply || null,
          max: solana.maxSupply || null
        },
        allTimeHigh: {
          price: solana.values?.USD?.athPrice || null,
          date: solana.values?.USD?.athDate || null,
          percentFromAth: solana.values?.USD?.percentFromAth || null
        },
        allTimeLow: {
          price: solana.values?.USD?.atlPrice || null,
          date: solana.values?.USD?.atlDate || null,
          percentFromAtl: solana.values?.USD?.percentFromAtl || null
        },
        links: {
          website: solana.links?.website || null,
          explorer: solana.links?.explorer || null,
          github: solana.links?.sourceCode || null,
          twitter: solana.links?.twitter || null,
          telegram: solana.links?.telegram || null,
          discord: solana.links?.discord || null,
          reddit: solana.links?.reddit || null
        },
        lastUpdated: solana.lastUpdated || new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No data found for Solana');
  }

  /**
   * Get historical price data for Solana
   * @param {string} timeframe - Time period: 1d, 7d, 30d, 90d, 180d, 1y, max
   * @param {string} currency - Currency: USD, BTC, ETH (default: USD)
   */
  async getSolanaHistoricalPrices(timeframe = '30d', currency = 'USD') {
    const endpoint = '/coins/solana/chart';
    const params = {
      timeframe,
      currency
    };

    const data = await this.makeRequest(endpoint, params);
    
    if (data.data) {
      return {
        symbol: 'SOL',
        currency,
        timeframe,
        prices: data.data.map(point => ({
          timestamp: point.timestamp,
          date: new Date(point.timestamp * 1000).toISOString(),
          price: point.price,
          volume: point.volume || null,
          marketCap: point.marketCap || null
        })),
        metadata: {
          totalPoints: data.data.length,
          startDate: data.data.length > 0 ? new Date(data.data[0].timestamp * 1000).toISOString() : null,
          endDate: data.data.length > 0 ? new Date(data.data[data.data.length - 1].timestamp * 1000).toISOString() : null
        },
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No historical data found for Solana');
  }

  /**
   * Get Solana market statistics and metrics
   */
  async getSolanaMarketStats() {
    const data = await this.makeRequest('/coins/solana');
    
    if (data.data) {
      const solana = data.data;
      
      return {
        symbol: 'SOL',
        name: 'Solana',
        marketMetrics: {
          rank: solana.values?.USD?.marketCapRank || null,
          marketCap: solana.values?.USD?.marketCap || null,
          volume24h: solana.values?.USD?.volume24h || null,
          volumeMarketCapRatio: solana.values?.USD?.volume24h && solana.values?.USD?.marketCap ? 
            (solana.values.USD.volume24h / solana.values.USD.marketCap) : null,
          circulatingSupply: solana.circulatingSupply || null,
          totalSupply: solana.totalSupply || null,
          maxSupply: solana.maxSupply || null,
          supplyPercentage: solana.circulatingSupply && solana.totalSupply ? 
            (solana.circulatingSupply / solana.totalSupply * 100) : null
        },
        priceMetrics: {
          currentPrice: solana.values?.USD?.price || null,
          athPrice: solana.values?.USD?.athPrice || null,
          athDate: solana.values?.USD?.athDate || null,
          percentFromAth: solana.values?.USD?.percentFromAth || null,
          atlPrice: solana.values?.USD?.atlPrice || null,
          atlDate: solana.values?.USD?.atlDate || null,
          percentFromAtl: solana.values?.USD?.percentFromAtl || null
        },
        performanceMetrics: {
          change1h: solana.values?.USD?.percentChange1h || null,
          change24h: solana.values?.USD?.percentChange24h || null,
          change7d: solana.values?.USD?.percentChange7d || null,
          change30d: solana.values?.USD?.percentChange30d || null,
          change1y: solana.values?.USD?.percentChange1y || null
        },
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No market statistics found for Solana');
  }

  /**
   * Get multiple cryptocurrencies data for comparison
   * @param {Array} symbols - Array of symbols to compare (default includes SOL)
   */
  async getMultiCoinComparison(symbols = ['solana', 'bitcoin', 'ethereum', 'cardano', 'polkadot']) {
    const symbolsParam = symbols.join(',');
    const data = await this.makeRequest('/coins', { symbols: symbolsParam });
    
    if (data.data) {
      return {
        comparison: data.data.map(coin => ({
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          rank: coin.values?.USD?.marketCapRank || null,
          price: coin.values?.USD?.price || null,
          marketCap: coin.values?.USD?.marketCap || null,
          volume24h: coin.values?.USD?.volume24h || null,
          change24h: coin.values?.USD?.percentChange24h || null,
          change7d: coin.values?.USD?.percentChange7d || null
        })),
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No comparison data found');
  }

  /**
   * Get market overview with top cryptocurrencies
   * @param {number} limit - Number of coins to return (default: 100)
   */
  async getMarketOverview(limit = 100) {
    const data = await this.makeRequest('/coins', { limit: limit.toString() });
    
    if (data.data) {
      const solanaData = data.data.find(coin => coin.symbol === 'SOL');
      
      return {
        marketOverview: data.data.slice(0, 20).map(coin => ({
          rank: coin.values?.USD?.marketCapRank || null,
          symbol: coin.symbol,
          name: coin.name,
          price: coin.values?.USD?.price || null,
          marketCap: coin.values?.USD?.marketCap || null,
          volume24h: coin.values?.USD?.volume24h || null,
          change24h: coin.values?.USD?.percentChange24h || null
        })),
        solanaPosition: solanaData ? {
          rank: solanaData.values?.USD?.marketCapRank || null,
          data: {
            symbol: solanaData.symbol,
            name: solanaData.name,
            price: solanaData.values?.USD?.price || null,
            marketCap: solanaData.values?.USD?.marketCap || null,
            volume24h: solanaData.values?.USD?.volume24h || null,
            change24h: solanaData.values?.USD?.percentChange24h || null
          }
        } : null,
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No market overview data found');
  }

  /**
   * Get comprehensive Solana analysis combining all fundamental data
   */
  async getComprehensiveSolanaAnalysis() {
    try {
      const [fundamentalData, marketStats, historicalData] = await Promise.allSettled([
        this.getSolanaData(),
        this.getSolanaMarketStats(),
        this.getSolanaHistoricalPrices('7d')
      ]);

      return {
        symbol: 'SOL',
        name: 'Solana',
        fundamentalData: fundamentalData.status === 'fulfilled' ? fundamentalData.value : null,
        marketStats: marketStats.status === 'fulfilled' ? marketStats.value : null,
        recentPriceHistory: historicalData.status === 'fulfilled' ? historicalData.value : null,
        errors: [
          ...(fundamentalData.status === 'rejected' ? [{ type: 'fundamentalData', error: fundamentalData.reason.message }] : []),
          ...(marketStats.status === 'rejected' ? [{ type: 'marketStats', error: marketStats.reason.message }] : []),
          ...(historicalData.status === 'rejected' ? [{ type: 'historicalData', error: historicalData.reason.message }] : [])
        ],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Comprehensive analysis failed: ${error.message}`);
    }
  }

  /**
   * Get real-time price data for Solana
   */
  async getSolanaRealTimePrice() {
    const data = await this.makeRequest('/coins/solana');
    
    if (data.data) {
      const solana = data.data;
      
      return {
        symbol: 'SOL',
        name: 'Solana',
        prices: {
          usd: solana.values?.USD?.price || null,
          btc: solana.values?.BTC?.price || null,
          eth: solana.values?.ETH?.price || null
        },
        changes: {
          percent1h: solana.values?.USD?.percentChange1h || null,
          percent24h: solana.values?.USD?.percentChange24h || null,
          percent7d: solana.values?.USD?.percentChange7d || null
        },
        volume: {
          usd24h: solana.values?.USD?.volume24h || null
        },
        marketCap: {
          usd: solana.values?.USD?.marketCap || null,
          rank: solana.values?.USD?.marketCapRank || null
        },
        lastUpdated: solana.lastUpdated || new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No real-time price data found for Solana');
  }
}

// Create singleton instance
const cryptoRankService = new CryptoRankService();

module.exports = {
  CryptoRankService,
  cryptoRankService
};