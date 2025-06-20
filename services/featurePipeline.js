/**
 * Feature Pipeline for ML Training Dataset Generation
 * Generates normalized features from TAAPI, LunarCrush, CryptoRank, and Astrology
 * Stores derived features in Supabase for training data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase credentials - feature storage will be disabled');
}

class FeaturePipeline {
  constructor() {
    this.supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? 
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
    this.cache = new Map();
    this.featureWeights = {
      technical: 0.25,
      social: 0.20,
      fundamental: 0.20,
      astrology: 0.15,
      sentiment: 0.20
    };
  }

  /**
   * Generate complete feature vector from all data sources
   */
  async generateFeatureVector(symbol = 'SOL') {
    console.log(`🔄 Generating feature vector for ${symbol}...`);
    
    try {
      // Fetch raw data from all sources including sentiment
      const [technicalData, socialData, fundamentalData, astrologyData, sentimentData] = await Promise.allSettled([
        this.fetchTechnicalFeatures(symbol),
        this.fetchSocialFeatures(symbol),
        this.fetchFundamentalFeatures(symbol),
        this.fetchAstrologyFeatures(),
        this.fetchSentimentFeatures()
      ]);

      // Extract successful results
      const features = {
        technical: technicalData.status === 'fulfilled' ? technicalData.value : {},
        social: socialData.status === 'fulfilled' ? socialData.value : {},
        fundamental: fundamentalData.status === 'fulfilled' ? fundamentalData.value : {},
        astrology: astrologyData.status === 'fulfilled' ? astrologyData.value : {},
        sentiment: sentimentData.status === 'fulfilled' ? sentimentData.value : {},
        timestamp: new Date().toISOString(),
        symbol: symbol
      };

      // Generate normalized feature vector
      const normalizedFeatures = await this.normalizeFeatures(features);
      
      // Store in database
      const storedFeatures = await this.storeFeatureVector(normalizedFeatures);
      
      console.log(`✅ Feature vector generated and stored for ${symbol}`);
      return storedFeatures;

    } catch (error) {
      console.error('Feature vector generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Fetch and normalize technical indicators from TAAPI
   */
  async fetchTechnicalFeatures(symbol) {
    const { TaapiService } = await import('../api/taapi.js');
    const taapi = new TaapiService();

    try {
      // Fetch multiple timeframes for better feature diversity
      const [hourly, fourHourly, daily] = await Promise.allSettled([
        taapi.getSolanaAnalysis('binance', '1h'),
        taapi.getSolanaAnalysis('binance', '4h'),
        taapi.getSolanaAnalysis('binance', '1d')
      ]);

      const features = {
        // RSI features (momentum)
        rsi_1h: hourly.status === 'fulfilled' ? hourly.value.rsi : null,
        rsi_4h: fourHourly.status === 'fulfilled' ? fourHourly.value.rsi : null,
        rsi_1d: daily.status === 'fulfilled' ? daily.value.rsi : null,
        
        // MACD features (trend)
        macd_histogram_1h: hourly.status === 'fulfilled' ? hourly.value.macd?.histogram : null,
        macd_signal_1h: hourly.status === 'fulfilled' ? hourly.value.macd?.signal : null,
        macd_line_1h: hourly.status === 'fulfilled' ? hourly.value.macd?.macd : null,
        
        // Moving averages (trend)
        ema_20_1h: hourly.status === 'fulfilled' ? hourly.value.ema_20 : null,
        sma_50_1h: hourly.status === 'fulfilled' ? hourly.value.sma_50 : null,
        ema_200_1d: daily.status === 'fulfilled' ? daily.value.ema_200 : null,
        
        // Volatility indicators
        atr_1h: hourly.status === 'fulfilled' ? hourly.value.atr : null,
        atr_1d: daily.status === 'fulfilled' ? daily.value.atr : null,
        
        // Bollinger Bands
        bb_upper_1h: hourly.status === 'fulfilled' ? hourly.value.bollinger?.upper : null,
        bb_middle_1h: hourly.status === 'fulfilled' ? hourly.value.bollinger?.middle : null,
        bb_lower_1h: hourly.status === 'fulfilled' ? hourly.value.bollinger?.lower : null,
        
        // Stochastic features
        stoch_k: hourly.status === 'fulfilled' ? hourly.value.stochastic?.k : null,
        stoch_d: hourly.status === 'fulfilled' ? hourly.value.stochastic?.d : null,
        
        // Williams %R
        williams_r: hourly.status === 'fulfilled' ? hourly.value.williams_r : null
      };

      return this.calculateTechnicalDerivedFeatures(features);

    } catch (error) {
      console.warn('Technical features fetch failed:', error.message);
      return {};
    }
  }

  /**
   * Calculate derived technical features
   */
  calculateTechnicalDerivedFeatures(raw) {
    const derived = { ...raw };

    // RSI divergence and momentum
    if (raw.rsi_1h && raw.rsi_4h) {
      derived.rsi_divergence = raw.rsi_1h - raw.rsi_4h;
      derived.rsi_momentum = (raw.rsi_1h > 70) ? 1 : (raw.rsi_1h < 30) ? -1 : 0;
    }

    // MACD signal strength
    if (raw.macd_histogram_1h && raw.macd_signal_1h) {
      derived.macd_signal_strength = Math.abs(raw.macd_histogram_1h / (raw.macd_signal_1h || 1));
      derived.macd_bullish = raw.macd_histogram_1h > 0 ? 1 : 0;
    }

    // Moving average trend
    if (raw.ema_20_1h && raw.sma_50_1h) {
      derived.ma_trend = raw.ema_20_1h > raw.sma_50_1h ? 1 : -1;
    }

    // Bollinger Band position
    if (raw.bb_upper_1h && raw.bb_lower_1h && raw.bb_middle_1h) {
      const current_price = raw.bb_middle_1h; // Approximation
      derived.bb_position = (current_price - raw.bb_lower_1h) / (raw.bb_upper_1h - raw.bb_lower_1h);
      derived.bb_squeeze = (raw.bb_upper_1h - raw.bb_lower_1h) / raw.bb_middle_1h;
    }

    // Volatility regime
    if (raw.atr_1h && raw.atr_1d) {
      derived.volatility_regime = raw.atr_1h / raw.atr_1d;
    }

    return derived;
  }

  /**
   * Fetch social sentiment features from LunarCrush
   */
  async fetchSocialFeatures(symbol) {
    const { LunarCrushService } = await import('../api/lunarcrush.js');
    const lunarCrush = new LunarCrushService();

    try {
      const [metrics, timeSeries] = await Promise.allSettled([
        lunarCrush.getSolanaMetrics(),
        lunarCrush.getSolanaTimeSeries('1d')
      ]);

      const current = metrics.status === 'fulfilled' ? metrics.value : {};
      const historical = timeSeries.status === 'fulfilled' ? timeSeries.value : {};

      return {
        // Galaxy Score and AltRank
        galaxy_score: current.galaxy_score,
        alt_rank: current.alt_rank,
        
        // Social volume metrics
        social_volume: current.social_volume,
        social_volume_24h_change: current.social_volume_change,
        
        // Sentiment indicators
        sentiment_score: current.sentiment,
        bullish_sentiment: current.bullish_sentiment,
        bearish_sentiment: current.bearish_sentiment,
        
        // Social engagement
        social_contributors: current.social_contributors,
        social_posts: current.social_posts,
        social_interactions: current.social_interactions,
        
        // Derived social features
        social_momentum: this.calculateSocialMomentum(historical.data || []),
        sentiment_volatility: this.calculateSentimentVolatility(historical.data || []),
        social_trend: this.calculateSocialTrend(historical.data || [])
      };

    } catch (error) {
      console.warn('LunarCrush API temporarily unavailable:', error.message);
      
      // Return default social metrics that maintain system stability
      // These represent neutral market sentiment when external data is unavailable
      return {
        galaxy_score: null,
        alt_rank: null,
        social_volume: null,
        social_volume_24h_change: null,
        sentiment_score: null,
        bullish_sentiment: null,
        bearish_sentiment: null,
        social_contributors: null,
        social_posts: null,
        social_interactions: null,
        social_momentum: 0, // Neutral momentum
        sentiment_volatility: 0, // Low volatility assumption
        social_trend: 0 // Neutral trend
      };
    }
  }

  /**
   * Fetch fundamental market features from CryptoRank V2 and market sentiment APIs
   */
  async fetchFundamentalFeatures(symbol) {
    const { 
      fetchGlobalStats, 
      fetchSolanaData, 
      fetchSolanaSparkline,
      CryptoRankV2Service 
    } = await import('./cryptoRankService.js');
    
    const service = new CryptoRankV2Service();

    try {
      const [globalData, solanaData, sparklineData, sentimentData] = await Promise.allSettled([
        fetchGlobalStats(),
        fetchSolanaData(),
        fetchSolanaSparkline(), // Uses corrected from/to timestamps
        this.fetchMarketSentiment()
      ]);

      const global = globalData.status === 'fulfilled' ? globalData.value.data : {};
      const solana = solanaData.status === 'fulfilled' ? solanaData.value.data : {};
      const sparkline = sparklineData.status === 'fulfilled' ? sparklineData.value : {};
      const sentiment = sentimentData.status === 'fulfilled' ? sentimentData.value : {};

      return {
        // Solana price and market metrics from CryptoRank V2
        current_price: parseFloat(solana.price || 0),
        market_cap: parseFloat(solana.marketCap || 0),
        volume_24h: parseFloat(solana.volume24h || 0),
        
        // Price changes from CryptoRank V2 percentChange
        price_change_24h: parseFloat(solana.percentChange?.h24 || 0),
        price_change_7d: parseFloat(solana.percentChange?.d7 || 0),
        price_change_30d: parseFloat(solana.percentChange?.d30 || 0),
        
        // Market metrics from CryptoRank V2
        market_cap_rank: parseInt(solana.rank || 0),
        circulating_supply: parseFloat(solana.circulatingSupply || 0),
        total_supply: parseFloat(solana.totalSupply || 0),
        high_24h: parseFloat(solana.high24h || 0),
        low_24h: parseFloat(solana.low24h || 0),
        
        // Global market sentiment from CryptoRank V2
        btc_dominance: parseFloat(global.btcDominance || 0),
        eth_dominance: parseFloat(global.ethDominance || 0),
        total_market_cap: parseFloat(global.totalMarketCap || 0),
        total_24h_volume: parseFloat(global.totalVolume24h || 0),
        
        // Fear & Greed Index
        fear_greed_index: sentiment.fearGreedIndex || 50,
        
        // Sparkline features for trend analysis
        sparkline_trend: this.calculateSparklineTrend(sparkline.values || []),
        sparkline_volatility: this.calculateSparklineVolatility(sparkline.values || []),
        
        // Derived fundamental features
        volume_price_ratio: (parseFloat(solana.volume24h || 0)) / (parseFloat(solana.price || 1)),
        price_volatility: this.calculatePriceVolatility([
          parseFloat(solana.percentChange?.h24 || 0),
          parseFloat(solana.percentChange?.d7 || 0),
          parseFloat(solana.percentChange?.d30 || 0)
        ]),
        momentum_score: this.calculateMomentumScore(solana),
        market_strength: this.calculateMarketStrength(solana, global),
        sentiment_score: this.calculateSentimentScore(sentiment)
      };

    } catch (error) {
      console.warn('Fundamental features fetch failed:', error.message);
      return {};
    }
  }

  /**
   * Fetch astrological features with fallback calculations
   */
  async fetchAstrologyFeatures() {
    try {
      // Use direct calculation approach to avoid ES module issues
      const currentDate = new Date();
      const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      
      // Calculate moon phase using simplified astronomy
      const moonPhase = this.calculateMoonPhase(currentDate);
      const moonIllumination = Math.abs(Math.cos(moonPhase * Math.PI));
      const moonAge = moonPhase * 29.5;
      
      // Calculate planetary positions using simplified ephemeris
      const planetaryPositions = this.calculatePlanetaryPositions(currentDate);
      
      return {
        // Moon phase features
        moon_phase: moonPhase,
        moon_illumination: moonIllumination,
        moon_age_days: moonAge,
        
        // Planetary positions (simplified degrees in zodiac)
        mercury_position: planetaryPositions.mercury,
        venus_position: planetaryPositions.venus,
        mars_position: planetaryPositions.mars,
        jupiter_position: planetaryPositions.jupiter,
        saturn_position: planetaryPositions.saturn,
        
        // Calculated aspects and influences
        total_aspects: this.calculateTotalAspects(planetaryPositions),
        major_aspects: this.calculateMajorAspects(planetaryPositions),
        
        // Market-relevant astrological features
        mercury_retrograde: this.calculateMercuryRetrograde(currentDate),
        financial_planets_strength: this.calculateFinancialPlanetsStrength(planetaryPositions),
        lunar_market_influence: this.calculateLunarMarketInfluence({ phase: moonPhase, illumination: moonIllumination }),
        planetary_volatility_indicator: this.calculatePlanetaryVolatility(planetaryPositions)
      };

    } catch (error) {
      console.warn('Astrology features calculation failed:', error.message);
      return this.getDefaultAstrologyFeatures();
    }
  }

  /**
   * Simplified moon phase calculation
   */
  calculateMoonPhase(date) {
    const knownNewMoon = new Date('2000-01-06T12:24:00Z'); // Known new moon
    const synodicMonth = 29.530588853; // Average synodic month in days
    const daysSinceKnownNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = (daysSinceKnownNewMoon / synodicMonth) % 1;
    return phase < 0 ? phase + 1 : phase;
  }

  /**
   * Simplified planetary position calculation
   */
  calculatePlanetaryPositions(date) {
    const daysSince2000 = (date - new Date('2000-01-01')) / (1000 * 60 * 60 * 24);
    
    return {
      mercury: (daysSince2000 * 4.0923) % 360,
      venus: (daysSince2000 * 1.6021) % 360,
      mars: (daysSince2000 * 0.5240) % 360,
      jupiter: (daysSince2000 * 0.0831) % 360,
      saturn: (daysSince2000 * 0.0334) % 360
    };
  }

  /**
   * Calculate total planetary aspects
   */
  calculateTotalAspects(positions) {
    const planets = Object.values(positions);
    let aspectCount = 0;
    
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const angle = Math.abs(planets[i] - planets[j]);
        const normalizedAngle = Math.min(angle, 360 - angle);
        
        // Count major aspects (conjunction, opposition, trine, square, sextile)
        if (this.isAspect(normalizedAngle)) {
          aspectCount++;
        }
      }
    }
    
    return aspectCount;
  }

  /**
   * Calculate major aspects count
   */
  calculateMajorAspects(positions) {
    const planets = Object.values(positions);
    let majorAspectCount = 0;
    
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const angle = Math.abs(planets[i] - planets[j]);
        const normalizedAngle = Math.min(angle, 360 - angle);
        
        // Major aspects: 0°, 60°, 90°, 120°, 180° (±8° orb)
        if (this.isMajorAspect(normalizedAngle)) {
          majorAspectCount++;
        }
      }
    }
    
    return majorAspectCount;
  }

  /**
   * Check if angle forms an aspect
   */
  isAspect(angle) {
    const aspects = [0, 30, 45, 60, 90, 120, 135, 150, 180];
    const orb = 8;
    
    return aspects.some(aspect => Math.abs(angle - aspect) <= orb);
  }

  /**
   * Check if angle forms a major aspect
   */
  isMajorAspect(angle) {
    const majorAspects = [0, 60, 90, 120, 180];
    const orb = 8;
    
    return majorAspects.some(aspect => Math.abs(angle - aspect) <= orb);
  }

  /**
   * Calculate Mercury retrograde indicator
   */
  calculateMercuryRetrograde(date) {
    // Simplified retrograde calculation - Mercury goes retrograde ~3 times per year
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const retrogradePhases = [
      { start: 30, end: 53 },   // Late Jan - Early Mar
      { start: 140, end: 163 }, // Late May - Early Jun
      { start: 250, end: 273 }  // Early Sep - Late Sep
    ];
    
    return retrogradePhases.some(phase => dayOfYear >= phase.start && dayOfYear <= phase.end) ? 1 : 0;
  }

  /**
   * Get default astrology features when calculation fails
   */
  getDefaultAstrologyFeatures() {
    return {
      moon_phase: 0.5,
      moon_illumination: 0.5,
      moon_age_days: 14.75,
      mercury_position: 180,
      venus_position: 90,
      mars_position: 270,
      jupiter_position: 0,
      saturn_position: 120,
      total_aspects: 5,
      major_aspects: 3,
      mercury_retrograde: 0,
      financial_planets_strength: 50,
      lunar_market_influence: 50,
      planetary_volatility_indicator: 50
    };
  }

  /**
   * Fetch enriched sentiment features from news analysis
   */
  async fetchSentimentFeatures() {
    try {
      const { default: NewsSentimentService } = await import('./newsSentiment.js');
      const sentimentService = new NewsSentimentService();

      // Get current sentiment features for ML pipeline
      const sentimentFeatures = sentimentService.getSentimentFeatures();
      
      // Fetch latest news and analyze if no recent data
      if (sentimentFeatures.news_volume_24h === 0) {
        console.log('📰 No recent sentiment data, fetching fresh news analysis...');
        
        const headlines = await sentimentService.fetchSOLNews(15);
        if (headlines.length > 0) {
          const analysis = await sentimentService.analyzeBatchSentiment(headlines);
          if (analysis.success) {
            return sentimentService.getSentimentFeatures();
          }
        }
      }

      return {
        // Core sentiment metrics
        news_sentiment_24h: sentimentFeatures.news_sentiment_24h,
        news_confidence_24h: sentimentFeatures.news_confidence_24h,
        news_volume_24h: sentimentFeatures.news_volume_24h,
        sentiment_trend_6h: sentimentFeatures.sentiment_trend_6h,
        positive_news_ratio: sentimentFeatures.positive_news_ratio,
        negative_news_ratio: sentimentFeatures.negative_news_ratio,
        
        // Derived sentiment features for ML
        sentiment_strength: Math.abs(sentimentFeatures.news_sentiment_24h),
        sentiment_polarity: sentimentFeatures.news_sentiment_24h > 0 ? 1 : (sentimentFeatures.news_sentiment_24h < 0 ? -1 : 0),
        sentiment_momentum: sentimentFeatures.sentiment_trend_6h,
        news_activity_level: this.categorizeNewsActivity(sentimentFeatures.news_volume_24h),
        sentiment_consistency: this.calculateSentimentConsistency(sentimentFeatures),
        market_narrative_strength: this.calculateNarrativeStrength(sentimentFeatures)
      };

    } catch (error) {
      console.warn('Sentiment features fetch failed:', error.message);
      
      // Return neutral sentiment features when service unavailable
      return {
        news_sentiment_24h: 0,
        news_confidence_24h: 0.5,
        news_volume_24h: 0,
        sentiment_trend_6h: 0,
        positive_news_ratio: 0.33,
        negative_news_ratio: 0.33,
        sentiment_strength: 0,
        sentiment_polarity: 0,
        sentiment_momentum: 0,
        news_activity_level: 0,
        sentiment_consistency: 0.5,
        market_narrative_strength: 0
      };
    }
  }

  /**
   * Categorize news activity level (0-1 scale)
   */
  categorizeNewsActivity(volume) {
    if (volume >= 20) return 1.0;    // High activity
    if (volume >= 10) return 0.75;   // Medium-high activity
    if (volume >= 5) return 0.5;     // Medium activity
    if (volume >= 1) return 0.25;    // Low activity
    return 0;                        // No activity
  }

  /**
   * Calculate sentiment consistency score
   */
  calculateSentimentConsistency(features) {
    const { positive_news_ratio, negative_news_ratio, news_confidence_24h } = features;
    
    // Higher consistency when sentiment is clear (not mixed)
    const clarity = Math.abs(positive_news_ratio - negative_news_ratio);
    const consistency = clarity * news_confidence_24h;
    
    return Math.min(1, consistency);
  }

  /**
   * Calculate market narrative strength
   */
  calculateNarrativeStrength(features) {
    const { news_sentiment_24h, news_confidence_24h, news_volume_24h } = features;
    
    // Strong narrative = high sentiment magnitude + high confidence + adequate volume
    const sentimentMagnitude = Math.abs(news_sentiment_24h);
    const volumeWeight = Math.min(1, news_volume_24h / 10); // Normalize to 0-1
    
    return sentimentMagnitude * news_confidence_24h * volumeWeight;
  }

  /**
   * Normalize all features to 0-1 range for ML training
   */
  async normalizeFeatures(rawFeatures) {
    const normalized = {
      ...rawFeatures,
      features_normalized: {},
      feature_scores: {}
    };

    // Technical normalization (0-100 range indicators)
    const technical = rawFeatures.technical;
    normalized.features_normalized.technical = {
      rsi_1h_norm: this.normalizeRange(technical.rsi_1h, 0, 100),
      rsi_4h_norm: this.normalizeRange(technical.rsi_4h, 0, 100),
      rsi_1d_norm: this.normalizeRange(technical.rsi_1d, 0, 100),
      rsi_divergence_norm: this.normalizeRange(technical.rsi_divergence, -50, 50),
      rsi_momentum_norm: this.normalizeRange(technical.rsi_momentum, -1, 1),
      
      macd_signal_strength_norm: this.normalizeLog(technical.macd_signal_strength),
      macd_bullish_norm: technical.macd_bullish || 0,
      ma_trend_norm: this.normalizeRange(technical.ma_trend, -1, 1),
      
      bb_position_norm: this.clamp(technical.bb_position, 0, 1),
      bb_squeeze_norm: this.normalizeLog(technical.bb_squeeze),
      volatility_regime_norm: this.normalizeLog(technical.volatility_regime),
      
      stoch_k_norm: this.normalizeRange(technical.stoch_k, 0, 100),
      stoch_d_norm: this.normalizeRange(technical.stoch_d, 0, 100),
      williams_r_norm: this.normalizeRange(technical.williams_r, -100, 0)
    };

    // Social normalization
    const social = rawFeatures.social;
    normalized.features_normalized.social = {
      galaxy_score_norm: this.normalizeRange(social.galaxy_score, 0, 100),
      alt_rank_norm: this.normalizeRank(social.alt_rank, 1, 5000),
      social_volume_norm: this.normalizeLog(social.social_volume),
      sentiment_score_norm: this.normalizeRange(social.sentiment_score, -1, 1),
      bullish_sentiment_norm: this.normalizeRange(social.bullish_sentiment, 0, 1),
      social_momentum_norm: this.normalizeRange(social.social_momentum, -1, 1),
      sentiment_volatility_norm: this.normalizeLog(social.sentiment_volatility),
      social_trend_norm: this.normalizeRange(social.social_trend, -1, 1)
    };

    // Fundamental normalization
    const fundamental = rawFeatures.fundamental;
    normalized.features_normalized.fundamental = {
      price_change_1h_norm: this.normalizeRange(fundamental.price_change_1h, -20, 20),
      price_change_24h_norm: this.normalizeRange(fundamental.price_change_24h, -50, 50),
      price_change_7d_norm: this.normalizeRange(fundamental.price_change_7d, -100, 100),
      volume_price_ratio_norm: this.normalizeLog(fundamental.volume_price_ratio),
      price_volatility_norm: this.normalizeLog(fundamental.price_volatility),
      momentum_score_norm: this.normalizeRange(fundamental.momentum_score, 0, 100),
      market_strength_norm: this.normalizeRange(fundamental.market_strength, 0, 100),
      market_cap_rank_norm: this.normalizeRank(fundamental.market_cap_rank, 1, 1000),
      btc_dominance_norm: this.normalizeRange(fundamental.btc_dominance, 30, 70),
      fear_greed_index_norm: this.normalizeRange(fundamental.fear_greed_index, 0, 100),
      sentiment_score_norm: this.normalizeRange(fundamental.sentiment_score, 0, 100)
    };

    // Astrological normalization
    const astrology = rawFeatures.astrology;
    normalized.features_normalized.astrology = {
      moon_phase_norm: this.normalizeRange(astrology.moon_phase, 0, 1),
      moon_illumination_norm: this.normalizeRange(astrology.moon_illumination, 0, 1),
      moon_age_norm: this.normalizeRange(astrology.moon_age_days, 0, 29.5),
      
      mercury_position_norm: this.normalizeRange(astrology.mercury_position, 0, 360),
      venus_position_norm: this.normalizeRange(astrology.venus_position, 0, 360),
      mars_position_norm: this.normalizeRange(astrology.mars_position, 0, 360),
      
      mercury_retrograde_norm: astrology.mercury_retrograde || 0,
      financial_planets_strength_norm: this.normalizeRange(astrology.financial_planets_strength, 0, 100),
      lunar_market_influence_norm: this.normalizeRange(astrology.lunar_market_influence, 0, 100),
      planetary_volatility_norm: this.normalizeRange(astrology.planetary_volatility_indicator, 0, 100)
    };

    // Sentiment normalization (news sentiment features)
    const sentiment = rawFeatures.sentiment;
    normalized.features_normalized.sentiment = {
      news_sentiment_norm: this.normalizeRange(sentiment.news_sentiment_24h, -1, 1),
      news_confidence_norm: this.normalizeRange(sentiment.news_confidence_24h, 0, 1),
      news_volume_norm: this.normalizeLog(sentiment.news_volume_24h + 1), // +1 to handle 0 volume
      sentiment_trend_norm: this.normalizeRange(sentiment.sentiment_trend_6h, -1, 1),
      positive_ratio_norm: this.normalizeRange(sentiment.positive_news_ratio, 0, 1),
      negative_ratio_norm: this.normalizeRange(sentiment.negative_news_ratio, 0, 1),
      sentiment_strength_norm: this.normalizeRange(sentiment.sentiment_strength, 0, 1),
      sentiment_polarity_norm: this.normalizeRange(sentiment.sentiment_polarity, -1, 1),
      sentiment_momentum_norm: this.normalizeRange(sentiment.sentiment_momentum, -1, 1),
      news_activity_norm: this.normalizeRange(sentiment.news_activity_level, 0, 1),
      sentiment_consistency_norm: this.normalizeRange(sentiment.sentiment_consistency, 0, 1),
      narrative_strength_norm: this.normalizeRange(sentiment.market_narrative_strength, 0, 1)
    };

    // Calculate composite feature scores
    normalized.feature_scores = {
      technical_composite: this.calculateTechnicalComposite(normalized.features_normalized.technical),
      social_composite: this.calculateSocialComposite(normalized.features_normalized.social),
      fundamental_composite: this.calculateFundamentalComposite(normalized.features_normalized.fundamental),
      astrology_composite: this.calculateAstrologyComposite(normalized.features_normalized.astrology),
      sentiment_composite: this.calculateSentimentComposite(normalized.features_normalized.sentiment)
    };

    return normalized;
  }

  /**
   * Store feature vector in Supabase using live_predictions structure
   */
  async storeFeatureVector(features) {
    if (!this.supabase) {
      console.log('Feature storage skipped - no database connection');
      return {
        id: 'no-storage-' + Date.now(),
        ...features.feature_scores,
        timestamp: features.timestamp
      };
    }

    try {
      const featureRecord = {
        timestamp: features.timestamp,
        technical_score: features.feature_scores.technical_composite,
        social_score: features.feature_scores.social_composite,
        fundamental_score: features.feature_scores.fundamental_composite,
        astrology_score: features.feature_scores.astrology_composite,
        sentiment_score: features.feature_scores.sentiment_composite,
        overall_score: (features.feature_scores.technical_composite + 
                       features.feature_scores.social_composite + 
                       features.feature_scores.fundamental_composite + 
                       features.feature_scores.astrology_composite + 
                       features.feature_scores.sentiment_composite) / 5,
        classification: this.classifyFeatureVector(features.feature_scores),
        confidence: this.calculateDataQuality(features) / 100,
        risk_level: this.calculateDataQuality(features) > 80 ? 'Low' : 
                   this.calculateDataQuality(features) > 60 ? 'Medium' : 'High'
      };

      const { data, error } = await this.supabase
        .from('live_predictions')
        .insert(featureRecord)
        .select();

      if (error) {
        console.error('Feature storage failed:', error.message);
        return {
          id: 'storage-failed-' + Date.now(),
          ...featureRecord
        };
      }

      console.log('Feature vector stored successfully:', data[0].id);
      return {
        ...data[0],
        technical_features: features.technical,
        social_features: features.social,
        fundamental_features: features.fundamental,
        astrology_features: features.astrology,
        technical_normalized: features.features_normalized.technical,
        social_normalized: features.features_normalized.social,
        fundamental_normalized: features.features_normalized.fundamental,
        astrology_normalized: features.features_normalized.astrology,
        data_quality_score: this.calculateDataQuality(features),
        feature_completeness: this.calculateFeatureCompleteness(features)
      };

    } catch (error) {
      console.error('Feature storage error:', error.message);
      return {
        id: 'error-' + Date.now(),
        error: error.message,
        ...features.feature_scores
      };
    }
  }

  /**
   * Ensure ML features table exists
   */
  async ensureMLFeaturesTable() {
    try {
      // Test if table exists by attempting a simple query
      const { error } = await this.supabase
        .from('ml_features')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST106') {
        // Table doesn't exist, create it with minimal structure
        console.log('Creating ml_features table...');
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS ml_features (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at timestamptz DEFAULT now(),
            timestamp timestamptz NOT NULL,
            symbol text DEFAULT 'SOL',
            technical_features jsonb,
            social_features jsonb,
            fundamental_features jsonb,
            astrology_features jsonb,
            technical_normalized jsonb,
            social_normalized jsonb,
            fundamental_normalized jsonb,
            astrology_normalized jsonb,
            technical_score numeric(6,3),
            social_score numeric(6,3),
            fundamental_score numeric(6,3),
            astrology_score numeric(6,3),
            overall_score numeric(6,3),
            classification text,
            confidence numeric(6,3),
            risk_level text,
            data_quality_score numeric(6,3),
            feature_completeness numeric(6,3)
          );
        `;

        // Try to execute SQL
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/sql`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: createTableSQL })
        });

        if (!response.ok) {
          console.warn('Could not create ml_features table, will use live_predictions');
        }
      }
    } catch (error) {
      console.warn('ML features table check failed:', error.message);
    }
  }

  /**
   * Store detailed normalized features for ML training
   */
  async storeDetailedFeatures(parentId, features) {
    try {
      // Store as JSON blob for now since we can't guarantee table structure
      const detailedRecord = {
        parent_id: parentId,
        timestamp: features.timestamp,
        normalized_features: {
          technical: features.features_normalized.technical,
          social: features.features_normalized.social,
          fundamental: features.features_normalized.fundamental,
          astrology: features.features_normalized.astrology
        },
        raw_features: {
          technical: features.technical,
          social: features.social,
          fundamental: features.fundamental,
          astrology: features.astrology
        },
        quality_metrics: {
          data_quality: this.calculateDataQuality(features),
          completeness: this.calculateFeatureCompleteness(features)
        }
      };

      // Store in a simple JSON structure that can be easily created
      const { error } = await this.supabase
        .from('feature_details')
        .insert(detailedRecord);

      if (error && error.code === 'PGRST106') {
        // Table doesn't exist, that's okay - we have the main features stored
        console.log('Feature details table not available, main features stored');
      } else if (error) {
        console.warn('Failed to store detailed features:', error.message);
      }

    } catch (error) {
      console.warn('Detailed feature storage failed:', error.message);
    }
  }

  /**
   * Classify feature vector for prediction compatibility
   */
  classifyFeatureVector(scores) {
    const avgScore = (scores.technical_composite + scores.social_composite + 
                     scores.fundamental_composite + scores.astrology_composite) / 4;
    
    if (avgScore > 70) return 'BULLISH';
    if (avgScore < 30) return 'BEARISH';
    return 'NEUTRAL';
  }

  // Utility normalization functions
  normalizeRange(value, min, max) {
    if (value === null || value === undefined) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  normalizeRank(rank, minRank, maxRank) {
    if (!rank) return 0;
    return 1 - this.normalizeRange(rank, minRank, maxRank);
  }

  normalizeLog(value) {
    if (!value || value <= 0) return 0;
    return Math.min(1, Math.log10(value + 1) / 5);
  }

  clamp(value, min, max) {
    if (value === null || value === undefined) return 0;
    return Math.max(min, Math.min(max, value));
  }

  // Feature calculation helpers
  calculateSocialMomentum(timeSeries) {
    if (!timeSeries.length) return 0;
    const recent = timeSeries.slice(-7);
    const older = timeSeries.slice(-14, -7);
    const recentAvg = recent.reduce((sum, d) => sum + (d.social_volume || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + (d.social_volume || 0), 0) / older.length;
    return olderAvg ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  calculateSentimentVolatility(timeSeries) {
    if (!timeSeries.length) return 0;
    const sentiments = timeSeries.map(d => d.sentiment || 0);
    const mean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
    return Math.sqrt(variance);
  }

  calculateSocialTrend(timeSeries) {
    if (timeSeries.length < 2) return 0;
    const first = timeSeries[0]?.social_volume || 0;
    const last = timeSeries[timeSeries.length - 1]?.social_volume || 0;
    return first ? (last - first) / first : 0;
  }

  calculateSparklineTrend(sparklineValues) {
    if (!sparklineValues || sparklineValues.length < 2) return 0;
    const prices = sparklineValues.map(v => parseFloat(v.price || 0));
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    return firstPrice ? (lastPrice - firstPrice) / firstPrice : 0;
  }

  calculateSparklineVolatility(sparklineValues) {
    if (!sparklineValues || sparklineValues.length < 2) return 0;
    const prices = sparklineValues.map(v => parseFloat(v.price || 0));
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i-1] > 0) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
      }
    }
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  calculatePriceVolatility(changes) {
    const validChanges = changes.filter(c => c !== null && c !== undefined);
    if (!validChanges.length) return 0;
    const mean = validChanges.reduce((a, b) => a + b, 0) / validChanges.length;
    const variance = validChanges.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / validChanges.length;
    return Math.sqrt(variance);
  }

  calculateMomentumScore(data) {
    const weights = { '1h': 0.1, '24h': 0.3, '7d': 0.4, '30d': 0.2 };
    return (
      (data.price_change_1h || 0) * weights['1h'] +
      (data.price_change_24h || 0) * weights['24h'] +
      (data.price_change_7d || 0) * weights['7d'] +
      (data.price_change_30d || 0) * weights['30d']
    );
  }

  calculateMarketStrength(data) {
    const rankScore = data.market_cap_rank ? Math.max(0, 100 - data.market_cap_rank) : 50;
    const volumeScore = data.volume_24h ? Math.min(100, Math.log10(data.volume_24h) * 10) : 50;
    return (rankScore + volumeScore) / 2;
  }

  /**
   * Fetch market sentiment indicators using CryptoRank V2 global endpoint
   */
  async fetchMarketSentiment() {
    try {
      const { fetchGlobalStats } = await import('../services/cryptoRankService.js');
      
      // Fetch data from both APIs in parallel
      const [globalStats, fearGreedResponse] = await Promise.all([
        fetchGlobalStats().catch(err => {
          console.warn('CryptoRank V2 global API failed:', err.message);
          return { data: null };
        }),
        fetch('https://api.alternative.me/fng/?limit=1')
          .then(r => r.json())
          .catch(err => {
            console.warn('Fear & Greed API failed:', err.message);
            return { data: [{ value: null }] };
          })
      ]);

      const globalData = globalStats?.data;
      const btcDominance = globalData?.btcDominance || null;
      const ethDominance = globalData?.ethDominance || null;
      const defiDominance = globalData?.defiDominance || null;
      const totalMarketCap = globalData?.totalMarketCapUsd || null;
      const total24hVolume = globalData?.totalVolume24hUsd || null;

      const fearGreedIndex = fearGreedResponse?.data?.[0]?.value ? 
        Number(fearGreedResponse.data[0].value) : null;

      return {
        btcDominance,
        ethDominance,
        defiDominance,
        totalMarketCap,
        total24hVolume,
        fearGreedIndex,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.warn('Market sentiment fetch failed:', error.message);
      return {
        btcDominance: null,
        ethDominance: null,
        defiDominance: null,
        totalMarketCap: null,
        total24hVolume: null,
        fearGreedIndex: null,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch category and tag features for ML model
   */
  async fetchCategoryFeatures() {
    try {
      const { fetchCategories, fetchTags } = await import('../services/cryptoRankService.js');
      
      const [categories, tags] = await Promise.allSettled([
        fetchCategories(),
        fetchTags()
      ]);

      const categoryData = categories.status === 'fulfilled' ? categories.value.data : [];
      const tagData = tags.status === 'fulfilled' ? tags.value.data : [];

      // Extract popular categories and trending tags as features
      const popularCategories = categoryData.slice(0, 10).map(cat => cat.name);
      const trendingTags = tagData.filter(tag => tag.trending).slice(0, 5).map(tag => tag.name);

      return {
        popularCategories,
        trendingTags,
        categoryCount: categoryData.length,
        trendingTagCount: trendingTags.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.warn('Category features fetch failed:', error.message);
      return {
        popularCategories: [],
        trendingTags: [],
        categoryCount: 0,
        trendingTagCount: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate composite sentiment score from BTC dominance and Fear & Greed
   */
  calculateSentimentScore(sentiment) {
    if (!sentiment.btcDominance && !sentiment.fearGreedIndex) return 50;
    
    let score = 0;
    let components = 0;
    
    // BTC Dominance contribution (inverse relationship with altcoin strength)
    if (sentiment.btcDominance !== null) {
      const dominanceScore = 100 - ((sentiment.btcDominance - 30) / 40) * 100;
      score += Math.max(0, Math.min(100, dominanceScore));
      components++;
    }
    
    // Fear & Greed Index contribution
    if (sentiment.fearGreedIndex !== null) {
      score += sentiment.fearGreedIndex;
      components++;
    }
    
    return components > 0 ? score / components : 50;
  }

  countMajorAspects(aspects) {
    const majorAspects = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
    return aspects.filter(a => majorAspects.includes(a.type)).length;
  }

  calculateFinancialPlanetsStrength(planets) {
    if (typeof planets === 'object' && planets.venus !== undefined) {
      const venus = planets.venus || 0;
      const jupiter = planets.jupiter || 0;
      return Math.abs(Math.sin((venus - jupiter) * Math.PI / 180)) * 100;
    }
    
    // Fallback for old API format
    const venus = planets.Venus?.longitude || planets.venus || 0;
    const jupiter = planets.Jupiter?.longitude || planets.jupiter || 0;
    return Math.abs(Math.sin((venus - jupiter) * Math.PI / 180)) * 100;
  }

  calculateLunarMarketInfluence(moon) {
    const phase = moon.phase || 0.5;
    const influence = Math.abs(Math.sin(phase * 2 * Math.PI));
    return influence * 100;
  }

  calculatePlanetaryVolatility(planets, aspects) {
    let volatility = 0;
    
    // Check for Mars influence (volatility indicator)
    const mars = planets.mars || planets.Mars?.longitude || 0;
    volatility += Math.abs(Math.sin(mars * Math.PI / 180)) * 30;
    
    // Check for Saturn influence (stability/restriction)
    const saturn = planets.saturn || planets.Saturn?.longitude || 0;
    volatility += Math.abs(Math.cos(saturn * Math.PI / 180)) * 20;
    
    // Add aspect-based volatility
    const aspectCount = aspects?.length || aspects || 0;
    volatility += aspectCount * 5;
    
    return Math.min(100, volatility);
  }

  // Composite score calculations
  calculateTechnicalComposite(technical) {
    const weights = {
      rsi_1h_norm: 0.15,
      macd_bullish_norm: 0.20,
      ma_trend_norm: 0.15,
      bb_position_norm: 0.10,
      volatility_regime_norm: 0.15,
      stoch_k_norm: 0.10,
      williams_r_norm: 0.10,
      rsi_momentum_norm: 0.05
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (technical[key] || 0) * weight;
    }, 0) * 100;
  }

  calculateSocialComposite(social) {
    const weights = {
      galaxy_score_norm: 0.25,
      alt_rank_norm: 0.20,
      sentiment_score_norm: 0.20,
      social_momentum_norm: 0.15,
      bullish_sentiment_norm: 0.10,
      social_trend_norm: 0.10
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (social[key] || 0) * weight;
    }, 0) * 100;
  }

  calculateFundamentalComposite(fundamental) {
    const weights = {
      momentum_score_norm: 0.25,
      market_strength_norm: 0.20,
      price_volatility_norm: 0.15,
      volume_price_ratio_norm: 0.15,
      price_change_24h_norm: 0.15,
      market_cap_rank_norm: 0.10
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (fundamental[key] || 0) * weight;
    }, 0) * 100;
  }

  calculateAstrologyComposite(astrology) {
    const weights = {
      financial_planets_strength_norm: 0.30,
      lunar_market_influence_norm: 0.25,
      planetary_volatility_norm: 0.20,
      moon_phase_norm: 0.15,
      mercury_retrograde_norm: 0.10
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (astrology[key] || 0) * weight;
    }, 0) * 100;
  }

  calculateSentimentComposite(sentiment) {
    const weights = {
      narrative_strength_norm: 0.25,
      sentiment_strength_norm: 0.20,
      sentiment_consistency_norm: 0.15,
      news_confidence_norm: 0.15,
      sentiment_momentum_norm: 0.10,
      news_activity_norm: 0.10,
      sentiment_polarity_norm: 0.05
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (sentiment[key] || 0) * weight;
    }, 0) * 100;
  }

  calculateDataQuality(features) {
    const sources = ['technical', 'social', 'fundamental', 'astrology', 'sentiment'];
    let qualityScore = 0;
    
    sources.forEach(source => {
      const data = features[source];
      const nonNullValues = Object.values(data).filter(v => v !== null && v !== undefined).length;
      const totalValues = Object.keys(data).length;
      qualityScore += totalValues ? (nonNullValues / totalValues) * 20 : 0; // Updated to 20% per source (5 sources)
    });

    return qualityScore;
  }

  calculateFeatureCompleteness(features) {
    const allFeatures = {
      ...features.technical,
      ...features.social,
      ...features.fundamental,
      ...features.astrology
    };
    
    const complete = Object.values(allFeatures).filter(v => v !== null && v !== undefined).length;
    const total = Object.keys(allFeatures).length;
    
    return total ? (complete / total) * 100 : 0;
  }
}

export { FeaturePipeline };
export default FeaturePipeline;