/**
 * Meta-Model Training for Dynamic Pillar Weighting
 * Uses TensorFlow.js to learn optimal weights for Technical, Social, Fundamental, Astrological pillars
 * Trains on historical data to predict next-hour price movements
 */

import * as tf from '@tensorflow/tfjs-node';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Import scoring functions
import {
  computeTechnicalScore,
  computeSocialScore,
  computeFundamentalScore,
  computeAstrologyScore
} from '../services/scorers.js';

import { normalizeMetrics, initializeNormalization } from '../services/normalize.js';

class MetaModelTrainer {
  constructor() {
    this.supabase = null;
    this.model = null;
    this.trainingData = [];
    this.modelPath = './models/solPredictModel';
  }

  async initialize() {
    // Initialize Supabase connection
    try {
      const supabaseUrl = process.env.DATABASE_URL?.replace('postgresql://', 'https://').replace(':5432/', '.supabase.co/');
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase connection initialized');
      } else {
        console.warn('Supabase configuration not available for training');
        return false;
      }
    } catch (error) {
      console.warn('Supabase initialization failed:', error.message);
      return false;
    }

    // Initialize normalization bounds
    try {
      await initializeNormalization();
      console.log('Normalization bounds initialized');
    } catch (error) {
      console.warn('Normalization initialization failed, using defaults:', error.message);
    }

    // Ensure models directory exists
    try {
      await fs.mkdir('./models', { recursive: true });
      console.log('Models directory ready');
    } catch (error) {
      console.error('Failed to create models directory:', error.message);
      return false;
    }

    return true;
  }

  async fetchHistoricalData() {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    console.log('Fetching historical data from Supabase...');

    // Get all historical metrics grouped by timestamp
    const { data: metrics, error: metricsError } = await this.supabase
      .from('historical_metrics')
      .select('timestamp, metric_name, raw_value')
      .order('timestamp', { ascending: true });

    if (metricsError) {
      throw new Error(`Failed to fetch metrics: ${metricsError.message}`);
    }

    if (!metrics || metrics.length === 0) {
      throw new Error('No historical metrics found in database');
    }

    console.log(`Fetched ${metrics.length} metric records`);

    // Group metrics by timestamp
    const timestampGroups = {};
    metrics.forEach(metric => {
      const timestamp = metric.timestamp;
      if (!timestampGroups[timestamp]) {
        timestampGroups[timestamp] = {};
      }
      timestampGroups[timestamp][metric.metric_name] = parseFloat(metric.raw_value);
    });

    // Get unique timestamps and sort them
    const timestamps = Object.keys(timestampGroups).sort();
    console.log(`Found ${timestamps.length} unique timestamps`);

    // Calculate price changes for each hour
    const trainingRecords = [];
    
    for (let i = 0; i < timestamps.length - 1; i++) {
      const currentTimestamp = timestamps[i];
      const nextTimestamp = timestamps[i + 1];
      
      const currentMetrics = timestampGroups[currentTimestamp];
      const nextMetrics = timestampGroups[nextTimestamp];
      
      // Check if we have price data for both timestamps
      const currentPrice = currentMetrics.price_usd || currentMetrics.marketCapUsd;
      const nextPrice = nextMetrics.price_usd || nextMetrics.marketCapUsd;
      
      if (!currentPrice || !nextPrice) {
        continue; // Skip if price data missing
      }

      // Calculate next hour percentage change
      const nextHourPct = ((nextPrice - currentPrice) / currentPrice) * 100;

      // Normalize current metrics
      const normalizedMetrics = normalizeMetrics(currentMetrics);

      // Calculate pillar scores
      const technicalScore = computeTechnicalScore(normalizedMetrics);
      const socialScore = computeSocialScore(normalizedMetrics);
      const fundamentalScore = computeFundamentalScore(normalizedMetrics);
      const astrologyScore = computeAstrologyScore(normalizedMetrics);

      // Skip if any score is invalid
      if (isNaN(technicalScore) || isNaN(socialScore) || isNaN(fundamentalScore) || isNaN(astrologyScore)) {
        continue;
      }

      trainingRecords.push({
        timestamp: currentTimestamp,
        features: [technicalScore, socialScore, fundamentalScore, astrologyScore],
        label: nextHourPct
      });
    }

    console.log(`Generated ${trainingRecords.length} training records`);
    this.trainingData = trainingRecords;
    return trainingRecords;
  }

  createModel(modelType = 'regression') {
    console.log(`Creating ${modelType} model...`);

    this.model = tf.sequential();

    if (modelType === 'regression') {
      // Regression model for predicting percentage change
      this.model.add(tf.layers.dense({
        units: 8,
        inputShape: [4],
        activation: 'relu'
      }));
      
      this.model.add(tf.layers.dropout({ rate: 0.2 }));
      
      this.model.add(tf.layers.dense({
        units: 4,
        activation: 'relu'
      }));
      
      this.model.add(tf.layers.dense({
        units: 1,
        activation: 'linear'
      }));

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

    } else if (modelType === 'classification') {
      // Classification model for Bullish/Neutral/Bearish
      this.model.add(tf.layers.dense({
        units: 16,
        inputShape: [4],
        activation: 'relu'
      }));
      
      this.model.add(tf.layers.dropout({ rate: 0.3 }));
      
      this.model.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      
      this.model.add(tf.layers.dense({
        units: 3,
        activation: 'softmax'
      }));

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
    }

    console.log('Model architecture:');
    this.model.summary();
  }

  prepareTrainingData(modelType = 'regression') {
    if (this.trainingData.length === 0) {
      throw new Error('No training data available');
    }

    console.log('Preparing training tensors...');

    // Extract features and labels
    const features = this.trainingData.map(record => record.features);
    let labels;

    if (modelType === 'regression') {
      // Use raw percentage change for regression
      labels = this.trainingData.map(record => [record.label]);
    } else {
      // Convert to one-hot encoding for classification
      labels = this.trainingData.map(record => {
        const pct = record.label;
        if (pct > 2) return [1, 0, 0]; // Bullish
        if (pct < -2) return [0, 0, 1]; // Bearish
        return [0, 1, 0]; // Neutral
      });
    }

    // Create tensors
    const featureTensor = tf.tensor2d(features);
    const labelTensor = tf.tensor2d(labels);

    console.log(`Feature tensor shape: [${featureTensor.shape}]`);
    console.log(`Label tensor shape: [${labelTensor.shape}]`);

    return { featureTensor, labelTensor };
  }

  async trainModel(modelType = 'regression', epochs = 100) {
    const { featureTensor, labelTensor } = this.prepareTrainingData(modelType);

    console.log(`Starting training for ${epochs} epochs...`);

    // Early stopping callback
    const earlyStopping = tf.callbacks.earlyStopping({
      monitor: 'val_loss',
      patience: 15,
      restoreBestWeights: true
    });

    // Training history callback
    let bestValLoss = Infinity;
    const logCallback = {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`Epoch ${epoch + 1}/${epochs}`);
          console.log(`  Loss: ${logs.loss.toFixed(6)}, Val Loss: ${logs.val_loss.toFixed(6)}`);
          
          if (modelType === 'regression') {
            console.log(`  MAE: ${logs.mae.toFixed(6)}, Val MAE: ${logs.val_mae.toFixed(6)}`);
          } else {
            console.log(`  Accuracy: ${logs.accuracy.toFixed(4)}, Val Accuracy: ${logs.val_accuracy.toFixed(4)}`);
          }
        }
        
        if (logs.val_loss < bestValLoss) {
          bestValLoss = logs.val_loss;
        }
      }
    };

    // Train the model
    const history = await this.model.fit(featureTensor, labelTensor, {
      epochs: epochs,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: [earlyStopping, logCallback]
    });

    // Clean up tensors
    featureTensor.dispose();
    labelTensor.dispose();

    console.log('Training completed');
    console.log(`Best validation loss: ${bestValLoss.toFixed(6)}`);

    return history;
  }

  async saveModel() {
    if (!this.model) {
      throw new Error('No model to save');
    }

    console.log(`Saving model to ${this.modelPath}...`);

    try {
      await this.model.save(`file://${this.modelPath}`);
      console.log('Model saved successfully');
      
      // Save training metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        trainingRecords: this.trainingData.length,
        modelType: 'regression',
        version: '1.0'
      };
      
      await fs.writeFile(
        path.join(this.modelPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log('Model metadata saved');
    } catch (error) {
      console.error('Failed to save model:', error.message);
      throw error;
    }
  }

  async evaluateModel(modelType = 'regression') {
    if (!this.model) {
      throw new Error('No model to evaluate');
    }

    console.log('Evaluating model performance...');

    const { featureTensor, labelTensor } = this.prepareTrainingData(modelType);

    // Split data for evaluation
    const numSamples = featureTensor.shape[0];
    const splitIdx = Math.floor(numSamples * 0.8);

    const testFeatures = featureTensor.slice([splitIdx, 0], [numSamples - splitIdx, 4]);
    const testLabels = labelTensor.slice([splitIdx, 0], [numSamples - splitIdx, -1]);

    // Make predictions
    const predictions = this.model.predict(testFeatures);

    if (modelType === 'regression') {
      // Calculate metrics for regression
      const mse = tf.losses.meanSquaredError(testLabels, predictions);
      const mae = tf.losses.absoluteDifference(testLabels, predictions);
      
      const mseValue = await mse.data();
      const maeValue = await mae.data();
      
      console.log(`Test MSE: ${mseValue[0].toFixed(6)}`);
      console.log(`Test MAE: ${maeValue[0].toFixed(6)}`);
      
      mse.dispose();
      mae.dispose();
    } else {
      // Calculate accuracy for classification
      const accuracy = tf.metrics.categoricalAccuracy(testLabels, predictions);
      const accuracyValue = await accuracy.mean().data();
      
      console.log(`Test Accuracy: ${(accuracyValue[0] * 100).toFixed(2)}%`);
      
      accuracy.dispose();
    }

    // Clean up
    testFeatures.dispose();
    testLabels.dispose();
    predictions.dispose();
    featureTensor.dispose();
    labelTensor.dispose();
  }

  async run(modelType = 'regression', epochs = 100) {
    try {
      console.log('=== Meta-Model Training Started ===');
      
      // Initialize connections and data
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize training environment');
      }

      // Fetch and prepare training data
      await this.fetchHistoricalData();
      
      if (this.trainingData.length < 100) {
        console.warn(`Limited training data: ${this.trainingData.length} records`);
        console.warn('Consider collecting more historical data for better model performance');
      }

      // Create and train model
      this.createModel(modelType);
      await this.trainModel(modelType, epochs);

      // Evaluate performance
      await this.evaluateModel(modelType);

      // Save trained model
      await this.saveModel();

      console.log('=== Meta-Model Training Completed Successfully ===');
      
      return {
        success: true,
        trainingRecords: this.trainingData.length,
        modelPath: this.modelPath
      };

    } catch (error) {
      console.error('Training failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const trainer = new MetaModelTrainer();
  
  // Parse command line arguments
  const modelType = process.argv.includes('--classification') ? 'classification' : 'regression';
  const epochs = parseInt(process.argv.find(arg => arg.startsWith('--epochs='))?.split('=')[1]) || 100;
  
  console.log(`Training ${modelType} model for ${epochs} epochs...`);
  
  trainer.run(modelType, epochs)
    .then(result => {
      if (result.success) {
        console.log('Training completed successfully');
        process.exit(0);
      } else {
        console.error('Training failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

export default MetaModelTrainer;