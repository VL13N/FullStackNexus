// services/normalize.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
let normBounds = {};

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * On plans without historical data, skip loading actual bounds.
 * Use fixed default bounds so normalizeMetrics() returns raw values.
 */
export async function initializeNormalization() {
  console.log("initializeNormalization(): historical data not available; using default bounds.");
  global.normBounds = {}; // empty => normalizeMetrics will just passthrough or default to 50
}

export function normalizeMetrics(raw) {
  // Define normalization bounds for cryptocurrency metrics
  const bounds = {
    // Technical indicators (0-100 range)
    rsi: { min: 0, max: 100 },
    rsi_1h: { min: 0, max: 100 },
    rsi_4h: { min: 0, max: 100 },
    macd: { min: -5, max: 5 },
    macdHistogram: { min: -2, max: 2 },
    ema: { min: 50, max: 300 },
    ema8: { min: 50, max: 300 },
    ema21: { min: 50, max: 300 },
    sma: { min: 50, max: 300 },
    sma50: { min: 50, max: 300 },
    sma200: { min: 50, max: 300 },
    atr: { min: 0.5, max: 10 },
    
    // Price and volume
    price: { min: 10, max: 500 },
    volume24h: { min: 100000000, max: 5000000000 },
    volume_24h_usd: { min: 100000000, max: 5000000000 },
    priceChange24h: { min: -20, max: 20 },
    
    // Market fundamentals (normalize to 0-100)
    marketCap: { min: 10000000000, max: 100000000000 },
    market_cap_usd: { min: 10000000000, max: 100000000000 },
    circulatingSupply: { min: 300000000, max: 600000000 },
    
    // Social metrics
    galaxyScore: { min: 20, max: 80 },
    social_score: { min: 20, max: 80 },
    socialVolume: { min: 100, max: 10000 },
    tweetCount: { min: 10, max: 1000 },
    
    // On-chain metrics
    totalValidators: { min: 1000, max: 2000 },
    stakingYield: { min: 5, max: 15 },
    tps: { min: 1000, max: 5000 },
    
    // Astrological metrics
    moonPhase: { min: 0, max: 1 },
    moonIllumination: { min: 0, max: 100 },
    astro_score: { min: 0, max: 100 }
  };

  const normalized = {};
  
  for (const [metric, value] of Object.entries(raw)) {
    if (value === null || value === undefined) {
      normalized[metric] = 50; // neutral default
      continue;
    }
    
    const bound = bounds[metric];
    if (bound) {
      // Min-max normalization to 0-100 scale
      const scaled = Math.max(0, Math.min(100, 
        ((value - bound.min) / (bound.max - bound.min)) * 100
      ));
      normalized[metric] = scaled;
    } else {
      // Unknown metrics default to neutral 50 or passthrough if already 0-100
      normalized[metric] = (value >= 0 && value <= 100) ? value : 50;
    }
  }
  
  return normalized;
}