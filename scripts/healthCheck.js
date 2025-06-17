/**
 * Comprehensive System Health Check Script
 * Tests TAAPI Pro, Solana On-Chain, and Supabase endpoints
 */

async function testEndpoint(name, url, expectedCondition = null) {
  console.log(`\n🔍 Testing ${name}...`);
  console.log(`URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const latency = Date.now() - startTime;
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log(`Status: ${response.status}`);
    console.log(`Latency: ${latency}ms`);
    
    if (response.ok) {
      console.log(`✅ ${name}: PASS`);
      
      // Additional validation if provided
      if (expectedCondition && typeof expectedCondition === 'function') {
        const conditionResult = expectedCondition(responseData);
        if (conditionResult) {
          console.log(`✅ Data validation: PASS`);
        } else {
          console.log(`❌ Data validation: FAIL`);
          console.log('Response data:', JSON.stringify(responseData, null, 2));
        }
      }
      
      return { success: true, status: response.status, latency, data: responseData };
    } else {
      console.log(`❌ ${name}: FAIL`);
      console.log('Response body:', responseText);
      return { success: false, status: response.status, latency, error: responseText };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR`);
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runHealthChecks() {
  console.log('🚀 Starting Comprehensive System Health Check');
  console.log('=' .repeat(60));
  
  const results = {};
  
  // Test 1: TAAPI Pro Authentication
  results.taapi = await testEndpoint(
    'TAAPI Pro Authentication',
    'http://localhost:5000/api/taapi/test',
    (data) => data && (typeof data.value === 'number' || data.success === true)
  );
  
  // Test 2: Solana On-Chain RPC
  results.onchain = await testEndpoint(
    'Solana On-Chain RPC',
    'http://localhost:5000/api/onchain/test',
    (data) => data && data.success === true && data.data && data.data.result
  );
  
  // Test 3: Supabase Database Connection
  results.database = await testEndpoint(
    'Supabase Database',
    'http://localhost:5000/health/db',
    (data) => data && data.success === true && data.database === 'operational'
  );
  
  // Summary Report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'TAAPI Pro Authentication', result: results.taapi },
    { name: 'Solana On-Chain RPC', result: results.onchain },
    { name: 'Supabase Database', result: results.database }
  ];
  
  let passCount = 0;
  
  tests.forEach(test => {
    const status = test.result.success ? '✅ PASS' : '❌ FAIL';
    const latency = test.result.latency ? `(${test.result.latency}ms)` : '';
    console.log(`${status} ${test.name} ${latency}`);
    
    if (test.result.success) passCount++;
  });
  
  console.log('=' .repeat(60));
  console.log(`Overall Health: ${passCount}/3 tests passing (${Math.round(passCount/3*100)}%)`);
  
  if (passCount === 3) {
    console.log('🎉 All systems operational - ready for production!');
  } else {
    console.log('⚠️  Some systems require attention before full deployment');
  }
  
  return results;
}

// Run health checks if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthChecks().catch(console.error);
}

export default runHealthChecks;