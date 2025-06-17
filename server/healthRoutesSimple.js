/**
 * Simplified Health Monitoring Routes for System Hardening
 * Provides comprehensive health checks with minimal dependencies
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client with validation
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('[HEALTH] Supabase client initialized successfully');
} else {
  console.warn('[HEALTH] Supabase credentials not found - database tests will be skipped');
}

/**
 * Comprehensive internal health check endpoint
 */
router.get('/internal', async (req, res) => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    services: {},
    overall: {}
  };

  console.log('[HEALTH] Starting comprehensive health check...');

  // Test TAAPI Pro service
  try {
    const startTime = Date.now();
    const response = await fetch('https://api.taapi.io/rsi?exchange=binance&symbol=SOL/USDT&interval=1h', {
      headers: {
        'Authorization': `Bearer ${process.env.TAAPI_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    const latencyMs = Date.now() - startTime;
    
    if (response.ok) {
      healthStatus.services.taapi = {
        ok: true,
        latencyMs,
        endpoint: 'rsi indicator',
        error: null
      };
      console.log(`[HEALTH] TAAPI: OK (${latencyMs}ms)`);
    } else {
      const errorText = await response.text();
      healthStatus.services.taapi = {
        ok: false,
        latencyMs,
        endpoint: 'rsi indicator',
        error: `HTTP ${response.status}: ${errorText}`
      };
      console.error(`[HEALTH] TAAPI: FAILED - ${response.status}`);
    }
  } catch (error) {
    healthStatus.services.taapi = {
      ok: false,
      latencyMs: null,
      endpoint: 'rsi indicator',
      error: error.message
    };
    console.error(`[HEALTH] TAAPI: FAILED - ${error.message}`);
  }

  // Test CryptoRank service
  try {
    const startTime = Date.now();
    const response = await fetch('https://api.cryptorank.io/v2/currencies/5663', {
      headers: { 'X-API-KEY': process.env.CRYPTORANK_API_KEY }
    });
    const latencyMs = Date.now() - startTime;
    
    if (response.ok) {
      healthStatus.services.cryptorank = {
        ok: true,
        latencyMs,
        endpoint: 'solana current',
        error: null
      };
      console.log(`[HEALTH] CryptoRank: OK (${latencyMs}ms)`);
    } else {
      const errorText = await response.text();
      healthStatus.services.cryptorank = {
        ok: false,
        latencyMs,
        endpoint: 'solana current',
        error: `HTTP ${response.status}: ${errorText}`
      };
      console.error(`[HEALTH] CryptoRank: FAILED - ${response.status}`);
    }
  } catch (error) {
    healthStatus.services.cryptorank = {
      ok: false,
      latencyMs: null,
      endpoint: 'solana current',
      error: error.message
    };
    console.error(`[HEALTH] CryptoRank: FAILED - ${error.message}`);
  }

  // Test LunarCrush/CoinGecko social data
  try {
    const startTime = Date.now();
    const response = await fetch('https://api.coingecko.com/api/v3/coins/solana?localization=false&market_data=true&community_data=true');
    const latencyMs = Date.now() - startTime;
    
    if (response.ok) {
      healthStatus.services.social = {
        ok: true,
        latencyMs,
        endpoint: 'coingecko community',
        error: null
      };
      console.log(`[HEALTH] Social Data: OK (${latencyMs}ms)`);
    } else {
      healthStatus.services.social = {
        ok: false,
        latencyMs,
        endpoint: 'coingecko community',
        error: `HTTP ${response.status}`
      };
      console.error(`[HEALTH] Social Data: FAILED - ${response.status}`);
    }
  } catch (error) {
    healthStatus.services.social = {
      ok: false,
      latencyMs: null,
      endpoint: 'coingecko community',
      error: error.message
    };
    console.error(`[HEALTH] Social Data: FAILED - ${error.message}`);
  }

  // Test system metrics
  try {
    const startTime = Date.now();
    const systemHealth = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    const latencyMs = Date.now() - startTime;
    
    healthStatus.services.system = {
      ok: true,
      latencyMs,
      endpoint: 'system metrics',
      error: null,
      details: {
        uptime: Math.round(systemHealth.uptime),
        memoryMB: Math.round(systemHealth.memory.heapUsed / 1024 / 1024)
      }
    };
    console.log(`[HEALTH] System: OK (${latencyMs}ms) - Uptime: ${Math.round(systemHealth.uptime)}s`);
  } catch (error) {
    healthStatus.services.system = {
      ok: false,
      latencyMs: null,
      endpoint: 'system metrics',
      error: error.message
    };
    console.error(`[HEALTH] System: FAILED - ${error.message}`);
  }

  // Test Supabase database connection
  if (supabase) {
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
        direction: 'HEALTH_TEST',
        technical_score: 0,
        social_score: 0,
        fundamental_score: 0,
        astrology_score: 0,
        features: { health_test: true },
        pillar_scores: { health_test: true },
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
  } else {
    healthStatus.services.supabase = {
      ok: false,
      latencyMs: null,
      endpoint: 'read/write test',
      error: 'Supabase credentials not configured'
    };
    console.warn('[HEALTH] Supabase: SKIPPED - Credentials not configured');
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
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});

/**
 * API validation endpoint
 */
router.get('/apis', async (req, res) => {
  const apiStatus = {};

  // Check each API key availability
  apiStatus.taapi = !!process.env.TAAPI_SECRET;
  apiStatus.cryptorank = !!process.env.CRYPTORANK_API_KEY;
  apiStatus.supabase = !!(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  apiStatus.openai = !!process.env.OPENAI_API_KEY;

  const configuredApis = Object.values(apiStatus).filter(Boolean).length;
  const totalApis = Object.keys(apiStatus).length;

  res.json({
    timestamp: new Date().toISOString(),
    apis: apiStatus,
    configured: configuredApis,
    total: totalApis,
    score: Math.round((configuredApis / totalApis) * 100)
  });
});

export default router;