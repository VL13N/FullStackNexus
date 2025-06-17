/**
 * Hardened ML Routes with Comprehensive Error Handling
 * Decoupled from core API pipeline to prevent ML errors from blocking data fetches
 */

import { Router } from 'express';
import { supabase } from '../utils/supabase.js';

const router = Router();

// Add comprehensive logging wrapper for ML operations
function logMLOperation(operation, details = {}) {
  console.log(`[ML] ${operation} | ${JSON.stringify(details)} | Timestamp: ${new Date().toISOString()}`);
}

function logMLError(operation, error, details = {}) {
  console.error(`[ML] ERROR: ${operation} | Error: ${error.message} | Details: ${JSON.stringify(details)} | Stack: ${error.stack}`);
}

/**
 * Hardened ML Training Endpoint with Full Validation
 */
router.post('/train', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logMLOperation('TRAIN_START', { method: req.method, body: req.body });
    
    // Validate feature data existence and structure
    if (!req.body || typeof req.body !== 'object') {
      const error = 'Missing or invalid request body for ML training';
      logMLError('TRAIN_VALIDATION', new Error(error));
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid request body for ML training',
        timestamp: new Date().toISOString()
      });
    }

    const { features, targetValues, modelType = 'ensemble' } = req.body;

    // Validate features array
    if (!features || !Array.isArray(features) || features.length === 0) {
      const error = 'Missing or invalid feature data for ML training';
      logMLError('TRAIN_VALIDATION', new Error(error), { featuresLength: features?.length });
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid feature data for ML training',
        details: 'Features must be a non-empty array',
        timestamp: new Date().toISOString()
      });
    }

    // Validate feature vector structure
    const firstFeature = features[0];
    if (!firstFeature || typeof firstFeature !== 'object' || Object.keys(firstFeature).length === 0) {
      const error = 'Invalid feature vector structure';
      logMLError('TRAIN_VALIDATION', new Error(error), { firstFeature });
      return res.status(400).json({
        success: false,
        error: 'Invalid feature vector structure',
        details: 'Each feature must be a non-empty object',
        timestamp: new Date().toISOString()
      });
    }

    // Validate target values
    if (!targetValues || !Array.isArray(targetValues) || targetValues.length !== features.length) {
      const error = 'Target values must match feature count';
      logMLError('TRAIN_VALIDATION', new Error(error), { 
        targetLength: targetValues?.length, 
        featuresLength: features.length 
      });
      return res.status(400).json({
        success: false,
        error: 'Target values must match feature count',
        details: `Expected ${features.length} targets, got ${targetValues?.length || 0}`,
        timestamp: new Date().toISOString()
      });
    }

    logMLOperation('TRAIN_VALIDATED', { 
      featuresCount: features.length, 
      modelType,
      featureKeys: Object.keys(firstFeature)
    });

    // Safely import ML training service
    let trainResult;
    try {
      const { trainEnsembleModel } = await import('../services/mlTrainer.js');
      trainResult = await trainEnsembleModel(features, targetValues, modelType);
    } catch (importError) {
      logMLError('TRAIN_IMPORT', importError);
      return res.status(500).json({
        success: false,
        error: 'ML training service unavailable',
        details: importError.message,
        timestamp: new Date().toISOString()
      });
    }

    // Validate training result
    if (!trainResult || typeof trainResult !== 'object') {
      const error = 'Invalid training result from ML service';
      logMLError('TRAIN_RESULT', new Error(error), { trainResult });
      return res.status(500).json({
        success: false,
        error: 'Invalid training result from ML service',
        timestamp: new Date().toISOString()
      });
    }

    // Log training completion to database
    try {
      const { error: dbError } = await supabase
        .from('ml_training_logs')
        .insert([{
          model_type: modelType,
          features_count: features.length,
          accuracy: trainResult.accuracy || null,
          loss: trainResult.loss || null,
          training_time_ms: Date.now() - startTime,
          status: 'completed',
          created_at: new Date().toISOString()
        }]);

      if (dbError) {
        console.error('[ML] Database logging failed:', dbError.message);
      } else {
        console.log('[ML] Training logged to database successfully');
      }
    } catch (dbError) {
      console.error('[ML] Database logging error:', dbError.message);
    }

    const latencyMs = Date.now() - startTime;
    logMLOperation('TRAIN_SUCCESS', { 
      modelType, 
      accuracy: trainResult.accuracy,
      latencyMs
    });

    res.json({
      success: true,
      result: trainResult,
      trainingTimeMs: latencyMs,
      modelType,
      featuresProcessed: features.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    logMLError('TRAIN_FATAL', error, { latencyMs });
    
    res.status(500).json({
      success: false,
      error: 'ML training failed with internal error',
      details: error.message,
      trainingTimeMs: latencyMs,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Hardened ML Prediction Endpoint with Full Validation
 */
router.post('/predict', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logMLOperation('PREDICT_START', { method: req.method, body: req.body });
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      const error = 'Missing or invalid request body for prediction';
      logMLError('PREDICT_VALIDATION', new Error(error));
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid request body for prediction',
        timestamp: new Date().toISOString()
      });
    }

    const { featureVector, modelType = 'ensemble' } = req.body;

    // Validate feature vector existence and structure
    if (!featureVector || typeof featureVector !== 'object' || Object.keys(featureVector).length === 0) {
      const error = 'Missing or invalid feature vector for prediction';
      logMLError('PREDICT_VALIDATION', new Error(error), { featureVector });
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid feature vector for prediction',
        details: 'Feature vector must be a non-empty object',
        timestamp: new Date().toISOString()
      });
    }

    // Validate required feature keys
    const requiredFeatures = ['price', 'volume', 'technical_score', 'social_score', 'fundamental_score', 'astrology_score'];
    const missingFeatures = requiredFeatures.filter(key => !(key in featureVector));
    
    if (missingFeatures.length > 0) {
      const error = 'Missing required features for prediction';
      logMLError('PREDICT_VALIDATION', new Error(error), { missingFeatures });
      return res.status(400).json({
        success: false,
        error: 'Missing required features for prediction',
        details: `Missing: ${missingFeatures.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // Validate feature values are numeric
    const invalidFeatures = Object.entries(featureVector)
      .filter(([key, value]) => typeof value !== 'number' || isNaN(value))
      .map(([key]) => key);
    
    if (invalidFeatures.length > 0) {
      const error = 'Invalid feature values (must be numeric)';
      logMLError('PREDICT_VALIDATION', new Error(error), { invalidFeatures });
      return res.status(400).json({
        success: false,
        error: 'Invalid feature values (must be numeric)',
        details: `Invalid features: ${invalidFeatures.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    logMLOperation('PREDICT_VALIDATED', { 
      modelType,
      featureCount: Object.keys(featureVector).length,
      featureKeys: Object.keys(featureVector)
    });

    // Safely import ML prediction service
    let prediction;
    try {
      const { makePrediction } = await import('../services/mlPredictor.js');
      prediction = await makePrediction(featureVector, modelType);
    } catch (importError) {
      logMLError('PREDICT_IMPORT', importError);
      return res.status(500).json({
        success: false,
        error: 'ML prediction service unavailable',
        details: importError.message,
        timestamp: new Date().toISOString()
      });
    }

    // Validate prediction result
    if (!prediction || typeof prediction !== 'object') {
      const error = 'Invalid prediction result from ML service';
      logMLError('PREDICT_RESULT', new Error(error), { prediction });
      return res.status(500).json({
        success: false,
        error: 'Invalid prediction result from ML service',
        timestamp: new Date().toISOString()
      });
    }

    // Validate prediction structure
    if (typeof prediction.value !== 'number' || isNaN(prediction.value)) {
      const error = 'Prediction value must be a valid number';
      logMLError('PREDICT_RESULT', new Error(error), { prediction });
      return res.status(500).json({
        success: false,
        error: 'Prediction value must be a valid number',
        timestamp: new Date().toISOString()
      });
    }

    // Log prediction to database
    try {
      const { error: dbError } = await supabase
        .from('predictions')
        .insert([{
          prediction: prediction.value,
          confidence: prediction.confidence || 0,
          direction: prediction.direction || 'NEUTRAL',
          technical_score: featureVector.technical_score,
          social_score: featureVector.social_score,
          fundamental_score: featureVector.fundamental_score,
          astrology_score: featureVector.astrology_score,
          features: featureVector,
          pillar_scores: {
            technical: featureVector.technical_score,
            social: featureVector.social_score,
            fundamental: featureVector.fundamental_score,
            astrology: featureVector.astrology_score
          },
          created_at: new Date().toISOString()
        }]);

      if (dbError) {
        console.error('[ML] Prediction logging failed:', dbError.message);
      } else {
        console.log('[ML] Prediction logged to database successfully');
      }
    } catch (dbError) {
      console.error('[ML] Prediction logging error:', dbError.message);
    }

    const latencyMs = Date.now() - startTime;
    logMLOperation('PREDICT_SUCCESS', { 
      modelType, 
      prediction: prediction.value,
      confidence: prediction.confidence,
      latencyMs
    });

    res.json({
      success: true,
      prediction: prediction.value,
      confidence: prediction.confidence || 0,
      direction: prediction.direction || 'NEUTRAL',
      modelType,
      predictionTimeMs: latencyMs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    logMLError('PREDICT_FATAL', error, { latencyMs });
    
    res.status(500).json({
      success: false,
      error: 'ML prediction failed with internal error',
      details: error.message,
      predictionTimeMs: latencyMs,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * ML System Status Endpoint
 */
router.get('/status', async (req, res) => {
  try {
    logMLOperation('STATUS_CHECK');
    
    const status = {
      timestamp: new Date().toISOString(),
      services: {
        trainer: { available: false, error: null },
        predictor: { available: false, error: null },
        database: { available: false, error: null }
      }
    };

    // Check ML trainer availability
    try {
      await import('../services/mlTrainer.js');
      status.services.trainer.available = true;
    } catch (error) {
      status.services.trainer.error = error.message;
    }

    // Check ML predictor availability
    try {
      await import('../services/mlPredictor.js');
      status.services.predictor.available = true;
    } catch (error) {
      status.services.predictor.error = error.message;
    }

    // Check database connectivity
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      status.services.database.available = true;
    } catch (error) {
      status.services.database.error = error.message;
    }

    const healthyServices = Object.values(status.services).filter(s => s.available).length;
    const totalServices = Object.keys(status.services).length;
    
    status.overall = {
      healthy: healthyServices,
      total: totalServices,
      score: Math.round((healthyServices / totalServices) * 100),
      status: healthyServices === totalServices ? 'HEALTHY' : 'DEGRADED'
    };

    logMLOperation('STATUS_SUCCESS', status.overall);
    res.json(status);

  } catch (error) {
    logMLError('STATUS_FATAL', error);
    res.status(500).json({
      success: false,
      error: 'ML status check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;