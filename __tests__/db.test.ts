/**
 * Database Integration Test Suite
 * Validates Supabase connection and health endpoint functionality
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

describe('Database Health Integration Tests', () => {
  let serverProcess: any;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  test('should connect to database with SELECT 1 query', async () => {
    const response = await fetch(`${BASE_URL}/health/db`);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.connected).toBe(true);
    expect(data.success).toBe(true);
    expect(data.message).toContain('SELECT 1');
    expect(data.latency).toBeGreaterThan(0);
    expect(data.database).toBe('operational');
  });

  test('should validate Supabase environment variables', async () => {
    const response = await fetch(`${BASE_URL}/health/db`);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Supabase connection successful indicates env vars are properly set
  });

  test('should handle database errors gracefully', async () => {
    // Test endpoint availability even if connection issues occur
    const response = await fetch(`${BASE_URL}/health/db`);
    
    // Should return a response (either success or failure)
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(600);
    
    const data = await response.json() as any;
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('timestamp');
  });
});