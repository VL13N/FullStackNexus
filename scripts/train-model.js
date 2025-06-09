/**
 * TensorFlow.js Model Training Script
 * Trains LSTM + Transformer model on authentic cryptocurrency data
 */

import { MLTrainer } from '../services/mlTrainer.js';
import fs from 'fs';

async function trainCryptoPredictionModel() {
  console.log('TensorFlow.js Model Training');
  console.log('============================');
  
  const trainer = new MLTrainer();
  
  try {
    // Training configuration
    const trainingConfig = {
      symbol: 'SOL',
      epochs: 100,
      batchSize: 16,
      validationSplit: 0.2,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    };
    
    console.log('Training Configuration:');
    console.log(`Symbol: ${trainingConfig.symbol}`);
    console.log(`Epochs: ${trainingConfig.epochs}`);
    console.log(`Batch Size: ${trainingConfig.batchSize}`);
    console.log(`Validation Split: ${trainingConfig.validationSplit}`);
    console.log(`Data Range: ${trainingConfig.startDate.split('T')[0]} to ${trainingConfig.endDate.split('T')[0]}`);
    
    // Create model architecture
    console.log('\nBuilding model architecture...');
    trainer.createModel();
    
    // Display model summary
    const modelSummary = trainer.getModelSummary();
    console.log(`Model Summary:`);
    console.log(`Total Parameters: ${modelSummary.totalParams.toLocaleString()}`);
    console.log(`Layers: ${modelSummary.layers}`);
    
    // Start training
    console.log('\nStarting training process...');
    const trainingResults = await trainer.trainModel(trainingConfig);
    
    // Display training results
    console.log('\nTraining Results:');
    console.log('================');
    console.log(`Final Training Loss: ${trainingResults.finalLoss.toFixed(4)}`);
    console.log(`Final Training Accuracy: ${(trainingResults.finalAccuracy * 100).toFixed(1)}%`);
    console.log(`Final Validation Loss: ${trainingResults.validationLoss.toFixed(4)}`);
    console.log(`Final Validation Accuracy: ${(trainingResults.validationAccuracy * 100).toFixed(1)}%`);
    
    // Create models directory if it doesn't exist
    if (!fs.existsSync('./models')) {
      fs.mkdirSync('./models', { recursive: true });
    }
    
    // Save the trained model
    console.log('\nSaving trained model...');
    await trainer.saveModel('file://./models/crypto-predictor');
    
    // Save training metadata
    const metadata = {
      trainingDate: new Date().toISOString(),
      modelVersion: '1.0.0',
      trainingConfig,
      results: trainingResults,
      modelSummary,
      featureCount: trainer.featureCount,
      sequenceLength: trainer.sequenceLength,
      classLabels: trainer.classLabels
    };
    
    fs.writeFileSync('./models/training-metadata.json', JSON.stringify(metadata, null, 2));
    console.log('Training metadata saved to ./models/training-metadata.json');
    
    // Cleanup
    trainer.dispose();
    
    console.log('\nModel Training Complete');
    console.log('======================');
    console.log(`Model saved to: ./models/crypto-predictor/`);
    console.log(`Validation Accuracy: ${(trainingResults.validationAccuracy * 100).toFixed(1)}%`);
    console.log(`Ready for inference on new data`);
    
    return trainingResults;
    
  } catch (error) {
    console.error('Training failed:', error.message);
    if (error.message.includes('Insufficient data')) {
      console.log('\nRecommendation: Generate more historical data by running:');
      console.log('node scripts/generate-historical-data.js');
    }
    throw error;
  }
}

// Run training if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  trainCryptoPredictionModel()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { trainCryptoPredictionModel };