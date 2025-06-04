// services/normalize.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
let normBounds = {};

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function initializeNormalization() {
  if (!supabase) {
    console.log("Using default normalization bounds (no Supabase credentials).");
    global.normBounds = {};
    return;
  }

  console.log("Initializing normalization bounds from Supabase...");
  try {
    const { data: names, error: namesErr } = await supabase
      .from("historical_metrics")
      .select("metric_name");

    if (namesErr) throw namesErr;

    const uniqueMetrics = [...new Set(names.map(row => row.metric_name))];

    for (const metric of uniqueMetrics) {
      const { data: bounds, error: boundsErr } = await supabase
        .from("historical_metrics")
        .select("raw_value")
        .eq("metric_name", metric);

      if (boundsErr) {
        console.error(`Error fetching bounds for ${metric}:`, boundsErr.message);
        continue;
      }

      const values = bounds.map(row => parseFloat(row.raw_value));
      normBounds[metric] = {
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }

    global.normBounds = normBounds;
    console.log(`Normalization bounds loaded for ${Object.keys(normBounds).length} metrics`);
  } catch (err) {
    console.error("Error initializing normalization:", err.message || err);
    global.normBounds = {};
  }
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