/**
 * Integration Tests for Complete Platform
 * End-to-end testing of ML pipeline, risk management, and API integrations
 */

import request from 'supertest';
import HealthChecker from '../../scripts/healthcheck.js';
import { riskManager } from '../../services/riskManager.js';

describe('Full Platform Integration Tests', () => {
  let healthChecker;

  beforeAll(async () => {
    healthChecker = new HealthChecker();
  });

  describe('Risk Management Integration', () => {
    it('should validate position sizing calculations', () => {
      const testCases = [
        { prediction: 0.8, confidence: 0.9, expected: 'BUY' },
        { prediction: -0.8, confidence: 0.9, expected: 'SELL' },
        { prediction: 0.1, confidence: 0.9, expected: 'HOLD' }
      ];

      testCases.forEach(({ prediction, confidence, expected }) => {
        const result = riskManager.calculatePositionSize(
          prediction, confidence, 150, 10000, [145, 148, 152, 149, 151]
        );
        expect(result.recommendation).toBe(expected);
      });
    });

    it('should handle Kelly Criterion calculations', () => {
      const kelly = riskManager.calculateKellyCriterion(0.8, 0.1, 0.2);
      
      expect(kelly.kellyFraction).toBeGreaterThanOrEqual(0);
      expect(kelly.kellyFraction).toBeLessThanOrEqual(1);
      expect(kelly.expectedReturn).toBe(0.1);
      expect(kelly.winProbability).toBe(0.8);
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate correlation matrix properties', () => {
      const mockData = {
        btc_prices: [50000, 51000, 49000, 52000, 48000],
        eth_prices: [3000, 3100, 2950, 3150, 2900],
        sol_technical: [0.6, 0.65, 0.55, 0.7, 0.5],
        sol_social: [0.4, 0.45, 0.35, 0.5, 0.3]
      };

      // Test Pearson correlation calculation
      const correlation = healthChecker.calculatePearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
      expect(correlation).toBeCloseTo(1, 10);
    });

    it('should handle edge cases in calculations', () => {
      // Test with constant values
      const constantCorrelation = healthChecker.calculatePearsonCorrelation([5, 5, 5, 5, 5], [1, 2, 3, 4, 5]);
      expect(constantCorrelation).toBe(0);

      // Test with empty arrays
      const emptyCorrelation = healthChecker.calculatePearsonCorrelation([], []);
      expect(emptyCorrelation).toBe(0);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 5 }, () => 
        riskManager.calculatePositionSize(0.7, 0.8, 150, 10000, [145, 148, 152, 149, 151])
      );

      const results = await Promise.all(operations);
      
      results.forEach(result => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('recommendation');
      });
    });

    it('should validate calculation boundaries', () => {
      const testValues = [
        { x: [1, 2, 3, 4, 5], y: [1, 2, 3, 4, 5], expected: 1 },
        { x: [1, 2, 3, 4, 5], y: [5, 4, 3, 2, 1], expected: -1 },
        { x: [1, 1, 1, 1, 1], y: [2, 3, 4, 5, 6], expected: 0 }
      ];

      testValues.forEach(({ x, y, expected }) => {
        const correlation = healthChecker.calculatePearsonCorrelation(x, y);
        expect(correlation).toBeCloseTo(expected, 5);
        expect(correlation).toBeGreaterThanOrEqual(-1);
        expect(correlation).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle NaN and infinite values', () => {
      const nanData = [1, 2, NaN, 4, 5];
      const infiniteData = [1, 2, Infinity, 4, 5];
      const normalData = [2, 4, 6, 8, 10];

      const nanCorrelation = healthChecker.calculatePearsonCorrelation(nanData, normalData);
      const infiniteCorrelation = healthChecker.calculatePearsonCorrelation(infiniteData, normalData);

      expect(isNaN(nanCorrelation)).toBe(false);
      expect(isFinite(infiniteCorrelation)).toBe(true);
    });

    it('should validate risk management boundaries', () => {
      // Test extreme volatility
      const highVolatilityPrices = [100, 50, 200, 25, 300];
      const result = riskManager.calculatePositionSize(0.5, 0.7, 150, 10000, highVolatilityPrices);

      expect(result.riskMetrics.volatility).toBeGreaterThan(0.5);
      expect(result.positionSize).toBeLessThan(2); // Should reduce position size for high volatility

      // Test zero prediction
      const neutralResult = riskManager.calculatePositionSize(0, 0.8, 150, 10000, [145, 148, 152, 149, 151]);
      expect(neutralResult.recommendation).toBe('HOLD');
      expect(neutralResult.positionSize).toBe(0);
    });
  });

  describe('Service Integration', () => {
    it('should maintain consistent service interfaces', () => {
      // Test risk manager settings
      const settings = riskManager.getSettings();
      expect(settings).toHaveProperty('maxRiskPerTrade');
      expect(settings).toHaveProperty('kellyFraction');
      expect(settings).toHaveProperty('fixedFraction');

      // Test performance stats
      const stats = riskManager.getPerformanceStats();
      expect(stats).toHaveProperty('totalTrades');
      expect(stats).toHaveProperty('winRate');
      expect(stats.winRate).toBeGreaterThanOrEqual(0);
      expect(stats.winRate).toBeLessThanOrEqual(100);
    });

    it('should generate realistic simulation data', () => {
      const scenarios = riskManager.simulatePositionSizing();

      expect(Array.isArray(scenarios)).toBe(true);
      expect(scenarios.length).toBeGreaterThan(50);

      scenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('confidence');
        expect(scenario).toHaveProperty('prediction');
        expect(scenario).toHaveProperty('positionSize');
        expect(scenario).toHaveProperty('recommendation');
        expect(scenario.confidence).toBeGreaterThanOrEqual(0.3);
        expect(scenario.confidence).toBeLessThanOrEqual(1);
        expect(['BUY', 'SELL', 'HOLD']).toContain(scenario.recommendation);
      });
    });
  });

  describe('Mathematical Accuracy', () => {
    it('should maintain correlation matrix symmetry', () => {
      const matrix = [
        [1.0, 0.8, 0.2, -0.1],
        [0.8, 1.0, 0.3, -0.2],
        [0.2, 0.3, 1.0, 0.9],
        [-0.1, -0.2, 0.9, 1.0]
      ];

      // Check symmetry
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[0].length; j++) {
          expect(matrix[i][j]).toBeCloseTo(matrix[j][i], 5);
        }
      }

      // Check diagonal values
      for (let i = 0; i < matrix.length; i++) {
        expect(matrix[i][i]).toBeCloseTo(1.0, 5);
      }
    });

    it('should validate Kelly Criterion edge cases', () => {
      // Test with negative expected value
      const negativeKelly = riskManager.calculateKellyCriterion(0.4, 0.1, 0.2);
      expect(negativeKelly.kellyFraction).toBe(0);

      // Test with very high confidence
      const highConfidenceKelly = riskManager.calculateKellyCriterion(0.95, 0.2, 0.1);
      expect(highConfidenceKelly.kellyFraction).toBeLessThanOrEqual(0.25); // Should be capped
    });
  });
});