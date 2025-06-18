/**
 * TAAPI Pro Authentication Test Suite
 * Validates query string authentication and API connectivity
 */

import { describe, test, expect, beforeAll, jest } from '@jest/globals';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Mock fetch for unit tests
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('TAAPI Pro Authentication Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  test('should use query string authentication instead of Bearer tokens', async () => {
    // Mock successful TAAPI response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: 45.67,
        timestamp: new Date().toISOString()
      })
    } as any);

    const response = await fetch(`${BASE_URL}/api/taapi/rsi?interval=1h`);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify the API call used query string authentication
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const [url, options] = lastCall as [string, any];
    
    // Should include secret in query string
    expect(url).toContain('secret=');
    expect(url).toContain('exchange=binance');
    expect(url).toContain('symbol=SOL/USDT');
    expect(url).toContain('interval=1h');
    
    // Should NOT use Authorization header
    expect(options?.headers?.Authorization).toBeUndefined();
  });

  test('should handle 401 authentication errors with proper logging', async () => {
    // Mock 401 authentication failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key'
    } as any);

    const response = await fetch(`${BASE_URL}/api/taapi/rsi?interval=1h`);
    const data = await response.json() as any;

    expect(response.status).toBe(200); // Server should handle gracefully
    expect(data.success).toBe(false);
    expect(data.message).toContain('authentication');
  });

  test('should include proper URL parameters for RSI indicator', async () => {
    // Mock successful RSI response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: 52.34,
        timestamp: new Date().toISOString()
      })
    } as any);

    await fetch(`${BASE_URL}/api/taapi/rsi?interval=1h`);
    
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const [url] = lastCall as [string, any];
    
    expect(url).toContain('rsi');
    expect(url).toContain('period=14');
    expect(url).toContain('interval=1h');
  });

  test('should include proper URL parameters for MACD indicator', async () => {
    // Mock successful MACD response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valueMACD: 1.23,
        valueMACDSignal: 1.45,
        valueMACDHist: -0.22,
        timestamp: new Date().toISOString()
      })
    } as any);

    await fetch(`${BASE_URL}/api/taapi/macd?interval=1h`);
    
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const [url] = lastCall as [string, any];
    
    expect(url).toContain('macd');
    expect(url).toContain('fastPeriod=12');
    expect(url).toContain('slowPeriod=26');
    expect(url).toContain('signalPeriod=9');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});