/**
 * Comprehensive System Health Check Script
 * Tests all critical endpoints, API integrations, and system functionality
 */

const testResults = [];
const BASE_URL = 'http://localhost:5000';

async function testEndpoint(method, path, expectedStatus = 200, description = '') {
  const startTime = Date.now();
  try {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, { method });
    const duration = Date.now() - startTime;
    
    let data = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { _raw: text.substring(0, 200) + (text.length > 200 ? '...' : '') };
    }
    
    const result = {
      path,
      method,
      status: response.status,
      expected: expectedStatus,
      success: response.status === expectedStatus,
      duration,
      description,
      data: data?.success !== undefined ? { success: data.success } : data,
      timestamp: new Date().toISOString()
    };
    
    testResults.push(result);
    
    const statusIcon = result.success ? '✅' : '❌';
    console.log(`${statusIcon} ${method} ${path} - ${response.status} (${duration}ms) ${description}`);
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const result = {
      path,
      method,
      status: 'ERROR',
      expected: expectedStatus,
      success: false,
      duration,
      description,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    testResults.push(result);
    console.log(`❌ ${method} ${path} - ERROR (${duration}ms) ${error.message}`);
    return result;
  }
}

async function runHealthChecks() {
  console.log('🔍 Starting comprehensive system health check...\n');
  
  // Core health endpoints
  await testEndpoint('GET', '/health', 200, 'General system health');
  await testEndpoint('GET', '/health/db', 200, 'Database connectivity');
  
  // API endpoints - CryptoRank
  await testEndpoint('GET', '/api/cryptorank/current', 200, 'CryptoRank current data');
  await testEndpoint('GET', '/api/cryptorank/sparkline', 200, 'CryptoRank historical data');
  await testEndpoint('GET', '/api/cryptorank/global', 200, 'CryptoRank global metrics');
  
  // API endpoints - TAAPI
  await testEndpoint('GET', '/api/taapi/bulk', 200, 'TAAPI bulk indicators');
  await testEndpoint('GET', '/api/taapi/rsi', 200, 'TAAPI RSI indicator');
  await testEndpoint('GET', '/api/taapi/macd', 200, 'TAAPI MACD indicator');
  
  // API endpoints - LunarCrush
  await testEndpoint('GET', '/api/lunarcrush/metrics', 200, 'LunarCrush social metrics');
  await testEndpoint('GET', '/api/lunarcrush/news', 200, 'LunarCrush news data');
  
  // API endpoints - Solana
  await testEndpoint('GET', '/api/solana/current', 200, 'Solana current price');
  await testEndpoint('GET', '/api/solana/metrics', 200, 'Solana on-chain metrics');
  
  // API endpoints - Astrology
  await testEndpoint('GET', '/api/astrology/current', 200, 'Current astrological data');
  await testEndpoint('GET', '/api/astrology/moon-phase', 200, 'Moon phase data');
  
  // ML endpoints
  await testEndpoint('GET', '/api/ml/predict', 200, 'ML prediction endpoint');
  await testEndpoint('GET', '/api/ml/feature-importance', 200, 'Feature importance analysis');
  
  // Feature data endpoints
  await testEndpoint('GET', '/api/features/latest', 200, 'Latest feature vectors');
  await testEndpoint('GET', '/api/features/stats', 200, 'Feature statistics');
  
  // Training and automation
  await testEndpoint('GET', '/api/training/status', 200, 'Training scheduler status');
  await testEndpoint('GET', '/api/training/logs', 200, 'Training logs');
  
  // Analysis endpoints
  await testEndpoint('GET', '/api/analysis/correlations', 200, 'Correlation analysis');
  await testEndpoint('GET', '/api/backtest/summary', 200, 'Backtesting summary');
  
  // Alerts system
  await testEndpoint('GET', '/api/alerts/rules', 200, 'Alert rules');
  await testEndpoint('GET', '/api/alerts/active', 200, 'Active alerts');
  
  // Risk management
  await testEndpoint('GET', '/api/risk/stats', 200, 'Risk statistics');
  
  console.log('\n📊 Health Check Results Summary:');
  console.log('================================');
  
  const successful = testResults.filter(r => r.success).length;
  const failed = testResults.filter(r => !r.success).length;
  const totalTime = testResults.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📈 Success rate: ${((successful / testResults.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n🚨 Failed Endpoints:');
    testResults.filter(r => !r.success).forEach(result => {
      console.log(`   ${result.method} ${result.path} - ${result.status} ${result.error || ''}`);
    });
  }
  
  // Check for specific issues
  console.log('\n🔧 System Analysis:');
  
  const apiEndpoints = testResults.filter(r => r.path.startsWith('/api/'));
  const htmlResponses = apiEndpoints.filter(r => r.data && r.data._raw && r.data._raw.includes('<!DOCTYPE html>'));
  
  if (htmlResponses.length > 0) {
    console.log(`⚠️  ${htmlResponses.length} API endpoints returning HTML instead of JSON`);
    console.log('   This indicates a routing configuration issue');
  }
  
  const networkErrors = testResults.filter(r => r.error && r.error.includes('fetch failed'));
  if (networkErrors.length > 0) {
    console.log(`⚠️  ${networkErrors.length} endpoints with network connectivity issues`);
  }
  
  const authErrors = testResults.filter(r => r.status === 401 || (r.error && r.error.includes('API key')));
  if (authErrors.length > 0) {
    console.log(`⚠️  ${authErrors.length} endpoints with authentication issues`);
  }
  
  console.log('\n✅ Health check completed');
  
  return {
    summary: { successful, failed, total: testResults.length, successRate: (successful / testResults.length) * 100 },
    results: testResults,
    issues: { htmlResponses: htmlResponses.length, networkErrors: networkErrors.length, authErrors: authErrors.length }
  };
}

// Run health checks if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthChecks().catch(console.error);
}

export { runHealthChecks, testEndpoint };