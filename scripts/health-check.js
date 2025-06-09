#!/usr/bin/env node
/**
 * Comprehensive API Health Check and Data Persistence Verification
 * Tests all endpoints and verifies Supabase data storage
 */

const API_BASE = 'http://localhost:5000/api';

// Test endpoint function
async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE}${url}`, options);
    const data = await response.json();
    
    return {
      success: response.ok && data.success,
      status: response.status,
      data: data,
      url: url
    };
  } catch (error) {
    return {
      success: false,
      status: 'CONNECTION_ERROR',
      error: error.message,
      url: url
    };
  }
}

// Main health check runner
async function runHealthChecks() {
  console.log('=== COMPREHENSIVE API HEALTH CHECK REPORT ===\n');
  
  const results = {};
  
  // Core API endpoints to test
  const endpoints = [
    { category: 'TAAPI Pro Technical Analysis', tests: [
      '/taapi/rsi?interval=1h',
      '/taapi/macd?interval=1h',
      '/taapi/ema?interval=1h'
    ]},
    { category: 'LunarCrush Social Metrics', tests: [
      '/lunarcrush/metrics',
      '/lunarcrush/social'
    ]},
    { category: 'CryptoRank Market Data', tests: [
      '/cryptorank/data',
      '/cryptorank/price',
      '/cryptorank/stats'
    ]},
    { category: 'On-Chain Metrics', tests: [
      '/onchain/metrics',
      '/onchain/validators'
    ]},
    { category: 'Astrology Engine', tests: [
      '/astrology/moon-phase',
      '/astrology/planetary-positions',
      '/astrology/aspects'
    ]},
    { category: 'Predictions & Analysis', tests: [
      '/predictions/latest',
      '/predictions/generate'
    ]},
    { category: 'OpenAI Integration', tests: [
      '/news/recent',
      '/updates/today'
    ]}
  ];
  
  // Test all endpoints
  for (const category of endpoints) {
    console.log(`${category.category}:`);
    results[category.category] = {};
    
    for (const endpoint of category.tests) {
      const result = await testEndpoint(endpoint);
      const status = result.success ? '✅' : '❌';
      const details = result.success ? 
        (result.data.type || 'Success') : 
        (result.error || result.data?.error || 'Failed');
      
      console.log(`  ${status} ${endpoint}: ${details}`);
      results[category.category][endpoint] = result;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('');
  }
  
  // Test data persistence endpoints
  console.log('Data Persistence & ML Endpoints:');
  const dataEndpoints = [
    '/data/statistics',
    '/data/technical?limit=5',
    '/data/social?limit=5',
    '/data/fundamental?limit=5',
    '/data/predictions?limit=5'
  ];
  
  for (const endpoint of dataEndpoints) {
    const result = await testEndpoint(endpoint);
    const status = result.success ? '✅' : '❌';
    const details = result.success ? 
      `${result.data.count || 'N/A'} records` : 
      (result.error || result.data?.error || 'Failed');
    
    console.log(`  ${status} ${endpoint}: ${details}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n=== SUMMARY ===');
  
  // Calculate overall success rate
  let totalTests = 0;
  let passedTests = 0;
  
  Object.values(results).forEach(category => {
    Object.values(category).forEach(result => {
      totalTests++;
      if (result.success) passedTests++;
    });
  });
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  console.log(`Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (successRate === 100) {
    console.log('🎉 All systems operational!');
  } else if (successRate >= 80) {
    console.log('⚠️  Most systems operational with minor issues');
  } else {
    console.log('🚨 Multiple system failures detected');
  }
  
  return results;
}

// Run the health checks
runHealthChecks().catch(console.error);