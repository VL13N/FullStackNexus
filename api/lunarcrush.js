/**
 * LunarCrush API Integration for Solana Social Metrics
 * Fetches Galaxy Score™, AltRank™, and social volume data
 */
class LunarCrushService {
  constructor() {
    // LunarCrush v1 API for Discover plan compatibility
    this.baseUrl = 'https://api.lunarcrush.com/v1';
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
   * Makes authenticated request to LunarCrush v1 endpoint with retry logic
   */
  async makeRequest(endpoint, maxRetries = 3) {
    this.validateApiKey();
    
    const url = `${this.baseUrl}/${endpoint}?key=${this.apiKey}`;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`LunarCrush v1 API Request (attempt ${attempt}): ${endpoint}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CryptoAnalytics/1.0'
          },
          timeout: 15000
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit - exponential backoff
            const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
            console.warn(`LunarCrush rate limited, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          if (response.status >= 500) {
            // Server error - retry with backoff
            const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.warn(`LunarCrush server error ${response.status}, retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // Client error - don't retry
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log(`LunarCrush v1 API Success: ${endpoint}`);
        return data;
        
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`LunarCrush API failed after ${maxRetries} attempts:`, error.message);
          throw error;
        }
        
        // Network error - retry with exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`LunarCrush network error, retrying in ${waitTime}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Check API key validity by making a test request
   */
  async validateApiKeyConnection() {
    try {
      const response = await this.makeRequest('coins/SOL');
      return { valid: true, message: 'API key is valid' };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  /**
   * Get Solana social metrics using v1 endpoint
   * @param {string} symbol - Cryptocurrency symbol (default: SOL)
   */
  async getSolanaMetrics(symbol = 'SOL') {
    const data = await this.makeRequest(`coins/${symbol}`);
    
    // LunarCrush v1 API response structure
    const coinData = data.data || data;
    
    if (coinData) {
      const result = {
        symbol: coinData.symbol || coinData.s || symbol,
        name: coinData.name || coinData.n || 'Solana',
        price: coinData.price || coinData.p || null,
        priceChange24h: coinData.percent_change_24h || coinData.pc || null,
        volume24h: coinData.volume_24h || coinData.v || null,
        marketCap: coinData.market_cap || coinData.mc || null,
        galaxyScore: coinData.galaxy_score || coinData.gs || null,
        altRank: coinData.alt_rank || coinData.acr || null,
        socialVolume: coinData.social_volume || coinData.sv || null,
        socialScore: coinData.social_score || coinData.ss || null,
        socialContributors: coinData.social_contributors || coinData.sc || null,
        socialDominance: coinData.social_dominance || coinData.sd || null,
        marketDominance: coinData.market_dominance || coinData.md || null,
        correlationRank: coinData.correlation_rank || coinData.cr || null,
        volatility: coinData.volatility || null,
        timestamp: new Date().toISOString(),
        raw: coinData
      };
      
      return result;
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

export { LunarCrushService };
export default new LunarCrushService();