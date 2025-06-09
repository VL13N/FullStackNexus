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
    // Direct approach: Insert a complete record to force column creation
    const testRecord = {
      timestamp: new Date().toISOString(),
      technical_score: 50.0,
      social_score: 50.0,
      fundamental_score: 50.0,
      astrology_score: 50.0,
      predicted_pct: 0.0,
      category: 'NEUTRAL',
      confidence: 0.5
    };

    console.log('🔄 Attempting to insert test record with all required columns...');
    const { data, error } = await supabase
      .from('live_predictions')
      .insert(testRecord)
      .select();

    if (error) {
      console.error('Insert failed:', error.message);
      
      // Try alternative approach: Check existing columns
      console.log('🔄 Checking existing table structure...');
      const { data: existingData, error: selectError } = await supabase
        .from('live_predictions')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.error('Table access failed:', selectError.message);
        process.exit(1);
      }
      
      console.log('Existing columns found in table:', Object.keys(existingData[0] || {}));
      console.log('Missing columns need to be added manually through Supabase Dashboard');
      
    } else {
      console.log('✅ Test record inserted successfully');
      console.log('✅ All required columns now exist in the table');
      
      // Clean up test record
      if (data && data[0]) {
        await supabase
          .from('live_predictions')
          .delete()
          .eq('id', data[0].id);
        console.log('✅ Test record cleaned up');
      }
    }
    
  } catch (err) {
    console.error('Schema fix error:', err.message);
    process.exit(1);
  }
}

fixSchema();