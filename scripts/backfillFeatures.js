#!/usr/bin/env node

/**
 * Feature Vector Backfill Script
 * Generates 365 days of hourly feature vectors for ML training data
 * Calls /api/features/generate endpoint and stores results in Supabase
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

class FeatureBackfillService {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabase = null;
    
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      startTime: Date.now()
    };

    if (this.supabaseUrl && this.supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      console.log('✅ Supabase persistence enabled');
    } else {
      console.warn('⚠️ Supabase not configured - features will not be persisted');
    }
  }

  /**
   * Generate timestamps for the last 365 days in hourly intervals
   */
  generateTimestamps() {
    const timestamps = [];
    const now = new Date();
    const endTime = new Date(now);
    const startTime = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)); // 365 days ago

    console.log(`📅 Generating timestamps from ${startTime.toISOString()} to ${endTime.toISOString()}`);

    let currentTime = new Date(startTime);
    while (currentTime <= endTime) {
      timestamps.push(new Date(currentTime));
      currentTime.setHours(currentTime.getHours() + 1); // Add 1 hour
    }

    console.log(`📊 Generated ${timestamps.length} hourly timestamps`);
    return timestamps;
  }

  /**
   * Check if feature vector already exists for timestamp
   */
  async featureExists(timestamp) {
    if (!this.supabase) return false;

    try {
      const { data, error } = await this.supabase
        .from('feature_vectors')
        .select('id')
        .eq('timestamp', timestamp.toISOString())
        .limit(1);

      if (error) {
        console.warn(`Database check failed for ${timestamp.toISOString()}: ${error.message}`);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.warn(`Feature existence check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate feature vector for specific timestamp
   */
  async generateFeatureVector(timestamp, symbol = 'SOL') {
    try {
      const response = await fetch(`${this.baseUrl}/api/features/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          timestamp: timestamp.toISOString(),
          backfill: true
        }),
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Feature generation failed: ${error.message}`);
    }
  }

  /**
   * Store feature vector in database
   */
  async storeFeatureVector(timestamp, featureData) {
    if (!this.supabase) {
      console.log(`📝 Feature vector generated for ${timestamp.toISOString()} (no storage)`);
      return true;
    }

    try {
      const { data, error } = await this.supabase
        .from('feature_vectors')
        .insert({
          timestamp: timestamp.toISOString(),
          symbol: 'SOL',
          features: featureData.data,
          processing_time_ms: featureData.processing_time_ms,
          data_quality_score: featureData.data?.data_quality_score || 0.8,
          feature_completeness: featureData.data?.feature_completeness || 0.9,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log(`✅ Feature vector stored for ${timestamp.toISOString()}`);
      return true;
    } catch (error) {
      console.error(`❌ Storage failed for ${timestamp.toISOString()}: ${error.message}`);
      return false;
    }
  }

  /**
   * Process single timestamp
   */
  async processTimestamp(timestamp) {
    this.stats.total++;

    try {
      // Check if already exists
      const exists = await this.featureExists(timestamp);
      if (exists) {
        console.log(`⏭️ Skipping ${timestamp.toISOString()} (already exists)`);
        this.stats.skipped++;
        return true;
      }

      // Generate feature vector
      console.log(`🔄 Processing ${timestamp.toISOString()}...`);
      const featureData = await this.generateFeatureVector(timestamp);

      if (!featureData.success) {
        throw new Error(featureData.error || 'Feature generation failed');
      }

      // Store in database
      const stored = await this.storeFeatureVector(timestamp, featureData);
      
      if (stored) {
        this.stats.successful++;
        return true;
      } else {
        this.stats.failed++;
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed ${timestamp.toISOString()}: ${error.message}`);
      this.stats.failed++;
      return false;
    }
  }

  /**
   * Process timestamps in batches with delay
   */
  async processBatch(timestamps, batchSize = 10, delayMs = 1000) {
    console.log(`🚀 Processing ${timestamps.length} timestamps in batches of ${batchSize}`);

    for (let i = 0; i < timestamps.length; i += batchSize) {
      const batch = timestamps.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(timestamps.length / batchSize)}`);
      
      // Process batch in parallel
      const promises = batch.map(timestamp => this.processTimestamp(timestamp));
      await Promise.allSettled(promises);

      // Progress report
      const progress = ((i + batchSize) / timestamps.length * 100).toFixed(1);
      const elapsed = (Date.now() - this.stats.startTime) / 1000;
      const eta = elapsed / (i + batchSize) * (timestamps.length - i - batchSize);
      
      console.log(`📊 Progress: ${progress}% | Successful: ${this.stats.successful} | Failed: ${this.stats.failed} | Skipped: ${this.stats.skipped}`);
      console.log(`⏱️ Elapsed: ${elapsed.toFixed(0)}s | ETA: ${eta.toFixed(0)}s`);

      // Delay between batches to avoid overwhelming the API
      if (i + batchSize < timestamps.length) {
        console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  /**
   * Generate final report
   */
  generateReport() {
    const totalTime = (Date.now() - this.stats.startTime) / 1000;
    const successRate = (this.stats.successful / this.stats.total * 100).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('📋 BACKFILL COMPLETION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Timestamps: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.successful} (${successRate}%)`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Total Time: ${totalTime.toFixed(0)} seconds`);
    console.log(`Average: ${(totalTime / this.stats.total).toFixed(2)}s per timestamp`);
    console.log('='.repeat(60));

    if (this.stats.failed > 0) {
      console.log('⚠️ Some timestamps failed - consider re-running for failed entries');
    } else {
      console.log('✅ All timestamps processed successfully!');
    }
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 Starting Feature Vector Backfill Process');
    console.log(`📍 Target: ${this.baseUrl}`);
    console.log(`🗓️ Duration: 365 days of hourly data`);
    
    try {
      // Generate timestamps
      const timestamps = this.generateTimestamps();
      
      // Process in batches
      await this.processBatch(timestamps, 5, 2000); // 5 per batch, 2s delay
      
      // Generate report
      this.generateReport();
      
      process.exit(0);
    } catch (error) {
      console.error('💥 Backfill process failed:', error);
      process.exit(1);
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const backfiller = new FeatureBackfillService();
  backfiller.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default FeatureBackfillService;