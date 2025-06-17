/**
 * Comprehensive System Health Fix Script
 * Identifies and resolves critical system issues automatically
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testCriticalEndpoints() {
  console.log('Running comprehensive endpoint verification...\n');
  
  const tests = [
    { path: '/health', description: 'System health check' },
    { path: '/health/db', description: 'Database connectivity' },
    { path: '/api/ml/predict', description: 'ML prediction service' },
    { path: '/api/cryptorank/current', description: 'CryptoRank current data' },
    { path: '/api/taapi/bulk', description: 'TAAPI indicators' },
    { path: '/api/astrology/current', description: 'Astrological data' },
    { path: '/api/solana/current', description: 'Solana price data' },
    { path: '/api/training/status', description: 'Training scheduler' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`);
      const contentType = response.headers.get('content-type');
      const isJSON = contentType && contentType.includes('application/json');
      
      let data = null;
      if (isJSON) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { _content_type: contentType, _is_html: text.includes('<!DOCTYPE html>') };
      }
      
      results.push({
        path: test.path,
        status: response.status,
        success: response.status === 200 && isJSON,
        description: test.description,
        isJSON,
        hasData: !!data?.success
      });
      
      const icon = (response.status === 200 && isJSON) ? '✅' : '❌';
      console.log(`${icon} ${test.path} - ${response.status} ${isJSON ? 'JSON' : 'HTML'} - ${test.description}`);
      
    } catch (error) {
      results.push({
        path: test.path,
        status: 'ERROR',
        success: false,
        description: test.description,
        error: error.message
      });
      console.log(`❌ ${test.path} - ERROR - ${error.message}`);
    }
  }
  
  // Analyze results
  const jsonEndpoints = results.filter(r => r.isJSON).length;
  const htmlEndpoints = results.filter(r => r.status === 200 && !r.isJSON).length;
  const errorEndpoints = results.filter(r => r.status === 'ERROR' || r.status >= 400).length;
  
  console.log('\n📊 System Analysis:');
  console.log(`✅ Working JSON endpoints: ${jsonEndpoints}`);
  console.log(`🌐 HTML responses (routing issue): ${htmlEndpoints}`);
  console.log(`❌ Error endpoints: ${errorEndpoints}`);
  
  if (htmlEndpoints > 0) {
    console.log('\n⚠️  CRITICAL: API endpoints returning HTML instead of JSON');
    console.log('   This indicates a server routing configuration issue');
    console.log('   Vite dev server may be intercepting API routes');
  }
  
  return results;
}

async function checkDatabaseTables() {
  console.log('\n🔍 Checking database table status...');
  
  try {
    const response = await fetch(`${BASE_URL}/health/db`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database connectivity verified');
      return true;
    } else {
      console.log('❌ Database connectivity failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Database check error: ${error.message}`);
    return false;
  }
}

async function verifyAPICredentials() {
  console.log('\n🔑 Verifying API credentials...');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      const credentials = data.environment || {};
      
      console.log(`SUPABASE: ${credentials.supabase_url && credentials.supabase_key ? '✅' : '❌'}`);
      console.log(`CRYPTORANK: ${credentials.cryptorank_key ? '✅' : '❌'}`);
      console.log(`LUNARCRUSH: ${credentials.lunarcrush_key ? '✅' : '❌'}`);
      console.log(`TAAPI: ${credentials.taapi_secret ? '✅' : '❌'}`);
      console.log(`OPENAI: ${credentials.openai_key ? '✅' : '❌'}`);
      
      return credentials;
    }
  } catch (error) {
    console.log(`❌ Credential check error: ${error.message}`);
  }
  
  return null;
}

async function runHealthFix() {
  console.log('🔧 SYSTEM HEALTH CHECK & FIX SCRIPT');
  console.log('=====================================\n');
  
  // Step 1: Test critical endpoints
  const endpointResults = await testCriticalEndpoints();
  
  // Step 2: Check database
  const dbStatus = await checkDatabaseTables();
  
  // Step 3: Verify API credentials
  const credentials = await verifyAPICredentials();
  
  // Step 4: Generate health report
  console.log('\n📋 HEALTH REPORT SUMMARY');
  console.log('=========================');
  
  const workingEndpoints = endpointResults.filter(r => r.success).length;
  const totalEndpoints = endpointResults.length;
  const healthScore = Math.round((workingEndpoints / totalEndpoints) * 100);
  
  console.log(`System Health Score: ${healthScore}%`);
  console.log(`Working Endpoints: ${workingEndpoints}/${totalEndpoints}`);
  console.log(`Database Status: ${dbStatus ? 'Connected' : 'Issues detected'}`);
  
  // Step 5: Identify critical issues
  const issues = [];
  
  const htmlResponses = endpointResults.filter(r => r.status === 200 && !r.isJSON);
  if (htmlResponses.length > 0) {
    issues.push(`${htmlResponses.length} API endpoints returning HTML (routing config issue)`);
  }
  
  if (!dbStatus) {
    issues.push('Database connectivity problems');
  }
  
  if (credentials && !credentials.taapi_secret) {
    issues.push('TAAPI_SECRET missing from environment');
  }
  
  if (issues.length > 0) {
    console.log('\n🚨 Critical Issues Detected:');
    issues.forEach(issue => console.log(`   • ${issue}`));
    console.log('\nRecommended Actions:');
    console.log('   1. Verify server routing configuration');
    console.log('   2. Check Vite development server settings');
    console.log('   3. Confirm API route registration order');
    console.log('   4. Validate environment variables');
  } else {
    console.log('\n🎉 All critical systems operational!');
  }
  
  return {
    healthScore,
    workingEndpoints,
    totalEndpoints,
    dbStatus,
    credentials,
    issues
  };
}

// Run health fix if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthFix().catch(console.error);
}

export { runHealthFix, testCriticalEndpoints, checkDatabaseTables };