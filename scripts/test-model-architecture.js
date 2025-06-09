/**
 * Test TensorFlow.js Model Architecture
 * Verifies LSTM + Transformer model creation and prediction capabilities
 */

import { MLTrainer } from '../services/mlTrainer.js';

async function testModelArchitecture() {
  console.log('TensorFlow.js Model Architecture Test');
  console.log('====================================');
  
  const trainer = new MLTrainer();
  
  try {
    // Test model creation
    console.log('Creating LSTM + Transformer hybrid model...');
    const model = trainer.createModel();
    
    // Display model details
    const summary = trainer.getModelSummary();
    console.log('\nModel Architecture:');
    console.log(`Total Parameters: ${summary.totalParams.toLocaleString()}`);
    console.log(`Number of Layers: ${summary.layers}`);
    console.log(`Input Shape: [${trainer.sequenceLength}, ${trainer.featureCount}]`);
    console.log(`Output Classes: ${trainer.classLabels.join(', ')}`);
    
    // Test prediction with sample data
    console.log('\nTesting model inference...');
    const sampleSequence = Array(trainer.sequenceLength).fill(null).map(() => 
      Array(trainer.featureCount).fill(0).map(() => Math.random())
    );
    
    console.log(`Sample input shape: ${sampleSequence.length} x ${sampleSequence[0].length}`);
    
    const prediction = await trainer.predict(sampleSequence);
    
    console.log('\nPrediction Results:');
    console.log(`Classification: ${prediction.classification}`);
    console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log('Class Probabilities:');
    Object.entries(prediction.probabilities).forEach(([cls, prob]) => {
      console.log(`  ${cls}: ${(prob * 100).toFixed(1)}%`);
    });
    
    // Test model save/load cycle
    console.log('\nTesting model persistence...');
    await trainer.saveModel('file://./test-model');
    console.log('Model saved successfully');
    
    // Create new trainer and load model
    const trainer2 = new MLTrainer();
    await trainer2.loadModel('file://./test-model/model.json');
    console.log('Model loaded successfully');
    
    // Test loaded model prediction
    const prediction2 = await trainer2.predict(sampleSequence);
    console.log(`Loaded model prediction: ${prediction2.classification} (${(prediction2.confidence * 100).toFixed(1)}%)`);
    
    // Cleanup
    trainer.dispose();
    trainer2.dispose();
    
    console.log('\nModel Architecture Test: PASSED');
    console.log('LSTM + Transformer model is functional and ready for training');
    
  } catch (error) {
    console.error('Model architecture test failed:', error.message);
    throw error;
  }
}

testModelArchitecture();