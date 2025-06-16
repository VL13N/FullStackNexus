#!/usr/bin/env node

/**
 * Automated Model Retraining Trigger
 * Initiates ML model retraining based on backtest performance
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

class RetrainingService {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabase = null;
    
    if (this.supabaseUrl && this.supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }
  }

  /**
   * Trigger ML model retraining
   */
  async triggerMLTraining(fromDate, toDate) {
    try {
      console.log(`Initiating ML model retraining from ${fromDate} to ${toDate}`);
      
      const response = await fetch(`${this.baseUrl}/api/ml/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: 'SOL',
          startDate: fromDate,
          endDate: toDate,
          epochs: 100,
          batchSize: 32,
          validationSplit: 0.2
        }),
        timeout: 45 * 60 * 1000 // 45 minute timeout
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'ML training failed');
      }

      console.log('ML model retraining completed successfully');
      return result;
    } catch (error) {
      console.error('ML training failed:', error.message);
      throw error;
    }
  }

  /**
   * Trigger LSTM model retraining
   */
  async triggerLSTMTraining() {
    try {
      console.log('Initiating LSTM model retraining');
      
      const response = await fetch(`${this.baseUrl}/api/ml/lstm/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          epochs: 50,
          batchSize: 16,
          sequenceLength: 60
        }),
        timeout: 30 * 60 * 1000 // 30 minute timeout
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'LSTM training failed');
      }

      console.log('LSTM model retraining completed successfully');
      return result;
    } catch (error) {
      console.error('LSTM training failed:', error.message);
      throw error;
    }
  }

  /**
   * Trigger HPO optimization
   */
  async triggerHPOOptimization() {
    try {
      console.log('Initiating hyperparameter optimization');
      
      const response = await fetch(`${this.baseUrl}/api/ml/hpo/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_type: 'ensemble',
          n_trials: 50,
          timeout: 1800 // 30 minutes
        }),
        timeout: 35 * 60 * 1000 // 35 minute timeout
      });

      const result = await response.json();
      
      if (!result.success) {
        console.warn('HPO optimization failed:', result.error);
        return { success: false, error: result.error };
      }

      console.log('HPO optimization completed successfully');
      return result;
    } catch (error) {
      console.warn('HPO optimization failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store retraining results
   */
  async storeRetrainingResult(fromDate, toDate, results) {
    if (!this.supabase) {
      console.log('Retraining completed - Supabase not configured for persistence');
      return;
    }

    try {
      const retrainingRecord = {
        retrain_id: `retrain_${Date.now()}`,
        from_date: fromDate,
        to_date: toDate,
        ml_training_success: results.mlTraining?.success || false,
        lstm_training_success: results.lstmTraining?.success || false,
        hpo_optimization_success: results.hpoOptimization?.success || false,
        ml_accuracy: results.mlTraining?.accuracy || null,
        lstm_accuracy: results.lstmTraining?.accuracy || null,
        training_duration_seconds: results.totalDuration || 0,
        triggered_by: 'backtest_performance',
        created_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('retraining_history')
        .insert(retrainingRecord);

      if (error && error.code !== 'PGRST116') {
        console.warn('Failed to store retraining record:', error.message);
      } else {
        console.log('Retraining results stored successfully');
      }
    } catch (error) {
      console.warn('Storage error:', error.message);
    }
  }

  /**
   * Run complete retraining process
   */
  async runRetraining(fromDate, toDate) {
    const startTime = Date.now();
    const results = {
      mlTraining: null,
      lstmTraining: null,
      hpoOptimization: null,
      totalDuration: 0
    };

    try {
      console.log('Starting comprehensive model retraining process');
      
      // Step 1: ML model retraining
      try {
        results.mlTraining = await this.triggerMLTraining(fromDate, toDate);
      } catch (error) {
        results.mlTraining = { success: false, error: error.message };
      }

      // Step 2: LSTM model retraining
      try {
        results.lstmTraining = await this.triggerLSTMTraining();
      } catch (error) {
        results.lstmTraining = { success: false, error: error.message };
      }

      // Step 3: HPO optimization (optional, may fail without affecting overall success)
      results.hpoOptimization = await this.triggerHPOOptimization();

      // Calculate total duration
      results.totalDuration = Math.floor((Date.now() - startTime) / 1000);

      // Store results
      await this.storeRetrainingResult(fromDate, toDate, results);

      // Generate report
      this.generateRetrainingReport(results);

      // Determine overall success
      const overallSuccess = results.mlTraining?.success || results.lstmTraining?.success;
      
      return {
        success: overallSuccess,
        results: results,
        message: overallSuccess ? 'Retraining completed successfully' : 'Retraining failed for all models'
      };

    } catch (error) {
      console.error('Retraining process failed:', error.message);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }

  /**
   * Generate retraining performance report
   */
  generateRetrainingReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 MODEL RETRAINING REPORT');
    console.log('='.repeat(60));
    
    console.log(`ML Training: ${results.mlTraining?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (results.mlTraining?.accuracy) {
      console.log(`  Accuracy: ${(results.mlTraining.accuracy * 100).toFixed(2)}%`);
    }
    if (results.mlTraining?.error) {
      console.log(`  Error: ${results.mlTraining.error}`);
    }
    
    console.log(`LSTM Training: ${results.lstmTraining?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (results.lstmTraining?.accuracy) {
      console.log(`  Accuracy: ${(results.lstmTraining.accuracy * 100).toFixed(2)}%`);
    }
    if (results.lstmTraining?.error) {
      console.log(`  Error: ${results.lstmTraining.error}`);
    }
    
    console.log(`HPO Optimization: ${results.hpoOptimization?.success ? '✅ SUCCESS' : '⚠️ SKIPPED'}`);
    if (results.hpoOptimization?.error) {
      console.log(`  Info: ${results.hpoOptimization.error}`);
    }
    
    console.log(`Total Duration: ${results.totalDuration} seconds`);
    console.log('='.repeat(60));

    const successCount = [
      results.mlTraining?.success,
      results.lstmTraining?.success,
      results.hpoOptimization?.success
    ].filter(Boolean).length;

    if (successCount >= 2) {
      console.log('✅ EXCELLENT: Multiple models retrained successfully');
    } else if (successCount === 1) {
      console.log('⚠️ PARTIAL: At least one model retrained successfully');
    } else {
      console.log('❌ FAILED: No models were successfully retrained');
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const fromDate = process.argv[2] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = process.argv[3] || new Date().toISOString().split('T')[0];
  
  const service = new RetrainingService();
  service.runRetraining(fromDate, toDate).then(result => {
    if (result.success) {
      console.log('\n✅ Automated retraining completed successfully');
      process.exit(0);
    } else {
      console.error('\n❌ Automated retraining failed:', result.error);
      process.exit(1);
    }
  });
}

export default RetrainingService;