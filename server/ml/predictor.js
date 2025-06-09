/**
 * TensorFlow.js ML Prediction Service
 * Loads trained model and provides prediction endpoints
 */

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';

class MLPredictor {
  constructor() {
    this.model = null;
    this.metadata = null;
    this.modelPath = path.join(process.cwd(), 'server/ml/model/crypto_model');
    this.metadataPath = path.join(process.cwd(), 'server/ml/model/metadata.json');
    this.isLoaded = false;
  }

  async loadModel() {
    try {
      console.log('Loading ML model from:', this.modelPath);
      
      // Check if model exists
      if (!fs.existsSync(this.modelPath)) {
        throw new Error('ML model not found. Run training first with: python3 server/ml/train_model.py');
      }

      // Load TensorFlow model
      this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
      console.log('✅ ML model loaded successfully');

      // Load metadata
      if (fs.existsSync(this.metadataPath)) {
        this.metadata = JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
        console.log('✅ Model metadata loaded');
      } else {
        console.warn('⚠️ Model metadata not found, using defaults');
        this.metadata = {
          feature_columns: ['rsi_1h', 'macd_histogram', 'ema_20', 'market_cap_usd', 'volume_24h_usd', 'social_score', 'astro_score'],
          input_dim: 7
        };
      }

      this.isLoaded = true;
      return true;

    } catch (error) {
      console.error('❌ Failed to load ML model:', error.message);
      this.isLoaded = false;
      return false;
    }
  }

  validateInput(features) {
    if (!this.metadata) {
      throw new Error('Model metadata not available');
    }

    const requiredFeatures = this.metadata.feature_columns;
    const missing = requiredFeatures.filter(col => !(col in features));
    
    if (missing.length > 0) {
      throw new Error(`Missing required features: ${missing.join(', ')}`);
    }

    // Validate numeric values
    for (const [key, value] of Object.entries(features)) {
      if (requiredFeatures.includes(key) && (typeof value !== 'number' || isNaN(value))) {
        throw new Error(`Feature '${key}' must be a valid number, got: ${value}`);
      }
    }

    return true;
  }

  normalizeFeatures(features) {
    if (!this.metadata) {
      throw new Error('Model metadata not available');
    }

    const featureArray = this.metadata.feature_columns.map(col => features[col]);
    
    // Simple normalization (should match training normalization)
    // In production, store normalization parameters from training
    const normalized = featureArray.map(val => {
      if (val > 1000) return val / 1e10; // Scale large values like market cap
      return val / 100; // Scale percentage-based values
    });

    return normalized;
  }

  async predict(features) {
    if (!this.isLoaded) {
      const loaded = await this.loadModel();
      if (!loaded) {
        throw new Error('Model not available. Please train the model first.');
      }
    }

    try {
      // Validate input
      this.validateInput(features);

      // Normalize features
      const normalizedFeatures = this.normalizeFeatures(features);

      // Convert to tensor
      const inputTensor = tf.tensor2d([normalizedFeatures], [1, normalizedFeatures.length]);

      // Make prediction
      const predictionTensor = this.model.predict(inputTensor);
      const predictionArray = await predictionTensor.data();
      
      // Clean up tensors
      inputTensor.dispose();
      predictionTensor.dispose();

      const prediction = predictionArray[0];

      // Calculate confidence based on prediction magnitude and feature alignment
      const confidence = this.calculateConfidence(features, prediction);

      return {
        prediction: Number(prediction.toFixed(6)),
        confidence: Number(confidence.toFixed(3)),
        model_version: this.metadata?.trained_at || 'unknown',
        features_used: this.metadata?.feature_columns || []
      };

    } catch (error) {
      console.error('Prediction error:', error);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  calculateConfidence(features, prediction) {
    // Simple confidence calculation based on feature values and prediction
    const rsi = features.rsi_1h || 50;
    const socialScore = features.social_score || 50;
    const astroScore = features.astro_score || 50;

    // Higher confidence when features align with prediction direction
    let confidence = 0.5; // Base confidence

    // RSI alignment
    if ((prediction > 0 && rsi > 50) || (prediction < 0 && rsi < 50)) {
      confidence += 0.1;
    }

    // Social sentiment alignment
    if ((prediction > 0 && socialScore > 50) || (prediction < 0 && socialScore < 50)) {
      confidence += 0.1;
    }

    // Astro alignment
    if ((prediction > 0 && astroScore > 60) || (prediction < 0 && astroScore < 40)) {
      confidence += 0.1;
    }

    // Prediction magnitude confidence
    const magnitude = Math.abs(prediction);
    if (magnitude > 0.05) confidence += 0.1; // Strong signal
    if (magnitude > 0.1) confidence += 0.1;  // Very strong signal

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  async getModelInfo() {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    return {
      isLoaded: this.isLoaded,
      modelPath: this.modelPath,
      metadata: this.metadata,
      inputShape: this.model ? this.model.inputs[0].shape : null,
      outputShape: this.model ? this.model.outputs[0].shape : null
    };
  }

  // Batch prediction for multiple feature sets
  async batchPredict(featuresArray) {
    if (!Array.isArray(featuresArray)) {
      throw new Error('Features must be an array for batch prediction');
    }

    const predictions = [];
    for (const features of featuresArray) {
      try {
        const result = await this.predict(features);
        predictions.push(result);
      } catch (error) {
        predictions.push({
          error: error.message,
          features: features
        });
      }
    }

    return predictions;
  }
}

// Singleton instance
const mlPredictor = new MLPredictor();

export default mlPredictor;