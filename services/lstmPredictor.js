/**
 * LSTM Time-Series Predictor for Solana Price Forecasting
 * Uses TensorFlow.js for deep recurrent neural networks with multi-layer LSTM architecture
 */

import * as tf from '@tensorflow/tfjs-node';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

class LSTMPredictor {
  constructor() {
    this.model = null;
    this.scaler = null;
    this.windowSize = 60; // 60 time steps for sequence prediction
    this.features = [
      'price', 'volume', 'market_cap', 
      'technical_score', 'social_score', 'fundamental_score', 'astrology_score',
      'rsi', 'macd_histogram', 'ema_20', 'sma_50', 'bollinger_upper', 'bollinger_lower',
      'stoch_rsi', 'williams_r', 'atr'
    ];
    this.modelPath = './models/lstm_model';
    this.scalerPath = './models/lstm_scaler.json';
    
    // Initialize Supabase
    this.supabase = null;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    
    this.initializeModel();
  }

  /**
   * Initialize LSTM model with multi-layer architecture
   */
  async initializeModel() {
    try {
      // Try to load existing model
      if (fs.existsSync(this.modelPath)) {
        console.log('📈 Loading existing LSTM model...');
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        
        // Load scaler parameters
        if (fs.existsSync(this.scalerPath)) {
          const scalerData = JSON.parse(fs.readFileSync(this.scalerPath, 'utf8'));
          this.scaler = scalerData;
        }
        
        console.log('✅ LSTM model loaded successfully');
      } else {
        console.log('🔧 Creating new LSTM model architecture...');
        await this.createModel();
      }
    } catch (error) {
      console.error('❌ LSTM model initialization failed:', error);
      await this.createModel();
    }
  }

  /**
   * Create multi-layer LSTM model with dropout regularization
   */
  async createModel() {
    const inputShape = [this.windowSize, this.features.length];
    
    this.model = tf.sequential({
      layers: [
        // First LSTM layer with return sequences
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: inputShape,
          dropout: 0.2,
          recurrentDropout: 0.2,
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        
        // Batch normalization for stability
        tf.layers.batchNormalization(),
        
        // Second LSTM layer
        tf.layers.lstm({
          units: 64,
          returnSequences: true,
          dropout: 0.2,
          recurrentDropout: 0.2,
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        
        // Third LSTM layer (final recurrent layer)
        tf.layers.lstm({
          units: 32,
          returnSequences: false,
          dropout: 0.2,
          recurrentDropout: 0.2
        }),
        
        // Dense layers for final prediction
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        
        // Output layer - predicting next price and confidence
        tf.layers.dense({
          units: 2, // [price_prediction, confidence_score]
          activation: 'linear'
        })
      ]
    });

    // Compile with advanced optimizer
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    console.log('✅ LSTM model architecture created');
    this.model.summary();
  }

  /**
   * Fetch historical data from Supabase for training
   */
  async fetchTrainingData(days = 90) {
    if (!this.supabase) {
      throw new Error('Supabase not configured - cannot fetch training data');
    }

    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { data, error } = await this.supabase
        .from('live_predictions')
        .select(`
          created_at, predicted_price, confidence,
          technical_score, social_score, fundamental_score, astrology_score
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log(`📊 Fetched ${data?.length || 0} training samples from last ${days} days`);
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch training data:', error);
      return this.generateSyntheticData(days * 24); // Fallback for development
    }
  }

  /**
   * Generate realistic synthetic data for development/testing
   */
  generateSyntheticData(samples = 2160) { // 90 days * 24 hours
    const data = [];
    let price = 180 + Math.random() * 40; // Start around $180-220
    
    for (let i = 0; i < samples; i++) {
      // Realistic price movement with trend and volatility
      const trend = Math.sin(i * 0.01) * 0.5;
      const volatility = (Math.random() - 0.5) * 0.1;
      price *= (1 + trend + volatility);
      price = Math.max(50, Math.min(500, price)); // Bounds checking
      
      const volume = 1000000 + Math.random() * 5000000;
      const marketCap = price * 500000000; // Approximate circulating supply
      
      data.push({
        created_at: new Date(Date.now() - (samples - i) * 60 * 60 * 1000).toISOString(),
        price: price,
        volume: volume,
        market_cap: marketCap,
        technical_score: 0.3 + Math.random() * 0.4,
        social_score: 0.2 + Math.random() * 0.6,
        fundamental_score: 0.4 + Math.random() * 0.3,
        astrology_score: 0.1 + Math.random() * 0.8,
        rsi: 30 + Math.random() * 40,
        macd_histogram: (Math.random() - 0.5) * 2,
        ema_20: price * (0.98 + Math.random() * 0.04),
        sma_50: price * (0.95 + Math.random() * 0.1),
        bollinger_upper: price * 1.02,
        bollinger_lower: price * 0.98,
        stoch_rsi: Math.random(),
        williams_r: -80 + Math.random() * 60,
        atr: price * 0.02 * (0.5 + Math.random())
      });
    }
    
    return data;
  }

  /**
   * Normalize data using min-max scaling
   */
  async normalizeData(data) {
    const features = data.map(row => 
      this.features.map(feature => parseFloat(row[feature]) || 0)
    );
    
    const featuresArray = tf.tensor2d(features);
    
    // Calculate min/max for each feature
    const min = featuresArray.min(0);
    const max = featuresArray.max(0);
    const range = max.sub(min);
    
    // Normalize to [0, 1] range
    const normalized = featuresArray.sub(min).div(range.add(1e-8)); // Add small epsilon to avoid division by zero
    
    // Store scaler parameters
    this.scaler = {
      min: await min.data(),
      max: await max.data(),
      range: await range.data()
    };
    
    // Clean up tensors
    featuresArray.dispose();
    min.dispose();
    max.dispose();
    range.dispose();
    
    return normalized;
  }

  /**
   * Create windowed sequences for LSTM training
   */
  createSequences(normalizedData) {
    const dataArray = normalizedData.arraySync();
    const sequences = [];
    const targets = [];
    
    for (let i = 0; i < dataArray.length - this.windowSize; i++) {
      // Input sequence
      const sequence = dataArray.slice(i, i + this.windowSize);
      sequences.push(sequence);
      
      // Target: next price and a confidence score based on volatility
      const nextPrice = dataArray[i + this.windowSize][0]; // Price is first feature
      const recentPrices = dataArray.slice(i + this.windowSize - 5, i + this.windowSize).map(row => row[0]);
      const volatility = this.calculateVolatility(recentPrices);
      const confidence = Math.max(0.1, 1 - volatility); // Higher volatility = lower confidence
      
      targets.push([nextPrice, confidence]);
    }
    
    return {
      sequences: tf.tensor3d(sequences),
      targets: tf.tensor2d(targets)
    };
  }

  /**
   * Calculate price volatility for confidence scoring
   */
  calculateVolatility(prices) {
    if (prices.length < 2) return 0.5;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Train LSTM model with historical data
   */
  async trainModel(epochs = 100, validationSplit = 0.2) {
    try {
      console.log('🚀 Starting LSTM training...');
      
      // Fetch training data
      const rawData = await this.fetchTrainingData(90);
      if (rawData.length < this.windowSize + 100) {
        throw new Error(`Insufficient data: need at least ${this.windowSize + 100} samples, got ${rawData.length}`);
      }
      
      // Normalize data
      const normalizedData = await this.normalizeData(rawData);
      
      // Create sequences
      const { sequences, targets } = this.createSequences(normalizedData);
      
      console.log(`📊 Training on ${sequences.shape[0]} sequences of length ${this.windowSize}`);
      
      // Training configuration with callbacks
      const history = await this.model.fit(sequences, targets, {
        epochs: epochs,
        batchSize: 32,
        validationSplit: validationSplit,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch + 1}/${epochs} - Loss: ${logs.loss.toFixed(4)}, Val Loss: ${logs.val_loss.toFixed(4)}`);
            }
          }
        }
      });
      
      // Save model and scaler
      await this.saveModel();
      
      // Clean up tensors
      sequences.dispose();
      targets.dispose();
      normalizedData.dispose();
      
      const finalLoss = history.history.loss[history.history.loss.length - 1];
      const finalValLoss = history.history.val_loss[history.history.val_loss.length - 1];
      
      console.log(`✅ LSTM training completed - Final Loss: ${finalLoss.toFixed(4)}, Val Loss: ${finalValLoss.toFixed(4)}`);
      
      return {
        success: true,
        epochs: epochs,
        finalLoss: finalLoss,
        finalValLoss: finalValLoss,
        trainingTime: Date.now()
      };
      
    } catch (error) {
      console.error('❌ LSTM training failed:', error);
      throw error;
    }
  }

  /**
   * Make real-time predictions with confidence scoring
   */
  async predict(recentData = null) {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained or loaded');
    }

    try {
      let inputData = recentData;
      
      // If no data provided, fetch recent data
      if (!inputData) {
        inputData = await this.fetchRecentData();
      }
      
      if (inputData.length < this.windowSize) {
        throw new Error(`Need at least ${this.windowSize} data points for prediction, got ${inputData.length}`);
      }
      
      // Take the most recent window
      const recentWindow = inputData.slice(-this.windowSize);
      
      // Extract and normalize features
      const features = recentWindow.map(row => 
        this.features.map(feature => parseFloat(row[feature]) || 0)
      );
      
      // Apply normalization using stored scaler
      const normalizedFeatures = features.map((row, i) => 
        row.map((val, j) => {
          const min = this.scaler.min[j];
          const range = this.scaler.range[j];
          return (val - min) / (range + 1e-8);
        })
      );
      
      // Create tensor and predict
      const inputTensor = tf.tensor3d([normalizedFeatures]);
      const prediction = this.model.predict(inputTensor);
      const predictionData = await prediction.data();
      
      // Denormalize price prediction
      const normalizedPrice = predictionData[0];
      const priceMin = this.scaler.min[0];
      const priceRange = this.scaler.range[0];
      const predictedPrice = normalizedPrice * priceRange + priceMin;
      
      const confidence = Math.min(1, Math.max(0, predictionData[1]));
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      // Calculate prediction direction
      const currentPrice = recentWindow[recentWindow.length - 1].price;
      const priceChange = predictedPrice - currentPrice;
      const priceChangePercent = (priceChange / currentPrice) * 100;
      
      let direction = 'NEUTRAL';
      if (priceChangePercent > 1) direction = 'BULLISH';
      else if (priceChangePercent < -1) direction = 'BEARISH';
      
      return {
        success: true,
        predictedPrice: predictedPrice,
        currentPrice: currentPrice,
        priceChange: priceChange,
        priceChangePercent: priceChangePercent,
        direction: direction,
        confidence: confidence,
        timestamp: new Date().toISOString(),
        windowSize: this.windowSize,
        modelType: 'LSTM'
      };
      
    } catch (error) {
      console.error('❌ LSTM prediction failed:', error);
      throw error;
    }
  }

  /**
   * Fetch recent data for prediction
   */
  async fetchRecentData() {
    if (!this.supabase) {
      // Return synthetic recent data for development
      const syntheticData = this.generateSyntheticData(this.windowSize + 10);
      return syntheticData.slice(-this.windowSize);
    }

    try {
      const { data, error } = await this.supabase
        .from('live_predictions')
        .select(`
          created_at, price, volume, market_cap,
          technical_score, social_score, fundamental_score, astrology_score,
          rsi, macd_histogram, ema_20, sma_50, bollinger_upper, bollinger_lower,
          stoch_rsi, williams_r, atr
        `)
        .order('created_at', { ascending: false })
        .limit(this.windowSize + 10);

      if (error) throw error;
      
      return (data || []).reverse(); // Return in chronological order
    } catch (error) {
      console.error('❌ Failed to fetch recent data:', error);
      // Fallback to synthetic data
      const syntheticData = this.generateSyntheticData(this.windowSize + 10);
      return syntheticData.slice(-this.windowSize);
    }
  }

  /**
   * Save model and scaler to disk
   */
  async saveModel() {
    try {
      // Ensure models directory exists
      const modelsDir = './models';
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }
      
      // Save TensorFlow model
      await this.model.save(`file://${this.modelPath}`);
      
      // Save scaler parameters
      fs.writeFileSync(this.scalerPath, JSON.stringify(this.scaler, null, 2));
      
      console.log('💾 LSTM model and scaler saved successfully');
    } catch (error) {
      console.error('❌ Failed to save LSTM model:', error);
    }
  }

  /**
   * Get model information and statistics
   */
  getModelInfo() {
    if (!this.model) {
      return { loaded: false, message: 'Model not initialized' };
    }

    return {
      loaded: true,
      windowSize: this.windowSize,
      features: this.features,
      featureCount: this.features.length,
      modelLayers: this.model.layers.length,
      totalParams: this.model.countParams(),
      architecture: 'Multi-layer LSTM with dropout regularization',
      scalerLoaded: !!this.scaler
    };
  }

  /**
   * Batch prediction for multiple sequences
   */
  async batchPredict(sequences) {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained or loaded');
    }

    try {
      // Normalize and prepare sequences
      const normalizedSequences = sequences.map(sequence => {
        const features = sequence.map(row => 
          this.features.map(feature => parseFloat(row[feature]) || 0)
        );
        
        return features.map((row, i) => 
          row.map((val, j) => {
            const min = this.scaler.min[j];
            const range = this.scaler.range[j];
            return (val - min) / (range + 1e-8);
          })
        );
      });
      
      const inputTensor = tf.tensor3d(normalizedSequences);
      const predictions = this.model.predict(inputTensor);
      const predictionsData = await predictions.data();
      
      const results = [];
      for (let i = 0; i < sequences.length; i++) {
        const normalizedPrice = predictionsData[i * 2];
        const confidence = predictionsData[i * 2 + 1];
        
        // Denormalize price
        const priceMin = this.scaler.min[0];
        const priceRange = this.scaler.range[0];
        const predictedPrice = normalizedPrice * priceRange + priceMin;
        
        results.push({
          sequenceIndex: i,
          predictedPrice: predictedPrice,
          confidence: Math.min(1, Math.max(0, confidence)),
          timestamp: new Date().toISOString()
        });
      }
      
      // Clean up tensors
      inputTensor.dispose();
      predictions.dispose();
      
      return {
        success: true,
        predictions: results,
        batchSize: sequences.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ LSTM batch prediction failed:', error);
      throw error;
    }
  }
}

export default LSTMPredictor;