/**
 * LunarCrush API Integration for Solana Social Metrics
 * Fetches Galaxy Score™, AltRank™, and social volume data
 */
class LunarCrushService {
  constructor() {
    this.baseUrl = 'https://api.lunarcrush.com/v4';
    this.apiKey = process.env.LUNARCRUSH_API_KEY;
    
    if (!this.apiKey) {
      console.warn('LUNARCRUSH_API_KEY not found in environment variables');
    }
  }

  /**
   * Validates API key availability
   */
  validateApiKey() {
    if (!this.apiKey) {
      throw new Error('LunarCrush API key not configured. Please set LUNARCRUSH_API_KEY environment variable.');
    }
  }

  /**
   * Makes authenticated request to LunarCrush endpoint
   */
  async makeRequest(params = {}) {
    this.validateApiKey();
    
    const queryParams = new URLSearchParams({
      key: this.apiKey,
      ...params
    });

    const url = `${this.baseUrl}?${queryParams}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('LunarCrush API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Get Solana social metrics including Galaxy Score™, AltRank™, and social volume
   * @param {string} symbol - Cryptocurrency symbol (default: SOL)
   * @param {string} interval - Time interval: 1d, 1w, 1m (default: 1d)
   */
  async getSolanaMetrics(symbol = 'SOL', interval = '1d') {
    const params = {
      data: 'assets',
      symbol: symbol,
      interval: interval
    };

    const data = await this.makeRequest(params);
    
    if (data.data && data.data.length > 0) {
      const solanaData = data.data[0]; // First result should be SOL
      
      return {
        symbol: solanaData.s || symbol,
        name: solanaData.n || 'Solana',
        price: solanaData.p || null,
        priceChange24h: solanaData.pc || null,
        volume24h: solanaData.v || null,
        marketCap: solanaData.mc || null,
        galaxyScore: solanaData.gs || null,
        altRank: solanaData.acr || null,
        socialVolume: solanaData.sv || null,
        socialScore: solanaData.ss || null,
        socialContributors: solanaData.sc || null,
        socialDominance: solanaData.sd || null,
        marketDominance: solanaData.md || null,
        correlationRank: solanaData.cr || null,
        volatility: solanaData.volatility || null,
        timestamp: new Date().toISOString(),
        raw: solanaData
      };
    }
    
    throw new Error('No data found for Solana');
  }

  /**
   * Get detailed social metrics for Solana
   */
  async getSolanaSocialMetrics() {
    const params = {
      data: 'assets',
      symbol: 'SOL'
    };

    const data = await this.makeRequest(params);
    
    if (data.data && data.data.length > 0) {
      const solana = data.data[0];
      
      return {
        symbol: 'SOL',
        name: 'Solana',
        socialMetrics: {
          galaxyScore: {
            value: solana.gs,
            description: 'Galaxy Score™ - Overall health and performance metric'
          },
          altRank: {
            value: solana.acr,
            description: 'AltRank™ - Alternative ranking based on social activity'
          },
          socialVolume: {
            value: solana.sv,
            description: 'Total social media mentions and discussions'
          },
          socialScore: {
            value: solana.ss,
            description: 'Social engagement and sentiment score'
          },
          socialContributors: {
            value: solana.sc,
            description: 'Number of unique social contributors'
          },
          socialDominance: {
            value: solana.sd,
            description: 'Social dominance compared to other cryptocurrencies'
          }
        },
        marketMetrics: {
          price: solana.p,
          priceChange24h: solana.pc,
          volume24h: solana.v,
          marketCap: solana.mc,
          marketDominance: solana.md,
          correlationRank: solana.cr,
          volatility: solana.volatility
        },
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No social metrics data found for Solana');
  }

  /**
   * Get influencer activity for Solana
   * @param {number} limit - Number of influencers to return (default: 10)
   */
  async getSolanaInfluencers(limit = 10) {
    const params = {
      data: 'influencers',
      symbol: 'SOL',
      limit: limit.toString()
    };

    const data = await this.makeRequest(params);
    
    if (data.data) {
      return {
        symbol: 'SOL',
        influencers: data.data.map(influencer => ({
          name: influencer.n,
          username: influencer.u,
          followers: influencer.f,
          engagementRate: influencer.er,
          posts24h: influencer.p24h,
          influence: influencer.influence,
          platform: influencer.platform
        })),
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No influencer data found for Solana');
  }

  /**
   * Get social feed for Solana
   * @param {number} limit - Number of posts to return (default: 20)
   */
  async getSolanaFeed(limit = 20) {
    const params = {
      data: 'feeds',
      symbol: 'SOL',
      limit: limit.toString()
    };

    const data = await this.makeRequest(params);
    
    if (data.data) {
      return {
        symbol: 'SOL',
        posts: data.data.map(post => ({
          id: post.id,
          title: post.title,
          url: post.url,
          time: post.time,
          sentiment: post.sentiment,
          interactions: post.interactions,
          spam: post.spam,
          type: post.type
        })),
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No social feed data found for Solana');
  }

  /**
   * Get time series data for Solana social metrics
   * @param {string} interval - Time interval: 1d, 1w, 1m
   * @param {number} start - Start timestamp
   * @param {number} end - End timestamp
   */
  async getSolanaTimeSeries(interval = '1d', start = null, end = null) {
    const params = {
      data: 'assets',
      symbol: 'SOL',
      interval: interval
    };

    if (start) params.start = start.toString();
    if (end) params.end = end.toString();

    const data = await this.makeRequest(params);
    
    if (data.data && data.data.length > 0) {
      return {
        symbol: 'SOL',
        interval: interval,
        timeSeries: data.data.map(point => ({
          time: point.time || point.t,
          price: point.p,
          volume: point.v,
          galaxyScore: point.gs,
          altRank: point.acr,
          socialVolume: point.sv,
          socialScore: point.ss
        })),
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No time series data found for Solana');
  }

  /**
   * Get comprehensive Solana analysis combining all metrics
   */
  async getComprehensiveSolanaAnalysis() {
    try {
      const [socialMetrics, influencers, feed] = await Promise.allSettled([
        this.getSolanaSocialMetrics(),
        this.getSolanaInfluencers(5),
        this.getSolanaFeed(10)
      ]);

      return {
        symbol: 'SOL',
        name: 'Solana',
        socialMetrics: socialMetrics.status === 'fulfilled' ? socialMetrics.value : null,
        topInfluencers: influencers.status === 'fulfilled' ? influencers.value : null,
        recentFeed: feed.status === 'fulfilled' ? feed.value : null,
        errors: [
          ...(socialMetrics.status === 'rejected' ? [{ type: 'socialMetrics', error: socialMetrics.reason.message }] : []),
          ...(influencers.status === 'rejected' ? [{ type: 'influencers', error: influencers.reason.message }] : []),
          ...(feed.status === 'rejected' ? [{ type: 'feed', error: feed.reason.message }] : [])
        ],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Comprehensive analysis failed: ${error.message}`);
    }
  }

  /**
   * Get multiple cryptocurrencies comparison including Solana
   * @param {Array} symbols - Array of symbols to compare (default includes SOL)
   */
  async getMultiAssetComparison(symbols = ['SOL', 'BTC', 'ETH', 'ADA', 'DOT']) {
    const params = {
      data: 'assets',
      symbol: symbols.join(',')
    };

    const data = await this.makeRequest(params);
    
    if (data.data) {
      return {
        comparison: data.data.map(asset => ({
          symbol: asset.s,
          name: asset.n,
          price: asset.p,
          galaxyScore: asset.gs,
          altRank: asset.acr,
          socialVolume: asset.sv,
          socialScore: asset.ss,
          marketCap: asset.mc
        })),
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No comparison data found');
  }

  /**
   * Get market overview with Solana highlighted
   */
  async getMarketOverview() {
    const params = {
      data: 'market',
      limit: '50'
    };

    const data = await this.makeRequest(params);
    
    if (data.data) {
      const solanaData = data.data.find(asset => asset.s === 'SOL');
      
      return {
        marketOverview: data.data.slice(0, 10), // Top 10 assets
        solanaPosition: solanaData ? {
          rank: data.data.findIndex(asset => asset.s === 'SOL') + 1,
          data: solanaData
        } : null,
        timestamp: new Date().toISOString()
      };
    }
    
    throw new Error('No market overview data found');
  }
}

// Create singleton instance
const lunarCrushService = new LunarCrushService();

module.exports = {
  LunarCrushService,
  lunarCrushService
};