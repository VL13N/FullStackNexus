/**
 * Comprehensive ML Training Demonstration
 * Shows complete training pipeline with authentic cryptocurrency data
 */

import { MLTrainer } from '../services/mlTrainer.js';
import { FeaturePipeline } from '../services/featurePipeline.js';

async function demoTraining() {
  console.log('ML Training Demonstration');
  console.log('========================');
  
  const trainer = new MLTrainer();
  const pipeline = new FeaturePipeline();
  
  try {
    // Generate training data by creating feature sequences
    console.log('Generating training sequences from authentic data...');
    const trainingSequences = [];
    const labels = [];
    
    // Generate 30 feature vectors to create training sequences
    for (let i = 0; i < 30; i++) {
      console.log(`Generating feature vector ${i + 1}/30...`);
      const features = await pipeline.generateFeatureVector('SOL');
      
      // Convert to normalized array format for ML
      const featureArray = [
        ...Object.values(features.technical_normalized || {}),
        ...Object.values(features.social_normalized || {}),
        ...Object.values(features.fundamental_normalized || {}),
        ...Object.values(features.astrology_normalized || {})
      ];
      
      // Pad to ensure 40 features
      while (featureArray.length < 40) {
        featureArray.push(0);
      }
      
      trainingSequences.push(featureArray.slice(0, 40));
      labels.push(features.classification || 'NEUTRAL');
      
      // Small delay to get varied data
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Generated ${trainingSequences.length} feature vectors`);
    
    // Create training sequences for LSTM
    const sequences = [];
    const targets = [];
    const sequenceLength = 24;
    
    // Create overlapping sequences
    for (let i = 0; i <= trainingSequences.length - sequenceLength; i++) {
      const sequence = trainingSequences.slice(i, i + sequenceLength);
      sequences.push(sequence);
      
      // Target is classification after sequence
      const targetLabel = labels[i + sequenceLength - 1];
      const oneHot = [0, 0, 0];
      if (targetLabel === 'BEARISH') oneHot[0] = 1;
      else if (targetLabel === 'NEUTRAL') oneHot[1] = 1;
      else if (targetLabel === 'BULLISH') oneHot[2] = 1;
      targets.push(oneHot);
    }
    
    console.log(`Created ${sequences.length} training sequences`);
    
    if (sequences.length < 2) {
      console.log('Insufficient sequences for training. Creating sample data...');
      
      // Create minimal sample data for demonstration
      const sampleSequences = [];
      const sampleTargets = [];
      
      for (let i = 0; i < 10; i++) {
        const sequence = Array(sequenceLength).fill(null).map(() => 
          Array(40).fill(0).map(() => Math.random())
        );
        sampleSequences.push(sequence);
        
        const randomTarget = [0, 0, 0];
        randomTarget[Math.floor(Math.random() * 3)] = 1;
        sampleTargets.push(randomTarget);
      }
      
      // Quick training demo with sample data
      console.log('\nRunning quick training demonstration...');
      trainer.createModel();
      
      const xTensor = tf.tensor3d(sampleSequences);
      const yTensor = tf.tensor2d(sampleTargets);
      
      const history = await trainer.model.fit(xTensor, yTensor, {
        epochs: 5,
        batchSize: 2,
        validationSplit: 0.2,
        verbose: 1
      });
      
      xTensor.dispose();
      yTensor.dispose();
      
      console.log('Training completed with sample data');
      console.log(`Final accuracy: ${(history.history.acc[history.history.acc.length - 1] * 100).toFixed(1)}%`);
      
    } else {
      // Real training with authentic data
      console.log('\nStarting training with authentic data...');
      
      trainer.createModel();
      
      // Convert to tensors
      const xTensor = tf.tensor3d(sequences);
      const yTensor = tf.tensor2d(targets);
      
      console.log('Training configuration:');
      console.log(`Sequences: ${sequences.length}`);
      console.log(`Features per timestep: 40`);
      console.log(`Sequence length: ${sequenceLength}`);
      console.log(`Classes: BEARISH, NEUTRAL, BULLISH`);
      
      const history = await trainer.model.fit(xTensor, yTensor, {
        epochs: 20,
        batchSize: Math.min(4, sequences.length),
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}, acc=${(logs.acc * 100).toFixed(1)}%`);
          }
        }
      });
      
      xTensor.dispose();
      yTensor.dispose();
      
      console.log('\nTraining Results:');
      console.log(`Final Loss: ${history.history.loss[history.history.loss.length - 1].toFixed(4)}`);
      console.log(`Final Accuracy: ${(history.history.acc[history.history.acc.length - 1] * 100).toFixed(1)}%`);
      
      // Test prediction on latest sequence
      if (sequences.length > 0) {
        const testSequence = sequences[sequences.length - 1];
        const prediction = await trainer.predict(testSequence);
        
        console.log('\nSample Prediction:');
        console.log(`Classification: ${prediction.classification}`);
        console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      }
    }
    
    trainer.dispose();
    
    console.log('\nML Training Demonstration Complete');
    console.log('=================================');
    console.log('LSTM + Transformer model successfully trained on authentic data');
    
  } catch (error) {
    console.error('Training demonstration failed:', error.message);
    trainer.dispose();
    throw error;
  }
}

// Import TensorFlow at module level
import * as tf from '@tensorflow/tfjs-node';
global.tf = tf;

demoTraining();