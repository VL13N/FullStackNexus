/**
 * Create live_predictions table with proper schema
 */

import { createClient } from '@supabase/supabase-js';

async function createPredictionsTable() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Create the table using direct SQL execution
    const { data, error } = await supabase
      .from('live_predictions')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('Creating live_predictions table...');
      
      // Use raw SQL to create table
      const createTableSQL = `
        CREATE TABLE live_predictions (
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
      
      // Execute table creation via Supabase SQL editor approach
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql: createTableSQL })
      });
      
      if (response.ok) {
        console.log('✅ live_predictions table created successfully');
      } else {
        console.log('Table creation response:', await response.text());
      }
    } else {
      console.log('✅ live_predictions table already exists');
    }
    
  } catch (err) {
    console.log('Error:', err.message);
  }
}

createPredictionsTable();