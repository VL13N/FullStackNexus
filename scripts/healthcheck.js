/**
 * Comprehensive Health Check Script for CI Pipeline
 * Tests all critical endpoints and services
 */

import { execSync } from 'child_process';
import fetch from 'node-fetch';

const BASE_URL = process.env.CI ? 'http://localhost:5000' : 'http://localhost:5000';
const TIMEOUT = 10000;

class HealthChecker {
  constructor() {
    this.results = [];
    this.failures = 0;
  }

  async checkEndpoint(name, url, options = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      
      const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const isSuccess = response.ok;
      this.results.push({
        name,
        url,
        status: response.status,
        success: isSuccess,
        responseTime: Date.now()
      });
      
      if (!isSuccess) {
        this.failures++;
        console.error(`❌ ${name}: ${response.status} ${response.statusText}`);
      } else {
        console.log(`✅ ${name}: ${response.status}`);
      }
      
      return isSuccess;
    } catch (error) {
      this.failures++;
      this.results.push({
        name,
        url,
        success: false,
        error: error.message
      });
      console.error(`❌ ${name}: ${error.message}`);
      return false;
    }
  }

  async checkMLEndpoints() {
    console.log('\n🧠 Testing ML Endpoints...');
    
    await this.checkEndpoint('ML Predict', '/api/ml/predict');
    await this.checkEndpoint('ML Feature Importance', '/api/ml/feature-importance');
    await this.checkEndpoint('LSTM Info', '/api/ml/lstm/info');
    await this.checkEndpoint('Ensemble Stack', '/api/ml/ensemble-stack');
    
    // Test training endpoints with POST
    await this.checkEndpoint('ML Train', '/api/ml/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: true })
    });
  }

  async checkRiskEndpoints() {
    console.log('\n🛡️ Testing Risk Management Endpoints...');
    
    await this.checkEndpoint('Risk Settings', '/api/risk/settings');
    await this.checkEndpoint('Risk Stats', '/api/risk/stats');
    await this.checkEndpoint('Risk Simulation', '/api/risk/simulate');
    
    // Test position sizing with sample data
    await this.checkEndpoint('Position Sizing', '/api/risk/size', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prediction: 0.5,
        confidence: 0.7,
        currentPrice: 150,
        accountBalance: 10000
      })
    });
  }

  async checkAnalysisEndpoints() {
    console.log('\n📊 Testing Analysis Endpoints...');
    
    await this.checkEndpoint('Correlations', '/api/analysis/correlations');
    await this.checkEndpoint('Correlation Matrix', '/api/analysis/correlations/matrix');
    await this.checkEndpoint('Correlation Insights', '/api/analysis/correlations/insights');
    await this.checkEndpoint('Sentiment Analysis', '/api/sentiment/analyze');
  }

  async checkAlertEndpoints() {
    console.log('\n🔔 Testing Alert Endpoints...');
    
    await this.checkEndpoint('Alert Rules', '/api/alerts/rules');
    await this.checkEndpoint('Active Alerts', '/api/alerts/active');
    await this.checkEndpoint('Alert History', '/api/alerts/history');
  }

  async checkHPOEndpoints() {
    console.log('\n🎯 Testing HPO Endpoints...');
    
    await this.checkEndpoint('HPO Status', '/api/ml/hpo/status');
    await this.checkEndpoint('HPO History', '/api/ml/hpo/history');
    await this.checkEndpoint('HPO Search Spaces', '/api/ml/hpo/search-spaces');
  }

  async checkDataSources() {
    console.log('\n🔌 Testing Data Source Endpoints...');
    
    await this.checkEndpoint('CryptoRank Current', '/api/cryptorank/current');
    await this.checkEndpoint('TAAPI Indicators', '/api/taapi/indicators');
    await this.checkEndpoint('LunarCrush Social', '/api/lunarcrush/social');
    await this.checkEndpoint('Astrology Data', '/api/astrology/current');
    await this.checkEndpoint('On-Chain Metrics', '/api/onchain/metrics');
  }

  async checkBacktestEndpoints() {
    console.log('\n📈 Testing Backtest Endpoints...');
    
    await this.checkEndpoint('Backtest Summary', '/api/backtest/summary');
    await this.checkEndpoint('Backtest Data', '/api/backtest/data');
  }

  async checkWebSocketConnections() {
    console.log('\n🌐 Testing WebSocket Connections...');
    
    // Test WebSocket alert connection
    try {
      const WebSocket = (await import('ws')).default;
      const ws = new WebSocket(`ws://localhost:5000/ws/alerts`);
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          console.log('✅ WebSocket Alerts: Connected');
          resolve();
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      this.failures++;
      console.error(`❌ WebSocket Alerts: ${error.message}`);
    }
  }

  async checkStaticAssets() {
    console.log('\n🎨 Testing Static Assets...');
    
    await this.checkEndpoint('Frontend Assets', '/');
    await this.checkEndpoint('API Health', '/api/health');
  }

  async runAllChecks() {
    console.log('🏥 Starting Comprehensive Health Check...\n');
    
    await this.checkStaticAssets();
    await this.checkMLEndpoints();
    await this.checkRiskEndpoints();
    await this.checkAnalysisEndpoints();
    await this.checkAlertEndpoints();
    await this.checkHPOEndpoints();
    await this.checkDataSources();
    await this.checkBacktestEndpoints();
    await this.checkWebSocketConnections();
    
    return this.generateReport();
  }

  generateReport() {
    const totalChecks = this.results.length;
    const successCount = totalChecks - this.failures;
    const successRate = ((successCount / totalChecks) * 100).toFixed(1);
    
    console.log('\n📋 Health Check Report');
    console.log('='.repeat(50));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${this.failures}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (this.failures > 0) {
      console.log('\n❌ Failed Endpoints:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.name}: ${r.error || r.status}`));
    }
    
    const isHealthy = this.failures === 0;
    console.log(`\n${isHealthy ? '✅' : '❌'} Overall Health: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    
    return {
      healthy: isHealthy,
      totalChecks,
      successCount,
      failures: this.failures,
      successRate: parseFloat(successRate),
      results: this.results
    };
  }
}

// Run health check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  
  checker.runAllChecks()
    .then(report => {
      if (!report.healthy) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

export default HealthChecker;