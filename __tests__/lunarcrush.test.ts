/**
 * LunarCrush v2 Discover Plan Test Suite
 * Validates v2 endpoint connectivity and data mapping logic
 */

import { describe, test, expect, beforeAll, jest } from '@jest/globals';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Mock fetch for unit tests
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('LunarCrush v2 Discover Plan Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  test('should use v2 Discover Plan endpoints', async () => {
    // Mock successful v2 response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          galaxy_score: 72.5,
          altrank: 15,
          social_volume_24h: 450,
          social_score: 68.2,
          social_contributors: 1250,
          social_dominance: 2.8,
          volatility: 0.045,
          sentiment: 0.62
        }
      })
    } as any);

    const response = await fetch(`${BASE_URL}/api/lunarcrush/metrics`);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify v2 endpoint usage
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const [url] = lastCall as [string, any];
    
    expect(url).toContain('/v2/assets/solana');
    expect(url).toContain('key=');
  });

  test('should respect 1 call/sec rate limit for Discover plan', async () => {
    const startTime = Date.now();
    
    // Mock multiple successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          galaxy_score: 70.0,
          social_volume_24h: 400
        }
      })
    } as any);

    // Make two sequential calls
    await fetch(`${BASE_URL}/api/lunarcrush/metrics`);
    await fetch(`${BASE_URL}/api/lunarcrush/metrics`);
    
    const elapsed = Date.now() - startTime;
    
    // Should have rate limiting delay
    expect(elapsed).toBeGreaterThan(1000);
  });

  test('should map v2 response data correctly', async () => {
    // Mock v2 response with specific data structure
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          galaxy_score: 75.8,
          altrank: 12,
          social_volume_24h: 520,
          social_score: 71.5,
          social_contributors: 1380,
          social_dominance: 3.2,
          volatility: 0.038,
          sentiment: 0.68
        }
      })
    } as any);

    const response = await fetch(`${BASE_URL}/api/lunarcrush/metrics`);
    const data = await response.json() as any;

    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      galaxy_score: 75.8,
      altrank: 12,
      social_volume: 520,
      social_score: 71.5,
      social_contributors: 1380,
      social_dominance: 3.2,
      volatility: 0.038,
      sentiment: 0.68
    });
    expect(data.data.source).toBe('lunarcrush_v2_discover');
  });

  test('should handle network failures with exponential backoff', async () => {
    // Mock network failure followed by success
    mockFetch
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { galaxy_score: 70.0 }
        })
      } as any);

    const response = await fetch(`${BASE_URL}/api/lunarcrush/metrics`);
    const data = await response.json() as any;

    // Should eventually succeed with fallback
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});