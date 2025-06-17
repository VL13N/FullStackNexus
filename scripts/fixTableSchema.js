/**
 * Fix live_predictions table schema by adding missing astro_score column
 */

import { createClient } from '@supabase/supabase-js';

async function fixTableSchema() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Try to insert a test record to see what columns are missing
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
      console.log('Schema error detected:', error.message);
      
      if (error.message.includes('astro_score')) {
        console.log('Missing astro_score column - using direct database modification approach');
        
        // Use PostgreSQL connection directly
        const { Client } = await import('pg');
        const client = new Client({
          connectionString: process.env.DATABASE_URL
        });
        
        await client.connect();
        
        const alterQuery = `
          ALTER TABLE live_predictions 
          ADD COLUMN IF NOT EXISTS astro_score DECIMAL(5,2);
        `;
        
        await client.query(alterQuery);
        await client.end();
        
        console.log('✅ astro_score column added via direct PostgreSQL connection');
      }
    } else {
      console.log('✅ Schema is correct - test record inserted successfully');
      
      // Clean up test record
      if (data && data.length > 0) {
        await supabase
          .from('live_predictions')
          .delete()
          .eq('id', data[0].id);
        console.log('Test record cleaned up');
      }
    }
    
  } catch (err) {
    console.log('Error:', err.message);
  }
}

fixTableSchema();