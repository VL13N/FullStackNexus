/**
 * TensorFlow.js ML Training Service
 * Implements LSTM and Transformer layers for cryptocurrency price movement prediction
 * Classification: Bullish/Neutral/Bearish using normalized feature vectors
 */

import * as tf from '@tensorflow/tfjs-node';
import { DatasetExporter } from './datasetExporter.js';

export class MLTrainer {
  constructor() {
    this.model = null;
    this.featureCount = 40; // 14 technical + 8 social + 8 fundamental + 10 astrological
    this.sequenceLength = 24; // 24 hours of data for LSTM
    this.numClasses = 3; // Bullish, Neutral, Bearish
    this.classLabels = ['BEARISH', 'NEUTRAL', 'BULLISH'];
    this.isTraining = false;
    
    console.log('🤖 ML Trainer initialized with TensorFlow.js');
  }

  /**
   * Create LSTM + Transformer hybrid model for price movement classification
   */
  createModel() {
    console.log('🏗️ Building LSTM + Transformer hybrid model...');
    
    // Input layer for sequence of feature vectors
    const input = tf.input({ 
      shape: [this.sequenceLength, this.featureCount],
      name: 'feature_sequence'
    });
    
    // LSTM layers for temporal pattern recognition
    let x = tf.layers.lstm({
      units: 128,
      returnSequences: true,
      dropout: 0.2,
      recurrentDropout: 0.2,
      name: 'lstm_1'
    }).apply(input);
    
    x = tf.layers.lstm({
      units: 64,
      returnSequences: true,
      dropout: 0.2,
      recurrentDropout: 0.2,
      name: 'lstm_2'
    }).apply(x);
    
    // Self-attention mechanism (simplified transformer component)
    // Using dense layers to simulate attention weights
    const query = tf.layers.dense({
      units: 64,
      activation: 'linear',
      name: 'attention_query'
    }).apply(x);
    
    const key = tf.layers.dense({
      units: 64,
      activation: 'linear', 
      name: 'attention_key'
    }).apply(x);
    
    const value = tf.layers.dense({
      units: 64,
      activation: 'linear',
      name: 'attention_value'
    }).apply(x);
    
    // Compute attention scores using dot product
    const scores = tf.layers.dot({
      axes: -1,
      name: 'attention_scores'
    }).apply([query, key]);
    
    const attentionWeights = tf.layers.softmax({
      axis: -1,
      name: 'attention_weights'
    }).apply(scores);
    
    // Apply attention to values
    const attended = tf.layers.dot({
      axes: [2, 1],
      name: 'attention_output'
    }).apply([attentionWeights, value]);
    
    // Add & Norm (residual connection)
    const addNorm1 = tf.layers.add({ name: 'add_norm_1' }).apply([x, attended]);
    
    // Feed-forward network
    let ffn = tf.layers.dense({
      units: 256,
      activation: 'relu',
      name: 'ffn_1'
    }).apply(addNorm1);
    
    ffn = tf.layers.dropout({ rate: 0.1, name: 'ffn_dropout' }).apply(ffn);
    
    ffn = tf.layers.dense({
      units: 64,
      activation: 'relu',
      name: 'ffn_2'
    }).apply(ffn);
    
    // Add & Norm (second residual connection)
    const addNorm2 = tf.layers.add({ name: 'add_norm_2' }).apply([addNorm1, ffn]);
    
    // Global average pooling to aggregate sequence
    const pooled = tf.layers.globalAveragePooling1d({ name: 'global_avg_pool' }).apply(addNorm2);
    
    // Classification head with domain-specific branches
    let technical = tf.layers.dense({
      units: 32,
      activation: 'relu',
      name: 'technical_branch'
    }).apply(pooled);
    
    let social = tf.layers.dense({
      units: 16,
      activation: 'relu',
      name: 'social_branch'
    }).apply(pooled);
    
    let fundamental = tf.layers.dense({
      units: 16,
      activation: 'relu',
      name: 'fundamental_branch'
    }).apply(pooled);
    
    let astrological = tf.layers.dense({
      units: 16,
      activation: 'relu',
      name: 'astrological_branch'
    }).apply(pooled);
    
    // Concatenate domain branches
    const concat = tf.layers.concatenate({ 
      name: 'domain_concat'
    }).apply([technical, social, fundamental, astrological]);
    
    // Final classification layers
    let dense = tf.layers.dense({
      units: 64,
      activation: 'relu',
      name: 'final_dense'
    }).apply(concat);
    
    dense = tf.layers.dropout({ rate: 0.3, name: 'final_dropout' }).apply(dense);
    
    const output = tf.layers.dense({
      units: this.numClasses,
      activation: 'softmax',
      name: 'classification_output'
    }).apply(dense);
    
    // Create and compile model
    this.model = tf.model({ inputs: input, outputs: output });
    
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    console.log('✅ Model architecture created:');
    console.log(`   Input: [${this.sequenceLength}, ${this.featureCount}]`);
    console.log(`   LSTM: 128 -> 64 units with attention`);
    console.log(`   Transformer: Multi-head attention + FFN`);
    console.log(`   Output: ${this.numClasses} classes (${this.classLabels.join(', ')})`);
    
    return this.model;
  }

  /**
   * Prepare training data from normalized feature vectors
   */
  async prepareTrainingData(options = {}) {
    console.log('📊 Preparing training data...');
    
    const exporter = new DatasetExporter();
    
    // Export dataset with extended timeframe for sequence building
    const dataset = await exporter.exportTrainingDataset({
      startDate: options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: options.endDate || new Date().toISOString(),
      format: 'tensorflow',
      includeTargets: true,
      symbol: options.symbol || 'SOL'
    });
    
    if (!dataset.features || dataset.features.length < this.sequenceLength + 1) {
      throw new Error(`Insufficient data: need at least ${this.sequenceLength + 1} samples, got ${dataset.features?.length || 0}`);
    }
    
    // Create sequences for LSTM input
    const sequences = [];
    const labels = [];
    
    for (let i = 0; i < dataset.features.length - this.sequenceLength; i++) {
      // Get sequence of feature vectors
      const sequence = dataset.features.slice(i, i + this.sequenceLength);
      sequences.push(sequence);
      
      // Target is the classification at the end of the sequence
      const targetIndex = i + this.sequenceLength;
      if (dataset.targets && dataset.targets[targetIndex]) {
        const classification = dataset.targets[targetIndex];
        const labelIndex = this.classLabels.indexOf(classification);
        
        // One-hot encode the label
        const oneHot = Array(this.numClasses).fill(0);
        if (labelIndex >= 0) {
          oneHot[labelIndex] = 1;
        } else {
          oneHot[1] = 1; // Default to NEUTRAL
        }
        labels.push(oneHot);
      }
    }
    
    console.log(`✅ Created ${sequences.length} training sequences`);
    console.log(`   Sequence length: ${this.sequenceLength}`);
    console.log(`   Feature dimensions: ${this.featureCount}`);
    
    // Convert to tensors
    const xTensor = tf.tensor3d(sequences);
    const yTensor = tf.tensor2d(labels);
    
    return { 
      x: xTensor, 
      y: yTensor, 
      sequences: sequences.length,
      metadata: dataset.metadata 
    };
  }

  /**
   * Train the model with prepared data
   */
  async trainModel(options = {}) {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }
    
    console.log('🚀 Starting model training...');
    this.isTraining = true;
    
    try {
      // Create model if not exists
      if (!this.model) {
        this.createModel();
      }
      
      // Prepare training data
      const trainingData = await this.prepareTrainingData(options);
      
      // Split data for validation
      const validationSplit = options.validationSplit || 0.2;
      const batchSize = options.batchSize || 32;
      const epochs = options.epochs || 50;
      
      console.log(`📈 Training configuration:`);
      console.log(`   Epochs: ${epochs}`);
      console.log(`   Batch size: ${batchSize}`);
      console.log(`   Validation split: ${validationSplit}`);
      console.log(`   Training samples: ${trainingData.sequences}`);
      
      // Training callbacks
      const callbacks = {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}/${epochs} - Loss: ${logs.loss.toFixed(4)} - Accuracy: ${logs.acc.toFixed(4)} - Val Loss: ${logs.val_loss.toFixed(4)} - Val Accuracy: ${logs.val_acc.toFixed(4)}`);
        },
        onTrainEnd: () => {
          console.log('✅ Training completed successfully');
        }
      };
      
      // Train the model
      const history = await this.model.fit(trainingData.x, trainingData.y, {
        epochs: epochs,
        batchSize: batchSize,
        validationSplit: validationSplit,
        shuffle: true,
        callbacks: callbacks,
        verbose: 0
      });
      
      // Clean up tensors
      trainingData.x.dispose();
      trainingData.y.dispose();
      
      this.isTraining = false;
      
      return {
        success: true,
        history: history.history,
        epochs: epochs,
        finalLoss: history.history.loss[history.history.loss.length - 1],
        finalAccuracy: history.history.acc[history.history.acc.length - 1],
        validationLoss: history.history.val_loss[history.history.val_loss.length - 1],
        validationAccuracy: history.history.val_acc[history.history.val_acc.length - 1],
        metadata: trainingData.metadata
      };
      
    } catch (error) {
      this.isTraining = false;
      console.error('❌ Training failed:', error.message);
      throw error;
    }
  }

  /**
   * Make prediction on new feature sequence
   */
  async predict(featureSequence) {
    if (!this.model) {
      throw new Error('Model not trained. Call trainModel() first.');
    }
    
    if (!Array.isArray(featureSequence) || featureSequence.length !== this.sequenceLength) {
      throw new Error(`Feature sequence must be array of length ${this.sequenceLength}`);
    }
    
    // Ensure each feature vector has correct dimensions
    featureSequence.forEach((features, index) => {
      if (!Array.isArray(features) || features.length !== this.featureCount) {
        throw new Error(`Feature vector ${index} must have ${this.featureCount} features`);
      }
    });
    
    // Convert to tensor and predict
    const inputTensor = tf.tensor3d([featureSequence]);
    const prediction = this.model.predict(inputTensor);
    const probabilities = await prediction.data();
    
    // Clean up
    inputTensor.dispose();
    prediction.dispose();
    
    // Get prediction results
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[maxIndex];
    const classification = this.classLabels[maxIndex];
    
    return {
      classification,
      confidence,
      probabilities: {
        BEARISH: probabilities[0],
        NEUTRAL: probabilities[1],
        BULLISH: probabilities[2]
      }
    };
  }

  /**
   * Evaluate model performance on test data
   */
  async evaluateModel(testData) {
    if (!this.model) {
      throw new Error('Model not trained. Call trainModel() first.');
    }
    
    console.log('📊 Evaluating model performance...');
    
    const evaluation = await this.model.evaluate(testData.x, testData.y);
    const [loss, accuracy, precision, recall] = await Promise.all(
      evaluation.map(tensor => tensor.data())
    );
    
    // Calculate F1 score
    const f1Score = 2 * (precision[0] * recall[0]) / (precision[0] + recall[0]);
    
    // Clean up
    evaluation.forEach(tensor => tensor.dispose());
    
    return {
      loss: loss[0],
      accuracy: accuracy[0],
      precision: precision[0],
      recall: recall[0],
      f1Score: f1Score || 0
    };
  }

  /**
   * Save trained model
   */
  async saveModel(savePath = 'file://./models/crypto-predictor') {
    if (!this.model) {
      throw new Error('No model to save. Train a model first.');
    }
    
    console.log(`💾 Saving model to ${savePath}`);
    await this.model.save(savePath);
    console.log('✅ Model saved successfully');
  }

  /**
   * Load pre-trained model
   */
  async loadModel(modelPath = 'file://./models/crypto-predictor/model.json') {
    console.log(`📂 Loading model from ${modelPath}`);
    this.model = await tf.loadLayersModel(modelPath);
    console.log('✅ Model loaded successfully');
  }

  /**
   * Get model summary
   */
  getModelSummary() {
    if (!this.model) {
      return 'No model created yet';
    }
    
    this.model.summary();
    return {
      totalParams: this.model.countParams(),
      layers: this.model.layers.length,
      inputShape: this.model.inputShape,
      outputShape: this.model.outputShape
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    console.log('🧹 ML Trainer resources cleaned up');
  }
}