/**
 * Live Prediction Service
 * Loads trained TensorFlow.js model and generates real-time trading predictions
 * Combines pillar scores to predict next-hour price movements
 */

import * as tf from '@tensorflow/tfjs-node';
import { createClient } from '@supabase/supabase-js';
import { fetchAndNormalize } from './fetchAndNormalize.js';
import {
  computeTechnicalScore,
  computeSocialScore,
  computeFundamentalScore,
  computeAstrologyScore
} from './scorers.js';
import { alertManager } from '../server/alerts/alerting.js';

class PredictionService {
  constructor() {
    this.model = null;
    this.supabase = null;
    this.isModelLoaded = false;
    this.modelPath = './server/ml/model/crypto_model/model.json';
  }

  async initialize() {
    // Initialize Supabase connection
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Prediction service requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Prediction service: Supabase enabled for persistence');

    // Load trained model
    await this.loadModel();
  }

  async loadModel() {
    try {
      console.log('Loading TensorFlow.js model...');
      this.model = await tf.loadLayersModel(`file://${this.modelPath}`);
      this.isModelLoaded = true;
      console.log('Model loaded successfully');
    } catch (error) {
      console.warn('Failed to load trained model:', error.message);
      console.log('Using fixed pillar weights instead of learned weights');
      this.isModelLoaded = false;
    }
  }

  async ensureTableExists() {
    if (!this.supabase) return;

    try {
      // Check if live_predictions table exists
      const { error } = await this.supabase.from('live_predictions').select('*').limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('Creating live_predictions table...');
        
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS live_predictions (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMPTZ NOT NULL,
            tech_score DECIMAL,
            social_score DECIMAL,
            fund_score DECIMAL,
            astro_score DECIMAL,
            predicted_pct DECIMAL,
            category VARCHAR(20),
            confidence DECIMAL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_live_predictions_timestamp ON live_predictions(timestamp);
        `;
        
        const { error: createError } = await this.supabase.rpc('exec_sql', { sql: createTableQuery });
        if (createError) {
          console.error('Error creating live_predictions table:', createError);
        } else {
          console.log('live_predictions table created successfully');
        }
      }
    } catch (error) {
      console.error('Error ensuring table exists:', error);
    }
  }

  async runPredictionLive() {
    try {
      console.log('Running live prediction analysis...');

      // Fetch and normalize current metrics
      const { normalized, dataIds } = await fetchAndNormalize();

      // Compute pillar scores
      const techScore = computeTechnicalScore(normalized);
      const socialScore = computeSocialScore(normalized);
      const fundScore = computeFundamentalScore(normalized);
      const astroScore = computeAstrologyScore(normalized);

      console.log(`Pillar scores - Technical: ${techScore.toFixed(2)}, Social: ${socialScore.toFixed(2)}, Fundamental: ${fundScore.toFixed(2)}, Astrology: ${astroScore.toFixed(2)}`);

      let predictedPct;
      let confidence;

      if (this.isModelLoaded && this.model) {
        // Use trained model for prediction - extract required features from normalized data
        const features = [
          normalized.rsi_1h || normalized.rsi || 50,
          normalized.macdHistogram || normalized.macd || 0,
          normalized.ema_20 || normalized.ema || normalized.ema8 || 50,
          normalized.market_cap_usd || normalized.marketCap || 50,
          normalized.volume_24h_usd || normalized.volume24h || 50,
          normalized.social_score || normalized.socialVolume || socialScore,
          normalized.astro_score || astroScore
        ];
        
        const input = tf.tensor2d([features]);
        const predTensor = this.model.predict(input);
        predictedPct = predTensor.dataSync()[0];
        
        // Calculate confidence based on score alignment
        confidence = this.calculateConfidence(techScore, socialScore, fundScore, astroScore);
        
        // Clean up tensors
        input.dispose();
        predTensor.dispose();
      } else {
        // Use fixed weights as fallback
        const weights = { technical: 0.4, social: 0.2, fundamental: 0.25, astrology: 0.15 };
        const compositeScore = (
          weights.technical * techScore +
          weights.social * socialScore +
          weights.fundamental * fundScore +
          weights.astrology * astroScore
        );
        
        // Convert composite score to percentage prediction
        // Scores above 60 suggest bullish, below 40 suggest bearish
        predictedPct = (compositeScore - 50) * 0.2; // Scale to reasonable percentage range
        confidence = Math.abs(compositeScore - 50) / 50; // Higher confidence when further from neutral
      }

      // Categorize prediction
      const category = this.categorizeprediction(predictedPct);

      // Store prediction in database with enhanced lineage tracking
      await this.storePrediction({
        timestamp: new Date().toISOString(),
        techScore,
        socialScore,
        fundScore,
        astroScore,
        predictedPct,
        category,
        confidence
      });

      // Store enhanced prediction with data lineage
      try {
        const { persistEnhancedPrediction } = await import('./dataPersistence.js');
        await persistEnhancedPrediction({
          technical_score: techScore,
          social_score: socialScore,
          fundamental_score: fundScore,
          astrology_score: astroScore,
          overall_score: (techScore + socialScore + fundScore + astroScore) / 4,
          classification: category,
          confidence: confidence,
          price_target: null,
          risk_level: confidence > 0.7 ? 'Low' : confidence > 0.4 ? 'Medium' : 'High'
        }, dataIds || {});
      } catch (persistError) {
        console.warn('Failed to persist enhanced prediction:', persistError.message);
      }

      const result = {
        timestamp: new Date().toISOString(),
        pillarScores: {
          technical: Math.round(techScore * 100) / 100,
          social: Math.round(socialScore * 100) / 100,
          fundamental: Math.round(fundScore * 100) / 100,
          astrology: Math.round(astroScore * 100) / 100
        },
        prediction: {
          percentageChange: Math.round(predictedPct * 100) / 100,
          category: category,
          confidence: Math.round(confidence * 100) / 100
        },
        modelUsed: this.isModelLoaded ? 'trained' : 'fixed_weights'
      };

      console.log(`Prediction: ${predictedPct.toFixed(2)}% (${category}), Confidence: ${(confidence * 100).toFixed(1)}%`);
      
      // Check alerts for this prediction
      try {
        const predictionForAlerts = {
          symbol: 'SOL', // Default symbol, could be parameterized
          prediction: predictedPct,
          confidence: confidence,
          technical_score: techScore,
          social_score: socialScore,
          fundamental_score: fundScore,
          astrology_score: astroScore,
          overall_score: (techScore + socialScore + fundScore + astroScore) / 4,
          category: category,
          timestamp: new Date().toISOString()
        };
        
        await alertManager.checkAlerts(predictionForAlerts);
      } catch (alertError) {
        console.warn('Alert checking failed:', alertError.message);
      }
      
      return result;

    } catch (error) {
      console.error('Live prediction failed:', error);
      throw error;
    }
  }

  categorizeprediction(predictedPct) {
    if (predictedPct > 2) return 'BULLISH';
    if (predictedPct < -2) return 'BEARISH';
    return 'NEUTRAL';
  }

  calculateConfidence(techScore, socialScore, fundScore, astroScore) {
    // Calculate confidence based on score alignment and extremes
    const scores = [techScore, socialScore, fundScore, astroScore];
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Standard deviation of scores (lower = more aligned = higher confidence)
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Confidence decreases with higher standard deviation
    const alignmentConfidence = Math.max(0, 1 - (stdDev / 25)); // Normalize to 0-1
    
    // Confidence increases when mean is further from neutral (50)
    const extremeConfidence = Math.abs(mean - 50) / 50;
    
    // Combine both factors
    return Math.min(1, (alignmentConfidence + extremeConfidence) / 2);
  }

  async storePrediction(predictionData) {
    if (!this.supabase) {
      console.warn('Cannot store prediction: Supabase not available');
      return;
    }

    try {
      await this.ensureTableExists();

      const { error } = await this.supabase
        .from('live_predictions')
        .insert({
          timestamp: predictionData.timestamp,
          tech_score: predictionData.techScore,
          social_score: predictionData.socialScore,
          fund_score: predictionData.fundScore,
          astro_score: predictionData.astroScore,
          predicted_pct: predictionData.predictedPct,
          category: predictionData.category,
          confidence: predictionData.confidence
        });

      if (error) {
        console.error('Error storing prediction:', error);
      } else {
        console.log('Prediction stored successfully');
      }
    } catch (error) {
      console.error('Failed to store prediction:', error);
    }
  }

  async getLatestPrediction() {
    if (!this.supabase) {
      throw new Error('Supabase not available');
    }

    try {
      const { data, error } = await this.supabase
        .from('live_predictions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Failed to fetch latest prediction: ${error.message}`);
      }

      return data[0] || null;
    } catch (error) {
      console.error('Error fetching latest prediction:', error);
      throw error;
    }
  }

  async getPredictionHistory(hours = 24) {
    if (!this.supabase) {
      throw new Error('Supabase not available');
    }

    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await this.supabase
        .from('live_predictions')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch prediction history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      throw error;
    }
  }
}

// Create singleton instance
const predictionService = new PredictionService();

// Initialize on module load
predictionService.initialize().catch(error => {
  console.error('Failed to initialize prediction service:', error);
});

// Export main functions
export async function runPredictionLive() {
  return await predictionService.runPredictionLive();
}

export async function getLatestPrediction() {
  return await predictionService.getLatestPrediction();
}

export async function getPredictionHistory(hours = 24) {
  return await predictionService.getPredictionHistory(hours);
}

export default predictionService;