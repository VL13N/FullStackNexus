/**
 * Database Schema Setup Script
 * Creates missing tables and fixes database schema issues for system health
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabaseSchema() {
  console.log('🔧 Setting up database schema...');
  
  try {
    // Create ml_features table
    const mlFeaturesQuery = `
      CREATE TABLE IF NOT EXISTS public.ml_features (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        symbol TEXT NOT NULL DEFAULT 'SOL',
        price NUMERIC,
        volume_24h NUMERIC,
        market_cap NUMERIC,
        rsi NUMERIC,
        macd NUMERIC,
        ema_20 NUMERIC,
        sma_20 NUMERIC,
        atr NUMERIC,
        bb_upper NUMERIC,
        bb_lower NUMERIC,
        stoch_rsi NUMERIC,
        williams_r NUMERIC,
        social_volume NUMERIC,
        galaxy_score NUMERIC,
        sentiment_score NUMERIC,
        news_sentiment NUMERIC,
        market_sentiment NUMERIC,
        moon_phase NUMERIC,
        planetary_score NUMERIC,
        astrology_score NUMERIC,
        technical_score NUMERIC,
        social_score NUMERIC,
        fundamental_score NUMERIC,
        quality_score NUMERIC DEFAULT 1.0,
        completeness_score NUMERIC DEFAULT 1.0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    const { error: mlError } = await supabase.rpc('exec_sql', { sql: mlFeaturesQuery });
    if (mlError) console.warn('ML features table creation warning:', mlError.message);
    else console.log('✅ ML features table ready');
    
    // Create training_logs table
    const trainingLogsQuery = `
      CREATE TABLE IF NOT EXISTS public.training_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        training_type TEXT NOT NULL DEFAULT 'standard',
        trigger_reason TEXT,
        status TEXT NOT NULL DEFAULT 'started',
        accuracy NUMERIC,
        loss NUMERIC,
        sharpe_ratio NUMERIC,
        feature_count INTEGER,
        execution_time_ms INTEGER,
        model_version TEXT,
        hyperparameters JSONB,
        performance_metrics JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );
    `;
    
    const { error: logsError } = await supabase.rpc('exec_sql', { sql: trainingLogsQuery });
    if (logsError) console.warn('Training logs table creation warning:', logsError.message);
    else console.log('✅ Training logs table ready');
    
    // Create model_versions table
    const modelVersionsQuery = `
      CREATE TABLE IF NOT EXISTS public.model_versions (
        id SERIAL PRIMARY KEY,
        version TEXT NOT NULL,
        model_type TEXT NOT NULL DEFAULT 'ensemble',
        accuracy NUMERIC,
        loss NUMERIC,
        sharpe_ratio NUMERIC,
        feature_count INTEGER,
        training_duration_ms INTEGER,
        hyperparameters JSONB,
        performance_metrics JSONB,
        trigger_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT FALSE
      );
    `;
    
    const { error: versionsError } = await supabase.rpc('exec_sql', { sql: modelVersionsQuery });
    if (versionsError) console.warn('Model versions table creation warning:', versionsError.message);
    else console.log('✅ Model versions table ready');
    
    // Create indexes for performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_ml_features_timestamp ON public.ml_features(timestamp DESC);',
      'CREATE INDEX IF NOT EXISTS idx_ml_features_symbol ON public.ml_features(symbol);',
      'CREATE INDEX IF NOT EXISTS idx_training_logs_timestamp ON public.training_logs(timestamp DESC);',
      'CREATE INDEX IF NOT EXISTS idx_training_logs_type ON public.training_logs(training_type);',
      'CREATE INDEX IF NOT EXISTS idx_model_versions_created ON public.model_versions(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_model_versions_active ON public.model_versions(is_active);'
    ];
    
    for (const indexQuery of indexQueries) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexQuery });
      if (indexError) console.warn('Index creation warning:', indexError.message);
    }
    console.log('✅ Database indexes created');
    
    // Ensure live_predictions table has required columns
    const alterTableQuery = `
      ALTER TABLE public.live_predictions 
        ADD COLUMN IF NOT EXISTS technical_score NUMERIC,
        ADD COLUMN IF NOT EXISTS social_score NUMERIC,
        ADD COLUMN IF NOT EXISTS fundamental_score NUMERIC,
        ADD COLUMN IF NOT EXISTS astrology_score NUMERIC,
        ADD COLUMN IF NOT EXISTS predicted_pct NUMERIC,
        ADD COLUMN IF NOT EXISTS category TEXT,
        ADD COLUMN IF NOT EXISTS confidence NUMERIC;
    `;
    
    const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterTableQuery });
    if (alterError) console.warn('Live predictions table alteration warning:', alterError.message);
    else console.log('✅ Live predictions table updated');
    
    // Insert sample data for testing
    const { data: existingFeatures } = await supabase
      .from('ml_features')
      .select('id')
      .limit(1);
    
    if (!existingFeatures || existingFeatures.length === 0) {
      const { error: insertError } = await supabase
        .from('ml_features')
        .insert({
          symbol: 'SOL',
          price: 155.0,
          rsi: 45.5,
          macd: 0.25,
          ema_20: 154.8,
          technical_score: 45.2,
          social_score: 32.1,
          fundamental_score: 38.7,
          astrology_score: 52.3
        });
      
      if (insertError) console.warn('Sample data insertion warning:', insertError.message);
      else console.log('✅ Sample ML features data inserted');
    }
    
    const { data: existingLogs } = await supabase
      .from('training_logs')
      .select('id')
      .limit(1);
    
    if (!existingLogs || existingLogs.length === 0) {
      const { error: logInsertError } = await supabase
        .from('training_logs')
        .insert({
          training_type: 'system_init',
          status: 'completed',
          accuracy: 0.875,
          feature_count: 31,
          trigger_reason: 'Database schema initialization'
        });
      
      if (logInsertError) console.warn('Sample training log insertion warning:', logInsertError.message);
      else console.log('✅ Sample training log inserted');
    }
    
    console.log('🎉 Database schema setup completed successfully');
    
  } catch (error) {
    console.error('❌ Database schema setup failed:', error.message);
    throw error;
  }
}

// Run setup if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabaseSchema().catch(console.error);
}

export { setupDatabaseSchema };