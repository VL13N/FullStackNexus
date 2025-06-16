#!/usr/bin/env node

/**
 * Feature Backfill Scheduler
 * Sets up automated cron jobs for continuous feature vector generation
 */

import cron from 'node-cron';
import FeatureBackfillService from './backfillFeatures.js';
import { createClient } from '@supabase/supabase-js';

class BackfillScheduler {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabase = null;
    
    if (this.supabaseUrl && this.supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }
  }

  /**
   * Create feature_vectors table if it doesn't exist
   */
  async setupDatabase() {
    if (!this.supabase) {
      console.warn('Supabase not configured - skipping database setup');
      return;
    }

    try {
      // Create feature_vectors table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS feature_vectors (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          timestamp TIMESTAMPTZ NOT NULL,
          symbol VARCHAR(10) NOT NULL DEFAULT 'SOL',
          features JSONB NOT NULL,
          processing_time_ms INTEGER,
          data_quality_score DECIMAL(3,2) DEFAULT 0.8,
          feature_completeness DECIMAL(3,2) DEFAULT 0.9,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(timestamp, symbol)
        );
        
        CREATE INDEX IF NOT EXISTS idx_feature_vectors_timestamp ON feature_vectors(timestamp);
        CREATE INDEX IF NOT EXISTS idx_feature_vectors_symbol ON feature_vectors(symbol);
        CREATE INDEX IF NOT EXISTS idx_feature_vectors_created_at ON feature_vectors(created_at);
      `;

      const { error } = await this.supabase.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (error) {
        console.error('Database setup failed:', error.message);
        // Try direct table creation as fallback
        const { error: directError } = await this.supabase
          .from('feature_vectors')
          .select('id')
          .limit(1);
        
        if (directError && directError.code === 'PGRST116') {
          console.log('Creating feature_vectors table...');
          // Table doesn't exist, but we can't create it without proper permissions
          console.warn('Please create feature_vectors table manually in Supabase');
        }
      } else {
        console.log('Database schema ready');
      }
    } catch (error) {
      console.warn('Database setup warning:', error.message);
    }
  }

  /**
   * Run incremental backfill for recent missing data
   */
  async runIncrementalBackfill() {
    console.log('Starting incremental feature backfill...');
    
    try {
      const backfiller = new FeatureBackfillService();
      
      // Generate last 24 hours of timestamps
      const timestamps = [];
      const now = new Date();
      const startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

      let currentTime = new Date(startTime);
      while (currentTime <= now) {
        timestamps.push(new Date(currentTime));
        currentTime.setHours(currentTime.getHours() + 1);
      }

      console.log(`Processing ${timestamps.length} recent timestamps`);
      await backfiller.processBatch(timestamps, 3, 1500); // Smaller batches for incremental
      
    } catch (error) {
      console.error('Incremental backfill failed:', error);
    }
  }

  /**
   * Run full 365-day backfill
   */
  async runFullBackfill() {
    console.log('Starting full 365-day feature backfill...');
    
    try {
      const backfiller = new FeatureBackfillService();
      await backfiller.run();
    } catch (error) {
      console.error('Full backfill failed:', error);
    }
  }

  /**
   * Schedule automated jobs
   */
  startScheduler() {
    console.log('Starting feature backfill scheduler...');

    // Hourly incremental backfill at 5 minutes past the hour
    cron.schedule('5 * * * *', async () => {
      console.log('Running hourly incremental backfill...');
      await this.runIncrementalBackfill();
    });

    // Daily catch-up at 02:30 AM UTC
    cron.schedule('30 2 * * *', async () => {
      console.log('Running daily catch-up backfill...');
      await this.runIncrementalBackfill();
    });

    // Weekly deep backfill on Sundays at 01:00 AM UTC
    cron.schedule('0 1 * * 0', async () => {
      console.log('Running weekly deep backfill...');
      
      // Backfill last 7 days to catch any missed data
      const backfiller = new FeatureBackfillService();
      const timestamps = [];
      const now = new Date();
      const startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

      let currentTime = new Date(startTime);
      while (currentTime <= now) {
        timestamps.push(new Date(currentTime));
        currentTime.setHours(currentTime.getHours() + 1);
      }

      await backfiller.processBatch(timestamps, 5, 2000);
    });

    console.log('Backfill scheduler active:');
    console.log('- Hourly incremental: */5 * * * * (5 min past each hour)');
    console.log('- Daily catch-up: 30 2 * * * (02:30 UTC)');
    console.log('- Weekly deep: 0 1 * * 0 (Sunday 01:00 UTC)');
  }

  /**
   * Main execution
   */
  async run() {
    await this.setupDatabase();
    this.startScheduler();
    
    // Keep process alive
    console.log('Scheduler running... Press Ctrl+C to stop');
    process.on('SIGINT', () => {
      console.log('Stopping backfill scheduler...');
      process.exit(0);
    });
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const scheduler = new BackfillScheduler();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'full':
      scheduler.runFullBackfill();
      break;
    case 'incremental':
      scheduler.runIncrementalBackfill();
      break;
    case 'schedule':
      scheduler.run();
      break;
    case 'setup':
      scheduler.setupDatabase();
      break;
    default:
      console.log('Feature Backfill Scheduler');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/scheduleBackfill.js full        - Run full 365-day backfill');
      console.log('  node scripts/scheduleBackfill.js incremental - Run 24-hour incremental backfill');
      console.log('  node scripts/scheduleBackfill.js schedule    - Start automated scheduler');
      console.log('  node scripts/scheduleBackfill.js setup       - Setup database schema');
      console.log('');
      console.log('Environment Variables:');
      console.log('  SUPABASE_URL              - Supabase project URL');
      console.log('  SUPABASE_SERVICE_ROLE_KEY - Supabase service role key');
      console.log('  BASE_URL                  - API base URL (default: http://localhost:5000)');
      break;
  }
}

export default BackfillScheduler;