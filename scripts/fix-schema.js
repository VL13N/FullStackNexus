/**
 * Direct Schema Fix Script
 * Adds missing columns to live_predictions table using Supabase client
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixSchema() {
  console.log('🔄 Fixing live_predictions table schema...');
  
  try {
    // First approach: Use PostgREST direct SQL execution
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE public.live_predictions
            ADD COLUMN IF NOT EXISTS technical_score NUMERIC,
            ADD COLUMN IF NOT EXISTS social_score NUMERIC,
            ADD COLUMN IF NOT EXISTS fundamental_score NUMERIC,
            ADD COLUMN IF NOT EXISTS astrology_score NUMERIC,
            ADD COLUMN IF NOT EXISTS predicted_pct NUMERIC,
            ADD COLUMN IF NOT EXISTS category TEXT,
            ADD COLUMN IF NOT EXISTS confidence NUMERIC;
        `
      })
    });

    if (response.ok) {
      console.log('✅ Schema migration successful via PostgREST');
      
      // Verify the columns exist
      const { data, error } = await supabase
        .from('live_predictions')
        .select('technical_score, social_score, fundamental_score, astrology_score, predicted_pct, category, confidence')
        .limit(1);
      
      if (!error) {
        console.log('✅ Column verification successful - all columns exist');
      } else {
        console.warn('Column verification warning:', error.message);
      }
      
    } else {
      const errorText = await response.text();
      console.error('PostgREST migration failed:', errorText);
      
      // Fallback: Try Supabase RPC approach
      console.log('🔄 Trying alternative RPC approach...');
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.live_predictions
            ADD COLUMN IF NOT EXISTS technical_score NUMERIC,
            ADD COLUMN IF NOT EXISTS social_score NUMERIC,
            ADD COLUMN IF NOT EXISTS fundamental_score NUMERIC,
            ADD COLUMN IF NOT EXISTS astrology_score NUMERIC,
            ADD COLUMN IF NOT EXISTS predicted_pct NUMERIC,
            ADD COLUMN IF NOT EXISTS category TEXT,
            ADD COLUMN IF NOT EXISTS confidence NUMERIC;
        `
      });
      
      if (error) {
        console.error('RPC migration also failed:', error);
        process.exit(1);
      } else {
        console.log('✅ Schema migration successful via RPC');
      }
    }
    
  } catch (err) {
    console.error('Schema fix error:', err.message);
    process.exit(1);
  }
}

fixSchema();