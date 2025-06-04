// services/normalize.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_KEY. Using default normalization bounds."
  );
  export async function initializeNormalization() {
    console.log("Using default normalization bounds.");
    global.normBounds = {};
  }
  export function normalizeMetrics(raw) {
    const out = {};
    for (const [metric, value] of Object.entries(raw)) {
      out[metric] = 50;
    }
    return out;
  }
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  let normBounds = {};

  export async function initializeNormalization() {
    console.log("Initializing normalization bounds from Supabase…");
    try {
      const { data: names, error: namesErr } = await supabase
        .from("historical_metrics")
        .select("metric_name", { distinct: true });

      if (namesErr) throw namesErr;

      for (const row of names) {
        const metric = row.metric_name;
        const { data: stats, error: statErr } = await supabase
          .from("historical_metrics")
          .select("MIN(raw_value) as min, MAX(raw_value) as max")
          .eq("metric_name", metric)
          .single();

        if (statErr) {
          console.error(`Error fetching bounds for ${metric}:`, statErr.message);
          continue;
        }
        normBounds[metric] = { min: stats.min, max: stats.max };
      }

      global.normBounds = normBounds;
      console.log("Normalization bounds loaded for", Object.keys(normBounds));
    } catch (err) {
      console.error("Error initializing normalization:", err.message || err);
      global.normBounds = {};
    }
  }

  export function normalizeMetrics(raw) {
    const out = {};
    for (const [metric, value] of Object.entries(raw)) {
      const bounds = global.normBounds[metric];
      if (!bounds || bounds.max === bounds.min) {
        out[metric] = 50;
      } else {
        const { min, max } = bounds;
        const score = ((value - min) / (max - min)) * 100;
        out[metric] = Math.max(0, Math.min(100, score));
      }
    }
    return out;
  }
}