/**
 * Optuna Hyperparameter Optimization Service
 * JavaScript interface for Bayesian optimization using Python Optuna backend
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

class OptunaTuner {
  constructor() {
    this.pythonScript = path.join(process.cwd(), 'services', 'optunaTuner.py');
    this.studiesDir = path.join(process.cwd(), 'studies');
    this.currentTuningJob = null;
    
    // Ensure studies directory exists
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      await fs.mkdir(this.studiesDir, { recursive: true });
      console.log('✅ Optuna storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Optuna storage:', error);
    }
  }

  /**
   * Define search spaces for different optimization types
   */
  getSearchSpaces() {
    return {
      lstm: {
        description: "LSTM neural network hyperparameters",
        parameters: {
          lstm_units_1: { range: [64, 256], type: 'int', description: 'First LSTM layer units' },
          lstm_units_2: { range: [32, 128], type: 'int', description: 'Second LSTM layer units' },
          lstm_units_3: { range: [16, 64], type: 'int', description: 'Third LSTM layer units' },
          learning_rate: { range: [0.0001, 0.01], type: 'float', description: 'Learning rate' },
          dropout_rate: { range: [0.1, 0.5], type: 'float', description: 'Dropout rate' },
          batch_size: { range: [16, 64], type: 'int', description: 'Batch size' },
          sequence_length: { range: [30, 90], type: 'int', description: 'Sequence length' },
          dense_units: { range: [32, 128], type: 'int', description: 'Dense layer units' }
        }
      },
      
      ensemble: {
        description: "XGBoost ensemble hyperparameters", 
        parameters: {
          n_estimators: { range: [50, 300], type: 'int', description: 'Number of estimators' },
          max_depth: { range: [3, 12], type: 'int', description: 'Maximum tree depth' },
          learning_rate: { range: [0.01, 0.3], type: 'float', description: 'Learning rate' },
          subsample: { range: [0.6, 1.0], type: 'float', description: 'Subsample ratio' },
          colsample_bytree: { range: [0.6, 1.0], type: 'float', description: 'Feature subsample' },
          reg_alpha: { range: [0, 10], type: 'float', description: 'L1 regularization' },
          reg_lambda: { range: [1, 10], type: 'float', description: 'L2 regularization' },
          min_child_weight: { range: [1, 10], type: 'int', description: 'Minimum child weight' }
        }
      },
      
      hybrid: {
        description: "Hybrid ensemble + LSTM hyperparameters",
        parameters: {
          // XGBoost parameters
          xgb_n_estimators: { range: [50, 200], type: 'int', description: 'XGBoost estimators' },
          xgb_max_depth: { range: [3, 10], type: 'int', description: 'XGBoost max depth' },
          xgb_learning_rate: { range: [0.01, 0.2], type: 'float', description: 'XGBoost learning rate' },
          
          // LSTM parameters
          lstm_units_1: { range: [64, 192], type: 'int', description: 'LSTM layer 1 units' },
          lstm_units_2: { range: [32, 96], type: 'int', description: 'LSTM layer 2 units' },
          dropout_rate: { range: [0.1, 0.4], type: 'float', description: 'LSTM dropout rate' },
          learning_rate: { range: [0.0001, 0.005], type: 'float', description: 'LSTM learning rate' },
          
          // Ensemble weights
          xgb_weight: { range: [0.3, 0.8], type: 'float', description: 'XGBoost weight in ensemble' },
          confidence_threshold: { range: [0.1, 0.9], type: 'float', description: 'Confidence threshold' }
        }
      }
    };
  }

  /**
   * Start hyperparameter optimization study
   */
  async startOptimization(options = {}) {
    const {
      optimizationType = 'ensemble',
      nTrials = 50,
      studyName = null,
      timeout = 3600000 // 1 hour timeout
    } = options;

    try {
      console.log(`🔬 Starting ${optimizationType} optimization with ${nTrials} trials`);

      // Prepare data for optimization (if available)
      const dataDict = await this.prepareOptimizationData();

      return new Promise((resolve, reject) => {
        const args = ['start', optimizationType, nTrials.toString()];
        
        const pythonProcess = spawn('python3', [this.pythonScript, ...args], {
          stdio: ['inherit', 'pipe', 'pipe'],
          cwd: process.cwd()
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
          console.log(`[Optuna] ${data.toString().trim()}`);
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
          console.error(`[Optuna Error] ${data.toString().trim()}`);
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout.split('\n').find(line => line.startsWith('{')));
              console.log(`✅ Optimization completed with best value: ${result.best_value?.toFixed(4)}`);
              resolve(result);
            } catch (parseError) {
              console.log('✅ Optimization completed (output parsing failed)');
              resolve({ 
                success: true, 
                output: stdout,
                optimization_type: optimizationType,
                n_trials: nTrials
              });
            }
          } else {
            reject(new Error(`Optimization failed with code ${code}: ${stderr}`));
          }
        });

        pythonProcess.on('error', (error) => {
          reject(new Error(`Failed to start optimization: ${error.message}`));
        });

        // Set timeout
        setTimeout(() => {
          pythonProcess.kill();
          reject(new Error('Optimization timed out'));
        }, timeout);

        // Store current job reference
        this.currentTuningJob = {
          process: pythonProcess,
          startTime: new Date(),
          optimizationType,
          nTrials
        };
      });

    } catch (error) {
      console.error('❌ Failed to start optimization:', error);
      throw error;
    }
  }

  /**
   * Get current tuning status
   */
  async getTuningStatus() {
    try {
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [this.pythonScript, 'status'], {
          stdio: ['inherit', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const status = JSON.parse(stdout.trim());
              
              // Add current job info if available
              if (this.currentTuningJob) {
                status.current_job = {
                  optimization_type: this.currentTuningJob.optimizationType,
                  n_trials: this.currentTuningJob.nTrials,
                  start_time: this.currentTuningJob.startTime,
                  elapsed_minutes: Math.round((new Date() - this.currentTuningJob.startTime) / 60000)
                };
              }
              
              resolve(status);
            } catch (parseError) {
              resolve({ 
                active: false, 
                error: 'Status parsing failed',
                raw_output: stdout 
              });
            }
          } else {
            reject(new Error(`Status check failed: ${stderr}`));
          }
        });
      });

    } catch (error) {
      console.error('❌ Failed to get tuning status:', error);
      return { active: false, error: error.message };
    }
  }

  /**
   * Get optimization history
   */
  async getOptimizationHistory(studyName = null) {
    try {
      const args = ['history'];
      if (studyName) {
        args.push(studyName);
      }

      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [this.pythonScript, ...args], {
          stdio: ['inherit', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const history = JSON.parse(stdout.trim());
              resolve(history);
            } catch (parseError) {
              resolve([]);
            }
          } else {
            reject(new Error(`History retrieval failed: ${stderr}`));
          }
        });
      });

    } catch (error) {
      console.error('❌ Failed to get optimization history:', error);
      return [];
    }
  }

  /**
   * Get best parameters from completed studies
   */
  async getBestParameters(optimizationType = 'ensemble') {
    try {
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [this.pythonScript, 'best', optimizationType], {
          stdio: ['inherit', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout.trim());
              resolve(result);
            } catch (parseError) {
              resolve({ success: false, error: 'Output parsing failed' });
            }
          } else {
            reject(new Error(`Best parameters retrieval failed: ${stderr}`));
          }
        });
      });

    } catch (error) {
      console.error('❌ Failed to get best parameters:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prepare data for optimization (mock for now, integrate with real data service)
   */
  async prepareOptimizationData() {
    try {
      // In production, this would pull real data from Supabase
      // For now, we'll return a placeholder structure
      return {
        X_train: null,
        y_train: null,
        X_val: null,
        y_val: null,
        feature_names: ['technical_score', 'social_score', 'fundamental_score', 'astrology_score']
      };
    } catch (error) {
      console.error('❌ Failed to prepare optimization data:', error);
      return null;
    }
  }

  /**
   * Stop current tuning job
   */
  stopOptimization() {
    if (this.currentTuningJob && this.currentTuningJob.process) {
      this.currentTuningJob.process.kill();
      this.currentTuningJob = null;
      console.log('🛑 Optimization job stopped');
      return true;
    }
    return false;
  }

  /**
   * Get detailed study statistics
   */
  async getStudyStatistics(optimizationType = 'ensemble') {
    try {
      const history = await this.getOptimizationHistory(`solana_ml_optimization_${optimizationType}`);
      const best = await this.getBestParameters(optimizationType);

      if (!history || history.length === 0) {
        return {
          total_trials: 0,
          best_value: null,
          convergence_analysis: null
        };
      }

      // Calculate statistics
      const values = history.map(trial => trial.value).filter(v => v !== null);
      const trials = history.length;

      const statistics = {
        total_trials: trials,
        best_value: best.success ? best.best_value : Math.max(...values),
        mean_value: values.reduce((a, b) => a + b, 0) / values.length,
        std_value: Math.sqrt(values.reduce((a, b) => a + Math.pow(b - (values.reduce((c, d) => c + d, 0) / values.length), 2), 0) / values.length),
        improvement_rate: this.calculateImprovementRate(values),
        parameter_importance: await this.analyzeParameterImportance(history),
        convergence_analysis: {
          trials_to_best: this.findTrialsToBest(values),
          plateau_detection: this.detectPlateau(values)
        }
      };

      return statistics;

    } catch (error) {
      console.error('❌ Failed to get study statistics:', error);
      return { error: error.message };
    }
  }

  calculateImprovementRate(values) {
    if (values.length < 2) return 0;
    
    const firstQuarter = values.slice(0, Math.floor(values.length / 4));
    const lastQuarter = values.slice(-Math.floor(values.length / 4));
    
    const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
    
    return ((lastAvg - firstAvg) / firstAvg) * 100;
  }

  analyzeParameterImportance(history) {
    // Simplified parameter importance analysis
    const parameterFrequency = {};
    
    history.forEach(trial => {
      if (trial.params) {
        Object.keys(trial.params).forEach(param => {
          if (!parameterFrequency[param]) {
            parameterFrequency[param] = { count: 0, totalValue: 0 };
          }
          parameterFrequency[param].count++;
          parameterFrequency[param].totalValue += trial.value || 0;
        });
      }
    });

    return Object.entries(parameterFrequency).map(([param, data]) => ({
      parameter: param,
      frequency: data.count,
      avg_contribution: data.totalValue / data.count
    })).sort((a, b) => b.avg_contribution - a.avg_contribution);
  }

  findTrialsToBest(values) {
    let bestValue = -Infinity;
    let trialsToBest = 0;
    
    for (let i = 0; i < values.length; i++) {
      if (values[i] > bestValue) {
        bestValue = values[i];
        trialsToBest = i + 1;
      }
    }
    
    return trialsToBest;
  }

  detectPlateau(values, windowSize = 10) {
    if (values.length < windowSize * 2) return false;
    
    const recentValues = values.slice(-windowSize);
    const recentVariance = this.calculateVariance(recentValues);
    
    return recentVariance < 0.01; // Low variance indicates plateau
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  }
}

export default OptunaTuner;