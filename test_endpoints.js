/**
 * Comprehensive Endpoint Testing Script
 * Tests all API endpoints and verifies platform functionality
 */

import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS = [];

// Helper function to test an endpoint
async function testEndpoint(method, path, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    const result = {
      method: method.toUpperCase(),
      path,
      status: response.status,
      success: response.status === expectedStatus,
      responseSize: JSON.stringify(response.data).length,
      sampleData: JSON.stringify(response.data).substring(0, 500)
    };
    
    TEST_RESULTS.push(result);
    return result;
  } catch (error) {
    const result = {
      method: method.toUpperCase(),
      path,
      status: error.response?.status || 'ERROR',
      success: false,
      error: error.message,
      sampleData: error.response?.data ? JSON.stringify(error.response.data).substring(0, 500) : 'No response data'
    };
    
    TEST_RESULTS.push(result);
    return result;
  }
}

// Core API endpoints to test
const ENDPOINTS = [
  // Data Source Endpoints
  { method: 'get', path: '/api/solana/current' },
  { method: 'get', path: '/api/taapi/bulk' },
  { method: 'get', path: '/api/lunarcrush/metrics' },
  { method: 'get', path: '/api/astrology/current' },
  { method: 'get', path: '/api/onchain/metrics' },
  
  // Prediction Endpoints
  { method: 'get', path: '/api/predict/current' },
  { method: 'get', path: '/api/predict/history' },
  { method: 'post', path: '/api/predict/live', data: {} },
  
  // ML Endpoints
  { method: 'get', path: '/api/ml/test' },
  { method: 'post', path: '/api/ml/train', data: { samples: 100 } },
  { method: 'post', path: '/api/ml/predict', data: { features: { price: 150, rsi: 60, volume: 20000000 } } },
  { method: 'get', path: '/api/ml/feature-importance' },
  { method: 'post', path: '/api/ml/compare-models', data: { data: [{ price: 150, volume: 20000000, timestamp: new Date().toISOString() }] } },
  
  // Ensemble Endpoints
  { method: 'post', path: '/api/ensemble/train', data: {} },
  { method: 'post', path: '/api/ensemble/predict', data: { features: { price: 150, rsi: 60, tech_score: 35, social_score: 32, fund_score: 33, astro_score: 60 } } },
  { method: 'get', path: '/api/ensemble/status' },
  { method: 'get', path: '/api/ensemble/importance' },
  
  // ML Demo Endpoints
  { method: 'post', path: '/api/ml/demo/train', data: {} },
  { method: 'post', path: '/api/ml/demo/predict', data: { features: { price: 150, rsi: 60, volume: 20000000 } } },
  { method: 'get', path: '/api/ml/demo/importance' },
  
  // Training Scheduler Endpoints
  { method: 'get', path: '/api/training/status' },
  { method: 'get', path: '/api/training/logs' },
  
  // Explainability Endpoints
  { method: 'post', path: '/api/ml/explainability', data: { samples: 50, verbose: false } },
  { method: 'get', path: '/api/ml/features' },
  
  // OpenAI Endpoints
  { method: 'post', path: '/api/openai/analyze-news', data: {} },
  { method: 'post', path: '/api/openai/daily-update', data: {} },
  { method: 'get', path: '/api/openai/summaries' },
  
  // Backtesting Endpoints
  { method: 'post', path: '/api/backtest/run', data: { strategy: 'trend_following', timeframe: '1h', lookback: 30 } },
  { method: 'get', path: '/api/backtest/results' },
  { method: 'get', path: '/api/backtest/performance' },
  
  // Normalization Endpoints
  { method: 'get', path: '/api/normalize/features' },
  { method: 'get', path: '/api/pillars/scores' }
];

async function runTests() {
  console.log('🧪 Starting comprehensive endpoint testing...\n');
  
  for (const endpoint of ENDPOINTS) {
    console.log(`Testing ${endpoint.method.toUpperCase()} ${endpoint.path}...`);
    await testEndpoint(endpoint.method, endpoint.path, endpoint.data);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  
  // Generate report
  const report = generateReport();
  console.log('\n' + report);
  
  // Save detailed results
  fs.writeFileSync('endpoint_test_results.json', JSON.stringify(TEST_RESULTS, null, 2));
  console.log('\n📊 Detailed results saved to endpoint_test_results.json');
}

function generateReport() {
  const total = TEST_RESULTS.length;
  const successful = TEST_RESULTS.filter(r => r.success).length;
  const failed = TEST_RESULTS.filter(r => !r.success).length;
  
  let report = `
=== SOLANA TRADING PLATFORM - ENDPOINT TEST REPORT ===

📈 OVERALL RESULTS:
- Total Endpoints Tested: ${total}
- Successful: ${successful} (${((successful/total)*100).toFixed(1)}%)
- Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)

📋 DETAILED RESULTS:
`;

  TEST_RESULTS.forEach(result => {
    const status = result.success ? '✅' : '❌';
    report += `${status} ${result.method} ${result.path} - Status: ${result.status}\n`;
    
    if (!result.success && result.error) {
      report += `   Error: ${result.error}\n`;
    }
    
    if (result.sampleData && result.success) {
      report += `   Sample: ${result.sampleData.substring(0, 100)}...\n`;
    }
    report += '\n';
  });
  
  return report;
}

// Run the tests
runTests().catch(console.error);