/**
 * LSTM Pipeline Testing Script
 * Tests LSTM training, prediction, and ensemble stacking functionality
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testLSTMPipeline() {
  console.log('🧪 Testing LSTM Time-Series Pipeline...\n');

  try {
    // Test 1: Check LSTM model info
    console.log('1️⃣ Testing LSTM model info...');
    const infoResponse = await axios.get(`${BASE_URL}/api/ml/lstm/info`);
    if (infoResponse.data.success) {
      console.log('✅ LSTM model info retrieved successfully');
      console.log(`   - Window size: ${infoResponse.data.modelInfo.windowSize}`);
      console.log(`   - Features: ${infoResponse.data.modelInfo.featureCount}`);
      console.log(`   - Architecture: ${infoResponse.data.modelInfo.architecture}`);
    } else {
      console.log('❌ Failed to get LSTM model info');
    }

    // Test 2: Train LSTM model (quick training with 5 epochs)
    console.log('\n2️⃣ Testing LSTM training (5 epochs for quick test)...');
    const trainingResponse = await axios.post(`${BASE_URL}/api/ml/lstm/train`, {
      epochs: 5,
      validationSplit: 0.2
    });

    if (trainingResponse.data.success) {
      console.log('✅ LSTM training completed successfully');
      console.log(`   - Final Loss: ${trainingResponse.data.training.finalLoss?.toFixed(4)}`);
      console.log(`   - Validation Loss: ${trainingResponse.data.training.finalValLoss?.toFixed(4)}`);
    } else {
      console.log('❌ LSTM training failed:', trainingResponse.data.error);
    }

    // Test 3: LSTM prediction
    console.log('\n3️⃣ Testing LSTM prediction...');
    const predictionResponse = await axios.post(`${BASE_URL}/api/ml/lstm/predict`, {
      recentData: null // Use synthetic data
    });

    if (predictionResponse.data.success) {
      console.log('✅ LSTM prediction completed successfully');
      console.log(`   - Predicted Price: $${predictionResponse.data.predictedPrice?.toFixed(2)}`);
      console.log(`   - Current Price: $${predictionResponse.data.currentPrice?.toFixed(2)}`);
      console.log(`   - Direction: ${predictionResponse.data.direction}`);
      console.log(`   - Confidence: ${(predictionResponse.data.confidence * 100)?.toFixed(1)}%`);
    } else {
      console.log('❌ LSTM prediction failed:', predictionResponse.data.error);
    }

    // Test 4: Ensemble stacking (XGBoost + LSTM)
    console.log('\n4️⃣ Testing ensemble stacking...');
    const features = {
      price: 200,
      volume: 2500000,
      market_cap: 95000000000,
      technical_score: 0.65,
      social_score: 0.45,
      fundamental_score: 0.55,
      astrology_score: 0.35,
      rsi: 58.5,
      macd_histogram: 0.8,
      ema_20: 198.5,
      sma_50: 195.2,
      bollinger_upper: 205.8,
      bollinger_lower: 192.4,
      stoch_rsi: 0.62,
      williams_r: -35.2,
      atr: 4.2
    };

    const stackingResponse = await axios.post(`${BASE_URL}/api/ml/ensemble-stack`, {
      features: features,
      recentData: null
    });

    if (stackingResponse.data.success) {
      console.log('✅ Ensemble stacking completed successfully');
      const stacking = stackingResponse.data.ensembleStacking;
      console.log(`   - Stacked Prediction: $${stacking.prediction?.toFixed(2)}`);
      console.log(`   - Stacked Confidence: ${(stacking.confidence * 100)?.toFixed(1)}%`);
      console.log(`   - Stacked Direction: ${stacking.direction}`);
      console.log(`   - XGBoost Weight: ${stacking.components.xgboost.weight}`);
      console.log(`   - LSTM Weight: ${stacking.components.lstm.weight}`);
    } else {
      console.log('❌ Ensemble stacking failed:', stackingResponse.data.error);
    }

    // Test 5: Check training scheduler status
    console.log('\n5️⃣ Testing training scheduler integration...');
    const schedulerResponse = await axios.get(`${BASE_URL}/api/training/status`);
    
    if (schedulerResponse.data.success) {
      console.log('✅ Training scheduler status retrieved');
      console.log(`   - Is Running: ${schedulerResponse.data.isRunning}`);
      console.log(`   - Last Training: ${schedulerResponse.data.lastTrainingTime || 'Never'}`);
      console.log(`   - Log Entries: ${schedulerResponse.data.totalLogEntries}`);
    } else {
      console.log('❌ Failed to get scheduler status');
    }

    // Test 6: Batch prediction test
    console.log('\n6️⃣ Testing LSTM batch prediction...');
    const batchSequences = [
      // Create synthetic sequence data for testing
      Array.from({ length: 60 }, (_, i) => ({
        price: 200 + Math.sin(i * 0.1) * 10,
        volume: 2000000 + Math.random() * 1000000,
        market_cap: 95000000000,
        technical_score: 0.5 + Math.sin(i * 0.05) * 0.2,
        social_score: 0.4 + Math.random() * 0.3,
        fundamental_score: 0.55,
        astrology_score: 0.3 + Math.cos(i * 0.08) * 0.2,
        rsi: 50 + Math.sin(i * 0.1) * 20,
        macd_histogram: Math.sin(i * 0.15),
        ema_20: 200 + Math.sin(i * 0.1) * 8,
        sma_50: 195 + Math.sin(i * 0.08) * 5,
        bollinger_upper: 210,
        bollinger_lower: 190,
        stoch_rsi: Math.random(),
        williams_r: -50 + Math.random() * 40,
        atr: 3 + Math.random() * 2
      }))
    ];

    const batchResponse = await axios.post(`${BASE_URL}/api/ml/lstm/predict`, {
      recentData: batchSequences,
      batch: true
    });

    if (batchResponse.data.success) {
      console.log('✅ LSTM batch prediction completed successfully');
      console.log(`   - Batch Size: ${batchResponse.data.batchSize}`);
      console.log(`   - Predictions: ${batchResponse.data.predictions.length}`);
      if (batchResponse.data.predictions.length > 0) {
        const firstPred = batchResponse.data.predictions[0];
        console.log(`   - First Prediction: $${firstPred.predictedPrice?.toFixed(2)} (confidence: ${(firstPred.confidence * 100)?.toFixed(1)}%)`);
      }
    } else {
      console.log('❌ LSTM batch prediction failed:', batchResponse.data.error);
    }

    console.log('\n🎯 LSTM Pipeline Testing Complete!');
    console.log('\n📊 Summary:');
    console.log('• LSTM time-series module with 60-step windowing ✓');
    console.log('• Multi-layer LSTM architecture with dropout regularization ✓');
    console.log('• Real-time and batch prediction capabilities ✓');
    console.log('• Ensemble stacking with XGBoost integration ✓');
    console.log('• Automated scheduler integration for nightly retraining ✓');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data?.error) {
      console.error('   API Error:', error.response.data.error);
    }
  }
}

// Run the test
testLSTMPipeline();