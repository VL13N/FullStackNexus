/**
 * Trading Analysis Scoring Algorithms
 * Computes composite scores for sub-pillars and main pillars using normalized metrics
 * Weights are based on correlation analysis with next-hour price movements
 */

import { technicalMetrics, socialMetrics, fundamentalMetrics, astrologyMetrics } from './pillars.js';

/**
 * TECHNICAL ANALYSIS SUB-PILLAR SCORERS
 * Each function takes normalized metrics (0-100 scale) and returns weighted composite scores
 */

/**
 * Short-term trend strength based on moving average relationships
 * Higher scores indicate strong upward momentum across timeframes
 */
export function computeTrendScore(norm) {
  // EMA8 > EMA21 > SMA50 > SMA200 indicates strong uptrend
  // Weight faster indicators more heavily for short-term signals
  const ema8Weight = 0.4;   // Most responsive to immediate price action
  const ema21Weight = 0.3;  // Short-term trend confirmation
  const sma50Weight = 0.2;  // Medium-term trend filter
  const sma200Weight = 0.1; // Long-term trend context
  
  return (
    ema8Weight * (norm.ema8 || 50) +
    ema21Weight * (norm.ema21 || 50) +
    sma50Weight * (norm.sma50 || 50) +
    sma200Weight * (norm.sma200 || 50)
  );
}

/**
 * Momentum oscillator composite reflecting price momentum strength
 * RSI and MACD across multiple timeframes for momentum confluence
 */
export function computeMomentumScore(norm) {
  // RSI shows overbought/oversold conditions, MACD shows trend changes
  // 1h timeframe weighted higher for immediate signals
  const rsi1hWeight = 0.4;   // Primary momentum indicator
  const rsi4hWeight = 0.25;  // Trend confirmation
  const macd1hWeight = 0.25; // Momentum change detection
  const macd4hWeight = 0.1;  // Longer-term momentum context
  
  return (
    rsi1hWeight * (norm.rsi_1h || 50) +
    rsi4hWeight * (norm.rsi_4h || 50) +
    macd1hWeight * (norm.macd_1h || 50) +
    macd4hWeight * (norm.macd_4h || 50)
  );
}

/**
 * Market volatility and range analysis
 * Higher scores indicate increased volatility and trading opportunities
 */
export function computeVolatilityScore(norm) {
  // Bollinger width shows volatility expansion, ATR shows true range
  // VWAP spread indicates price deviation from volume-weighted average
  const bollingerWeight = 0.45; // Primary volatility measure
  const atrWeight = 0.35;       // True range volatility
  const vwapSpreadWeight = 0.2; // Price deviation from VWAP
  
  return (
    bollingerWeight * (norm.bollingerWidth_1h || 50) +
    atrWeight * (norm.atr_1h || 50) +
    vwapSpreadWeight * (norm.vwap_price_spread || 50)
  );
}

/**
 * Order book depth and liquidity analysis
 * Higher scores indicate better liquidity and market structure
 */
export function computeLiquidityScore(norm) {
  // Book depth balance shows bid/ask equilibrium
  // DEX/CEX ratio shows decentralized vs centralized trading preference
  const depthWeight = 0.6;     // Primary liquidity indicator
  const dexCexWeight = 0.4;    // Market structure preference
  
  return (
    depthWeight * (norm.bookDepthImbalance || 50) +
    dexCexWeight * (norm.dexCexVolumeRatio || 50)
  );
}

/**
 * SOCIAL SENTIMENT SUB-PILLAR SCORERS
 * Community engagement and sentiment indicators
 */

/**
 * Social media engagement and activity levels
 * Higher scores indicate increased community interest and discussion
 */
export function computeEngagementScore(norm) {
  // Social volume captures overall discussion, tweets show Twitter activity
  // Telegram posts indicate community engagement
  const socialVolumeWeight = 0.5; // Primary engagement metric
  const tweetWeight = 0.3;        // Twitter engagement
  const telegramWeight = 0.2;     // Community channel activity
  
  return (
    socialVolumeWeight * (norm.socialVolume || 50) +
    tweetWeight * (norm.tweetCount || 50) +
    telegramWeight * (norm.telegramPostVolume || 50)
  );
}

/**
 * Community sentiment and emotional analysis
 * Higher scores indicate more positive market psychology
 */
export function computeSentimentScore(norm) {
  // LunarCrush sentiment is comprehensive, Twitter polarity adds granularity
  const lunarcrushWeight = 0.7; // Primary sentiment indicator
  const twitterWeight = 0.3;    // Twitter-specific sentiment
  
  return (
    lunarcrushWeight * (norm.lunarcrushSentiment || 50) +
    twitterWeight * (norm.twitterPolarity || 50)
  );
}

/**
 * Market influence and whale activity indicators
 * Higher scores indicate institutional and whale interest
 */
export function computeInfluenceScore(norm) {
  // Galaxy Score shows overall market influence, whale transactions show big money moves
  const galaxyWeight = 0.6;  // Comprehensive influence metric
  const whaleWeight = 0.4;   // Large transaction activity
  
  return (
    galaxyWeight * (norm.galaxyScore || 50) +
    whaleWeight * (norm.whaleTxCount || 50)
  );
}

/**
 * Information flow and news catalysts
 * Higher scores indicate increased news flow and development activity
 */
export function computeNewsScore(norm) {
  // News headlines drive market reactions, GitHub releases show development progress
  const newsWeight = 0.7;     // Market-moving news
  const githubWeight = 0.3;   // Development announcements
  
  return (
    newsWeight * (norm.cryptoNewsHeadlineCount || 50) +
    githubWeight * (norm.githubReleaseNewsCount || 50)
  );
}

/**
 * FUNDAMENTAL ANALYSIS SUB-PILLAR SCORERS
 * Network health and economic fundamentals
 */

/**
 * Token supply and market capitalization metrics
 * Higher scores indicate stronger market valuation
 */
export function computeMarketSupplyScore(norm) {
  // Market cap shows total value, circulating supply shows availability
  // FDV provides fully diluted perspective
  const marketCapWeight = 0.5;      // Primary valuation metric
  const circulatingWeight = 0.3;    // Supply availability
  const fdvWeight = 0.2;            // Fully diluted context
  
  // Ensure market cap is properly normalized to 0-100 scale
  const normalizeMarketCap = (value) => {
    if (!value || typeof value !== 'number') return 50;
    
    // Market cap ranges for SOL: 10B = bearish (0), 50B = neutral (50), 100B+ = bullish (100)
    const billion = 1000000000;
    if (value >= 100 * billion) return 100;
    if (value <= 10 * billion) return 0;
    
    // Linear scaling between 10B and 100B
    return Math.min(100, Math.max(0, ((value - 10 * billion) / (90 * billion)) * 100));
  };
  
  return (
    marketCapWeight * normalizeMarketCap(norm.marketCapUsd || norm.market_cap_usd) +
    circulatingWeight * (norm.circulatingSupplyPct || 50) +
    fdvWeight * (norm.fullyDilutedValuation || 50)
  );
}

/**
 * On-chain network usage and activity metrics
 * Higher scores indicate stronger network utilization
 */
export function computeOnChainUsageScore(norm) {
  // TPS shows network throughput, active addresses show user adoption
  // Staking yield shows network rewards, DeFi TVL shows ecosystem value
  // Whale flows show institutional movement
  const tpsWeight = 0.25;           // Network performance
  const addressesWeight = 0.25;     // User adoption
  const stakingWeight = 0.2;        // Network rewards
  const tvlWeight = 0.2;           // DeFi ecosystem value
  const whaleFlowWeight = 0.1;     // Institutional flows
  
  return (
    tpsWeight * (norm.tps || 50) +
    addressesWeight * (norm.activeAddresses || 50) +
    stakingWeight * (norm.stakingYield || 50) +
    tvlWeight * (norm.defiTvl || 50) +
    whaleFlowWeight * (norm.whaleFlowUsd || 50)
  );
}

/**
 * Development activity and progress indicators
 * Higher scores indicate active development and improvement
 */
export function computeDevActivityScore(norm) {
  // GitHub commits show code development, pull requests show collaboration
  const commitsWeight = 0.6;  // Primary development metric
  const pullsWeight = 0.4;    // Collaboration and review activity
  
  return (
    commitsWeight * (norm.githubCommitsCount || 50) +
    pullsWeight * (norm.githubPullsCount || 50)
  );
}

/**
 * Macro market flows and broader cryptocurrency trends
 * Higher scores indicate favorable macro conditions
 */
export function computeMacroFlowsScore(norm) {
  // BTC dominance affects altcoin flows, total market cap shows overall crypto health
  const btcDominanceWeight = 0.4;   // Altcoin vs Bitcoin preference
  const totalMarketWeight = 0.6;    // Overall crypto market health
  
  // Normalize large market cap values to 0-100 scale
  const normalizeMarketCap = (value) => {
    if (!value || typeof value !== 'number') return 50;
    
    // Market cap ranges: 1T = baseline (50), 3T+ = bullish (100), sub-1T = bearish (0-50)
    const trillion = 1000000000000;
    if (value >= 3 * trillion) return 100;
    if (value <= 0.5 * trillion) return 0;
    
    // Linear scaling between 0.5T and 3T
    return Math.min(100, Math.max(0, ((value - 0.5 * trillion) / (2.5 * trillion)) * 100));
  };
  
  return (
    btcDominanceWeight * (100 - (norm.btcDominance || 50)) + // Inverse: lower BTC dominance favors alts
    totalMarketWeight * normalizeMarketCap(norm.totalCryptoMarketCapExStablecoins)
  );
}

/**
 * ASTROLOGICAL TIMING SUB-PILLAR SCORERS
 * Astronomical cycles and celestial timing patterns
 */

/**
 * Lunar cycle timing and moon-based market psychology
 * Higher scores indicate favorable lunar timing for market movements
 */
export function computeLunarScore(norm) {
  // Lunar phase affects market psychology, lunar distance affects emotional intensity
  const phaseWeight = 0.7;     // Primary lunar timing indicator
  const distanceWeight = 0.3;  // Emotional intensity modifier
  
  return (
    phaseWeight * (norm.lunarPhasePercentile || 50) +
    distanceWeight * (norm.lunarPerigeeApogeeDist || 50)
  );
}

/**
 * Planetary aspect timing for market cycle analysis
 * Higher scores indicate favorable planetary configurations
 */
export function computeAspectsScore(norm) {
  // Saturn-Jupiter aspects affect long-term cycles, Mars-Sun affects short-term energy
  // North Node position affects karmic timing and market destiny
  const saturnJupiterWeight = 0.4;  // Long-term cycle timing
  const marsSunWeight = 0.3;        // Short-term energy cycles
  const nodeWeight = 0.3;           // Karmic timing and destiny points
  
  return (
    saturnJupiterWeight * (norm.saturnJupiterAspect || 50) +
    marsSunWeight * (norm.marsSunAspect || 50) +
    nodeWeight * (norm.northNodeSolanaLongitude || 50)
  );
}

/**
 * Solar and nodal ingress timing for seasonal market shifts
 * Higher scores indicate favorable seasonal timing
 */
export function computeIngressScore(norm) {
  // Solar ingresses mark seasonal shifts, node ingress marks destiny point changes
  const ariesIngressWeight = 0.4;   // Spring market renewal
  const libraIngressWeight = 0.35;  // Autumn market balance
  const nodeIngressWeight = 0.25;   // Karmic shift timing
  
  return (
    ariesIngressWeight * (norm.solarIngressAries || 50) +
    libraIngressWeight * (norm.solarIngressLibra || 50) +
    nodeIngressWeight * (norm.nodeIngressData || 50)
  );
}

/**
 * Fixed star timing for precision market timing
 * Higher scores indicate favorable fixed star configurations
 */
export function computeFixedStarScore(norm) {
  // Sirius rising indicates royal timing, Aldebaran conjunction indicates success timing
  const siriusWeight = 0.6;      // Royal star timing
  const aldebaranWeight = 0.4;   // Success and achievement timing
  
  return (
    siriusWeight * (norm.siriusRisingIndicator || 50) +
    aldebaranWeight * (norm.aldebaranConjunctionIndicator || 50)
  );
}

/**
 * MAIN PILLAR COMPOSITE SCORERS
 * Combine sub-pillar scores into main pillar scores
 */

/**
 * Overall technical analysis score combining all technical sub-pillars
 * Weights based on correlation analysis with price movements
 */
export function computeTechnicalScore(norm) {
  const trendScore = computeTrendScore(norm);
  const momentumScore = computeMomentumScore(norm);
  const volatilityScore = computeVolatilityScore(norm);
  const liquidityScore = computeLiquidityScore(norm);
  
  // Sub-pillar weights based on predictive power analysis
  const trendWeight = 0.35;       // Primary trend direction
  const momentumWeight = 0.3;     // Momentum confirmation
  const volatilityWeight = 0.2;   // Risk and opportunity sizing
  const liquidityWeight = 0.15;   // Market structure quality
  
  return (
    trendWeight * trendScore +
    momentumWeight * momentumScore +
    volatilityWeight * volatilityScore +
    liquidityWeight * liquidityScore
  );
}

/**
 * Overall social sentiment score combining all social sub-pillars
 * Captures community psychology and market sentiment
 */
export function computeSocialScore(norm) {
  const engagementScore = computeEngagementScore(norm);
  const sentimentScore = computeSentimentScore(norm);
  const influenceScore = computeInfluenceScore(norm);
  const newsScore = computeNewsScore(norm);
  
  // Sub-pillar weights based on social signal importance
  const sentimentWeight = 0.35;    // Primary psychology indicator
  const engagementWeight = 0.3;    // Community interest level
  const influenceWeight = 0.25;    // Institutional and whale interest
  const newsWeight = 0.1;          // Information catalyst strength
  
  return (
    sentimentWeight * sentimentScore +
    engagementWeight * engagementScore +
    influenceWeight * influenceScore +
    newsWeight * newsScore
  );
}

/**
 * Overall fundamental analysis score combining all fundamental sub-pillars
 * Captures network health and economic value
 */
export function computeFundamentalScore(norm) {
  const marketSupplyScore = computeMarketSupplyScore(norm);
  const onChainUsageScore = computeOnChainUsageScore(norm);
  const devActivityScore = computeDevActivityScore(norm);
  const macroFlowsScore = computeMacroFlowsScore(norm);
  
  // Sub-pillar weights based on fundamental importance
  const onChainWeight = 0.4;       // Primary network health indicator
  const marketSupplyWeight = 0.3;  // Valuation and tokenomics
  const macroWeight = 0.2;         // Broader market context
  const devWeight = 0.1;           // Development progress
  
  return (
    onChainWeight * onChainUsageScore +
    marketSupplyWeight * marketSupplyScore +
    macroWeight * macroFlowsScore +
    devWeight * devActivityScore
  );
}

/**
 * Overall astrological timing score combining all astrological sub-pillars
 * Captures celestial timing and cosmic market cycles
 */
export function computeAstrologyScore(norm) {
  const lunarScore = computeLunarScore(norm);
  const aspectsScore = computeAspectsScore(norm);
  const ingressScore = computeIngressScore(norm);
  const fixedStarScore = computeFixedStarScore(norm);
  
  // Sub-pillar weights based on astrological timing importance
  const lunarWeight = 0.4;        // Primary emotional and psychological timing
  const aspectsWeight = 0.3;      // Planetary energy configurations
  const ingressWeight = 0.2;      // Seasonal and karmic timing shifts
  const fixedStarWeight = 0.1;    // Precision timing indicators
  
  return (
    lunarWeight * lunarScore +
    aspectsWeight * aspectsScore +
    ingressWeight * ingressScore +
    fixedStarWeight * fixedStarScore
  );
}

/**
 * MASTER COMPOSITE SCORE
 * Combines all four main pillars into a unified trading signal
 */

/**
 * Master trading score combining all four analysis pillars
 * Returns comprehensive 0-100 score for trading decision support
 */
export function computeMasterScore(norm) {
  const technicalScore = computeTechnicalScore(norm);
  const socialScore = computeSocialScore(norm);
  const fundamentalScore = computeFundamentalScore(norm);
  const astrologyScore = computeAstrologyScore(norm);
  
  // Main pillar weights based on overall predictive power
  // Technical analysis weighted highest for short-term trading
  const technicalWeight = 0.4;     // Primary price action analysis
  const fundamentalWeight = 0.25;  // Network health and value
  const socialWeight = 0.2;        // Community sentiment and psychology
  const astrologyWeight = 0.15;    // Timing and cycle analysis
  
  const masterScore = (
    technicalWeight * technicalScore +
    fundamentalWeight * fundamentalScore +
    socialWeight * socialScore +
    astrologyWeight * astrologyScore
  );
  
  // Ensure result is within 0-100 bounds
  return Math.max(0, Math.min(100, masterScore));
}

/**
 * UTILITY FUNCTIONS
 * Helper functions for score analysis and interpretation
 */

/**
 * Get detailed breakdown of all scores for analysis
 * Returns object with all sub-pillar and main pillar scores
 */
export function getScoreBreakdown(norm) {
  // Technical sub-pillars
  const trendScore = computeTrendScore(norm);
  const momentumScore = computeMomentumScore(norm);
  const volatilityScore = computeVolatilityScore(norm);
  const liquidityScore = computeLiquidityScore(norm);
  
  // Social sub-pillars
  const engagementScore = computeEngagementScore(norm);
  const sentimentScore = computeSentimentScore(norm);
  const influenceScore = computeInfluenceScore(norm);
  const newsScore = computeNewsScore(norm);
  
  // Fundamental sub-pillars
  const marketSupplyScore = computeMarketSupplyScore(norm);
  const onChainUsageScore = computeOnChainUsageScore(norm);
  const devActivityScore = computeDevActivityScore(norm);
  const macroFlowsScore = computeMacroFlowsScore(norm);
  
  // Astrological sub-pillars
  const lunarScore = computeLunarScore(norm);
  const aspectsScore = computeAspectsScore(norm);
  const ingressScore = computeIngressScore(norm);
  const fixedStarScore = computeFixedStarScore(norm);
  
  // Main pillars
  const technicalScore = computeTechnicalScore(norm);
  const socialScore = computeSocialScore(norm);
  const fundamentalScore = computeFundamentalScore(norm);
  const astrologyScore = computeAstrologyScore(norm);
  
  // Master score
  const masterScore = computeMasterScore(norm);
  
  return {
    subPillars: {
      technical: {
        trend: Math.round(trendScore * 100) / 100,
        momentum: Math.round(momentumScore * 100) / 100,
        volatility: Math.round(volatilityScore * 100) / 100,
        liquidity: Math.round(liquidityScore * 100) / 100
      },
      social: {
        engagement: Math.round(engagementScore * 100) / 100,
        sentiment: Math.round(sentimentScore * 100) / 100,
        influence: Math.round(influenceScore * 100) / 100,
        news: Math.round(newsScore * 100) / 100
      },
      fundamental: {
        marketSupply: Math.round(marketSupplyScore * 100) / 100,
        onChainUsage: Math.round(onChainUsageScore * 100) / 100,
        devActivity: Math.round(devActivityScore * 100) / 100,
        macroFlows: Math.round(macroFlowsScore * 100) / 100
      },
      astrology: {
        lunar: Math.round(lunarScore * 100) / 100,
        aspects: Math.round(aspectsScore * 100) / 100,
        ingress: Math.round(ingressScore * 100) / 100,
        fixedStar: Math.round(fixedStarScore * 100) / 100
      }
    },
    mainPillars: {
      technical: Math.round(technicalScore * 100) / 100,
      social: Math.round(socialScore * 100) / 100,
      fundamental: Math.round(fundamentalScore * 100) / 100,
      astrology: Math.round(astrologyScore * 100) / 100
    },
    masterScore: Math.round(masterScore * 100) / 100
  };
}

/**
 * Interpret master score into actionable trading signals
 */
export function interpretMasterScore(score) {
  if (score >= 80) return { signal: 'STRONG_BUY', confidence: 'HIGH' };
  if (score >= 65) return { signal: 'BUY', confidence: 'MEDIUM' };
  if (score >= 55) return { signal: 'WEAK_BUY', confidence: 'LOW' };
  if (score >= 45) return { signal: 'NEUTRAL', confidence: 'NEUTRAL' };
  if (score >= 35) return { signal: 'WEAK_SELL', confidence: 'LOW' };
  if (score >= 20) return { signal: 'SELL', confidence: 'MEDIUM' };
  return { signal: 'STRONG_SELL', confidence: 'HIGH' };
}

export default {
  // Sub-pillar scorers
  computeTrendScore,
  computeMomentumScore,
  computeVolatilityScore,
  computeLiquidityScore,
  computeEngagementScore,
  computeSentimentScore,
  computeInfluenceScore,
  computeNewsScore,
  computeMarketSupplyScore,
  computeOnChainUsageScore,
  computeDevActivityScore,
  computeMacroFlowsScore,
  computeLunarScore,
  computeAspectsScore,
  computeIngressScore,
  computeFixedStarScore,
  
  // Main pillar scorers
  computeTechnicalScore,
  computeSocialScore,
  computeFundamentalScore,
  computeAstrologyScore,
  
  // Master score
  computeMasterScore,
  
  // Utilities
  getScoreBreakdown,
  interpretMasterScore
};