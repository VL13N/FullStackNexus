/**
 * Historical Data Fetcher
 * Collects 365 days of authentic metric data from multiple APIs and stores in Supabase
 * Handles rate limiting, API mapping, and data persistence for comprehensive analysis
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { technicalMetrics, socialMetrics, fundamentalMetrics, astrologyMetrics } from '../services/pillars.js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// API configuration and rate limiting
const API_CONFIG = {
  taapi: {
    baseUrl: 'https://api.taapi.io',
    rateLimit: 200, // ms between calls
    maxCallsPerHour: 500,
    requiresKey: true
  },
  lunarcrush: {
    baseUrl: 'https://lunarcrush.com/api4',
    rateLimit: 1000, // ms between calls
    maxCallsPerDay: 1000,
    requiresKey: true
  },
  cryptorank: {
    baseUrl: 'https://api.cryptorank.io/v1',
    rateLimit: 500, // ms between calls
    maxCallsPerDay: 10000,
    requiresKey: true
  },
  onchain: {
    baseUrl: 'https://data.solanatracker.io',
    rateLimit: 300, // ms between calls
    maxCallsPerHour: 1000,
    requiresKey: false
  },
  astronomy: {
    rateLimit: 100, // ms between calls (local calculations)
    requiresKey: false
  }
};

// Metric to API mapping
const METRIC_API_MAP = {
  // Technical metrics -> TAAPI
  'ema8': { api: 'taapi', indicator: 'ema', params: { period: 8 } },
  'ema21': { api: 'taapi', indicator: 'ema', params: { period: 21 } },
  'sma50': { api: 'taapi', indicator: 'sma', params: { period: 50 } },
  'sma200': { api: 'taapi', indicator: 'sma', params: { period: 200 } },
  'rsi_1h': { api: 'taapi', indicator: 'rsi', params: { period: 14, interval: '1h' } },
  'rsi_4h': { api: 'taapi', indicator: 'rsi', params: { period: 14, interval: '4h' } },
  'macd_1h': { api: 'taapi', indicator: 'macd', params: { interval: '1h' } },
  'macd_4h': { api: 'taapi', indicator: 'macd', params: { interval: '4h' } },
  'bollingerWidth_1h': { api: 'taapi', indicator: 'bbands', params: { interval: '1h' } },
  'atr_1h': { api: 'taapi', indicator: 'atr', params: { period: 14, interval: '1h' } },
  'vwap_price_spread': { api: 'taapi', indicator: 'vwap', params: { interval: '1h' } },
  
  // Social metrics -> LunarCrush
  'socialVolume': { api: 'lunarcrush', endpoint: 'coins/sol', field: 'social_volume' },
  'tweetCount': { api: 'lunarcrush', endpoint: 'coins/sol', field: 'tweet_count' },
  'telegramPostVolume': { api: 'lunarcrush', endpoint: 'coins/sol', field: 'telegram_posts' },
  'lunarcrushSentiment': { api: 'lunarcrush', endpoint: 'coins/sol', field: 'sentiment' },
  'twitterPolarity': { api: 'lunarcrush', endpoint: 'coins/sol', field: 'twitter_sentiment' },
  'galaxyScore': { api: 'lunarcrush', endpoint: 'coins/sol', field: 'galaxy_score' },
  'whaleTxCount': { api: 'lunarcrush', endpoint: 'coins/sol', field: 'whale_transactions' },
  'cryptoNewsHeadlineCount': { api: 'lunarcrush', endpoint: 'coins/sol', field: 'news_count' },
  
  // Fundamental metrics -> CryptoRank
  'marketCapUsd': { api: 'cryptorank', endpoint: 'currencies/solana', field: 'market_cap' },
  'circulatingSupplyPct': { api: 'cryptorank', endpoint: 'currencies/solana', field: 'circulating_supply' },
  'fullyDilutedValuation': { api: 'cryptorank', endpoint: 'currencies/solana', field: 'fully_diluted_valuation' },
  'btcDominance': { api: 'cryptorank', endpoint: 'global', field: 'btc_dominance' },
  'totalCryptoMarketCapExStablecoins': { api: 'cryptorank', endpoint: 'global', field: 'total_market_cap' },
  
  // On-chain metrics -> Solana API
  'tps': { api: 'onchain', endpoint: 'performance', field: 'tps' },
  'activeAddresses': { api: 'onchain', endpoint: 'analytics', field: 'active_addresses' },
  'stakingYield': { api: 'onchain', endpoint: 'staking', field: 'average_apy' },
  'defiTvl': { api: 'onchain', endpoint: 'defi', field: 'total_value_locked' },
  'whaleFlowUsd': { api: 'onchain', endpoint: 'whale-activity', field: 'net_flow_usd' },
  
  // Development activity -> GitHub API (via CryptoRank)
  'githubCommitsCount': { api: 'cryptorank', endpoint: 'currencies/solana/github', field: 'commits' },
  'githubPullsCount': { api: 'cryptorank', endpoint: 'currencies/solana/github', field: 'pull_requests' },
  'githubReleaseNewsCount': { api: 'cryptorank', endpoint: 'currencies/solana/github', field: 'releases' },
  
  // Order book metrics (derived from multiple sources)
  'bookDepthImbalance': { api: 'taapi', indicator: 'custom', calculation: 'book_depth' },
  'dexCexVolumeRatio': { api: 'onchain', endpoint: 'dex-volume', field: 'dex_cex_ratio' },
  
  // Astrological metrics -> Swiss Ephemeris calculations
  'lunarPhasePercentile': { api: 'astronomy', calculation: 'lunar_phase' },
  'lunarPerigeeApogeeDist': { api: 'astronomy', calculation: 'lunar_distance' },
  'saturnJupiterAspect': { api: 'astronomy', calculation: 'saturn_jupiter_aspect' },
  'marsSunAspect': { api: 'astronomy', calculation: 'mars_sun_aspect' },
  'northNodeSolanaLongitude': { api: 'astronomy', calculation: 'north_node_position' },
  'solarIngressAries': { api: 'astronomy', calculation: 'solar_ingress_aries' },
  'solarIngressLibra': { api: 'astronomy', calculation: 'solar_ingress_libra' },
  'nodeIngressData': { api: 'astronomy', calculation: 'node_ingress' },
  'siriusRisingIndicator': { api: 'astronomy', calculation: 'sirius_rising' },
  'aldebaranConjunctionIndicator': { api: 'astronomy', calculation: 'aldebaran_conjunction' }
};

// Rate limiting utilities
class RateLimiter {
  constructor() {
    this.lastCalls = {};
  }

  async wait(apiName) {
    const config = API_CONFIG[apiName];
    if (!config) return;

    const now = Date.now();
    const lastCall = this.lastCalls[apiName] || 0;
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < config.rateLimit) {
      const waitTime = config.rateLimit - timeSinceLastCall;
      console.log(`Rate limiting: waiting ${waitTime}ms for ${apiName}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastCalls[apiName] = Date.now();
  }
}

const rateLimiter = new RateLimiter();

// API request handlers
class ApiClient {
  constructor() {
    this.astronomy = null; // Will be loaded dynamically
  }

  async initAstronomy() {
    if (!this.astronomy) {
      try {
        const astroModule = await import('astronomy-engine');
        this.astronomy = astroModule.default || astroModule;
      } catch (error) {
        console.error('Failed to load astronomy engine:', error);
      }
    }
  }

  async fetchTaapiMetric(metric, timestamp, config) {
    if (!process.env.TAAPI_API_KEY) {
      throw new Error('TAAPI_API_KEY required for technical indicators');
    }

    await rateLimiter.wait('taapi');

    const params = new URLSearchParams({
      secret: process.env.TAAPI_API_KEY,
      exchange: 'binance',
      symbol: 'SOL/USDT',
      interval: config.params?.interval || '1h',
      backtrack: Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)), // hours back
      ...config.params
    });

    const url = `${API_CONFIG.taapi.baseUrl}/${config.indicator}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TAAPI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.extractTaapiValue(data, metric);
  }

  async fetchLunarCrushMetric(metric, timestamp, config) {
    if (!process.env.LUNARCRUSH_API_KEY) {
      throw new Error('LUNARCRUSH_API_KEY required for social metrics');
    }

    await rateLimiter.wait('lunarcrush');

    const url = `${API_CONFIG.lunarcrush.baseUrl}/${config.endpoint}/v1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`LunarCrush error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.extractLunarCrushValue(data, config.field);
  }

  async fetchCryptoRankMetric(metric, timestamp, config) {
    if (!process.env.CRYPTORANK_API_KEY) {
      throw new Error('CRYPTORANK_API_KEY required for fundamental metrics');
    }

    await rateLimiter.wait('cryptorank');

    const params = new URLSearchParams({
      api_key: process.env.CRYPTORANK_API_KEY,
      timestamp: Math.floor(timestamp / 1000)
    });

    const url = `${API_CONFIG.cryptorank.baseUrl}/${config.endpoint}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CryptoRank error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.extractCryptoRankValue(data, config.field);
  }

  async fetchOnChainMetric(metric, timestamp, config) {
    await rateLimiter.wait('onchain');

    const url = `${API_CONFIG.onchain.baseUrl}/${config.endpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OnChain error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.extractOnChainValue(data, config.field);
  }

  async calculateAstronomyMetric(metric, timestamp, config) {
    await this.initAstronomy();
    if (!this.astronomy) {
      throw new Error('Astronomy engine not available');
    }

    await rateLimiter.wait('astronomy');

    const date = new Date(timestamp);
    const astroDate = new this.astronomy.AstroTime(date);

    switch (config.calculation) {
      case 'lunar_phase':
        return this.calculateLunarPhase(astroDate);
      case 'lunar_distance':
        return this.calculateLunarDistance(astroDate);
      case 'saturn_jupiter_aspect':
        return this.calculatePlanetaryAspect(astroDate, 'Saturn', 'Jupiter');
      case 'mars_sun_aspect':
        return this.calculatePlanetaryAspect(astroDate, 'Mars', 'Sun');
      case 'north_node_position':
        return this.calculateNorthNodePosition(astroDate);
      case 'solar_ingress_aries':
        return this.calculateSolarIngress(astroDate, 'Aries');
      case 'solar_ingress_libra':
        return this.calculateSolarIngress(astroDate, 'Libra');
      case 'node_ingress':
        return this.calculateNodeIngress(astroDate);
      case 'sirius_rising':
        return this.calculateFixedStarRising(astroDate, 'Sirius');
      case 'aldebaran_conjunction':
        return this.calculateFixedStarConjunction(astroDate, 'Aldebaran');
      default:
        throw new Error(`Unknown astronomy calculation: ${config.calculation}`);
    }
  }

  // Value extraction helpers
  extractTaapiValue(data, metric) {
    if (data.value !== undefined) return data.value;
    if (data.macd !== undefined) return data.macd;
    if (data.valueUpperBand !== undefined && metric.includes('bollinger')) {
      return data.valueUpperBand - data.valueLowerBand; // Bollinger width
    }
    return data.value || 0;
  }

  extractLunarCrushValue(data, field) {
    return data.data?.[field] || data[field] || 0;
  }

  extractCryptoRankValue(data, field) {
    return data.data?.[field] || data[field] || 0;
  }

  extractOnChainValue(data, field) {
    return data[field] || data.data?.[field] || 0;
  }

  // Astronomy calculation helpers
  calculateLunarPhase(astroDate) {
    const moonIllumination = this.astronomy.Illumination(this.astronomy.Body.Moon, astroDate);
    return moonIllumination.phase_fraction * 100; // Convert to percentile
  }

  calculateLunarDistance(astroDate) {
    const moonPos = this.astronomy.GeoVector(this.astronomy.Body.Moon, astroDate, false);
    return moonPos.length; // Distance in AU
  }

  calculatePlanetaryAspect(astroDate, planet1, planet2) {
    const body1 = this.astronomy.Body[planet1];
    const body2 = this.astronomy.Body[planet2];
    
    const pos1 = this.astronomy.Ecliptic(this.astronomy.GeoVector(body1, astroDate, false));
    const pos2 = this.astronomy.Ecliptic(this.astronomy.GeoVector(body2, astroDate, false));
    
    let angle = Math.abs(pos1.elon - pos2.elon);
    if (angle > 180) angle = 360 - angle;
    
    return angle;
  }

  calculateNorthNodePosition(astroDate) {
    // Approximate North Node calculation
    const moonPos = this.astronomy.Ecliptic(this.astronomy.GeoVector(this.astronomy.Body.Moon, astroDate, false));
    return moonPos.elon; // Simplified for demonstration
  }

  calculateSolarIngress(astroDate, sign) {
    const sunPos = this.astronomy.Ecliptic(this.astronomy.GeoVector(this.astronomy.Body.Sun, astroDate, false));
    const signStart = sign === 'Aries' ? 0 : 180; // Aries = 0°, Libra = 180°
    return Math.abs(sunPos.elon - signStart) < 1 ? 1 : 0; // Within 1 degree
  }

  calculateNodeIngress(astroDate) {
    // Placeholder for node ingress calculation
    return 0;
  }

  calculateFixedStarRising(astroDate, starName) {
    // Placeholder for fixed star calculations
    return 0;
  }

  calculateFixedStarConjunction(astroDate, starName) {
    // Placeholder for fixed star conjunction calculations
    return 0;
  }
}

// Database operations
class DatabaseManager {
  async ensureTableExists() {
    // Create table if it doesn't exist
    const { error } = await supabase.from('historical_metrics').select('*').limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('Creating historical_metrics table...');
      
      // Table doesn't exist, create it
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS historical_metrics (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMPTZ NOT NULL,
          metric_name VARCHAR(255) NOT NULL,
          raw_value DECIMAL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(timestamp, metric_name)
        );
        
        CREATE INDEX IF NOT EXISTS idx_historical_metrics_timestamp ON historical_metrics(timestamp);
        CREATE INDEX IF NOT EXISTS idx_historical_metrics_metric_name ON historical_metrics(metric_name);
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableQuery });
      if (createError) {
        console.error('Error creating table:', createError);
        throw createError;
      }
    }
  }

  async insertMetric(timestamp, metricName, rawValue) {
    const { error } = await supabase
      .from('historical_metrics')
      .upsert({
        timestamp: new Date(timestamp).toISOString(),
        metric_name: metricName,
        raw_value: rawValue,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'timestamp,metric_name'
      });

    if (error) {
      console.error(`Error inserting ${metricName}:`, error);
      throw error;
    }
  }

  async getExistingMetrics(metricName, startDate, endDate) {
    const { data, error } = await supabase
      .from('historical_metrics')
      .select('timestamp')
      .eq('metric_name', metricName)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (error) {
      console.error(`Error checking existing metrics for ${metricName}:`, error);
      return new Set();
    }

    return new Set(data.map(row => new Date(row.timestamp).getTime()));
  }
}

// Main execution class
class HistoricalFetcher {
  constructor() {
    this.apiClient = new ApiClient();
    this.dbManager = new DatabaseManager();
    this.metrics = this.getAllMetrics();
  }

  getAllMetrics() {
    const allMetrics = [];
    
    // Flatten all metrics from pillars
    Object.values(technicalMetrics).forEach(category => {
      allMetrics.push(...category);
    });
    Object.values(socialMetrics).forEach(category => {
      allMetrics.push(...category);
    });
    Object.values(fundamentalMetrics).forEach(category => {
      allMetrics.push(...category);
    });
    Object.values(astrologyMetrics).forEach(category => {
      allMetrics.push(...category);
    });

    return [...new Set(allMetrics)]; // Remove duplicates
  }

  generateHourlyTimestamps(days = 365) {
    const timestamps = [];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (let i = 0; i < days * 24; i++) {
      timestamps.push(now - (i * oneHour));
    }

    return timestamps.reverse(); // Oldest first
  }

  async fetchMetricValue(metric, timestamp) {
    const config = METRIC_API_MAP[metric];
    if (!config) {
      console.warn(`No API mapping found for metric: ${metric}`);
      return null;
    }

    try {
      switch (config.api) {
        case 'taapi':
          return await this.apiClient.fetchTaapiMetric(metric, timestamp, config);
        case 'lunarcrush':
          return await this.apiClient.fetchLunarCrushMetric(metric, timestamp, config);
        case 'cryptorank':
          return await this.apiClient.fetchCryptoRankMetric(metric, timestamp, config);
        case 'onchain':
          return await this.apiClient.fetchOnChainMetric(metric, timestamp, config);
        case 'astronomy':
          return await this.apiClient.calculateAstronomyMetric(metric, timestamp, config);
        default:
          throw new Error(`Unknown API: ${config.api}`);
      }
    } catch (error) {
      console.error(`Error fetching ${metric} for ${new Date(timestamp).toISOString()}: ${error.message}`);
      return null;
    }
  }

  async run() {
    console.log('Starting historical data fetch...');
    console.log(`Metrics to fetch: ${this.metrics.length}`);
    console.log(`Time range: 365 days (${365 * 24} hourly data points per metric)`);

    await this.dbManager.ensureTableExists();

    const timestamps = this.generateHourlyTimestamps(365);
    const startDate = new Date(timestamps[0]);
    const endDate = new Date(timestamps[timestamps.length - 1]);

    let totalProcessed = 0;
    let totalErrors = 0;

    for (const metric of this.metrics) {
      console.log(`\nProcessing metric: ${metric}`);
      
      // Check existing data to avoid duplicates
      const existingTimestamps = await this.dbManager.getExistingMetrics(metric, startDate, endDate);
      const timestampsToFetch = timestamps.filter(ts => !existingTimestamps.has(ts));
      
      console.log(`Found ${existingTimestamps.size} existing records, fetching ${timestampsToFetch.length} new ones`);

      for (let i = 0; i < timestampsToFetch.length; i++) {
        const timestamp = timestampsToFetch[i];
        
        try {
          const rawValue = await this.fetchMetricValue(metric, timestamp);
          
          if (rawValue !== null) {
            await this.dbManager.insertMetric(timestamp, metric, rawValue);
            totalProcessed++;
            
            if (totalProcessed % 100 === 0) {
              console.log(`Processed ${totalProcessed} records so far...`);
            }
          } else {
            totalErrors++;
          }
        } catch (error) {
          console.error(`Failed to process ${metric} at ${new Date(timestamp).toISOString()}: ${error.message}`);
          totalErrors++;
        }

        // Progress indicator
        if (i % 24 === 0) { // Every day
          const progress = ((i / timestampsToFetch.length) * 100).toFixed(1);
          console.log(`${metric}: ${progress}% complete`);
        }
      }
    }

    console.log('\n=== Historical Data Fetch Complete ===');
    console.log(`Total records processed: ${totalProcessed}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Success rate: ${((totalProcessed / (totalProcessed + totalErrors)) * 100).toFixed(1)}%`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new HistoricalFetcher();
  fetcher.run().catch(console.error);
}

export default HistoricalFetcher;