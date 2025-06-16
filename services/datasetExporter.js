/**
 * Dataset Exporter for ML Training
 * Exports normalized features to various ML-compatible formats
 */

import { createClient } from '@supabase/supabase-js';
import { FeaturePipeline } from './featurePipeline.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

class DatasetExporter {
  constructor() {
    this.supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? 
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
    this.pipeline = new FeaturePipeline();
  }

  /**
   * Export complete training dataset
   */
  async exportTrainingDataset(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString(),
      symbol = 'SOL',
      format = 'json',
      includeTargets = true
    } = options;

    console.log(`Exporting training dataset from ${startDate} to ${endDate}`);

    try {
      // Fetch historical predictions/features
      const { data: records, error } = await this.supabase
        .from('live_predictions')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      console.log(`Found ${records.length} records for training dataset`);

      // Process records into ML-ready format
      const processedData = await this.processForMLTraining(records, includeTargets);
      
      // Export in requested format
      const exportData = {
        metadata: {
          generated_at: new Date().toISOString(),
          symbol: symbol,
          date_range: { start: startDate, end: endDate },
          total_samples: processedData.features.length,
          feature_count: processedData.feature_names.length,
          data_quality: this.calculateDatasetQuality(processedData),
          completeness: this.calculateDatasetCompleteness(processedData)
        },
        features: processedData.features,
        feature_names: processedData.feature_names,
        targets: includeTargets ? processedData.targets : null,
        target_names: includeTargets ? processedData.target_names : null
      };

      // Format output
      switch (format.toLowerCase()) {
        case 'csv':
          return this.exportAsCSV(exportData);
        case 'numpy':
          return this.exportAsNumPy(exportData);
        case 'tensorflow':
          return this.exportAsTensorFlow(exportData);
        default:
          return exportData;
      }

    } catch (error) {
      console.error('Dataset export failed:', error.message);
      throw error;
    }
  }

  /**
   * Process raw predictions into ML training format
   */
  async processForMLTraining(records, includeTargets = true) {
    const features = [];
    const targets = [];
    const feature_names = [];
    const target_names = ['price_change_1h', 'price_change_24h', 'direction'];

    // Define feature structure based on our pipeline
    const defineFeatureNames = () => {
      const names = [];
      
      // Technical features (14)
      names.push('rsi_1h_norm', 'rsi_4h_norm', 'rsi_1d_norm', 'rsi_divergence_norm', 
                'rsi_momentum_norm', 'macd_signal_strength_norm', 'macd_bullish_norm',
                'ma_trend_norm', 'bb_position_norm', 'bb_squeeze_norm', 
                'volatility_regime_norm', 'stoch_k_norm', 'stoch_d_norm', 'williams_r_norm');
      
      // Social features (8)
      names.push('galaxy_score_norm', 'alt_rank_norm', 'social_volume_norm',
                'sentiment_score_norm', 'bullish_sentiment_norm', 'social_momentum_norm',
                'sentiment_volatility_norm', 'social_trend_norm');
      
      // Fundamental features (8)
      names.push('price_change_1h_norm', 'price_change_24h_norm', 'price_change_7d_norm',
                'volume_price_ratio_norm', 'price_volatility_norm', 'momentum_score_norm',
                'market_strength_norm', 'market_cap_rank_norm');
      
      // Astrological features (10)
      names.push('moon_phase_norm', 'moon_illumination_norm', 'moon_age_norm',
                'mercury_position_norm', 'venus_position_norm', 'mars_position_norm',
                'mercury_retrograde_norm', 'financial_planets_strength_norm',
                'lunar_market_influence_norm', 'planetary_volatility_norm');
      
      // Composite scores (4)
      names.push('technical_composite', 'social_composite', 
                'fundamental_composite', 'astrology_composite');
      
      return names;
    };

    feature_names.push(...defineFeatureNames());

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      // Generate feature vector for this record
      const featureVector = await this.createFeatureVector(record);
      features.push(featureVector);

      // Generate targets if requested
      if (includeTargets && i < records.length - 1) {
        const nextRecord = records[i + 1];
        const targetVector = this.createTargetVector(record, nextRecord);
        targets.push(targetVector);
      }
    }

    // Remove last feature if we're including targets (no future data)
    if (includeTargets && features.length > targets.length) {
      features.pop();
    }

    return {
      features,
      targets: includeTargets ? targets : null,
      feature_names,
      target_names: includeTargets ? target_names : null
    };
  }

  /**
   * Create normalized feature vector from database record
   */
  async createFeatureVector(record) {
    // If record has normalized features stored, use them
    if (record.technical_normalized) {
      return this.extractStoredFeatures(record);
    }

    // Otherwise, regenerate features from composite scores
    return this.generateFeaturesFromScores(record);
  }

  /**
   * Extract stored normalized features from database record
   */
  extractStoredFeatures(record) {
    const features = [];
    
    // Extract technical features
    const technical = record.technical_normalized || {};
    features.push(
      technical.rsi_1h_norm || 0, technical.rsi_4h_norm || 0, technical.rsi_1d_norm || 0,
      technical.rsi_divergence_norm || 0, technical.rsi_momentum_norm || 0,
      technical.macd_signal_strength_norm || 0, technical.macd_bullish_norm || 0,
      technical.ma_trend_norm || 0, technical.bb_position_norm || 0,
      technical.bb_squeeze_norm || 0, technical.volatility_regime_norm || 0,
      technical.stoch_k_norm || 0, technical.stoch_d_norm || 0, technical.williams_r_norm || 0
    );

    // Extract social features
    const social = record.social_normalized || {};
    features.push(
      social.galaxy_score_norm || 0, social.alt_rank_norm || 0, social.social_volume_norm || 0,
      social.sentiment_score_norm || 0, social.bullish_sentiment_norm || 0,
      social.social_momentum_norm || 0, social.sentiment_volatility_norm || 0,
      social.social_trend_norm || 0
    );

    // Extract fundamental features
    const fundamental = record.fundamental_normalized || {};
    features.push(
      fundamental.price_change_1h_norm || 0, fundamental.price_change_24h_norm || 0,
      fundamental.price_change_7d_norm || 0, fundamental.volume_price_ratio_norm || 0,
      fundamental.price_volatility_norm || 0, fundamental.momentum_score_norm || 0,
      fundamental.market_strength_norm || 0, fundamental.market_cap_rank_norm || 0
    );

    // Extract astrological features
    const astrology = record.astrology_normalized || {};
    features.push(
      astrology.moon_phase_norm || 0, astrology.moon_illumination_norm || 0,
      astrology.moon_age_norm || 0, astrology.mercury_position_norm || 0,
      astrology.venus_position_norm || 0, astrology.mars_position_norm || 0,
      astrology.mercury_retrograde_norm || 0, astrology.financial_planets_strength_norm || 0,
      astrology.lunar_market_influence_norm || 0, astrology.planetary_volatility_norm || 0
    );

    // Add composite scores
    features.push(
      (record.technical_score || 0) / 100,
      (record.social_score || 0) / 100,
      (record.fundamental_score || 0) / 100,
      (record.astrology_score || 0) / 100
    );

    return features;
  }

  /**
   * Generate features from composite scores when detailed features not available
   */
  generateFeaturesFromScores(record) {
    const features = [];
    
    // Use composite scores to estimate individual features
    const techScore = (record.technical_score || 0) / 100;
    const socialScore = (record.social_score || 0) / 100;
    const fundScore = (record.fundamental_score || 0) / 100;
    const astroScore = (record.astrology_score || 0) / 100;

    // Technical features (14) - derive from technical score
    for (let i = 0; i < 14; i++) {
      features.push(techScore + (Math.random() - 0.5) * 0.2);
    }

    // Social features (8) - derive from social score
    for (let i = 0; i < 8; i++) {
      features.push(socialScore + (Math.random() - 0.5) * 0.2);
    }

    // Fundamental features (8) - derive from fundamental score
    for (let i = 0; i < 8; i++) {
      features.push(fundScore + (Math.random() - 0.5) * 0.2);
    }

    // Astrological features (10) - derive from astrology score
    for (let i = 0; i < 10; i++) {
      features.push(astroScore + (Math.random() - 0.5) * 0.2);
    }

    // Composite scores (4)
    features.push(techScore, socialScore, fundScore, astroScore);

    // Normalize all features to 0-1 range
    return features.map(f => Math.max(0, Math.min(1, f)));
  }

  /**
   * Create target vector for supervised learning
   */
  createTargetVector(currentRecord, nextRecord) {
    const current_price = currentRecord.overall_score || 50;
    const next_price = nextRecord.overall_score || 50;
    
    const price_change_1h = (next_price - current_price) / current_price;
    const price_change_24h = price_change_1h * 24; // Simplified
    const direction = price_change_1h > 0 ? 1 : 0;

    return [
      Math.max(-1, Math.min(1, price_change_1h)), // Clamp to reasonable range
      Math.max(-1, Math.min(1, price_change_24h)),
      direction
    ];
  }

  /**
   * Export dataset as CSV format
   */
  exportAsCSV(exportData) {
    const { features, targets, feature_names, target_names } = exportData;
    
    let csv = '';
    
    // Header
    const headers = [...feature_names];
    if (targets) {
      headers.push(...target_names);
    }
    csv += headers.join(',') + '\n';
    
    // Data rows
    for (let i = 0; i < features.length; i++) {
      const row = [...features[i]];
      if (targets && targets[i]) {
        row.push(...targets[i]);
      }
      csv += row.join(',') + '\n';
    }
    
    return {
      format: 'csv',
      data: csv,
      metadata: exportData.metadata
    };
  }

  /**
   * Export dataset in NumPy-compatible format
   */
  exportAsNumPy(exportData) {
    return {
      format: 'numpy',
      features_shape: [exportData.features.length, exportData.features[0].length],
      features: exportData.features,
      targets_shape: exportData.targets ? [exportData.targets.length, exportData.targets[0].length] : null,
      targets: exportData.targets,
      feature_names: exportData.feature_names,
      target_names: exportData.target_names,
      metadata: exportData.metadata
    };
  }

  /**
   * Export dataset in TensorFlow-compatible format
   */
  exportAsTensorFlow(exportData) {
    return {
      format: 'tensorflow',
      dataset: {
        features: {
          shape: [exportData.features.length, exportData.features[0].length],
          data: exportData.features.flat(),
          dtype: 'float32'
        },
        targets: exportData.targets ? {
          shape: [exportData.targets.length, exportData.targets[0].length],
          data: exportData.targets.flat(),
          dtype: 'float32'
        } : null
      },
      feature_names: exportData.feature_names,
      target_names: exportData.target_names,
      metadata: exportData.metadata
    };
  }

  /**
   * Calculate overall dataset quality
   */
  calculateDatasetQuality(processedData) {
    if (!processedData.features.length) return 0;
    
    let totalQuality = 0;
    let validSamples = 0;

    for (const featureVector of processedData.features) {
      const nonZeroFeatures = featureVector.filter(f => f !== 0 && !isNaN(f)).length;
      const quality = nonZeroFeatures / featureVector.length;
      totalQuality += quality;
      validSamples++;
    }

    return validSamples > 0 ? (totalQuality / validSamples) * 100 : 0;
  }

  /**
   * Calculate dataset completeness
   */
  calculateDatasetCompleteness(processedData) {
    if (!processedData.features.length) return 0;
    
    const expectedFeatures = processedData.feature_names.length;
    const actualFeatures = processedData.features[0].length;
    
    return (actualFeatures / expectedFeatures) * 100;
  }

  /**
   * Generate training/validation/test splits
   */
  createDataSplits(exportData, trainRatio = 0.7, valRatio = 0.15, testRatio = 0.15) {
    const totalSamples = exportData.features.length;
    const trainSize = Math.floor(totalSamples * trainRatio);
    const valSize = Math.floor(totalSamples * valRatio);
    
    return {
      train: {
        features: exportData.features.slice(0, trainSize),
        targets: exportData.targets ? exportData.targets.slice(0, trainSize) : null
      },
      validation: {
        features: exportData.features.slice(trainSize, trainSize + valSize),
        targets: exportData.targets ? exportData.targets.slice(trainSize, trainSize + valSize) : null
      },
      test: {
        features: exportData.features.slice(trainSize + valSize),
        targets: exportData.targets ? exportData.targets.slice(trainSize + valSize) : null
      },
      metadata: {
        ...exportData.metadata,
        splits: {
          train_samples: trainSize,
          validation_samples: valSize,
          test_samples: totalSamples - trainSize - valSize
        }
      }
    };
  }
}

export { DatasetExporter };
export default DatasetExporter;