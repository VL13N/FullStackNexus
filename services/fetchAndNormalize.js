/**
 * Live Data Fetching and Normalization Service
 * Orchestrates real-time data collection from all API sources and applies normalization
 * Now includes data persistence and lineage tracking for ML/backtesting
 */

import { normalizeMetrics } from './normalize.js';
import { 
  persistTechnicalData, 
  persistSocialData, 
  persistFundamentalData, 
  persistOnChainData, 
  persistAstrologyData,
  persistFinancialAstrologyData 
} from './dataPersistence.js';

/**
 * Fetch raw metrics from all configured API sources in parallel
 * Returns comprehensive raw metric data for real-time analysis
 */
export async function fetchRawMetrics() {
  const rawMetrics = {};
  const fetchPromises = [];

  // Technical metrics from TAAPI Pro using bulk endpoint
  if (process.env.TAAPI_API_KEY) {
    fetchPromises.push(
      import('../api/taapi.js').then(module => module.fetchBulkIndicators('1h')).then(data => {
        if (data) {
          rawMetrics.rsi_1h = data.rsi;
          rawMetrics.macd_1h = data.macdHistogram;
          rawMetrics.ema200 = data.ema200;
        }
      })
    );
    
    // Additional individual indicators if needed
    fetchPromises.push(
      import('../api/taapi.js').then(module => module.fetchTAIndicator('rsi', '4h')).then(value => rawMetrics.rsi_4h = value),
      import('../api/taapi.js').then(module => module.fetchTAIndicator('ema', '1h')).then(value => rawMetrics.ema8 = value),
      import('../api/taapi.js').then(module => module.fetchTAIndicator('sma', '1h')).then(value => rawMetrics.sma50 = value),
      import('../api/taapi.js').then(module => module.fetchTAIndicator('atr', '1h')).then(value => rawMetrics.atr_1h = value)
    );
  }

  // Social metrics from LunarCrush
  if (process.env.LUNARCRUSH_API_KEY) {
    fetchPromises.push(
      fetchLunarCrushMetrics().then(data => {
        if (data) {
          rawMetrics.galaxyScore = data.galaxy_score;
          rawMetrics.socialVolume = data.social_volume;
          rawMetrics.lunarcrushSentiment = data.sentiment;
          rawMetrics.tweetCount = data.tweets;
        }
      })
    );
  }

  // Fundamental metrics from CryptoRank V2 API
  if (process.env.CRYPTORANK_API_KEY) {
    fetchPromises.push(
      import('../api/cryptorank.js').then(module => module.fetchSolanaCurrent()).then(data => {
        if (data) {
          rawMetrics.marketCapUsd = data.marketCapUsd;
          rawMetrics.volume24hUsd = data.volume24hUsd;
          rawMetrics.priceUsd = data.priceUsd;
        }
      })
    );
  }

  // On-chain metrics from Solana Tracker
  fetchPromises.push(
    fetchOnChainMetrics().then(data => {
      if (data) {
        rawMetrics.tps = data.tps;
        rawMetrics.activeAddresses = data.activeAddresses;
      }
    })
  );

  // Astrological metrics from Astronomy Engine
  fetchPromises.push(
    fetchAstrologyMetrics().then(data => {
      if (data) {
        Object.assign(rawMetrics, data);
      }
    })
  );

  // Execute all fetches in parallel
  await Promise.allSettled(fetchPromises);

  // Add default values for missing metrics
  addDefaultValues(rawMetrics);

  return rawMetrics;
}

/**
 * Fetch and normalize live metrics
 * Main entry point for real-time analysis
 */
export async function fetchAndNormalize() {
  try {
    const rawMetrics = await fetchRawMetrics();
    const normalizedMetrics = normalizeMetrics(rawMetrics);
    
    return {
      raw: rawMetrics,
      normalized: normalizedMetrics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch and normalize metrics:', error);
    throw error;
  }
}

/**
 * Individual API fetcher functions
 */

async function fetchTaapiIndicator(indicator, params = {}) {
  try {
    const urlParams = new URLSearchParams({
      secret: process.env.TAAPI_API_KEY,
      exchange: 'binance',
      symbol: 'SOL/USDT',
      ...params
    });

    const url = `https://api.taapi.io/${indicator}?${urlParams}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TAAPI ${indicator} error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract appropriate value based on indicator type
    switch (indicator) {
      case 'rsi':
      case 'ema':
      case 'sma':
      case 'atr':
      case 'vwap':
        return data.value;
      case 'macd':
        return data.valueMACD;
      case 'bbands':
        return data.valueUpperBand && data.valueLowerBand ? 
          data.valueUpperBand - data.valueLowerBand : 0;
      default:
        return data.value || 0;
    }
  } catch (error) {
    console.warn(`TAAPI ${indicator} fetch failed:`, error.message);
    return null;
  }
}

async function fetchLunarCrushMetrics() {
  try {
    const response = await fetch('https://lunarcrush.com/api4/public/coins/sol/v1', {
      headers: {
        'Authorization': `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`LunarCrush error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.warn('LunarCrush fetch failed:', error.message);
    return null;
  }
}

async function fetchCryptoRankMetrics() {
  try {
    const url = `https://api.cryptorank.io/v1/currencies/solana?api_key=${process.env.CRYPTORANK_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CryptoRank error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data) {
      return {
        marketCap: data.data.values.USD.marketCap,
        fullyDilutedValuation: data.data.values.USD.fullyDilutedValuation,
        circulatingSupplyPct: (data.data.circulatingSupply / data.data.maxSupply) * 100
      };
    }
    
    return null;
  } catch (error) {
    console.warn('CryptoRank fetch failed:', error.message);
    return null;
  }
}

async function fetchOnChainMetrics() {
  try {
    const response = await fetch('https://data.solanatracker.io/performance');

    if (!response.ok) {
      throw new Error(`Solana Tracker error: ${response.status}`);
    }

    const data = await response.json();
    return {
      tps: data.tps || 0,
      activeAddresses: data.activeAddresses || 0
    };
  } catch (error) {
    console.warn('On-chain metrics fetch failed:', error.message);
    return null;
  }
}

async function fetchAstrologyMetrics() {
  try {
    const astroModule = await import('astronomy-engine');
    const Astronomy = astroModule.default || astroModule;
    const astroDate = new Astronomy.AstroTime(new Date());
    
    // Calculate lunar metrics
    const moonIllumination = Astronomy.Illumination(Astronomy.Body.Moon, astroDate);
    const moonPos = Astronomy.GeoVector(Astronomy.Body.Moon, astroDate, false);
    
    // Calculate planetary positions
    const sunPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Sun, astroDate, false));
    const marsPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Mars, astroDate, false));
    const saturnPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Saturn, astroDate, false));
    const jupiterPos = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Jupiter, astroDate, false));
    
    // Calculate aspect angles
    let marsSunAngle = Math.abs((sunPos as any).elon - (marsPos as any).elon);
    if (marsSunAngle > 180) marsSunAngle = 360 - marsSunAngle;
    
    let saturnJupiterAngle = Math.abs((saturnPos as any).elon - (jupiterPos as any).elon);
    if (saturnJupiterAngle > 180) saturnJupiterAngle = 360 - saturnJupiterAngle;
    
    return {
      lunarPhasePercentile: (moonIllumination as any).phase_fraction * 100,
      lunarPerigeeApogeeDist: moonPos.Length(),
      marsSunAspect: marsSunAngle,
      saturnJupiterAspect: saturnJupiterAngle,
      northNodeSolanaLongitude: (sunPos as any).elon,
      solarIngressAries: Math.abs((sunPos as any).elon) < 1 ? 1 : 0,
      solarIngressLibra: Math.abs((sunPos as any).elon - 180) < 1 ? 1 : 0,
      nodeIngressData: 0,
      siriusRisingIndicator: 0,
      aldebaranConjunctionIndicator: 0
    };
  } catch (error) {
    console.warn('Astrology metrics calculation failed:', error.message);
    return null;
  }
}

/**
 * Add default values for metrics that couldn't be fetched
 */
function addDefaultValues(rawMetrics) {
  const defaults = {
    // Technical defaults
    rsi_1h: 50,
    rsi_4h: 50,
    ema8: 150,
    ema21: 150,
    sma50: 150,
    sma200: 150,
    macd_1h: 0,
    macd_4h: 0,
    bollingerWidth_1h: 10,
    atr_1h: 5,
    vwap_price_spread: 0,
    bookDepthImbalance: 0,
    dexCexVolumeRatio: 1,

    // Social defaults
    galaxyScore: 50,
    socialVolume: 1000,
    lunarcrushSentiment: 0,
    tweetCount: 100,
    telegramPostVolume: 10,
    twitterPolarity: 0,
    whaleTxCount: 5,
    cryptoNewsHeadlineCount: 10,
    githubReleaseNewsCount: 1,

    // Fundamental defaults
    marketCapUsd: 70000000000,
    fullyDilutedValuation: 80000000000,
    circulatingSupplyPct: 80,
    tps: 3000,
    activeAddresses: 1000000,
    stakingYield: 7,
    defiTvl: 5000000000,
    whaleFlowUsd: 0,
    githubCommitsCount: 20,
    githubPullsCount: 5,
    btcDominance: 55,
    totalCryptoMarketCapExStablecoins: 2500000000000,

    // Astrological defaults
    lunarPhasePercentile: 50,
    lunarPerigeeApogeeDist: 1.0,
    marsSunAspect: 90,
    saturnJupiterAspect: 120,
    northNodeSolanaLongitude: 180,
    solarIngressAries: 0,
    solarIngressLibra: 0,
    nodeIngressData: 0,
    siriusRisingIndicator: 0,
    aldebaranConjunctionIndicator: 0
  };

  // Apply defaults for missing values
  Object.entries(defaults).forEach(([key, value]) => {
    if (rawMetrics[key] === undefined || rawMetrics[key] === null) {
      rawMetrics[key] = value;
    }
  });
}

export default {
  fetchRawMetrics,
  fetchAndNormalize
};