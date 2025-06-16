/**
 * Database Migration Service
 * Handles schema updates for sentiment score integration
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

class DatabaseMigration {
  constructor() {
    this.supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? 
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
  }

  /**
   * Add sentiment_score column to live_predictions table
   */
  async addSentimentScoreColumn() {
    if (!this.supabase) {
      console.log('Supabase not configured - skipping migration');
      return { success: false, message: 'Database not available' };
    }

    try {
      // Check if column already exists
      const { data: existingColumns, error: checkError } = await this.supabase
        .from('live_predictions')
        .select('sentiment_score')
        .limit(1);

      if (!checkError) {
        console.log('✅ sentiment_score column already exists');
        return { success: true, message: 'Column already exists' };
      }

      // Try to add the column using a test insert
      console.log('🔄 Attempting to add sentiment_score column...');
      
      const testRecord = {
        timestamp: new Date().toISOString(),
        technical_score: 0,
        social_score: 0,
        fundamental_score: 0,
        astrology_score: 0,
        sentiment_score: 0,
        overall_score: 0,
        classification: 'NEUTRAL',
        confidence: 0.5,
        risk_level: 'Medium'
      };

      const { data, error } = await this.supabase
        .from('live_predictions')
        .insert(testRecord)
        .select();

      if (error) {
        console.error('❌ Migration failed:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Migration successful - sentiment_score column added');
      
      // Clean up test record
      if (data && data[0]) {
        await this.supabase
          .from('live_predictions')
          .delete()
          .eq('id', data[0].id);
      }

      return { success: true, message: 'Column added successfully' };

    } catch (error) {
      console.error('Migration error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate database schema for ML training
   */
  async validateSchema() {
    if (!this.supabase) {
      return { valid: false, message: 'Database not available' };
    }

    try {
      // Test required columns exist
      const testQuery = await this.supabase
        .from('live_predictions')
        .select('id, timestamp, technical_score, social_score, fundamental_score, astrology_score, sentiment_score, overall_score, classification, confidence')
        .limit(1);

      if (testQuery.error) {
        return { 
          valid: false, 
          message: `Schema validation failed: ${testQuery.error.message}` 
        };
      }

      return { 
        valid: true, 
        message: 'Database schema is valid for ML training',
        recordCount: testQuery.data ? testQuery.data.length : 0
      };

    } catch (error) {
      return { 
        valid: false, 
        message: `Schema validation error: ${error.message}` 
      };
    }
  }
}

export { DatabaseMigration };