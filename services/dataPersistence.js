/**
 * Data Persistence Service for ML/Backtesting
 * Captures all API responses into Supabase with full lineage tracking
 * Enables comprehensive historical analysis and model training
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.warn("Supabase credentials not found - data persistence will be disabled");
}

/**
 * Persists technical analysis data from TAAPI Pro
 * @param {Object} data - Raw TAAPI response
 * @param {string} coinSymbol - Trading pair symbol
 * @param {string} interval - Time interval
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistTechnicalData(data, coinSymbol = 'SOL/USDT', interval = '1h') {
  if (!supabase) return null;
  
  try {
    // Parse key indicators from response
    const rsiValue = data.indicators?.rsi?.value || data.rsi || null;
    const macdHist = data.indicators?.macd?.histogram || data.macd?.histogram || null;
    const emaValue = data.indicators?.ema?.value || data.ema || null;
    const bollingerUpper = data.indicators?.bbands?.upperBand || data.bbands?.upperBand || null;
    const bollingerLower = data.indicators?.bbands?.lowerBand || data.bbands?.lowerBand || null;
    const stochRsi = data.indicators?.stochrsi?.fastk || data.stochrsi?.fastk || null;
    const williamsR = data.indicators?.willr?.value || data.willr || null;

    const { data: insertedData, error } = await supabase
      .from('technical_data')
      .insert([
        {
          coin_symbol: coinSymbol,
          interval: interval,
          raw_response: data,
          rsi_value: rsiValue,
          macd_histogram: macdHist,
          ema_value: emaValue,
          bollinger_upper: bollingerUpper,
          bollinger_lower: bollingerLower,
          stoch_rsi: stochRsi,
          williams_r: williamsR
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist technical data:", error.message);
      return null;
    }

    console.log(`[Data Persistence] Technical data stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting technical data:", error.message);
    return null;
  }
}

/**
 * Persists social sentiment data from LunarCrush
 * @param {Object} data - Raw LunarCrush response
 * @param {string} coinSlug - Coin identifier
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistSocialData(data, coinSlug = 'solana') {
  if (!supabase) return null;
  
  try {
    // Parse social metrics from response
    const galaxyScore = data.data?.galaxy_score || data.galaxy_score || null;
    const altRank = data.data?.alt_rank || data.alt_rank || null;
    const socialVolume = data.data?.social_volume || data.social_volume || null;
    const sentiment = data.data?.sentiment || data.sentiment || null;
    const socialTimestamp = data.data?.social_timestamp || data.social_timestamp || null;
    const priceCorrelation = data.data?.price_correlation || data.price_correlation || null;

    const { data: insertedData, error } = await supabase
      .from('social_data')
      .insert([
        {
          coin_slug: coinSlug,
          raw_response: data,
          galaxy_score: galaxyScore,
          alt_rank: altRank,
          social_volume: socialVolume,
          sentiment: sentiment,
          social_timestamp: socialTimestamp ? new Date(socialTimestamp) : null,
          price_correlation: priceCorrelation
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist social data:", error.message);
      return null;
    }

    console.log(`[Data Persistence] Social data stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting social data:", error.message);
    return null;
  }
}

/**
 * Persists fundamental market data from CryptoRank
 * @param {Object} data - Raw CryptoRank response
 * @param {string} coinSlug - Coin identifier
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistFundamentalData(data, coinSlug = 'solana') {
  if (!supabase) return null;
  
  try {
    // Parse fundamental metrics from response
    const responseData = data.data || data;
    const priceUsd = responseData.currentPrice?.usd || responseData.price_usd || null;
    const marketCapUsd = responseData.marketCap?.usd || responseData.market_cap_usd || null;
    const volume24hUsd = responseData.volume24h?.usd || responseData.volume_24h_usd || null;
    const circulatingSupply = responseData.supply?.circulating || responseData.circulating_supply || null;
    const percentChange24h = responseData.priceChange?.percent24h || responseData.percent_change_24h || null;
    const percentChange7d = responseData.priceChange?.percent7d || responseData.percent_change_7d || null;
    const percentChange30d = responseData.priceChange?.percent30d || responseData.percent_change_30d || null;
    const athPrice = responseData.allTimeHigh?.price || responseData.ath_price || null;
    const atlPrice = responseData.allTimeLow?.price || responseData.atl_price || null;
    const marketRank = responseData.marketCap?.rank || responseData.market_rank || null;

    const { data: insertedData, error } = await supabase
      .from('fundamental_data')
      .insert([
        {
          coin_slug: coinSlug,
          raw_response: data,
          price_usd: priceUsd,
          market_cap_usd: marketCapUsd,
          volume_24h_usd: volume24hUsd,
          circulating_supply: circulatingSupply,
          percent_change_24h: percentChange24h,
          percent_change_7d: percentChange7d,
          percent_change_30d: percentChange30d,
          ath_price: athPrice,
          atl_price: atlPrice,
          market_rank: marketRank
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist fundamental data:", error.message);
      return null;
    }

    console.log(`[Data Persistence] Fundamental data stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting fundamental data:", error.message);
    return null;
  }
}

/**
 * Persists on-chain blockchain data
 * @param {Object} data - Raw on-chain response
 * @param {string} coinSlug - Coin identifier
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistOnChainData(data, coinSlug = 'solana') {
  if (!supabase) return null;
  
  try {
    // Parse on-chain metrics from response
    const responseData = data.data || data;
    const tps = responseData.tps || responseData.currentTps || null;
    const activeValidators = responseData.validators?.active || responseData.active_validators || null;
    const stakingYield = responseData.staking?.yield || responseData.staking_yield || null;
    const whaleFlow = responseData.whale_flow || responseData.whaleFlow || null;
    const tvl = responseData.tvl || responseData.totalValueLocked || null;
    const dexVolume = responseData.dex_volume || responseData.dexVolume || null;
    const networkHealth = responseData.network_health || responseData.networkHealth || null;
    const epochInfo = responseData.epoch_info || responseData.epochInfo || null;

    const { data: insertedData, error } = await supabase
      .from('onchain_data')
      .insert([
        {
          coin_slug: coinSlug,
          raw_response: data,
          tps: tps,
          active_validators: activeValidators,
          staking_yield: stakingYield,
          whale_flow: whaleFlow,
          tvl: tvl,
          dex_volume: dexVolume,
          network_health: networkHealth,
          epoch_info: epochInfo
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist on-chain data:", error.message);
      return null;
    }

    console.log(`[Data Persistence] On-chain data stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting on-chain data:", error.message);
    return null;
  }
}

/**
 * Persists basic astrological data
 * @param {Object} moonData - Moon phase data
 * @param {Object} planetaryData - Planetary positions data
 * @param {Object} aspectsData - Planetary aspects data
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistAstrologyData(moonData, planetaryData, aspectsData) {
  if (!supabase) return null;
  
  try {
    // Parse astrological data
    const moonPhaseName = moonData?.moonPhase?.phaseName || null;
    const moonIllumination = moonData?.moonPhase?.illumination || null;
    const mercuryRetrograde = planetaryData?.positions?.mercury?.retrograde || false;
    const majorAspectsCount = aspectsData?.aspects?.length || 0;

    const { data: insertedData, error } = await supabase
      .from('astrology_data')
      .insert([
        {
          raw_moon_phase: moonData,
          raw_planetary: planetaryData,
          raw_aspects: aspectsData,
          moon_phase_name: moonPhaseName,
          moon_illumination: moonIllumination,
          mercury_retrograde: mercuryRetrograde,
          major_aspects_count: majorAspectsCount
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist astrology data:", error.message);
      return null;
    }

    console.log(`[Data Persistence] Astrology data stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting astrology data:", error.message);
    return null;
  }
}

/**
 * Persists financial astrology index data
 * @param {Object} data - Financial astrology composite data
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistFinancialAstrologyData(data) {
  if (!supabase) return null;
  
  try {
    const { data: insertedData, error } = await supabase
      .from('financial_astrology_data')
      .insert([
        {
          raw_response: data,
          weighted_aspect: data.weightedAspect || 0,
          ingress_score: data.ingressScore || 0,
          midpoint_score: data.midpointScore || 0,
          station_score: data.stationScore || 0,
          node_score: data.nodeScore || 0,
          composite_fai: data.compositeFAI || 0
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist financial astrology data:", error.message);
      return null;
    }

    console.log(`[Data Persistence] Financial astrology data stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting financial astrology data:", error.message);
    return null;
  }
}

/**
 * Persists enhanced prediction with full data lineage
 * @param {Object} prediction - Prediction data
 * @param {Object} dataIds - IDs of source data records
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistEnhancedPrediction(prediction, dataIds = {}) {
  if (!supabase) return null;
  
  try {
    const { data: insertedData, error } = await supabase
      .from('predictions_enhanced')
      .insert([
        {
          technical_id: dataIds.technicalId || null,
          social_id: dataIds.socialId || null,
          fundamental_id: dataIds.fundamentalId || null,
          onchain_id: dataIds.onchainId || null,
          astrology_id: dataIds.astrologyId || null,
          fai_id: dataIds.faiId || null,
          tech_score: prediction.technical_score || 0,
          social_score: prediction.social_score || 0,
          fundamental_score: prediction.fundamental_score || 0,
          astrology_score: prediction.astrology_score || 0,
          composite_score: prediction.overall_score || 0,
          classification: prediction.classification || 'Neutral',
          confidence: prediction.confidence || 0,
          price_target: prediction.price_target || null,
          risk_level: prediction.risk_level || 'Medium'
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist enhanced prediction:", error.message);
      return null;
    }

    console.log(`[Data Persistence] Enhanced prediction stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting enhanced prediction:", error.message);
    return null;
  }
}

/**
 * Persists news sentiment analysis data
 * @param {Object} data - OpenAI news analysis response
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistNewsData(data) {
  if (!supabase) return null;
  
  try {
    const analysis = data.analysis || data;
    
    const { data: insertedData, error } = await supabase
      .from('news_scores')
      .insert([
        {
          raw_response: data,
          headline: analysis.headline || null,
          sentiment_score: analysis.sentiment_score || analysis.sentiment || null,
          confidence_level: analysis.confidence_level || analysis.confidence || null,
          source: analysis.source || null,
          article_url: analysis.article_url || null,
          key_topics: analysis.key_topics || [],
          market_impact: analysis.market_impact || null
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist news data:", error.message);
      return null;
    }

    console.log(`[Data Persistence] News data stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting news data:", error.message);
    return null;
  }
}

/**
 * Persists daily market update from OpenAI
 * @param {Object} data - OpenAI daily update response
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistDailyUpdate(data) {
  if (!supabase) return null;
  
  try {
    const update = data.update || data;
    
    const { data: insertedData, error } = await supabase
      .from('daily_updates')
      .insert([
        {
          raw_response: data,
          content: update.content || update.summary || '',
          market_outlook: update.market_outlook || update.outlook || null,
          key_events: update.key_events || [],
          price_prediction: update.price_prediction || null,
          confidence_rating: update.confidence_rating || null
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist daily update:", error.message);
      return null;
    }

    console.log(`[Data Persistence] Daily update stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting daily update:", error.message);
    return null;
  }
}

/**
 * Persists dynamic weight suggestions from OpenAI
 * @param {Object} data - OpenAI weight suggestions response
 * @returns {Promise<string|null>} - UUID of inserted record
 */
export async function persistWeightSuggestions(data) {
  if (!supabase) return null;
  
  try {
    const weights = data.weights || data;
    
    const { data: insertedData, error } = await supabase
      .from('dynamic_weights')
      .insert([
        {
          raw_response: data,
          technical_pct: weights.technical || weights.technical_pct || 0,
          social_pct: weights.social || weights.social_pct || 0,
          fundamental_pct: weights.fundamental || weights.fundamental_pct || 0,
          astrology_pct: weights.astrology || weights.astrology_pct || 0,
          justification: weights.justification || null,
          market_condition: weights.market_condition || null,
          volatility_factor: weights.volatility_factor || null
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error("Failed to persist weight suggestions:", error.message);
      return null;
    }

    console.log(`[Data Persistence] Weight suggestions stored: ${insertedData.id}`);
    return insertedData.id;
  } catch (error) {
    console.error("Error persisting weight suggestions:", error.message);
    return null;
  }
}

/**
 * Retrieves historical data for ML training
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {Array} features - Features to include
 * @returns {Promise<Array>} - Historical feature dataset
 */
export async function getMLTrainingData(startDate, endDate, features = []) {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('ml_features_view')
      .select('*')
      .gte('generated_at', startDate)
      .lte('generated_at', endDate)
      .order('generated_at', { ascending: true });

    if (error) {
      console.error("Failed to retrieve ML training data:", error.message);
      return [];
    }

    console.log(`[Data Persistence] Retrieved ${data.length} records for ML training`);
    return data;
  } catch (error) {
    console.error("Error retrieving ML training data:", error.message);
    return [];
  }
}

export { supabase };