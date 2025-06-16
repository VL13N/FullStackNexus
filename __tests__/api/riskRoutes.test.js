/**
 * Unit Tests for Risk Management API Routes
 * Comprehensive coverage of position sizing and risk management endpoints
 */

import request from 'supertest';
import express from 'express';
import riskRoutes from '../../server/riskRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/risk', riskRoutes);

describe('Risk Management API Routes', () => {
  describe('POST /api/risk/size', () => {
    it('should calculate position size for valid input', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send({
          prediction: 0.7,
          confidence: 0.8,
          currentPrice: 150,
          accountBalance: 10000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('positionSize');
      expect(response.body.data).toHaveProperty('recommendation');
      expect(response.body.data).toHaveProperty('riskMetrics');
      expect(response.body.data.positionSize).toBeGreaterThanOrEqual(0);
    });

    it('should return BUY recommendation for bullish prediction', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send({
          prediction: 0.8,
          confidence: 0.9,
          currentPrice: 150,
          accountBalance: 10000
        })
        .expect(200);

      expect(response.body.data.recommendation).toBe('BUY');
    });

    it('should return SELL recommendation for bearish prediction', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send({
          prediction: -0.8,
          confidence: 0.9,
          currentPrice: 150,
          accountBalance: 10000
        })
        .expect(200);

      expect(response.body.data.recommendation).toBe('SELL');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send({
          prediction: 0.7,
          // Missing confidence, currentPrice, accountBalance
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should validate prediction range', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send({
          prediction: 1.5, // Invalid range
          confidence: 0.8,
          currentPrice: 150,
          accountBalance: 10000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('prediction');
    });

    it('should validate confidence range', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send({
          prediction: 0.7,
          confidence: 1.5, // Invalid range
          currentPrice: 150,
          accountBalance: 10000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('confidence');
    });

    it('should handle low confidence predictions', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send({
          prediction: 0.7,
          confidence: 0.2, // Below threshold
          currentPrice: 150,
          accountBalance: 10000
        })
        .expect(200);

      expect(response.body.data.success).toBe(false);
      expect(response.body.data.reason).toContain('confidence');
    });
  });

  describe('GET /api/risk/size', () => {
    it('should calculate position size with query parameters', async () => {
      const response = await request(app)
        .get('/api/risk/size')
        .query({
          prediction: 0.6,
          confidence: 0.7,
          currentPrice: 155,
          accountBalance: 15000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('positionSize');
    });

    it('should use default values for missing query parameters', async () => {
      const response = await request(app)
        .get('/api/risk/size')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('positionSize');
    });
  });

  describe('GET /api/risk/settings', () => {
    it('should return current risk settings', async () => {
      const response = await request(app)
        .get('/api/risk/settings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('maxRiskPerTrade');
      expect(response.body.data).toHaveProperty('kellyFraction');
      expect(response.body.data).toHaveProperty('fixedFraction');
      expect(response.body.data).toHaveProperty('minConfidence');
    });

    it('should return valid setting ranges', async () => {
      const response = await request(app)
        .get('/api/risk/settings')
        .expect(200);

      const settings = response.body.data;
      expect(settings.maxRiskPerTrade).toBeGreaterThan(0);
      expect(settings.maxRiskPerTrade).toBeLessThanOrEqual(0.1);
      expect(settings.kellyFraction).toBeGreaterThanOrEqual(0);
      expect(settings.kellyFraction).toBeLessThanOrEqual(1);
    });
  });

  describe('PUT /api/risk/settings', () => {
    it('should update risk settings with valid values', async () => {
      const newSettings = {
        maxRiskPerTrade: 0.025,
        kellyFraction: 0.3,
        fixedFraction: 0.012
      };

      const response = await request(app)
        .put('/api/risk/settings')
        .send(newSettings)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxRiskPerTrade).toBe(0.025);
    });

    it('should validate setting boundaries', async () => {
      const invalidSettings = {
        maxRiskPerTrade: 0.5, // Too high
        kellyFraction: 1.5,   // Too high
        fixedFraction: -0.01  // Negative
      };

      const response = await request(app)
        .put('/api/risk/settings')
        .send(invalidSettings)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should handle partial setting updates', async () => {
      const partialSettings = {
        maxRiskPerTrade: 0.03
      };

      const response = await request(app)
        .put('/api/risk/settings')
        .send(partialSettings)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maxRiskPerTrade).toBe(0.03);
    });
  });

  describe('GET /api/risk/stats', () => {
    it('should return portfolio performance statistics', async () => {
      const response = await request(app)
        .get('/api/risk/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTrades');
      expect(response.body.data).toHaveProperty('winRate');
      expect(response.body.data).toHaveProperty('totalReturn');
      expect(response.body.data).toHaveProperty('sharpeRatio');
    });

    it('should return realistic performance metrics', async () => {
      const response = await request(app)
        .get('/api/risk/stats')
        .expect(200);

      const stats = response.body.data;
      expect(stats.winRate).toBeGreaterThanOrEqual(0);
      expect(stats.winRate).toBeLessThanOrEqual(100);
      expect(stats.totalTrades).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /api/risk/performance', () => {
    it('should add new performance data point', async () => {
      const performanceData = {
        prediction: 0.7,
        actualOutcome: 0.05,
        positionSize: 1.5,
        return: 0.03,
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/risk/performance')
        .send(performanceData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('added');
    });

    it('should validate performance data fields', async () => {
      const invalidData = {
        prediction: 0.7
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/risk/performance')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/risk/kelly/:confidence/:expectedReturn/:volatility', () => {
    it('should calculate Kelly Criterion for specific parameters', async () => {
      const response = await request(app)
        .get('/api/risk/kelly/0.8/0.1/0.2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('kellyFraction');
      expect(response.body.data).toHaveProperty('expectedReturn');
      expect(response.body.data).toHaveProperty('winProbability');
    });

    it('should validate Kelly parameters', async () => {
      const response = await request(app)
        .get('/api/risk/kelly/1.5/0.1/0.2') // Invalid confidence
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('confidence');
    });

    it('should handle edge case parameters', async () => {
      const response = await request(app)
        .get('/api/risk/kelly/0.5/0/-0.1') // Zero expected return
        .expect(200);

      expect(response.body.data.kellyFraction).toBe(0);
    });
  });

  describe('GET /api/risk/simulate', () => {
    it('should generate position sizing simulation scenarios', async () => {
      const response = await request(app)
        .get('/api/risk/simulate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('scenarios');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.scenarios)).toBe(true);
      expect(response.body.data.scenarios.length).toBeGreaterThan(50);
    });

    it('should include summary statistics', async () => {
      const response = await request(app)
        .get('/api/risk/simulate')
        .expect(200);

      const summary = response.body.data.summary;
      expect(summary).toHaveProperty('totalScenarios');
      expect(summary).toHaveProperty('avgPositionSize');
      expect(summary).toHaveProperty('buySignals');
      expect(summary).toHaveProperty('sellSignals');
    });

    it('should generate realistic scenario data', async () => {
      const response = await request(app)
        .get('/api/risk/simulate')
        .expect(200);

      const scenarios = response.body.data.scenarios;
      scenarios.forEach(scenario => {
        expect(scenario.confidence).toBeGreaterThanOrEqual(0.3);
        expect(scenario.confidence).toBeLessThanOrEqual(1);
        expect(scenario.prediction).toBeGreaterThanOrEqual(-1);
        expect(scenario.prediction).toBeLessThanOrEqual(1);
        expect(scenario.positionSize).toBeGreaterThanOrEqual(0);
        expect(['BUY', 'SELL', 'HOLD']).toContain(scenario.recommendation);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/risk/size')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Format', () => {
    it('should return consistent success response format', async () => {
      const response = await request(app)
        .get('/api/risk/settings')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.success).toBe(true);
    });

    it('should include timestamp in all responses', async () => {
      const response = await request(app)
        .get('/api/risk/stats')
        .expect(200);

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});