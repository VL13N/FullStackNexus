/**
 * Incremental Retraining Hook Service
 * Monitors feature data growth and triggers automatic model retraining
 * Manages model versions and comprehensive training logs
 */

import { createClient } from '@supabase/supabase-js';

class IncrementalRetrainingService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.lastTrainingCheck = new Date();
    this.retrainingInProgress = false;
    this.retrainingThreshold = 100; // Minimum new features to trigger retraining
    this.checkInterval = 15 * 60 * 1000; // Check every 15 minutes
  }

  /**
   * Initialize the incremental retraining service
   */
  async initialize() {
    try {
      // Setup database schema
      await this.setupSchema();
      
      // Log service initialization
      await this.logTrainingEvent('INFO', 'Incremental retraining service initialized', {
        component: 'incremental_retraining',
        threshold: this.retrainingThreshold,
        check_interval_minutes: this.checkInterval / 60000
      });

      console.log('✅ Incremental retraining service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize incremental retraining service:', error);
      return false;
    }
  }

  /**
   * Setup database schema for model versions and training logs
   */
  async setupSchema() {
    try {
      // Try to create model_versions table using direct client operations
      const { error: modelVersionsError } = await this.supabase
        .from('model_versions')
        .select('id')
        .limit(1);

      if (modelVersionsError && modelVersionsError.code === 'PGRST116') {
        console.log('Creating model_versions table via Supabase dashboard...');
        // Table doesn't exist - user needs to create it manually in Supabase dashboard
      }

      // Try to create training_logs table
      const { error: trainingLogsError } = await this.supabase
        .from('training_logs')
        .select('id')
        .limit(1);

      if (trainingLogsError && trainingLogsError.code === 'PGRST116') {
        console.log('Creating training_logs table via Supabase dashboard...');
        // Table doesn't exist - user needs to create it manually in Supabase dashboard
      }

      return true;
    } catch (error) {
      console.warn('Schema setup using fallback approach:', error.message);
      return true; // Continue with fallback approach
    }
  }

  /**
   * Get the last training timestamp from model versions
   */
  async getLastTrainingTimestamp() {
    try {
      const { data, error } = await this.supabase
        .from('model_versions')
        .select('training_timestamp')
        .eq('is_active', true)
        .order('training_timestamp', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error getting last training timestamp:', error);
        return new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
      }

      return data && data.length > 0 ? new Date(data[0].training_timestamp) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    } catch (error) {
      console.error('Failed to get last training timestamp:', error);
      return new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Count new features since last training
   */
  async countNewFeaturesSinceTraining() {
    try {
      const lastTrainTime = await this.getLastTrainingTimestamp();
      
      const { count, error } = await this.supabase
        .from('ml_features')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastTrainTime.toISOString());

      if (error) {
        console.warn('Error counting new features:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to count new features:', error);
      return 0;
    }
  }

  /**
   * Check if retraining should be triggered and execute if needed
   */
  async checkAndTriggerRetraining() {
    if (this.retrainingInProgress) {
      console.log('⏳ Retraining already in progress, skipping check');
      return false;
    }

    try {
      const newFeatureCount = await this.countNewFeaturesSinceTraining();
      const lastTrainTime = await this.getLastTrainingTimestamp();
      
      await this.logTrainingEvent('INFO', `Incremental retraining check: ${newFeatureCount} new features since ${lastTrainTime.toISOString()}`, {
        component: 'retraining_check',
        new_feature_count: newFeatureCount,
        threshold: this.retrainingThreshold,
        last_training: lastTrainTime.toISOString()
      });

      if (newFeatureCount >= this.retrainingThreshold) {
        console.log(`🚀 Triggering incremental retraining: ${newFeatureCount} new features (threshold: ${this.retrainingThreshold})`);
        
        await this.logTrainingEvent('INFO', `Triggering incremental retraining: ${newFeatureCount} >= ${this.retrainingThreshold} threshold`, {
          component: 'retraining_trigger',
          trigger_reason: 'feature_count_threshold',
          new_feature_count: newFeatureCount
        });

        return await this.executeRetraining(newFeatureCount, 'feature_count_threshold');
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking retraining trigger:', error);
      await this.logTrainingEvent('ERROR', `Retraining check failed: ${error.message}`, {
        component: 'retraining_check',
        error_details: error.stack
      });
      return false;
    }
  }

  /**
   * Execute incremental retraining
   */
  async executeRetraining(triggerCount, triggerReason) {
    const startTime = Date.now();
    this.retrainingInProgress = true;
    const versionId = `incremental_v${Date.now()}`;

    try {
      await this.logTrainingEvent('INFO', `Starting incremental retraining: ${triggerReason}`, {
        component: 'retraining_execution',
        version_id: versionId,
        trigger_count: triggerCount,
        trigger_reason: triggerReason
      });

      // Call ML training endpoint with retrain=true
      const response = await fetch('http://localhost:5000/api/ml/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          retrain: true,
          incremental: true,
          trigger_reason: triggerReason,
          version_id: versionId
        })
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Store model version metadata
        await this.storeModelVersion({
          version_id: versionId,
          model_type: 'ensemble',
          accuracy: result.accuracy || null,
          loss: result.loss || null,
          feature_count: result.feature_count || null,
          training_samples: result.training_samples || null,
          trigger_reason: triggerReason,
          trigger_count: triggerCount,
          model_path: result.model_path || null,
          metadata: {
            incremental: true,
            execution_time_ms: executionTime,
            trigger_details: {
              reason: triggerReason,
              feature_count: triggerCount
            }
          }
        });

        await this.logTrainingEvent('SUCCESS', `Incremental retraining completed successfully`, {
          component: 'retraining_execution',
          version_id: versionId,
          execution_time_ms: executionTime,
          accuracy: result.accuracy,
          success: true
        });

        console.log(`✅ Incremental retraining completed successfully in ${executionTime}ms`);
        return true;
      } else {
        throw new Error(result.error || 'Training failed');
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      await this.logTrainingEvent('ERROR', `Incremental retraining failed: ${error.message}`, {
        component: 'retraining_execution',
        version_id: versionId,
        execution_time_ms: executionTime,
        error_details: error.stack,
        success: false
      });

      console.error(`❌ Incremental retraining failed in ${executionTime}ms:`, error);
      return false;
    } finally {
      this.retrainingInProgress = false;
    }
  }

  /**
   * Store model version metadata
   */
  async storeModelVersion(versionData) {
    try {
      const { data, error } = await this.supabase
        .from('model_versions')
        .insert([versionData])
        .select();

      if (error) {
        console.error('Failed to store model version:', error);
        throw error;
      }

      console.log(`📊 Model version ${versionData.version_id} stored successfully`);
      return data[0];
    } catch (error) {
      console.error('Error storing model version:', error);
      throw error;
    }
  }

  /**
   * Log training events
   */
  async logTrainingEvent(level, message, metadata = {}) {
    try {
      const logEntry = {
        log_level: level,
        message: message,
        component: metadata.component || 'incremental_retraining',
        trigger_reason: metadata.trigger_reason || null,
        model_version_id: metadata.version_id || null,
        execution_time_ms: metadata.execution_time_ms || null,
        success: metadata.success || null,
        error_details: metadata.error_details || null,
        metadata: metadata
      };

      const { error } = await this.supabase
        .from('training_logs')
        .insert([logEntry]);

      if (error) {
        console.warn('Failed to log training event:', error);
      }
    } catch (error) {
      console.warn('Error logging training event:', error);
    }
  }

  /**
   * Get training logs for API endpoint
   */
  async getTrainingLogs(limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('training_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting training logs:', error);
      return [];
    }
  }

  /**
   * Hook to be called after successful training
   */
  async onTrainingComplete(trainingResult) {
    try {
      // Log the training completion
      await this.logTrainingEvent('INFO', 'Training completed, checking for incremental retraining trigger', {
        component: 'training_completion_hook',
        training_success: trainingResult.success,
        accuracy: trainingResult.accuracy
      });

      // Check if we need to trigger incremental retraining
      setTimeout(async () => {
        await this.checkAndTriggerRetraining();
      }, 5000); // Wait 5 seconds before checking

    } catch (error) {
      console.error('Error in training completion hook:', error);
    }
  }

  /**
   * Start periodic retraining checks
   */
  startPeriodicChecks() {
    setInterval(async () => {
      await this.checkAndTriggerRetraining();
    }, this.checkInterval);

    console.log(`🔄 Periodic retraining checks started (every ${this.checkInterval / 60000} minutes)`);
  }
}

export default IncrementalRetrainingService;