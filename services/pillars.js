/**
 * Trading Analysis Pillars Configuration
 * Defines the four core pillars of comprehensive cryptocurrency analysis
 * Each pillar contains specific metrics that contribute to understanding market dynamics
 */

/**
 * Technical Analysis Metrics
 * Price action, momentum, and market structure indicators that reveal immediate trading opportunities
 * These metrics focus on price movement patterns and technical trading signals
 */
const technicalMetrics = {
  shortTermTrends: ['ema8', 'ema21', 'sma50', 'sma200'],
  momentumOscillators: ['rsi_1h', 'rsi_4h', 'macd_1h', 'macd_4h'],
  volatilityMeasures: ['bollingerWidth_1h', 'atr_1h', 'vwap_price_spread'],
  orderBookLiquidity: ['bookDepthImbalance', 'dexCexVolumeRatio']
};

/**
 * Social Sentiment Metrics
 * Community engagement, sentiment analysis, and social influence indicators
 * These metrics capture the psychological and behavioral aspects of market participants
 */
const socialMetrics = {
  engagement: ['socialVolume', 'tweetCount', 'telegramPostVolume'],
  sentiment: ['lunarcrushSentiment', 'twitterPolarity'],
  influence: ['galaxyScore', 'whaleTxCount'],
  newsFlow: ['cryptoNewsHeadlineCount', 'githubReleaseNewsCount']
};

/**
 * Fundamental Analysis Metrics
 * Network health, adoption metrics, and economic fundamentals
 * These metrics assess the underlying value and long-term viability of the cryptocurrency
 */
const fundamentalMetrics = {
  marketSupply: ['marketCapUsd', 'circulatingSupplyPct', 'fullyDilutedValuation'],
  onChainUsage: ['tps', 'activeAddresses', 'stakingYield', 'defiTvl', 'whaleFlowUsd'],
  devActivity: ['githubCommitsCount', 'githubPullsCount'],
  macroFlows: ['btcDominance', 'totalCryptoMarketCapExStablecoins']
};

/**
 * Astrological Timing Metrics
 * Astronomical cycles and celestial events that may influence market psychology and timing
 * These metrics explore correlation between cosmic patterns and market behavior
 */
const astrologyMetrics = {
  lunar: ['lunarPhasePercentile', 'lunarPerigeeApogeeDist'],
  aspects: ['saturnJupiterAspect', 'marsSunAspect', 'northNodeSolanaLongitude'],
  ingress: ['solarIngressAries', 'solarIngressLibra', 'nodeIngressData'],
  fixedStar: ['siriusRisingIndicator', 'aldebaranConjunctionIndicator']
};

// Export all pillar configurations
export {
  technicalMetrics,
  socialMetrics,
  fundamentalMetrics,
  astrologyMetrics
};

// Default export for easy importing
export default {
  technical: technicalMetrics,
  social: socialMetrics,
  fundamental: fundamentalMetrics,
  astrology: astrologyMetrics
};