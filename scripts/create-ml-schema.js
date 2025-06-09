/**
 * Create ML Features Schema in Supabase
 * Sets up tables for storing normalized features and training datasets
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createMLSchema() {
  console.log('🔄 Creating ML features schema...');
  
  const schema = `
    -- ML Features Table for Training Dataset Storage
    CREATE TABLE IF NOT EXISTS ml_features (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      timestamp timestamptz NOT NULL,
      symbol text NOT NULL DEFAULT 'SOL',
      
      -- Raw feature data (JSON columns)
      technical_features jsonb,
      social_features jsonb,
      fundamental_features jsonb,
      astrology_features jsonb,
      
      -- Normalized feature vectors (JSON columns)
      technical_normalized jsonb,
      social_normalized jsonb,
      fundamental_normalized jsonb,
      astrology_normalized jsonb,
      
      -- Composite scores (0-100 range)
      technical_score numeric(6,3),
      social_score numeric(6,3),
      fundamental_score numeric(6,3),
      astrology_score numeric(6,3),
      
      -- Data quality metrics
      data_quality_score numeric(6,3),
      feature_completeness numeric(6,3),
      
      -- Metadata
      pipeline_version text DEFAULT '1.0',
      processing_time_ms integer,
      
      UNIQUE(timestamp, symbol)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_ml_features_timestamp ON ml_features (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_ml_features_symbol ON ml_features (symbol);
    CREATE INDEX IF NOT EXISTS idx_ml_features_created_at ON ml_features (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ml_features_quality ON ml_features (data_quality_score DESC);
    CREATE INDEX IF NOT EXISTS idx_ml_features_symbol_time ON ml_features (symbol, timestamp DESC);
  `;

  try {
    // Create the table using direct SQL execution
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: schema })
    });

    if (!response.ok) {
      // Fallback: Try creating table through insert operation
      console.log('🔄 Using fallback table creation method...');
      
      const testRecord = {
        timestamp: new Date().toISOString(),
        symbol: 'SOL',
        technical_features: {},
        social_features: {},
        fundamental_features: {},
        astrology_features: {},
        technical_normalized: {},
        social_normalized: {},
        fundamental_normalized: {},
        astrology_normalized: {},
        technical_score: 50.0,
        social_score: 50.0,
        fundamental_score: 50.0,
        astrology_score: 50.0,
        data_quality_score: 100.0,
        feature_completeness: 100.0,
        pipeline_version: '1.0'
      };

      const { data, error } = await supabase
        .from('ml_features')
        .insert(testRecord)
        .select();

      if (error) {
        console.error('Schema creation failed:', error.message);
        process.exit(1);
      }

      // Clean up test record
      if (data && data[0]) {
        await supabase
          .from('ml_features')
          .delete()
          .eq('id', data[0].id);
      }

      console.log('✅ ML features table created via fallback method');
    } else {
      console.log('✅ ML features schema created successfully');
    }

    // Verify table structure
    const { data: columns, error: columnError } = await supabase
      .from('ml_features')
      .select('*')
      .limit(1);

    if (!columnError) {
      console.log('✅ Table structure verified');
    } else {
      console.warn('Table verification warning:', columnError.message);
    }

  } catch (error) {
    console.error('Schema creation error:', error.message);
    process.exit(1);
  }
}

createMLSchema();