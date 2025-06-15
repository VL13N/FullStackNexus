/**
 * Model Training Scheduler
 * Automated daily retraining of ensemble and LSTM models with Optuna optimization
 */

import cron from 'node-cron';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class ModelTrainingScheduler {
  constructor() {
    this.isRunning = false;
    this.lastTrainingTime = null;
    this.trainingLogs = [];
    this.maxLogEntries = 100;
  }

  /**
   * Start the automated training scheduler
   * Runs daily at 3:00 AM UTC to avoid peak usage hours
   */
  start() {
    console.log('🤖 Starting automated model training scheduler...');
    
    // Daily retraining at 3:00 AM UTC
    cron.schedule('0 3 * * *', async () => {
      await this.runDailyTraining();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Optional: Weekly deep retraining with more Optuna trials on Sundays at 2:00 AM UTC
    cron.schedule('0 2 * * 0', async () => {
      await this.runWeeklyDeepTraining();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('✅ Model training scheduler started - Daily at 03:00 UTC, Weekly deep training on Sundays at 02:00 UTC');
  }

  /**
   * Run daily training routine
   */
  async runDailyTraining() {
    if (this.isRunning) {
      this.log('⚠️ Training already in progress, skipping scheduled run');
      return;
    }

    this.log('🚀 Starting daily automated model training...');
    this.isRunning = true;
    
    try {
      // Step 1: Pull latest feature vectors from Supabase
      this.log('📊 Pulling latest feature vectors from Supabase...');
      const featureData = await this.pullSupabaseFeatures();
      
      if (!featureData.success) {
        throw new Error(`Failed to pull features: ${featureData.error}`);
      }

      // Step 2: Retrain ensemble models
      this.log('🧠 Retraining ensemble models...');
      const ensembleResult = await this.retrainEnsembleModels(featureData.data);
      
      // Step 3: Retrain LSTM models
      this.log('🔮 Retraining LSTM models...');
      const lstmResult = await this.retrainLSTMModels(featureData.data);
      
      // Step 4: Run light Optuna optimization (50 trials)
      this.log('⚡ Running Optuna hyperparameter optimization (50 trials)...');
      const optunaResult = await this.runOptunaOptimization(featureData.data, 50);
      
      // Step 5: Serialize and deploy updated models
      this.log('💾 Serializing and deploying updated model artifacts...');
      const deployResult = await this.deployUpdatedModels();
      
      this.lastTrainingTime = new Date().toISOString();
      this.log(`✅ Daily training completed successfully at ${this.lastTrainingTime}`);
      this.log(`📈 Ensemble accuracy: ${ensembleResult.accuracy?.toFixed(3) || 'N/A'}`);
      this.log(`🎯 LSTM accuracy: ${lstmResult.accuracy?.toFixed(3) || 'N/A'}`);
      this.log(`🔧 Best Optuna score: ${optunaResult.best_value?.toFixed(3) || 'N/A'}`);
      
    } catch (error) {
      this.log(`❌ Daily training failed: ${error.message}`);
      console.error('Training error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run weekly deep training with more extensive optimization
   */
  async runWeeklyDeepTraining() {
    if (this.isRunning) {
      this.log('⚠️ Training already in progress, skipping weekly deep training');
      return;
    }

    this.log('🔬 Starting weekly deep training with extended optimization...');
    this.isRunning = true;
    
    try {
      // Pull features
      const featureData = await this.pullSupabaseFeatures();
      if (!featureData.success) {
        throw new Error(`Failed to pull features: ${featureData.error}`);
      }

      // Extended Optuna optimization (200 trials)
      this.log('🧪 Running extended Optuna optimization (200 trials)...');
      const optunaResult = await this.runOptunaOptimization(featureData.data, 200);
      
      // Full model retraining with optimized parameters
      this.log('🏗️ Full model retraining with optimized hyperparameters...');
      const ensembleResult = await this.retrainEnsembleModels(featureData.data, optunaResult.best_params);
      const lstmResult = await this.retrainLSTMModels(featureData.data, optunaResult.best_params);
      
      // Deploy optimized models
      await this.deployUpdatedModels();
      
      this.log(`🎉 Weekly deep training completed successfully`);
      this.log(`📊 Extended optimization trials: 200`);
      this.log(`🏆 Best validation score: ${optunaResult.best_value?.toFixed(3) || 'N/A'}`);
      
    } catch (error) {
      this.log(`❌ Weekly deep training failed: ${error.message}`);
      console.error('Deep training error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Pull latest feature vectors from Supabase
   */
  async pullSupabaseFeatures() {
    return new Promise((resolve, reject) => {
      const script = `
import sys
sys.path.append('/home/runner/workspace')
from services.dataService import pull_supabase_features
import json

try:
    result = pull_supabase_features()
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const python = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse feature data: ${e.message}`));
          }
        } else {
          reject(new Error(`Python script failed: ${stderr}`));
        }
      });

      // 5 minute timeout for data pulling
      setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error('Feature pulling timeout'));
      }, 300000);
    });
  }

  /**
   * Retrain ensemble models (XGBoost + Random Forest)
   */
  async retrainEnsembleModels(trainingData, optimizedParams = null) {
    return new Promise((resolve, reject) => {
      const paramsJson = optimizedParams ? JSON.stringify(optimizedParams) : 'null';
      
      const script = `
import sys
sys.path.append('/home/runner/workspace')
from services.ensemble_lite import EnsembleLite
import json

training_data = ${JSON.stringify(trainingData)}
optimized_params = ${paramsJson}

try:
    ensemble = EnsembleLite()
    result = ensemble.retrain(training_data, optimized_params)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const python = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse ensemble training result: ${e.message}`));
          }
        } else {
          reject(new Error(`Ensemble training failed: ${stderr}`));
        }
      });

      // 20 minute timeout for ensemble training
      setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error('Ensemble training timeout'));
      }, 1200000);
    });
  }

  /**
   * Retrain LSTM models using TensorFlow
   */
  async retrainLSTMModels(trainingData, optimizedParams = null) {
    return new Promise((resolve, reject) => {
      const paramsJson = optimizedParams ? JSON.stringify(optimizedParams) : 'null';
      
      const script = `
import sys
sys.path.append('/home/runner/workspace')
from services.advancedMLService import AdvancedMLService
import json

training_data = ${JSON.stringify(trainingData)}
optimized_params = ${paramsJson}

try:
    ml_service = AdvancedMLService()
    result = ml_service.retrain_lstm(training_data, optimized_params)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const python = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse LSTM training result: ${e.message}`));
          }
        } else {
          reject(new Error(`LSTM training failed: ${stderr}`));
        }
      });

      // 30 minute timeout for LSTM training
      setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error('LSTM training timeout'));
      }, 1800000);
    });
  }

  /**
   * Run Optuna hyperparameter optimization
   */
  async runOptunaOptimization(trainingData, nTrials = 50) {
    return new Promise((resolve, reject) => {
      const script = `
import sys
sys.path.append('/home/runner/workspace')
from scripts.tune import run_optimization
import json

training_data = ${JSON.stringify(trainingData)}
n_trials = ${nTrials}

try:
    result = run_optimization(training_data, n_trials)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const python = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Optuna result: ${e.message}`));
          }
        } else {
          reject(new Error(`Optuna optimization failed: ${stderr}`));
        }
      });

      // 45 minute timeout for optimization
      setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error('Optuna optimization timeout'));
      }, 2700000);
    });
  }

  /**
   * Deploy updated model artifacts for real-time serving
   */
  async deployUpdatedModels() {
    return new Promise((resolve, reject) => {
      const script = `
import sys
sys.path.append('/home/runner/workspace')
from services.modelDeployment import deploy_updated_models
import json

try:
    result = deploy_updated_models()
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const python = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse deployment result: ${e.message}`));
          }
        } else {
          reject(new Error(`Model deployment failed: ${stderr}`));
        }
      });

      // 10 minute timeout for deployment
      setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error('Model deployment timeout'));
      }, 600000);
    });
  }

  /**
   * Manual trigger for training (for testing or emergency retraining)
   */
  async triggerManualTraining(deepTraining = false) {
    if (deepTraining) {
      return await this.runWeeklyDeepTraining();
    } else {
      return await this.runDailyTraining();
    }
  }

  /**
   * Get training status and logs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastTrainingTime: this.lastTrainingTime,
      recentLogs: this.trainingLogs.slice(-10),
      totalLogEntries: this.trainingLogs.length
    };
  }

  /**
   * Add log entry with timestamp
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(logEntry);
    this.trainingLogs.push(logEntry);
    
    // Keep only recent logs
    if (this.trainingLogs.length > this.maxLogEntries) {
      this.trainingLogs = this.trainingLogs.slice(-this.maxLogEntries);
    }
  }

  /**
   * Export logs to file
   */
  async exportLogs() {
    const logData = {
      exportTime: new Date().toISOString(),
      status: this.getStatus(),
      fullLogs: this.trainingLogs
    };
    
    const logPath = path.join(process.cwd(), 'logs', `training_logs_${Date.now()}.json`);
    
    // Ensure logs directory exists
    const logsDir = path.dirname(logPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    return logPath;
  }
}

// Singleton instance
const modelTrainingScheduler = new ModelTrainingScheduler();

export default modelTrainingScheduler;