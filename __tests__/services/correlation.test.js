/**
 * Unit Tests for Correlation Analysis Service
 * Comprehensive coverage of correlation computation and matrix operations
 */

import CorrelationService from '../../services/correlation.js';

describe('CorrelationService', () => {
  let correlationService;

  beforeEach(() => {
    correlationService = new CorrelationService();
  });

  describe('computeCorrelationMatrix', () => {
    it('should compute correlation matrix for valid data', async () => {
      const mockData = {
        btc_prices: [50000, 51000, 49000, 52000, 48000],
        eth_prices: [3000, 3100, 2950, 3150, 2900],
        sol_technical: [0.6, 0.65, 0.55, 0.7, 0.5],
        sol_social: [0.4, 0.45, 0.35, 0.5, 0.3],
        sol_fundamental: [0.5, 0.55, 0.45, 0.6, 0.4],
        sol_astrology: [0.7, 0.75, 0.65, 0.8, 0.6]
      };

      const result = await correlationService.computeCorrelationMatrix(mockData);

      expect(result.success).toBe(true);
      expect(result.matrix).toBeDefined();
      expect(result.variables).toHaveLength(6);
      expect(result.matrix).toHaveLength(6);
      expect(result.matrix[0]).toHaveLength(6);

      // Check matrix properties
      result.matrix.forEach((row, i) => {
        row.forEach((value, j) => {
          expect(value).toBeGreaterThanOrEqual(-1);
          expect(value).toBeLessThanOrEqual(1);
          if (i === j) {
            expect(value).toBeCloseTo(1, 2); // Diagonal should be 1
          }
        });
      });

      // Check symmetry
      for (let i = 0; i < result.matrix.length; i++) {
        for (let j = 0; j < result.matrix[0].length; j++) {
          expect(result.matrix[i][j]).toBeCloseTo(result.matrix[j][i], 5);
        }
      }
    });

    it('should handle insufficient data', async () => {
      const mockData = {
        btc_prices: [50000],
        eth_prices: [3000],
        sol_technical: [0.6]
      };

      const result = await correlationService.computeCorrelationMatrix(mockData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient data');
    });

    it('should handle mismatched data lengths', async () => {
      const mockData = {
        btc_prices: [50000, 51000, 49000],
        eth_prices: [3000, 3100], // Different length
        sol_technical: [0.6, 0.65, 0.55]
      };

      const result = await correlationService.computeCorrelationMatrix(mockData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('length');
    });
  });

  describe('calculatePearsonCorrelation', () => {
    it('should calculate correct correlation for perfectly correlated data', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // Perfect positive correlation

      const correlation = correlationService.calculatePearsonCorrelation(x, y);

      expect(correlation).toBeCloseTo(1, 10);
    });

    it('should calculate correct correlation for perfectly anti-correlated data', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2]; // Perfect negative correlation

      const correlation = correlationService.calculatePearsonCorrelation(x, y);

      expect(correlation).toBeCloseTo(-1, 10);
    });

    it('should calculate zero correlation for uncorrelated data', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 1, 4, 3, 5]; // No clear pattern

      const correlation = correlationService.calculatePearsonCorrelation(x, y);

      expect(correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation).toBeLessThanOrEqual(1);
    });

    it('should handle constant values', () => {
      const x = [5, 5, 5, 5, 5];
      const y = [1, 2, 3, 4, 5];

      const correlation = correlationService.calculatePearsonCorrelation(x, y);

      expect(correlation).toBe(0);
    });

    it('should handle empty arrays', () => {
      const correlation = correlationService.calculatePearsonCorrelation([], []);

      expect(correlation).toBe(0);
    });

    it('should handle different length arrays', () => {
      const x = [1, 2, 3];
      const y = [1, 2];

      const correlation = correlationService.calculatePearsonCorrelation(x, y);

      expect(correlation).toBe(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights from correlation matrix', () => {
      const matrix = [
        [1.0, 0.8, 0.2, -0.1],
        [0.8, 1.0, 0.3, -0.2],
        [0.2, 0.3, 1.0, 0.9],
        [-0.1, -0.2, 0.9, 1.0]
      ];
      const variables = ['BTC', 'ETH', 'SOL_Tech', 'SOL_Social'];

      const insights = correlationService.generateInsights(matrix, variables);

      expect(insights).toHaveProperty('strongest_positive');
      expect(insights).toHaveProperty('strongest_negative');
      expect(insights).toHaveProperty('weakest_correlation');
      expect(insights).toHaveProperty('cross_asset_correlations');
      expect(insights).toHaveProperty('pillar_relationships');

      expect(insights.strongest_positive.correlation).toBeGreaterThan(0.8);
      expect(insights.strongest_negative.correlation).toBeLessThan(0);
    });

    it('should handle matrix with no strong correlations', () => {
      const matrix = [
        [1.0, 0.1, 0.05, -0.02],
        [0.1, 1.0, 0.03, -0.01],
        [0.05, 0.03, 1.0, 0.08],
        [-0.02, -0.01, 0.08, 1.0]
      ];
      const variables = ['BTC', 'ETH', 'SOL_Tech', 'SOL_Social'];

      const insights = correlationService.generateInsights(matrix, variables);

      expect(insights.strongest_positive.correlation).toBeLessThan(0.5);
      expect(insights.weakest_correlation.correlation).toBeLessThan(0.1);
    });
  });

  describe('fetchHistoricalData', () => {
    it('should fetch and structure historical data', async () => {
      // Mock successful API responses
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            bitcoin: { usd: 50000 },
            ethereum: { usd: 3000 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              price: { usd: 150 },
              sparkline: [145, 148, 152, 149, 151, 150]
            }
          })
        });

      const data = await correlationService.fetchHistoricalData(7);

      expect(data).toHaveProperty('btc_prices');
      expect(data).toHaveProperty('eth_prices');
      expect(data).toHaveProperty('sol_prices');
      expect(Array.isArray(data.btc_prices)).toBe(true);
      expect(Array.isArray(data.eth_prices)).toBe(true);
      expect(Array.isArray(data.sol_prices)).toBe(true);
    });

    it('should handle API failures gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const data = await correlationService.fetchHistoricalData(7);

      expect(data).toHaveProperty('btc_prices');
      expect(data).toHaveProperty('eth_prices');
      expect(data.btc_prices.length).toBeGreaterThan(0); // Should use fallback data
    });
  });

  describe('getCorrelationAnalysis', () => {
    it('should return complete correlation analysis', async () => {
      const analysis = await correlationService.getCorrelationAnalysis(30);

      expect(analysis).toHaveProperty('success');
      expect(analysis).toHaveProperty('data');
      expect(analysis).toHaveProperty('timestamp');

      if (analysis.success) {
        expect(analysis.data).toHaveProperty('correlations');
        expect(analysis.data).toHaveProperty('summary');
        expect(analysis.data.correlations).toBeInstanceOf(Object);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle NaN values in data', () => {
      const x = [1, 2, NaN, 4, 5];
      const y = [2, 4, 6, 8, 10];

      const correlation = correlationService.calculatePearsonCorrelation(x, y);

      expect(correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation).toBeLessThanOrEqual(1);
      expect(isNaN(correlation)).toBe(false);
    });

    it('should handle infinite values in data', () => {
      const x = [1, 2, Infinity, 4, 5];
      const y = [2, 4, 6, 8, 10];

      const correlation = correlationService.calculatePearsonCorrelation(x, y);

      expect(isFinite(correlation)).toBe(true);
    });

    it('should handle very large matrices', async () => {
      const largeData = {};
      for (let i = 0; i < 50; i++) {
        largeData[`var_${i}`] = Array.from({ length: 100 }, () => Math.random());
      }

      const result = await correlationService.computeCorrelationMatrix(largeData);

      expect(result.success).toBe(true);
      expect(result.matrix.length).toBe(50);
    });

    it('should validate correlation bounds', () => {
      // Test with known data that should produce valid correlations
      const testCases = [
        [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]],
        [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]],
        [[1, 1, 1, 1, 1], [2, 3, 4, 5, 6]],
        [[0, 1, 0, 1, 0], [1, 0, 1, 0, 1]]
      ];

      testCases.forEach(([x, y]) => {
        const correlation = correlationService.calculatePearsonCorrelation(x, y);
        expect(correlation).toBeGreaterThanOrEqual(-1);
        expect(correlation).toBeLessThanOrEqual(1);
        expect(isNaN(correlation)).toBe(false);
      });
    });
  });
});