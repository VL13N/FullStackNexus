/**
 * Schema Migration Script
 * Adds missing pillar score columns to live_predictions table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateSchema() {
  console.log('🔄 Starting schema migration...');
  
  try {
    // Use Supabase RPC to execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.live_predictions
          ADD COLUMN IF NOT EXISTS technical_score NUMERIC,
          ADD COLUMN IF NOT EXISTS social_score NUMERIC,
          ADD COLUMN IF NOT EXISTS fundamental_score NUMERIC,
          ADD COLUMN IF NOT EXISTS astrology_score NUMERIC;
      `
    });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Schema migration completed successfully');
    
    // Verify columns exist
    const { data: columns, error: columnError } = await supabase
      .from('live_predictions')
      .select('technical_score, social_score, fundamental_score, astrology_score')
      .limit(1);
    
    if (!columnError) {
      console.log('✅ Column verification successful');
    } else {
      console.warn('Column verification warning:', columnError.message);
    }
    
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrateSchema();