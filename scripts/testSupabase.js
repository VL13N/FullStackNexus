// scripts/testSupabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function ping() {
  const { data, error } = await supabase
    .from("historical_metrics")
    .select("*")
    .limit(1);
  if (error) {
    console.error("Supabase query error:", error.message);
  } else {
    console.log("Supabase query succeeded. Sample row:", data[0] || "none");
  }
  process.exit(0);
}

ping();