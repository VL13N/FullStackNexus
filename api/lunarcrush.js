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
    
    // Build URL based on endpoint type - either path-based or query-based
    let url;
    if (endpoint.startsWith('/')) {
      // Path-based endpoint like /coins/sol/v1
      url = `${this.baseUrl}${endpoint}?key=${this.apiKey}`;
    } else {
      // Legacy query-based endpoint
      url = `${this.baseUrl}?${endpoint}&key=${this.apiKey}`;
    }
    
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
          // Log status and full response for non-200 responses
          const responseText = await response.text();
          console.error(`LunarCrush API Error - Status: ${response.status}, Response: ${responseText}`);
          
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
          throw new Error(`HTTP ${response.status}: ${responseText}`);
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
      const response = await this.makeRequest('/coins/sol/v1');
      return { valid: true, message: 'API key is valid' };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  /**
   * Get Solana social metrics using v1 endpoint with graceful fallback
   * @param {string} symbol - Cryptocurrency symbol (default: SOL)
   */
  async getSolanaMetrics(symbol = 'SOL') {
    try {
      // Use the correct v1 endpoint: /coins/sol/v1
      const data = await this.makeRequest(`/coins/${symbol.toLowerCase()}/v1`);
      
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
          galaxy_score: coinData.galaxy_score || coinData.gs || null,
          alt_rank: coinData.alt_rank || coinData.acr || null,
          social_volume: coinData.social_volume || coinData.sv || null,
          social_score: coinData.social_score || coinData.ss || null,
          social_contributors: coinData.social_contributors || coinData.sc || null,
          social_dominance: coinData.social_dominance || coinData.sd || null,
          market_dominance: coinData.market_dominance || coinData.md || null,
          correlation_rank: coinData.correlation_rank || coinData.cr || null,
          volatility: coinData.volatility || null,
          timestamp: new Date().toISOString(),
          raw: coinData
        };
        
        return result;
      }
      
      throw new Error('No data found for Solana');
    } catch (error) {
      console.warn('LunarCrush API connection failed, switching to CoinGecko community data:', error.message);
      
      // Use authentic CoinGecko community data as replacement
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/solana?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false');
        
        if (response.ok) {
          const data = await response.json();
          const communityData = data.community_data || {};
          const marketData = data.market_data || {};
          
          // Map CoinGecko community metrics to LunarCrush format
          const socialVolume = (communityData.reddit_average_posts_48h || 0) + (communityData.reddit_average_comments_48h || 0);
          const socialScore = data.sentiment_votes_up_percentage ? data.sentiment_votes_up_percentage / 100 : null;
          
          return {
            symbol: symbol,
            name: data.name || 'Solana',
            price: marketData.current_price?.usd || null,
            priceChange24h: marketData.price_change_percentage_24h || null,
            volume24h: marketData.total_volume?.usd || null,
            marketCap: marketData.market_cap?.usd || null,
            galaxy_score: data.community_score || null,
            alt_rank: data.market_cap_rank || null,
            social_volume: socialVolume > 0 ? socialVolume : null,
            social_score: socialScore,
            social_contributors: communityData.reddit_subscribers || null,
            social_dominance: data.public_interest_score || null,
            market_dominance: null,
            correlation_rank: null,
            volatility: Math.abs(marketData.price_change_percentage_24h || 0) / 100,
            twitter_followers: communityData.twitter_followers || null,
            reddit_subscribers: communityData.reddit_subscribers || null,
            telegram_users: communityData.telegram_channel_user_count || null,
            timestamp: new Date().toISOString(),
            source: 'coingecko_community',
            status: 'authentic_community_data'
          };
        }
      } catch (cgError) {
        console.warn('CoinGecko community data also failed:', cgError.message);
      }
      
      // Only return null data if all authentic sources fail
      return {
        symbol: symbol,
        name: 'Solana',
        price: null,
        priceChange24h: null,
        volume24h: null,
        marketCap: null,
        galaxy_score: null,
        alt_rank: null,
        social_volume: null,
        social_score: null,
        social_contributors: null,
        social_dominance: null,
        market_dominance: null,
        correlation_rank: null,
        volatility: null,
        timestamp: new Date().toISOString(),
        error: 'All authentic social data sources temporarily unavailable'
      };
    }
  }

  /**
   * Get Solana news using v1 topic endpoint
   */
  async getSolanaNews(limit = 10) {
    try {
      // Use the correct v1 endpoint: /topic/solana/news/v1
      const data = await this.makeRequest(`/topic/solana/news/v1?limit=${limit}`);
      
      if (data.data && Array.isArray(data.data)) {
        return {
          symbol: 'SOL',
          topic: 'solana',
          news: data.data.map(article => ({
            id: article.id,
            title: article.title,
            url: article.url,
            time: article.time,
            sentiment: article.sentiment,
            interactions: article.interactions,
            type: article.type,
            source: article.source
          })),
          timestamp: new Date().toISOString()
        };
      }
      
      throw new Error('No news data found for Solana');
    } catch (error) {
      console.warn('LunarCrush news API unavailable:', error.message);
      return {
        symbol: 'SOL',
        topic: 'solana',
        news: [],
        timestamp: new Date().toISOString(),
        error: 'News data temporarily unavailable'
      };
    }
  }

  /**
   * Get detailed social metrics for Solana using v1 coins endpoint
   */
  async getSolanaSocialMetrics() {
    try {
      // Use the correct v1 endpoint: /coins/sol/v1
      const data = await this.makeRequest('/coins/sol/v1');
      
      if (data.data || data) {
        const solana = data.data || data;
        
        return {
          symbol: 'SOL',
          name: 'Solana',
          socialMetrics: {
            galaxyScore: {
              value: solana.galaxy_score || solana.gs,
              description: 'Galaxy Score™ - Overall health and performance metric'
            },
            altRank: {
              value: solana.alt_rank || solana.acr,
              description: 'AltRank™ - Alternative ranking based on social activity'
            },
            socialVolume: {
              value: solana.social_volume || solana.sv,
              description: 'Total social media mentions and discussions'
            },
            socialScore: {
              value: solana.social_score || solana.ss,
              description: 'Social engagement and sentiment score'
            },
            socialContributors: {
              value: solana.social_contributors || solana.sc,
              description: 'Number of unique social contributors'
            },
            socialDominance: {
              value: solana.social_dominance || solana.sd,
              description: 'Social dominance compared to other cryptocurrencies'
            }
          },
          marketMetrics: {
            price: solana.price || solana.p,
            priceChange24h: solana.percent_change_24h || solana.pc,
            volume24h: solana.volume_24h || solana.v,
            marketCap: solana.market_cap || solana.mc,
            marketDominance: solana.market_dominance || solana.md,
            correlationRank: solana.correlation_rank || solana.cr,
            volatility: solana.volatility
          },
          timestamp: new Date().toISOString()
        };
      }
      
      throw new Error('No social metrics data found for Solana');
    } catch (error) {
      console.warn('LunarCrush social metrics API unavailable:', error.message);
      return {
        symbol: 'SOL',
        name: 'Solana',
        socialMetrics: {},
        marketMetrics: {},
        timestamp: new Date().toISOString(),
        error: 'Social metrics temporarily unavailable'
      };
    }
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
   * Get time series data for Solana social metrics using v1 endpoint
   * @param {string} interval - Time interval: 1d, 1w, 1m
   * @param {number} start - Start timestamp
   * @param {number} end - End timestamp
   */
  async getSolanaTimeSeries(interval = '1d', start = null, end = null) {
    try {
      // Build time-series endpoint URL using v1 API format
      let endpoint = `data=assets&symbol=SOL`;
      if (interval) endpoint += `&interval=${interval}`;
      if (start) endpoint += `&start=${start}`;
      if (end) endpoint += `&end=${end}`;
      
      const data = await this.makeRequest(endpoint);
      
      if (data.data && data.data.length > 0) {
        return {
          symbol: 'SOL',
          interval: interval,
          data: data.data.map(point => ({
            time: point.time || point.t,
            price: point.price || point.p,
            volume: point.volume || point.v,
            galaxy_score: point.galaxy_score || point.gs,
            alt_rank: point.alt_rank || point.acr,
            social_volume: point.social_volume || point.sv,
            social_score: point.social_score || point.ss
          })),
          timestamp: new Date().toISOString()
        };
      }
      
      throw new Error('No time series data found for Solana');
    } catch (error) {
      console.warn('LunarCrush time-series API unavailable:', error.message);
      
      // Return empty data structure for graceful degradation
      return {
        symbol: 'SOL',
        interval: interval,
        data: [],
        timestamp: new Date().toISOString(),
        error: 'Time-series data temporarily unavailable'
      };
    }
  }

  /**
   * Get comprehensive Solana analysis combining all metrics
   */
  async getComprehensiveSolanaAnalysis() {
    try {
      const [socialMetrics, news, coinStats] = await Promise.allSettled([
        this.getSolanaSocialMetrics(),
        this.getSolanaNews(10),
        this.getSolanaMetrics('SOL')
      ]);

      return {
        symbol: 'SOL',
        name: 'Solana',
        socialMetrics: socialMetrics.status === 'fulfilled' ? socialMetrics.value : null,
        news: news.status === 'fulfilled' ? news.value : null,
        coinStats: coinStats.status === 'fulfilled' ? coinStats.value : null,
        errors: [
          ...(socialMetrics.status === 'rejected' ? [{ type: 'socialMetrics', error: socialMetrics.reason.message }] : []),
          ...(news.status === 'rejected' ? [{ type: 'news', error: news.reason.message }] : []),
          ...(coinStats.status === 'rejected' ? [{ type: 'coinStats', error: coinStats.reason.message }] : [])
        ],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Comprehensive analysis failed: ${error.message}`);
    }
  }

  /**
   * Get multiple cryptocurrencies comparison including Solana using v1 coins list endpoint
   * @param {Array} symbols - Array of symbols to compare (default includes SOL)
   */
  async getMultiAssetComparison(symbols = ['SOL', 'BTC', 'ETH', 'ADA', 'DOT']) {
    try {
      // Use the correct v1 endpoint: /coins/list/v1
      const data = await this.makeRequest(`/coins/list/v1?limit=100`);
      
      if (data.data && Array.isArray(data.data)) {
        // Filter for requested symbols
        const filteredAssets = data.data.filter(asset => 
          symbols.includes(asset.symbol?.toUpperCase() || asset.s?.toUpperCase())
        );
        
        return {
          comparison: filteredAssets.map(asset => ({
            symbol: asset.symbol || asset.s,
            name: asset.name || asset.n,
            price: asset.price || asset.p,
            galaxyScore: asset.galaxy_score || asset.gs,
            altRank: asset.alt_rank || asset.acr,
            socialVolume: asset.social_volume || asset.sv,
            socialScore: asset.social_score || asset.ss,
            marketCap: asset.market_cap || asset.mc
          })),
          timestamp: new Date().toISOString()
        };
      }
      
      throw new Error('No comparison data found');
    } catch (error) {
      console.warn('LunarCrush multi-asset comparison API unavailable:', error.message);
      return {
        comparison: [],
        timestamp: new Date().toISOString(),
        error: 'Comparison data temporarily unavailable'
      };
    }
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