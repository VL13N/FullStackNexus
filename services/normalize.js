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
  // If no normBounds defined, return raw values or a constant.
  const out = {};
  for (const [metric, value] of Object.entries(raw)) {
    out[metric] = value; // no scaling
  }
  return out;
}