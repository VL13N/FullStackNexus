/**
 * Unit Tests for Risk Manager Service
 * Comprehensive coverage of position sizing calculations
 */

import { riskManager } from '../../services/riskManager.js';

describe('RiskManager Service', () => {
  beforeEach(() => {
    // Reset settings to defaults
    riskManager.updateSettings({
      maxRiskPerTrade: 0.02,
      kellyFraction: 0.25,
      fixedFraction: 0.01,
      minConfidence: 0.3,
      maxPositionSize: 0.1,
      volatilityLookback: 30,
      emergencyStopLoss: 0.05,
      accountBalance: 10000
    });
  });

  describe('calculatePositionSize', () => {
    it('should calculate correct position size for bullish prediction', () => {
      const result = riskManager.calculatePositionSize(
        0.7,    // prediction
        0.8,    // confidence
        150,    // currentPrice
        10000,  // accountBalance
        [145, 148, 152, 149, 151] // priceHistory
      );

      expect(result.success).toBe(true);
      expect(result.recommendation).toBe('BUY');
      expect(result.positionSize).toBeGreaterThan(0);
      expect(result.positionPercentage).toBeLessThanOrEqual(10); // Max 10%
      expect(result.riskMetrics.riskPercentage).toBeLessThanOrEqual(2); // Max 2%
    });

    it('should return SELL recommendation for bearish prediction', () => {
      const result = riskManager.calculatePositionSize(
        -0.7,   // bearish prediction
        0.8,    // confidence
        150,    // currentPrice
        10000,  // accountBalance
        [155, 152, 148, 151, 149] // priceHistory
      );

      expect(result.recommendation).toBe('SELL');
    });

    it('should reject low confidence predictions', () => {
      const result = riskManager.calculatePositionSize(
        0.7,    // prediction
        0.2,    // low confidence
        150,    // currentPrice
        10000,  // accountBalance
        [145, 148, 152, 149, 151] // priceHistory
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('confidence');
    });

    it('should handle insufficient account balance', () => {
      const result = riskManager.calculatePositionSize(
        0.7,    // prediction
        0.8,    // confidence
        150,    // currentPrice
        100,    // small balance
        [145, 148, 152, 149, 151] // priceHistory
      );

      expect(result.success).toBe(false);
      expect(result.reason).toContain('balance');
    });
  });

  describe('calculateKellyCriterion', () => {
    it('should calculate Kelly fraction correctly', () => {
      const kelly = riskManager.calculateKellyCriterion(0.8, 0.1, 0.2);
      
      expect(kelly.kellyFraction).toBeGreaterThanOrEqual(0);
      expect(kelly.kellyFraction).toBeLessThanOrEqual(1);
      expect(kelly.expectedReturn).toBe(0.1);
      expect(kelly.winProbability).toBe(0.8);
    });

    it('should cap Kelly fraction at maximum', () => {
      const kelly = riskManager.calculateKellyCriterion(0.9, 0.5, 0.1);
      
      expect(kelly.kellyFraction).toBeLessThanOrEqual(0.25); // Default max
    });

    it('should return zero for negative expected value', () => {
      const kelly = riskManager.calculateKellyCriterion(0.4, 0.1, 0.2);
      
      expect(kelly.kellyFraction).toBe(0);
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate volatility from price history', () => {
      const prices = [100, 105, 98, 103, 97, 102, 99];
      const volatility = riskManager.calculateVolatility(prices);
      
      expect(volatility).toBeGreaterThan(0);
      expect(volatility).toBeLessThan(1); // Should be a reasonable percentage
    });

    it('should handle single price', () => {
      const volatility = riskManager.calculateVolatility([100]);
      
      expect(volatility).toBe(0.2); // Default fallback
    });

    it('should handle empty price array', () => {
      const volatility = riskManager.calculateVolatility([]);
      
      expect(volatility).toBe(0.2); // Default fallback
    });
  });

  describe('updateSettings', () => {
    it('should update risk settings correctly', () => {
      const newSettings = {
        maxRiskPerTrade: 0.03,
        kellyFraction: 0.3,
        fixedFraction: 0.015
      };

      riskManager.updateSettings(newSettings);
      const settings = riskManager.getSettings();

      expect(settings.maxRiskPerTrade).toBe(0.03);
      expect(settings.kellyFraction).toBe(0.3);
      expect(settings.fixedFraction).toBe(0.015);
    });

    it('should validate setting boundaries', () => {
      const invalidSettings = {
        maxRiskPerTrade: 0.5, // Too high
        kellyFraction: 1.5,   // Too high
        fixedFraction: -0.01  // Negative
      };

      riskManager.updateSettings(invalidSettings);
      const settings = riskManager.getSettings();

      expect(settings.maxRiskPerTrade).toBeLessThanOrEqual(0.1);
      expect(settings.kellyFraction).toBeLessThanOrEqual(1);
      expect(settings.fixedFraction).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPerformanceStats', () => {
    it('should return valid performance statistics', () => {
      const stats = riskManager.getPerformanceStats();

      expect(stats).toHaveProperty('totalTrades');
      expect(stats).toHaveProperty('winRate');
      expect(stats).toHaveProperty('totalReturn');
      expect(stats).toHaveProperty('sharpeRatio');
      expect(stats.winRate).toBeGreaterThanOrEqual(0);
      expect(stats.winRate).toBeLessThanOrEqual(100);
    });
  });

  describe('simulatePositionSizing', () => {
    it('should generate multiple scenarios', () => {
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
        expect(scenario.prediction).toBeGreaterThanOrEqual(-1);
        expect(scenario.prediction).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme volatility', () => {
      const prices = [100, 50, 200, 25, 300]; // Very volatile
      const result = riskManager.calculatePositionSize(
        0.5, 0.7, 150, 10000, prices
      );

      expect(result.riskMetrics.volatility).toBeGreaterThan(0.5);
      expect(result.positionSize).toBeLessThan(1); // Should reduce position size
    });

    it('should handle zero prediction', () => {
      const result = riskManager.calculatePositionSize(
        0, 0.8, 150, 10000, [145, 148, 152, 149, 151]
      );

      expect(result.recommendation).toBe('HOLD');
      expect(result.positionSize).toBe(0);
    });

    it('should handle very high confidence', () => {
      const result = riskManager.calculatePositionSize(
        0.9, 0.99, 150, 10000, [145, 148, 152, 149, 151]
      );

      expect(result.success).toBe(true);
      expect(result.modelMetrics.confidence).toBe(0.99);
    });
  });
});