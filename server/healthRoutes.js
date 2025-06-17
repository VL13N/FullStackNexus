/**
 * Health Monitoring Routes for System Hardening
 * Provides comprehensive health checks across all services and database
 */

import { Router } from 'express';
import { fetchTAIndicator } from '../api/taapi.js';
import { LunarCrushService } from '../api/lunarcrush.js';
import { fetchSolanaCurrent } from '../api/cryptorank.js';
import { SolanaOnChainService } from '../api/onchain.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const router = Router();

/**
 * Comprehensive internal health check endpoint
 * Tests all critical services with latency monitoring
 */
router.get('/internal', async (req, res) => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  console.log('[HEALTH] Starting comprehensive health check...');

  // Test TAAPI Pro service
  try {
    const startTime = Date.now();
    await fetchTAIndicator('rsi', '1h');
    const latencyMs = Date.now() - startTime;
    
    healthStatus.services.taapi = {
      ok: true,
      latencyMs,
      endpoint: 'rsi indicator',
      error: null
    };
    console.log(`[HEALTH] TAAPI: OK (${latencyMs}ms)`);
  } catch (error) {
    healthStatus.services.taapi = {
      ok: false,
      latencyMs: null,
      endpoint: 'rsi indicator',
      error: error.message
    };
    console.error(`[HEALTH] TAAPI: FAILED - ${error.message}`);
  }

  // Test LunarCrush service
  try {
    const startTime = Date.now();
    const lunarcrush = new LunarCrushService();
    await lunarcrush.getSolanaMetrics();
    const latencyMs = Date.now() - startTime;
    
    healthStatus.services.lunarcrush = {
      ok: true,
      latencyMs,
      endpoint: 'solana metrics',
      error: null
    };
    console.log(`[HEALTH] LunarCrush: OK (${latencyMs}ms)`);
  } catch (error) {
    healthStatus.services.lunarcrush = {
      ok: false,
      latencyMs: null,
      endpoint: 'solana metrics',
      error: error.message
    };
    console.error(`[HEALTH] LunarCrush: FAILED - ${error.message}`);
  }

  // Test CryptoRank service
  try {
    const startTime = Date.now();
    await fetchSolanaCurrent();
    const latencyMs = Date.now() - startTime;
    
    healthStatus.services.cryptorank = {
      ok: true,
      latencyMs,
      endpoint: 'solana current',
      error: null
    };
    console.log(`[HEALTH] CryptoRank: OK (${latencyMs}ms)`);
  } catch (error) {
    healthStatus.services.cryptorank = {
      ok: false,
      latencyMs: null,
      endpoint: 'solana current',
      error: error.message
    };
    console.error(`[HEALTH] CryptoRank: FAILED - ${error.message}`);
  }

  // Test Solana On-Chain service
  try {
    const startTime = Date.now();
    const onchain = new SolanaOnChainService();
    await onchain.getNetworkMetrics();
    const latencyMs = Date.now() - startTime;
    
    healthStatus.services.onchain = {
      ok: true,
      latencyMs,
      endpoint: 'network metrics',
      error: null
    };
    console.log(`[HEALTH] OnChain: OK (${latencyMs}ms)`);
  } catch (error) {
    healthStatus.services.onchain = {
      ok: false,
      latencyMs: null,
      endpoint: 'network metrics',
      error: error.message
    };
    console.error(`[HEALTH] OnChain: FAILED - ${error.message}`);
  }

  // Test Supabase database connection
  try {
    const startTime = Date.now();
    
    // Test read access
    const { data: readTest, error: readError } = await supabase
      .from('predictions')
      .select('id')
      .limit(1);
    
    if (readError) throw new Error(`Read test failed: ${readError.message}`);
    
    // Test write access with temporary row
    const testData = {
      prediction: 0,
      confidence: 0,
      direction: 'TEST',
      technical_score: 0,
      social_score: 0,
      fundamental_score: 0,
      astrology_score: 0,
      features: {},
      pillar_scores: {},
      created_at: new Date().toISOString()
    };
    
    const { data: writeTest, error: writeError } = await supabase
      .from('predictions')
      .insert([testData])
      .select();
    
    if (writeError) throw new Error(`Write test failed: ${writeError.message}`);
    
    // Clean up test row
    if (writeTest && writeTest[0]) {
      await supabase
        .from('predictions')
        .delete()
        .eq('id', writeTest[0].id);
    }
    
    const latencyMs = Date.now() - startTime;
    
    healthStatus.services.supabase = {
      ok: true,
      latencyMs,
      endpoint: 'read/write test',
      error: null
    };
    console.log(`[HEALTH] Supabase: OK (${latencyMs}ms)`);
    
  } catch (error) {
    healthStatus.services.supabase = {
      ok: false,
      latencyMs: null,
      endpoint: 'read/write test',
      error: error.message
    };
    console.error(`[HEALTH] Supabase: FAILED - ${error.message}`);
  }

  // Calculate overall health score
  const totalServices = Object.keys(healthStatus.services).length;
  const healthyServices = Object.values(healthStatus.services).filter(s => s.ok).length;
  const healthScore = Math.round((healthyServices / totalServices) * 100);
  
  healthStatus.overall = {
    healthy: healthyServices,
    total: totalServices,
    score: healthScore,
    status: healthScore >= 80 ? 'HEALTHY' : healthScore >= 50 ? 'DEGRADED' : 'UNHEALTHY'
  };

  console.log(`[HEALTH] Overall: ${healthScore}% (${healthyServices}/${totalServices} services healthy)`);

  res.json(healthStatus);
});

/**
 * Quick ping endpoint for basic uptime monitoring
 */
router.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;