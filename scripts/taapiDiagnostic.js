/**
 * TAAPI Pro Diagnostic Script
 * Comprehensive authentication and endpoint testing
 */

import fetch from 'node-fetch';

class TaapiDiagnostic {
  constructor() {
    this.apiKey = process.env.TAAPI_SECRET;
    this.baseUrl = 'https://api.taapi.io';
    this.testResults = [];
  }

  async runDiagnostic() {
    console.log('🔍 TAAPI Pro Diagnostic Starting...');
    console.log(`API Key (first 20 chars): ${this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'NOT FOUND'}`);
    console.log('');

    // Test 1: Basic connectivity
    await this.testConnectivity();

    // Test 2: Authentication methods
    await this.testAuthMethods();

    // Test 3: Different endpoints
    await this.testEndpoints();

    // Test 4: Different symbols and exchanges
    await this.testSymbols();

    // Generate report
    this.generateReport();
  }

  async testConnectivity() {
    console.log('📡 Testing TAAPI API Connectivity...');
    try {
      const response = await fetch(`${this.baseUrl}/rsi?secret=test&exchange=binance&symbol=BTC/USDT&interval=1h`);
      const data = await response.json();
      
      this.testResults.push({
        test: 'Connectivity',
        status: response.status,
        success: response.status !== 500,
        message: data.message || 'Connected to TAAPI API'
      });
      
      console.log(`Status: ${response.status} - ${data.message || 'Connected'}`);
    } catch (error) {
      this.testResults.push({
        test: 'Connectivity',
        status: 'ERROR',
        success: false,
        message: error.message
      });
      console.log(`Error: ${error.message}`);
    }
    console.log('');
  }

  async testAuthMethods() {
    console.log('🔐 Testing Authentication Methods...');
    
    // Method 1: Query string
    await this.testAuth('Query String', `${this.baseUrl}/rsi?secret=${this.apiKey}&exchange=binance&symbol=SOL/USDT&interval=1h`);
    
    // Method 2: Bearer token
    await this.testAuth('Bearer Token', `${this.baseUrl}/rsi?exchange=binance&symbol=SOL/USDT&interval=1h`, {
      'Authorization': `Bearer ${this.apiKey}`
    });
    
    // Method 3: API Key header
    await this.testAuth('API Key Header', `${this.baseUrl}/rsi?exchange=binance&symbol=SOL/USDT&interval=1h`, {
      'X-API-Key': this.apiKey
    });
    
    console.log('');
  }

  async testAuth(method, url, headers = {}) {
    try {
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      this.testResults.push({
        test: `Auth: ${method}`,
        status: response.status,
        success: response.status === 200,
        message: data.message || (response.status === 200 ? 'Success' : 'Authentication failed')
      });
      
      console.log(`${method}: Status ${response.status} - ${data.message || (response.status === 200 ? 'Success' : 'Failed')}`);
    } catch (error) {
      this.testResults.push({
        test: `Auth: ${method}`,
        status: 'ERROR',
        success: false,
        message: error.message
      });
      console.log(`${method}: Error - ${error.message}`);
    }
  }

  async testEndpoints() {
    console.log('📊 Testing Different Indicators...');
    
    const indicators = [
      { name: 'RSI', endpoint: 'rsi', params: 'period=14' },
      { name: 'MACD', endpoint: 'macd', params: '' },
      { name: 'EMA', endpoint: 'ema', params: 'period=20' },
      { name: 'SMA', endpoint: 'sma', params: 'period=20' },
      { name: 'Price', endpoint: 'price', params: '' },
      { name: 'Volume', endpoint: 'volume', params: '' }
    ];

    for (const indicator of indicators) {
      await this.testIndicator(indicator);
    }
    console.log('');
  }

  async testIndicator(indicator) {
    try {
      const params = indicator.params ? `&${indicator.params}` : '';
      const url = `${this.baseUrl}/${indicator.endpoint}?secret=${this.apiKey}&exchange=binance&symbol=SOL/USDT&interval=1h${params}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      this.testResults.push({
        test: `Indicator: ${indicator.name}`,
        status: response.status,
        success: response.status === 200,
        message: data.message || (response.status === 200 ? `Value: ${JSON.stringify(data)}` : 'Failed')
      });
      
      console.log(`${indicator.name}: Status ${response.status} - ${response.status === 200 ? 'Success' : data.message}`);
    } catch (error) {
      this.testResults.push({
        test: `Indicator: ${indicator.name}`,
        status: 'ERROR',
        success: false,
        message: error.message
      });
      console.log(`${indicator.name}: Error - ${error.message}`);
    }
  }

  async testSymbols() {
    console.log('💰 Testing Different Symbols...');
    
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT'];
    
    for (const symbol of symbols) {
      await this.testSymbol(symbol);
    }
    console.log('');
  }

  async testSymbol(symbol) {
    try {
      const url = `${this.baseUrl}/rsi?secret=${this.apiKey}&exchange=binance&symbol=${symbol}&interval=1h`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      this.testResults.push({
        test: `Symbol: ${symbol}`,
        status: response.status,
        success: response.status === 200,
        message: data.message || (response.status === 200 ? 'Success' : 'Failed')
      });
      
      console.log(`${symbol}: Status ${response.status} - ${response.status === 200 ? 'Success' : data.message}`);
    } catch (error) {
      this.testResults.push({
        test: `Symbol: ${symbol}`,
        status: 'ERROR',
        success: false,
        message: error.message
      });
      console.log(`${symbol}: Error - ${error.message}`);
    }
  }

  generateReport() {
    console.log('📋 DIAGNOSTIC REPORT');
    console.log('='.repeat(50));
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    
    console.log(`Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    console.log('');
    
    console.log('FAILED TESTS:');
    const failures = this.testResults.filter(r => !r.success);
    if (failures.length === 0) {
      console.log('None - All tests passed!');
    } else {
      failures.forEach(failure => {
        console.log(`❌ ${failure.test}: ${failure.message}`);
      });
    }
    console.log('');
    
    console.log('SUCCESSFUL TESTS:');
    const successes = this.testResults.filter(r => r.success);
    if (successes.length === 0) {
      console.log('None - All tests failed');
    } else {
      successes.forEach(success => {
        console.log(`✅ ${success.test}: ${success.message}`);
      });
    }
    console.log('');
    
    console.log('RECOMMENDATIONS:');
    if (successCount === 0) {
      console.log('1. Verify your TAAPI Pro API key in your account dashboard');
      console.log('2. Check if your TAAPI Pro subscription is active and paid');
      console.log('3. Confirm your plan includes access to technical indicators');
      console.log('4. Contact TAAPI support if the key appears correct');
    } else if (successCount < totalCount / 2) {
      console.log('1. Some authentication methods work - check which ones succeed');
      console.log('2. Verify your plan includes access to failed indicators');
      console.log('3. Check rate limits and usage quotas');
    } else {
      console.log('1. Most tests are passing - integration is working');
      console.log('2. Review failed tests for specific issues');
    }
  }
}

// Run diagnostic if called directly
const diagnostic = new TaapiDiagnostic();
diagnostic.runDiagnostic().catch(console.error);

export default TaapiDiagnostic;