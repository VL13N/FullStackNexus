/**
 * TAAPI Pro Key Validation & Account Status Checker
 * Comprehensive authentication testing and account verification
 */

import fetch from 'node-fetch';

async function validateTaapiProKey() {
  const apiKey = process.env.TAAPI_SECRET;
  
  if (!apiKey) {
    console.log('❌ TAAPI_SECRET environment variable not found');
    return false;
  }

  console.log('🔍 TAAPI Pro Key Validation Report:');
  console.log(`🔑 Key Format: ${apiKey.length} characters`);
  console.log(`🔑 Key Type: ${apiKey.startsWith('eyJ') ? 'JWT Token' : 'Standard Key'}`);
  
  // Test multiple authentication approaches
  const testEndpoints = [
    {
      name: 'RSI Basic',
      url: 'https://api.taapi.io/rsi',
      params: 'exchange=binance&symbol=SOL/USDT&interval=1h&period=14'
    },
    {
      name: 'Account Info',
      url: 'https://api.taapi.io/account',
      params: ''
    },
    {
      name: 'Bulk Endpoint',
      url: 'https://api.taapi.io/bulk',
      params: '',
      method: 'POST'
    }
  ];

  const authMethods = [
    {
      name: 'Query Parameter (secret=)',
      getOptions: (url, params) => ({
        url: `${url}?secret=${apiKey}&${params}`,
        options: { method: 'GET' }
      })
    },
    {
      name: 'Bearer Token Header',
      getOptions: (url, params) => ({
        url: `${url}?${params}`,
        options: {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      })
    },
    {
      name: 'X-API-Key Header',
      getOptions: (url, params) => ({
        url: `${url}?${params}`,
        options: {
          method: 'GET',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      })
    }
  ];

  let successfulAuth = null;
  let accountInfo = null;

  for (const endpoint of testEndpoints) {
    console.log(`\n📊 Testing ${endpoint.name}:`);
    
    for (const authMethod of authMethods) {
      try {
        const { url, options } = authMethod.getOptions(endpoint.url, endpoint.params);
        
        const startTime = Date.now();
        const response = await fetch(url, options);
        const latency = Date.now() - startTime;
        
        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }
        
        console.log(`  ${authMethod.name}: ${response.status} (${latency}ms)`);
        
        if (response.ok) {
          successfulAuth = authMethod.name;
          if (endpoint.name === 'Account Info') {
            accountInfo = responseData;
          }
          console.log(`  ✅ SUCCESS with ${authMethod.name}`);
          console.log(`  📄 Response:`, JSON.stringify(responseData, null, 2));
          break;
        } else {
          console.log(`  ❌ Error:`, responseData?.message || responseData);
        }
        
      } catch (error) {
        console.log(`  💥 Network Error:`, error.message);
      }
    }
    
    if (successfulAuth) break;
  }

  // Generate recommendations
  console.log('\n🎯 Validation Summary:');
  if (successfulAuth) {
    console.log(`✅ Working Authentication Method: ${successfulAuth}`);
    if (accountInfo) {
      console.log(`📊 Account Status:`, JSON.stringify(accountInfo, null, 2));
    }
  } else {
    console.log('❌ All authentication methods failed');
    console.log('\n🔧 Troubleshooting Recommendations:');
    console.log('1. Verify your TAAPI Pro subscription is active');
    console.log('2. Check if your API key has expired');
    console.log('3. Confirm you have a Pro plan (not Basic/Free)');
    console.log('4. Contact TAAPI support to verify key status');
    console.log('5. Check for any IP restrictions on your account');
  }

  return successfulAuth !== null;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateTaapiProKey().catch(console.error);
}

export { validateTaapiProKey };