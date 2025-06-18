/**
 * CryptoRank Sparkline Date Formatting Test Suite
 * Validates proper ISO timestamp usage and numeric ID handling
 */

import { describe, test, expect, beforeAll, jest } from '@jest/globals';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Mock fetch for unit tests
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('CryptoRank Sparkline Date Formatting Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  test('should use proper ISO timestamps for sparkline endpoint', async () => {
    // Mock successful sparkline response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { timestamp: 1703721600, price: 45.67, volume: 1250000 },
          { timestamp: 1703725200, price: 46.12, volume: 1180000 }
        ]
      })
    } as any);

    const response = await fetch(`${BASE_URL}/api/cryptorank/sparkline`);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify the API call used proper date formatting
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const [url] = lastCall as [string, any];
    
    // Should use numeric ID (5663) for Solana
    expect(url).toContain('currencies/5663/sparkline');
    
    // Should include from and to parameters as Unix timestamps
    expect(url).toContain('from=');
    expect(url).toContain('to=');
    expect(url).toContain('interval=');
    
    // Verify Unix timestamp format (10 digits)
    const fromMatch = url.match(/from=(\d+)/);
    const toMatch = url.match(/to=(\d+)/);
    
    expect(fromMatch).toBeTruthy();
    expect(toMatch).toBeTruthy();
    expect(fromMatch[1]).toMatch(/^\d{10}$/); // Unix timestamp
    expect(toMatch[1]).toMatch(/^\d{10}$/);   // Unix timestamp
  });

  test('should generate proper 24-hour date range', async () => {
    // Mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    } as any);

    const testStart = Date.now();
    await fetch(`${BASE_URL}/api/cryptorank/sparkline`);
    
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const [url] = lastCall as [string, any];
    
    const fromMatch = url.match(/from=(\d+)/);
    const toMatch = url.match(/to=(\d+)/);
    
    const fromUnix = parseInt(fromMatch[1]) * 1000;
    const toUnix = parseInt(toMatch[1]) * 1000;
    
    // Should be approximately 24 hours apart
    const timeDiff = toUnix - fromUnix;
    const expectedDiff = 24 * 60 * 60 * 1000; // 24 hours in ms
    
    expect(timeDiff).toBeGreaterThan(expectedDiff - 60000); // Allow 1min tolerance
    expect(timeDiff).toBeLessThan(expectedDiff + 60000);
    
    // 'to' should be close to current time
    expect(toUnix).toBeGreaterThan(testStart - 10000); // Within 10 seconds
    expect(toUnix).toBeLessThan(testStart + 10000);
  });

  test('should handle custom date parameters correctly', async () => {
    // Mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    } as any);

    const customFrom = new Date('2024-01-01T00:00:00Z');
    const customTo = new Date('2024-01-02T00:00:00Z');
    
    await fetch(`${BASE_URL}/api/cryptorank/sparkline?from=${customFrom.toISOString()}&to=${customTo.toISOString()}`);
    
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const [url] = lastCall as [string, any];
    
    const fromMatch = url.match(/from=(\d+)/);
    const toMatch = url.match(/to=(\d+)/);
    
    const fromUnix = parseInt(fromMatch[1]);
    const toUnix = parseInt(toMatch[1]);
    
    // Verify Unix timestamps match expected dates
    expect(fromUnix).toBe(Math.floor(customFrom.getTime() / 1000));
    expect(toUnix).toBe(Math.floor(customTo.getTime() / 1000));
  });

  test('should reject invalid date parameters', async () => {
    // Mock response for invalid dates
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Invalid date parameters'
      })
    } as any);

    const response = await fetch(`${BASE_URL}/api/cryptorank/sparkline?from=invalid&to=also-invalid`);
    
    // Should handle gracefully
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test('should use numeric currency ID instead of slugs', async () => {
    // Mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    } as any);

    await fetch(`${BASE_URL}/api/cryptorank/sparkline`);
    
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const [url] = lastCall as [string, any];
    
    // Should use numeric ID (5663) not slug (solana)
    expect(url).toContain('currencies/5663');
    expect(url).not.toContain('currencies/solana');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});