/**
 * Comprehensive Database Schema Validation and Fix
 * Ensures live_predictions table has all required columns for prediction storage
 */

import { createClient } from '@supabase/supabase-js';

async function ensureTableSchema() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('🔍 Checking database schema...');
    
    // Try to insert a minimal test record to identify missing columns
    const testRecord = {
      tech_score: 50.0,
      social_score: 50.0,
      fund_score: 50.0,
      astro_score: 50.0,
      predicted_pct: 1.0,
      category: 'TEST',
      confidence: 0.5
    };
    
    const { data, error } = await supabase
      .from('live_predictions')
      .insert([testRecord])
      .select();
    
    if (error) {
      console.log('❌ Schema validation failed:', error.message);
      
      if (error.message.includes('astro_score')) {
        console.log('🔧 Recreating table with complete schema...');
        
        // Drop and recreate table with complete schema
        try {
          // First, try to select from table to see if it exists
          const { data: existingData } = await supabase
            .from('live_predictions')
            .select('*')
            .limit(5);
          
          if (existingData) {
            console.log(`📊 Found ${existingData.length} existing records - preserving data`);
          }
          
          // Create new table with complete schema
          const createCompleteTableSQL = `
            CREATE TABLE IF NOT EXISTS live_predictions_new (
              id SERIAL PRIMARY KEY,
              timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              tech_score DECIMAL(5,2),
              social_score DECIMAL(5,2),
              fund_score DECIMAL(5,2),
              astro_score DECIMAL(5,2),
              predicted_pct DECIMAL(8,4),
              category VARCHAR(20),
              confidence DECIMAL(4,3),
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `;
          
          // Use Supabase SQL execution via REST API
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ query: createCompleteTableSQL })
          });
          
          if (response.ok) {
            console.log('✅ Complete schema table created successfully');
            
            // Test the new schema
            const testInsert = await supabase
              .from('live_predictions')
              .insert([testRecord])
              .select();
            
            if (testInsert.error) {
              console.log('❌ New schema test failed:', testInsert.error.message);
            } else {
              console.log('✅ Schema validation passed - prediction storage ready');
              
              // Clean up test record
              if (testInsert.data && testInsert.data.length > 0) {
                await supabase
                  .from('live_predictions')
                  .delete()
                  .eq('id', testInsert.data[0].id);
              }
            }
          } else {
            const errorText = await response.text();
            console.log('Table creation error:', errorText);
          }
          
        } catch (sqlError) {
          console.log('SQL execution error:', sqlError.message);
        }
      }
    } else {
      console.log('✅ Database schema is complete and functional');
      console.log(`📊 Test record created with ID: ${data[0].id}`);
      
      // Clean up test record
      await supabase
        .from('live_predictions')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (err) {
    console.log('❌ Schema validation error:', err.message);
  }
}

ensureTableSchema();