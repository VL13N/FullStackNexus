// scripts/createSupabaseTables.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTables() {
  console.log("Creating Supabase tables for normalization service...");
  
  // Create historical_metrics table
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS historical_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        raw_value DECIMAL NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_historical_metrics_name ON historical_metrics(metric_name);
      CREATE INDEX IF NOT EXISTS idx_historical_metrics_timestamp ON historical_metrics(timestamp);
      
      -- Insert sample normalization bounds
      INSERT INTO historical_metrics (metric_name, raw_value) VALUES
      ('rsi', 0), ('rsi', 100),
      ('price', 50), ('price', 300),
      ('volume24h', 1000000000), ('volume24h', 8000000000),
      ('galaxyScore', 20), ('galaxyScore', 80),
      ('socialVolume', 100), ('socialVolume', 5000),
      ('marketCap', 20000000000), ('marketCap', 150000000000)
      ON CONFLICT DO NOTHING;
    `
  });
  
  if (error) {
    console.error("Error creating tables:", error.message);
    
    // Try alternative approach with direct SQL execution
    console.log("Trying alternative table creation method...");
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS historical_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        raw_value DECIMAL NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabase
      .from('historical_metrics')
      .select('*')
      .limit(1);
    
    if (createError && createError.message.includes('does not exist')) {
      console.log("Table needs to be created in Supabase dashboard.");
      console.log("SQL to run in Supabase SQL Editor:");
      console.log(createTableQuery);
    }
  } else {
    console.log("Tables created successfully!");
  }
  
  process.exit(0);
}

createTables();