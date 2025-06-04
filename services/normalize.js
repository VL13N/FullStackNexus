/**
 * Data Normalization Service
 * Provides functions to normalize data from various APIs using z-score or min-max scaling
 * Ensures all metrics are scaled consistently for aggregation and analysis
 */

class DataNormalizer {
  constructor() {
    // Predefined ranges for common crypto metrics to ensure consistent scaling
    this.metricRanges = {
      // Price ranges (USD)
      price: { min: 0, max: 100000 },
      priceChange24h: { min: -50, max: 50 }, // percentage
      priceChange7d: { min: -70, max: 70 }, // percentage
      priceChange30d: { min: -90, max: 200 }, // percentage
      
      // Volume ranges (USD)
      volume24h: { min: 0, max: 50000000000 }, // 50B max
      marketCap: { min: 0, max: 3000000000000 }, // 3T max
      
      // Technical indicators
      rsi: { min: 0, max: 100 },
      macd: { min: -10, max: 10 },
      ema: { min: 0, max: 100000 },
      sma: { min: 0, max: 100000 },
      bollingerUpper: { min: 0, max: 100000 },
      bollingerLower: { min: 0, max: 100000 },
      bollingerMiddle: { min: 0, max: 100000 },
      stochasticK: { min: 0, max: 100 },
      stochasticD: { min: 0, max: 100 },
      williamsR: { min: -100, max: 0 },
      
      // Social metrics
      galaxyScore: { min: 0, max: 100 },
      altRank: { min: 1, max: 5000 },
      socialVolume: { min: 0, max: 1000000 },
      socialScore: { min: 0, max: 100 },
      socialContributors: { min: 0, max: 100000 },
      socialDominance: { min: 0, max: 100 },
      marketDominance: { min: 0, max: 100 },
      correlationRank: { min: 1, max: 5000 },
      volatility: { min: 0, max: 1 },
      
      // On-chain metrics
      tps: { min: 0, max: 10000 },
      blockTime: { min: 0, max: 10 },
      validatorCount: { min: 0, max: 5000 },
      stakingYield: { min: 0, max: 20 }, // percentage
      totalStaked: { min: 0, max: 1000000000 },
      
      // Astrological metrics (normalized to 0-100 scale)
      moonPhase: { min: 0, max: 1 },
      moonIllumination: { min: 0, max: 100 },
      planetaryAspectStrength: { min: 0, max: 10 },
      astrologyScore: { min: 0, max: 100 }
    };
    
    // Historical data for z-score calculation (will be populated from API responses)
    this.historicalStats = {};
  }

  /**
   * Normalize a single value using min-max scaling
   * @param {number} value - The value to normalize
   * @param {number} min - Minimum value in the range
   * @param {number} max - Maximum value in the range
   * @returns {number} Normalized value between 0 and 1
   */
  minMaxNormalize(value, min, max) {
    if (value === null || value === undefined || isNaN(value)) return 0;
    if (min === max) return 0.5; // Avoid division by zero
    
    // Clamp value to range
    const clampedValue = Math.max(min, Math.min(max, value));
    return (clampedValue - min) / (max - min);
  }

  /**
   * Normalize a value using z-score (standard score)
   * @param {number} value - The value to normalize
   * @param {number} mean - Mean of the dataset
   * @param {number} stdDev - Standard deviation of the dataset
   * @returns {number} Z-score normalized value
   */
  zScoreNormalize(value, mean, stdDev) {
    if (value === null || value === undefined || isNaN(value)) return 0;
    if (stdDev === 0) return 0; // Avoid division by zero
    
    return (value - mean) / stdDev;
  }

  /**
   * Convert z-score to a 0-1 range using sigmoid function
   * @param {number} zScore - Z-score value
   * @returns {number} Sigmoid normalized value between 0 and 1
   */
  sigmoidNormalize(zScore) {
    return 1 / (1 + Math.exp(-zScore));
  }

  /**
   * Normalize TAAPI Pro technical indicators
   * @param {Object} indicators - Raw indicator data from TAAPI
   * @returns {Object} Normalized indicators
   */
  normalizeTaapiData(indicators) {
    const normalized = {};
    
    for (const [indicatorName, indicatorData] of Object.entries(indicators)) {
      if (!indicatorData.success || !indicatorData.data) {
        normalized[indicatorName] = { success: false, normalized: 0 };
        continue;
      }

      const data = indicatorData.data;
      let normalizedValue = 0;

      switch (indicatorName) {
        case 'rsi':
          normalizedValue = this.minMaxNormalize(data.value, 0, 100);
          break;
        case 'macd':
          normalizedValue = this.minMaxNormalize(data.macd, -10, 10);
          break;
        case 'ema':
        case 'sma':
          const range = this.metricRanges[indicatorName] || { min: 0, max: 1000 };
          normalizedValue = this.minMaxNormalize(data.value, range.min, range.max);
          break;
        case 'bbands':
          normalized[indicatorName] = {
            success: true,
            upper: this.minMaxNormalize(data.valueUpperBand, 0, 1000),
            middle: this.minMaxNormalize(data.valueMiddleBand, 0, 1000),
            lower: this.minMaxNormalize(data.valueLowerBand, 0, 1000)
          };
          continue;
        case 'stoch':
          normalized[indicatorName] = {
            success: true,
            k: this.minMaxNormalize(data.valueK, 0, 100),
            d: this.minMaxNormalize(data.valueD, 0, 100)
          };
          continue;
        case 'willr':
          normalizedValue = this.minMaxNormalize(data.value, -100, 0);
          break;
        default:
          // Generic normalization for unknown indicators
          normalizedValue = data.value ? this.minMaxNormalize(data.value, 0, 100) : 0;
      }

      normalized[indicatorName] = {
        success: true,
        normalized: normalizedValue,
        raw: data
      };
    }

    return normalized;
  }

  /**
   * Normalize LunarCrush social metrics
   * @param {Object} socialData - Raw social data from LunarCrush
   * @returns {Object} Normalized social metrics
   */
  normalizeLunarCrushData(socialData) {
    if (!socialData.success || !socialData.data) {
      return { success: false, normalized: {} };
    }

    const data = socialData.data;
    const normalized = {};

    // Price metrics
    normalized.price = this.minMaxNormalize(data.price, 0, 1000);
    normalized.priceChange24h = this.minMaxNormalize(data.priceChange24h, -50, 50);
    normalized.volume24h = this.minMaxNormalize(data.volume24h, 0, 50000000000);
    normalized.marketCap = this.minMaxNormalize(data.marketCap, 0, 3000000000000);

    // Social metrics
    normalized.galaxyScore = this.minMaxNormalize(data.galaxyScore, 0, 100);
    normalized.altRank = 1 - this.minMaxNormalize(data.altRank, 1, 5000); // Invert ranking
    normalized.socialVolume = this.minMaxNormalize(data.socialVolume, 0, 1000000);
    normalized.socialScore = this.minMaxNormalize(data.socialScore, 0, 100);
    normalized.socialContributors = this.minMaxNormalize(data.socialContributors, 0, 100000);
    normalized.socialDominance = this.minMaxNormalize(data.socialDominance, 0, 100);
    normalized.marketDominance = this.minMaxNormalize(data.marketDominance, 0, 100);
    normalized.correlationRank = 1 - this.minMaxNormalize(data.correlationRank, 1, 5000); // Invert ranking
    normalized.volatility = this.minMaxNormalize(data.volatility, 0, 1);

    return {
      success: true,
      normalized,
      raw: data
    };
  }

  /**
   * Normalize CryptoRank fundamental data
   * @param {Object} cryptoRankData - Raw data from CryptoRank
   * @returns {Object} Normalized fundamental metrics
   */
  normalizeCryptoRankData(cryptoRankData) {
    if (!cryptoRankData.success || !cryptoRankData.data) {
      return { success: false, normalized: {} };
    }

    const data = cryptoRankData.data;
    const normalized = {};

    // Market metrics
    normalized.price = this.minMaxNormalize(data.price, 0, 1000);
    normalized.marketCap = this.minMaxNormalize(data.marketCap, 0, 3000000000000);
    normalized.volume24h = this.minMaxNormalize(data.volume24h, 0, 50000000000);
    normalized.priceChange24h = this.minMaxNormalize(data.priceChange24h, -50, 50);
    normalized.priceChange7d = this.minMaxNormalize(data.priceChange7d, -70, 70);
    normalized.priceChange30d = this.minMaxNormalize(data.priceChange30d, -90, 200);

    // Supply metrics
    normalized.circulatingSupply = this.minMaxNormalize(data.circulatingSupply, 0, 1000000000);
    normalized.totalSupply = this.minMaxNormalize(data.totalSupply, 0, 1000000000);

    return {
      success: true,
      normalized,
      raw: data
    };
  }

  /**
   * Normalize on-chain metrics
   * @param {Object} onChainData - Raw on-chain data
   * @returns {Object} Normalized on-chain metrics
   */
  normalizeOnChainData(onChainData) {
    if (!onChainData.success || !onChainData.data) {
      return { success: false, normalized: {} };
    }

    const data = onChainData.data;
    const normalized = {};

    // Network performance
    normalized.tps = this.minMaxNormalize(data.tps, 0, 10000);
    normalized.blockTime = 1 - this.minMaxNormalize(data.blockTime, 0, 10); // Invert (lower is better)
    normalized.validatorCount = this.minMaxNormalize(data.validatorCount, 0, 5000);

    // Staking metrics
    normalized.stakingYield = this.minMaxNormalize(data.stakingYield, 0, 20);
    normalized.totalStaked = this.minMaxNormalize(data.totalStaked, 0, 1000000000);
    normalized.stakingRatio = this.minMaxNormalize(data.stakingRatio, 0, 100);

    return {
      success: true,
      normalized,
      raw: data
    };
  }

  /**
   * Normalize astrological data
   * @param {Object} astroData - Raw astrological data
   * @returns {Object} Normalized astrological metrics
   */
  normalizeAstrologyData(astroData) {
    if (!astroData.success) {
      return { success: false, normalized: {} };
    }

    const normalized = {};

    // Moon phase data
    if (astroData.moonPhase) {
      normalized.moonPhase = this.minMaxNormalize(astroData.moonPhase.phase, 0, 1);
      normalized.moonIllumination = this.minMaxNormalize(astroData.moonPhase.illumination, 0, 100);
    }

    // Planetary positions (convert to influence scores)
    if (astroData.planetaryPositions) {
      const planetInfluences = {};
      for (const [planet, position] of Object.entries(astroData.planetaryPositions.positions)) {
        if (position.longitude !== undefined) {
          // Convert longitude to normalized influence (0-1)
          planetInfluences[planet] = this.minMaxNormalize(position.longitude, 0, 360);
        }
      }
      normalized.planetaryInfluences = planetInfluences;
    }

    // Aspect strength (if available)
    if (astroData.aspects) {
      normalized.aspectStrength = this.minMaxNormalize(astroData.aspects.orb || 0, 0, 10);
    }

    return {
      success: true,
      normalized,
      raw: astroData
    };
  }

  /**
   * Create a comprehensive normalized dataset combining all API sources
   * @param {Object} allApiData - Combined data from all APIs
   * @returns {Object} Comprehensive normalized dataset
   */
  createUnifiedNormalizedDataset(allApiData) {
    const unified = {
      timestamp: new Date().toISOString(),
      technical: {},
      social: {},
      fundamental: {},
      onChain: {},
      astrological: {},
      composite: {}
    };

    // Normalize each data source
    if (allApiData.taapi) {
      unified.technical = this.normalizeTaapiData(allApiData.taapi);
    }

    if (allApiData.lunarcrush) {
      unified.social = this.normalizeLunarCrushData(allApiData.lunarcrush);
    }

    if (allApiData.cryptorank) {
      unified.fundamental = this.normalizeCryptoRankData(allApiData.cryptorank);
    }

    if (allApiData.onchain) {
      unified.onChain = this.normalizeOnChainData(allApiData.onchain);
    }

    if (allApiData.astrology) {
      unified.astrological = this.normalizeAstrologyData(allApiData.astrology);
    }

    // Create composite scores
    unified.composite = this.calculateCompositeScores(unified);

    return unified;
  }

  /**
   * Calculate composite scores from normalized data
   * @param {Object} normalizedData - Normalized data from all sources
   * @returns {Object} Composite scores
   */
  calculateCompositeScores(normalizedData) {
    const scores = {};

    // Technical strength (average of key technical indicators)
    const technical = normalizedData.technical;
    if (technical.rsi && technical.macd) {
      const rsiScore = technical.rsi.success ? technical.rsi.normalized : 0;
      const macdScore = technical.macd.success ? Math.abs(technical.macd.normalized - 0.5) * 2 : 0;
      scores.technicalStrength = (rsiScore + macdScore) / 2;
    }

    // Social sentiment (weighted average of social metrics)
    const social = normalizedData.social;
    if (social.normalized) {
      const weights = {
        galaxyScore: 0.3,
        socialScore: 0.2,
        socialVolume: 0.2,
        altRank: 0.15,
        socialDominance: 0.15
      };
      
      let weightedSum = 0;
      let totalWeight = 0;
      
      for (const [metric, weight] of Object.entries(weights)) {
        if (social.normalized[metric] !== undefined && social.normalized[metric] !== null) {
          weightedSum += social.normalized[metric] * weight;
          totalWeight += weight;
        }
      }
      
      scores.socialSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    // Fundamental strength
    const fundamental = normalizedData.fundamental;
    if (fundamental.normalized) {
      const fundamentalMetrics = [
        fundamental.normalized.marketCap,
        fundamental.normalized.volume24h,
        1 - Math.abs(fundamental.normalized.priceChange24h - 0.5) * 2 // Stability score
      ].filter(v => v !== undefined && v !== null);
      
      scores.fundamentalStrength = fundamentalMetrics.length > 0 
        ? fundamentalMetrics.reduce((a, b) => a + b, 0) / fundamentalMetrics.length 
        : 0;
    }

    // Network health
    const onChain = normalizedData.onChain;
    if (onChain.normalized) {
      const networkMetrics = [
        onChain.normalized.tps,
        onChain.normalized.blockTime,
        onChain.normalized.validatorCount,
        onChain.normalized.stakingRatio
      ].filter(v => v !== undefined && v !== null);
      
      scores.networkHealth = networkMetrics.length > 0 
        ? networkMetrics.reduce((a, b) => a + b, 0) / networkMetrics.length 
        : 0;
    }

    // Astrological influence
    const astro = normalizedData.astrological;
    if (astro.normalized) {
      const astroMetrics = [
        astro.normalized.moonPhase,
        astro.normalized.moonIllumination,
        astro.normalized.aspectStrength
      ].filter(v => v !== undefined && v !== null);
      
      scores.astrologicalInfluence = astroMetrics.length > 0 
        ? astroMetrics.reduce((a, b) => a + b, 0) / astroMetrics.length 
        : 0;
    }

    // Overall composite score (weighted average of all categories)
    const categoryScores = Object.values(scores).filter(v => v !== undefined && v !== null);
    scores.overallScore = categoryScores.length > 0 
      ? categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length 
      : 0;

    return scores;
  }

  /**
   * Update historical statistics for z-score calculation
   * @param {string} metric - Metric name
   * @param {number} value - New value to add to history
   */
  updateHistoricalStats(metric, value) {
    if (!this.historicalStats[metric]) {
      this.historicalStats[metric] = [];
    }

    this.historicalStats[metric].push(value);
    
    // Keep only last 100 values for efficiency
    if (this.historicalStats[metric].length > 100) {
      this.historicalStats[metric].shift();
    }
  }

  /**
   * Calculate mean and standard deviation for a metric
   * @param {string} metric - Metric name
   * @returns {Object} Stats object with mean and stdDev
   */
  getMetricStats(metric) {
    const values = this.historicalStats[metric] || [];
    if (values.length === 0) return { mean: 0, stdDev: 1 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance) || 1; // Avoid zero std dev

    return { mean, stdDev };
  }
}

// Export singleton instance
const normalizer = new DataNormalizer();
module.exports = normalizer;