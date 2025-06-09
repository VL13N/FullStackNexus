#!/usr/bin/env node
/**
 * Comprehensive API Health Check
 * Tests all endpoints and Supabase tables
 */

const BASE_URL = 'http://localhost:5000';

const endpoints = [
  { method: 'GET', path: '/api/taapi/bulk?interval=1h', name: 'TAAPI Bulk' },
  { method: 'GET', path: '/api/taapi/rsi?interval=1h', name: 'TAAPI RSI' },
  { method: 'GET', path: '/api/taapi/macd?interval=1h', name: 'TAAPI MACD' },
  { method: 'GET', path: '/api/lunarcrush/metrics?symbol=SOL', name: 'LunarCrush Metrics' },
  { method: 'GET', path: '/api/lunarcrush/social?symbol=SOL', name: 'LunarCrush Social' },
  { method: 'GET', path: '/api/cryptorank/data', name: 'CryptoRank Data' },
  { method: 'GET', path: '/api/cryptorank/price', name: 'CryptoRank Price' },
  { method: 'GET', path: '/api/onchain/metrics?symbol=SOL', name: 'OnChain Metrics' },
  { method: 'GET', path: '/api/astrology/moon-phase', name: 'Astrology Moon Phase' },
  { method: 'GET', path: '/api/astrology/planetary-positions', name: 'Astrology Planetary' },
  { method: 'GET', path: '/api/astrology/aspects', name: 'Astrology Aspects' },
  { method: 'GET', path: '/api/predictions/latest', name: 'Predictions Latest' },
  { method: 'GET', path: '/api/news/recent', name: 'News Recent' },
  { method: 'GET', path: '/api/updates/today', name: 'Updates Today' },
  { method: 'GET', path: '/api/ml/model/info', name: 'ML Model Info' }
];

const postEndpoints = [
  { 
    method: 'POST', 
    path: '/api/ml/predict', 
    name: 'ML Predict',
    body: {
      rsi_1h: 65.5,
      macd_histogram: 0.15,
      ema_20: 142.5,
      market_cap_usd: 68000000000,
      volume_24h_usd: 1200000000,
      social_score: 72,
      astro_score: 68
    }
  },
  { 
    method: 'POST', 
    path: '/api/openai/analyze-news', 
    name: 'OpenAI Analyze',
    body: { articles: [] }
  }
];

async function testEndpoint(endpoint) {
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
    const contentType = response.headers.get('content-type');
    
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { status: '✅', name: endpoint.name, response: response.status, data: 'Valid JSON' };
    } else if (response.ok) {
      return { status: '⚠️', name: endpoint.name, response: response.status, data: 'Non-JSON response' };
    } else {
      return { status: '❌', name: endpoint.name, response: response.status, data: 'Error' };
    }
  } catch (error) {
    return { status: '❌', name: endpoint.name, response: 'Failed', data: error.message };
  }
}

async function runHealthCheck() {
  console.log('🔍 Running Comprehensive API Health Check\n');
  
  const results = [];

  // Test GET endpoints
  console.log('Testing GET endpoints...');
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(`${result.status} ${result.name}: ${result.response}`);
  }

  console.log('\nTesting POST endpoints...');
  for (const endpoint of postEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(`${result.status} ${result.name}: ${result.response}`);
  }

  // Summary
  console.log('\n📊 Health Check Summary:');
  const passed = results.filter(r => r.status === '✅').length;
  const warned = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️ Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed endpoints:');
    results.filter(r => r.status === '❌').forEach(r => {
      console.log(`  - ${r.name}: ${r.data}`);
    });
  }

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthCheck().catch(console.error);
}

export { runHealthCheck };