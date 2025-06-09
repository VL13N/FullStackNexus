/**
 * JavaScript ML Model Training Service
 * Trains a TensorFlow.js regression model on cryptocurrency data
 */

import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

class CryptoMLTrainer {
  constructor() {
    this.supabase = null;
    this.modelDir = "server/ml/model";
    
    // Initialize Supabase if credentials available
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
    
    // Ensure model directory exists
    if (!fs.existsSync(this.modelDir)) {
      fs.mkdirSync(this.modelDir, { recursive: true });
    }
  }

  async fetchTrainingData() {
    console.log('Generating training dataset...');
    
    // Generate realistic cryptocurrency training data
    const dataPoints = [];
    const basePrice = 150; // SOL base price
    const numSamples = 500;
    
    for (let i = 0; i < numSamples; i++) {
      // Generate correlated features
      const priceNoise = (Math.random() - 0.5) * 0.1;
      const currentPrice = basePrice + (Math.random() - 0.5) * 50;
      
      // Technical indicators with realistic ranges
      const rsi = Math.max(20, Math.min(80, 50 + (Math.random() - 0.5) * 30));
      const macd = (Math.random() - 0.5) * 4;
      const ema20 = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
      
      // Fundamental metrics
      const marketCap = currentPrice * 400000000 + (Math.random() - 0.5) * 10000000000;
      const volume24h = marketCap * (0.01 + Math.random() * 0.02);
      
      // Social and astrological scores
      const socialScore = Math.max(10, Math.min(90, 50 + (Math.random() - 0.5) * 40));
      const astroScore = Math.max(30, Math.min(90, 60 + (Math.random() - 0.5) * 30));
      
      // Target: next hour price return (correlated with features)
      let priceReturn = 0;
      if (rsi > 70) priceReturn -= 0.02; // Overbought
      if (rsi < 30) priceReturn += 0.02; // Oversold
      if (macd > 0) priceReturn += 0.01; // Bullish momentum
      if (socialScore > 70) priceReturn += 0.015; // Strong social sentiment
      if (astroScore > 75) priceReturn += 0.005; // Astrological influence
      
      priceReturn += (Math.random() - 0.5) * 0.05; // Add noise
      
      dataPoints.push({
        rsi_1h: rsi,
        macd_histogram: macd,
        ema_20: ema20,
        market_cap_usd: marketCap,
        volume_24h_usd: volume24h,
        social_score: socialScore,
        astro_score: astroScore,
        price_return_1h: priceReturn
      });
    }
    
    console.log(`Generated ${dataPoints.length} training samples`);
    return dataPoints;
  }

  prepareFeatures(data) {
    console.log('Preparing feature matrix...');
    
    const featureColumns = [
      'rsi_1h', 'macd_histogram', 'ema_20',
      'market_cap_usd', 'volume_24h_usd',
      'social_score', 'astro_score'
    ];
    
    // Extract features and targets
    const features = data.map(row => 
      featureColumns.map(col => row[col])
    );
    
    const targets = data.map(row => row.price_return_1h);
    
    // Normalize features
    const featureMatrix = tf.tensor2d(features);
    const targetVector = tf.tensor1d(targets);
    
    // Feature normalization
    const featureMean = featureMatrix.mean(0);
    const featureStd = featureMatrix.sub(featureMean).square().mean(0).sqrt();
    const normalizedFeatures = featureMatrix.sub(featureMean).div(featureStd.add(1e-7));
    
    console.log(`Feature matrix shape: [${normalizedFeatures.shape}]`);
    console.log(`Target vector shape: [${targetVector.shape}]`);
    
    return {
      features: normalizedFeatures,
      targets: targetVector,
      featureMean,
      featureStd,
      featureColumns
    };
  }

  buildModel(inputDim) {
    console.log(`Building neural network model (input dim: ${inputDim})`);
    
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          inputShape: [inputDim],
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'linear'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  async trainModel() {
    console.log('Starting ML model training...');
    
    try {
      // Fetch and prepare data
      const data = await this.fetchTrainingData();
      const { features, targets, featureMean, featureStd, featureColumns } = this.prepareFeatures(data);
      
      // Split train/validation (80/20)
      const totalSamples = features.shape[0];
      const trainSize = Math.floor(totalSamples * 0.8);
      
      const trainFeatures = features.slice([0, 0], [trainSize, -1]);
      const trainTargets = targets.slice([0], [trainSize]);
      const valFeatures = features.slice([trainSize, 0], [-1, -1]);
      const valTargets = targets.slice([trainSize], [-1]);
      
      console.log(`Training samples: ${trainSize}, Validation samples: ${totalSamples - trainSize}`);
      
      // Build and train model
      const model = this.buildModel(features.shape[1]);
      
      console.log('Training neural network...');
      const history = await model.fit(trainFeatures, trainTargets, {
        epochs: 100,
        batchSize: 32,
        validationData: [valFeatures, valTargets],
        callbacks: [
          tf.callbacks.earlyStopping({
            monitor: 'val_loss',
            patience: 15
          })
        ],
        verbose: 1
      });
      
      // Evaluate model
      const trainLoss = await model.evaluate(trainFeatures, trainTargets, { verbose: 0 });
      const valLoss = await model.evaluate(valFeatures, valTargets, { verbose: 0 });
      
      console.log(`Final Training Loss: ${trainLoss[0].dataSync()[0].toFixed(6)}`);
      console.log(`Final Validation Loss: ${valLoss[0].dataSync()[0].toFixed(6)}`);
      
      // Save model
      const modelPath = `file://${path.resolve(this.modelDir)}/crypto_model`;
      await model.save(modelPath);
      console.log(`Model saved to: ${this.modelDir}/crypto_model`);
      
      // Save metadata
      const metadata = {
        feature_columns: featureColumns,
        input_dim: features.shape[1],
        training_samples: trainSize,
        validation_samples: totalSamples - trainSize,
        final_train_loss: trainLoss[0].dataSync()[0],
        final_val_loss: valLoss[0].dataSync()[0],
        feature_mean: Array.from(featureMean.dataSync()),
        feature_std: Array.from(featureStd.dataSync()),
        trained_at: new Date().toISOString()
      };
      
      const metadataPath = path.join(this.modelDir, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`Metadata saved to: ${metadataPath}`);
      
      // Cleanup tensors
      features.dispose();
      targets.dispose();
      trainFeatures.dispose();
      trainTargets.dispose();
      valFeatures.dispose();
      valTargets.dispose();
      featureMean.dispose();
      featureStd.dispose();
      
      return true;
      
    } catch (error) {
      console.error('Training failed:', error);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Starting JavaScript ML Training...');
  
  const trainer = new CryptoMLTrainer();
  const success = await trainer.trainModel();
  
  if (success) {
    console.log('\n✅ Model training completed successfully!');
    console.log('Model files:');
    console.log('  - Model: server/ml/model/crypto_model/');
    console.log('  - Metadata: server/ml/model/metadata.json');
    console.log('\nYou can now use the ML prediction endpoints:');
    console.log('  POST /api/ml/predict');
    console.log('  GET /api/ml/model/info');
  } else {
    console.log('\n❌ Model training failed');
    process.exit(1);
  }
}

// Run training if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default CryptoMLTrainer;