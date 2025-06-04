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
  const out = {};
  for (const [metric, value] of Object.entries(raw)) {
    if (value === null || value === undefined) {
      out[metric] = 50;
      continue;
    }

    const bounds = global.normBounds?.[metric];
    if (!bounds || bounds.max === bounds.min) {
      out[metric] = 50;
    } else {
      const { min, max } = bounds;
      const score = ((value - min) / (max - min)) * 100;
      out[metric] = Math.max(0, Math.min(100, Math.round(score * 100) / 100));
    }
  }
  return out;
}