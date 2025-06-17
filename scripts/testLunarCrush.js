/**
 * LunarCrush API Connection Test
 * Diagnoses social metrics connectivity issues
 */

import fetch from 'node-fetch';

async function testLunarCrushConnectivity() {
  console.log('🔍 Testing LunarCrush API connectivity...');
  
  const apiKey = process.env.LUNARCRUSH_API_KEY;
  if (!apiKey) {
    console.error('❌ LUNARCRUSH_API_KEY not found in environment');
    return;
  }
  
  console.log(`🔑 API Key detected: ${apiKey.substring(0, 15)}...`);
  
  // Test multiple endpoint formats
  const testUrls = [
    `https://api.lunarcrush.com/v1/coins/sol/v1?key=${apiKey}`,
    `https://lunarcrush.com/api/v2?data=assets&symbol=SOL&key=${apiKey}`,
    `https://api.lunarcrush.com/v2?data=assets&symbol=SOL&key=${apiKey}`
  ];
  
  for (const [index, url] of testUrls.entries()) {
    try {
      console.log(`\n📡 Testing endpoint ${index + 1}...`);
      console.log(`URL: ${url.replace(apiKey, 'API_KEY')}`);
      
      const response = await fetch(url, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SolanaAnalytics/1.0'
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connection successful!');
        console.log('Data preview:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        
        // Check for SOL data
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const solData = data.data[0];
          console.log('\n📊 SOL Metrics found:');
          console.log(`Galaxy Score: ${solData.galaxy_score || 'N/A'}`);
          console.log(`Social Volume: ${solData.social_volume_24h || 'N/A'}`);
          console.log(`Social Score: ${solData.social_score || 'N/A'}`);
          console.log(`Alt Rank: ${solData.alt_rank || 'N/A'}`);
        }
        
        return { success: true, endpoint: index + 1, data };
      } else {
        const errorText = await response.text();
        console.log(`❌ Error response: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      
      if (error.code === 'ENOTFOUND') {
        console.log('🔍 DNS resolution failed - checking network connectivity...');
      }
    }
  }
  
  // Test basic network connectivity
  console.log('\n🌐 Testing basic network connectivity...');
  try {
    const response = await fetch('https://httpbin.org/ip', { timeout: 10000 });
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Network working - Public IP: ${data.origin}`);
    }
  } catch (error) {
    console.log(`❌ Network connectivity issue: ${error.message}`);
  }
  
  return { success: false, error: 'All endpoints failed' };
}

// Run test
testLunarCrushConnectivity().catch(console.error);