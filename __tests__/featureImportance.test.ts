/**
 * SHAP-based Feature Importance Endpoint Tests
 * Verifies output shape, sorting, and TensorFlow.js integration
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock TensorFlow.js
const mockTensorFlow = {
  tensor2d: jest.fn(),
  zeros: jest.fn(),
  variableGrads: jest.fn(),
  loadLayersModel: jest.fn()
};

const mockTensor = {
  add: jest.fn().mockReturnThis(),
  sub: jest.fn().mockReturnThis(),
  mul: jest.fn().mockReturnThis(),
  div: jest.fn().mockReturnThis(),
  squeeze: jest.fn().mockReturnThis(),
  mean: jest.fn().mockReturnThis(),
  dispose: jest.fn(),
  data: jest.fn().mockResolvedValue(new Float32Array([
    0.15, -0.12, 0.08, -0.05, 0.22, -0.18, 0.11, 0.03, -0.09, 0.14,
    0.07, -0.13, 0.19, -0.06, 0.04, 0.16, -0.11, 0.09, -0.02, 0.17,
    -0.14, 0.06, 0.12, -0.08, 0.13, 0.05, -0.10, 0.18, -0.07, 0.15,
    0.04, -0.16, 0.11, 0.09, -0.05, 0.20, -0.12, 0.08, 0.03, -0.14,
    0.17, -0.06, 0.10, 0.07, -0.13
  ]))
};

// Configure all tensor operations to return the mock tensor
Object.keys(mockTensor).forEach(key => {
  if (typeof mockTensor[key] === 'function' && key !== 'dispose' && key !== 'data') {
    mockTensor[key].mockReturnValue(mockTensor);
  }
});

mockTensorFlow.tensor2d.mockReturnValue(mockTensor);
mockTensorFlow.zeros.mockReturnValue(mockTensor);
mockTensorFlow.variableGrads.mockReturnValue({
  grads: { x: mockTensor }
});

const mockModel = {
  predict: jest.fn().mockReturnValue(mockTensor),
  inputs: [{ shape: [null, 45] }]
};

mockTensorFlow.loadLayersModel.mockResolvedValue(mockModel);

// Mock Supabase
const mockSupabaseData = {
  timestamp: '2025-06-16T06:00:00.000Z',
  price: 150.25,
  volume: 1000000,
  market_cap: 70000000000,
  price_change_24h: 2.5,
  volume_change_24h: -5.2,
  rsi: 65.4,
  macd_histogram: 0.8,
  ema_20: 148.5,
  sma_50: 145.2,
  bollinger_upper: 155.0,
  bollinger_lower: 140.0,
  stoch_rsi: 0.7,
  williams_r: -25.3,
  atr: 8.2,
  obv: 500000,
  cci: 120.5,
  social_volume: 15000,
  social_engagement: 8.5,
  galaxy_score: 72,
  alt_rank: 8,
  news_sentiment: 0.6,
  moon_phase: 0.75,
  mercury_retrograde: 0,
  market_sentiment: 0.65,
  fear_greed_index: 55,
  btc_dominance: 42.5,
  sentiment_volume: 12000,
  sentiment_consistency: 0.8,
  narrative_strength: 0.7,
  sentiment_momentum: 0.6,
  news_activity_level: 0.75,
  social_engagement_rate: 0.85,
  influencer_sentiment: 0.7,
  reddit_sentiment: 0.6,
  twitter_sentiment: 0.65,
  tps: 3500,
  validator_count: 1200,
  staking_yield: 6.8,
  epoch_progress: 0.45,
  slot_height: 250000000,
  network_congestion: 0.3,
  transaction_volume: 2500000,
  active_addresses: 450000,
  dex_volume: 1800000,
  defi_tvl: 5500000000,
  developer_activity: 85,
  github_commits: 125,
  network_growth: 0.15,
  holder_distribution: 0.6,
  whale_activity: 0.4
};

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue({
    data: [mockSupabaseData],
    error: null
  })
};

// Mock filesystem
const mockFs = {
  existsSync: jest.fn().mockReturnValue(true)
};

// Mock imports
jest.unstable_mockModule('@tensorflow/tfjs-node', () => mockTensorFlow);
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue(mockSupabase)
}));
jest.unstable_mockModule('fs', () => mockFs);

describe('SHAP-based Feature Importance Endpoint', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Create Express app and import routes
    app = express();
    app.use(express.json());
    
    // Set up environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    // Import and register routes
    const routes = await import('../server/routes.js');
    routes.default(app);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  test('should return feature importance with correct structure', async () => {
    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.feature_importance).toBeDefined();
    expect(Array.isArray(response.body.feature_importance)).toBe(true);
    expect(response.body.method).toBe('integrated_gradients');
    expect(response.body.model_info).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });

  test('should return correct number of features', async () => {
    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    const featureImportance = response.body.feature_importance;
    expect(featureImportance.length).toBe(45); // Total number of features
  });

  test('should have correct feature importance structure', async () => {
    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    const featureImportance = response.body.feature_importance;
    
    // Check first feature structure
    expect(featureImportance[0]).toHaveProperty('feature');
    expect(featureImportance[0]).toHaveProperty('shapValue');
    expect(typeof featureImportance[0].feature).toBe('string');
    expect(typeof featureImportance[0].shapValue).toBe('number');
  });

  test('should sort features by absolute SHAP value descending', async () => {
    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    const featureImportance = response.body.feature_importance;
    
    // Verify sorting by absolute value
    for (let i = 0; i < featureImportance.length - 1; i++) {
      const currentAbs = Math.abs(featureImportance[i].shapValue);
      const nextAbs = Math.abs(featureImportance[i + 1].shapValue);
      expect(currentAbs).toBeGreaterThanOrEqual(nextAbs);
    }
  });

  test('should include expected feature names', async () => {
    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    const featureImportance = response.body.feature_importance;
    const featureNames = featureImportance.map(f => f.feature);
    
    // Check for key features
    expect(featureNames).toContain('price');
    expect(featureNames).toContain('rsi');
    expect(featureNames).toContain('volume');
    expect(featureNames).toContain('social_volume');
    expect(featureNames).toContain('moon_phase');
    expect(featureNames).toContain('galaxy_score');
    expect(featureNames).toContain('news_sentiment');
  });

  test('should include model information', async () => {
    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    const modelInfo = response.body.model_info;
    expect(modelInfo.input_shape).toEqual([null, 45]);
    expect(modelInfo.total_features).toBe(45);
    expect(modelInfo.feature_vector_timestamp).toBeDefined();
  });

  test('should handle missing model file', async () => {
    // Mock model file not existing
    mockFs.existsSync.mockReturnValueOnce(false);

    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('TensorFlow.js model not found');
  });

  test('should handle missing feature data', async () => {
    // Mock no feature data available
    mockSupabase.limit.mockResolvedValueOnce({
      data: [],
      error: null
    });

    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No feature vectors found');
  });

  test('should handle Supabase errors', async () => {
    // Mock Supabase error
    mockSupabase.limit.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' }
    });

    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No feature vectors found');
  });

  test('should validate SHAP values are numeric', async () => {
    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    const featureImportance = response.body.feature_importance;
    
    featureImportance.forEach(feature => {
      expect(typeof feature.shapValue).toBe('number');
      expect(isNaN(feature.shapValue)).toBe(false);
      expect(isFinite(feature.shapValue)).toBe(true);
    });
  });

  test('should have non-zero SHAP values for most features', async () => {
    const response = await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    const featureImportance = response.body.feature_importance;
    const nonZeroFeatures = featureImportance.filter(f => Math.abs(f.shapValue) > 0.001);
    
    // Most features should have meaningful attribution
    expect(nonZeroFeatures.length).toBeGreaterThan(featureImportance.length * 0.7);
  });

  test('should properly dispose TensorFlow tensors', async () => {
    await request(app)
      .get('/api/ml/feature-importance')
      .expect(200);

    // Verify dispose was called multiple times for tensor cleanup
    expect(mockTensor.dispose).toHaveBeenCalled();
  });
});