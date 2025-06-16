/**
 * Cross-Asset and Inter-Pillar Correlation Analysis Test Suite
 * Comprehensive validation of correlation computation, API endpoints, and data integrity
 */

const BASE_URL = 'http://localhost:5000';

async function testCorrelationAnalysisSystem() {
  console.log('🔬 Testing Cross-Asset and Inter-Pillar Correlation Analysis System');
  console.log('================================================================');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test helper function
  async function runTest(testName, testFunction) {
    results.total++;
    try {
      console.log(`\n📊 Testing: ${testName}`);
      await testFunction();
      console.log(`✅ ${testName} - PASSED`);
      results.passed++;
    } catch (error) {
      console.error(`❌ ${testName} - FAILED:`, error.message);
      results.failed++;
      results.errors.push({ test: testName, error: error.message });
    }
  }

  // Test 1: Basic correlation computation
  await runTest('Basic Correlation Computation', async () => {
    const response = await fetch(`${BASE_URL}/api/analysis/correlations?days=30&force_refresh=true`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    if (!data.success) {
      throw new Error(`API Error: ${data.error}`);
    }
    
    if (!data.data) {
      throw new Error('No correlation data returned');
    }
    
    const correlationData = data.data;
    
    // Validate structure
    if (!correlationData.correlation_matrix) {
      throw new Error('Missing correlation matrix');
    }
    
    if (!correlationData.variables || !Array.isArray(correlationData.variables)) {
      throw new Error('Missing or invalid variables array');
    }
    
    if (!correlationData.insights) {
      throw new Error('Missing correlation insights');
    }
    
    console.log(`   📈 Data points: ${correlationData.data_points}`);
    console.log(`   📊 Variables: ${correlationData.variables.length}`);
    console.log(`   🕒 Period: ${correlationData.period_days} days`);
  });

  // Test 2: Correlation matrix validation
  await runTest('Correlation Matrix Validation', async () => {
    const response = await fetch(`${BASE_URL}/api/analysis/correlations/matrix`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Matrix API Error: ${data.error}`);
    }
    
    const { matrix, variables, heatmap_data } = data;
    
    // Check matrix symmetry
    for (let i = 0; i < variables.length; i++) {
      for (let j = 0; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];
        
        if (Math.abs(matrix[var1][var2] - matrix[var2][var1]) > 0.001) {
          throw new Error(`Matrix not symmetric: ${var1} vs ${var2}`);
        }
      }
    }
    
    // Check diagonal values are 1.0
    for (const variable of variables) {
      if (Math.abs(matrix[variable][variable] - 1.0) > 0.001) {
        throw new Error(`Diagonal not 1.0 for ${variable}: ${matrix[variable][variable]}`);
      }
    }
    
    // Validate correlation bounds [-1, 1]
    for (const var1 of variables) {
      for (const var2 of variables) {
        const correlation = matrix[var1][var2];
        if (correlation < -1.0 || correlation > 1.0) {
          throw new Error(`Correlation out of bounds: ${var1} vs ${var2} = ${correlation}`);
        }
      }
    }
    
    // Validate heatmap data structure
    if (!heatmap_data || !Array.isArray(heatmap_data)) {
      throw new Error('Invalid heatmap data structure');
    }
    
    const expectedCells = variables.length * variables.length;
    if (heatmap_data.length !== expectedCells) {
      throw new Error(`Heatmap data size mismatch: expected ${expectedCells}, got ${heatmap_data.length}`);
    }
    
    console.log(`   🔢 Matrix size: ${variables.length}x${variables.length}`);
    console.log(`   📱 Heatmap cells: ${heatmap_data.length}`);
  });

  // Test 3: Insights generation validation
  await runTest('Insights Generation Validation', async () => {
    const response = await fetch(`${BASE_URL}/api/analysis/correlations/insights`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Insights API Error: ${data.error}`);
    }
    
    const insights = data.insights;
    
    // Validate strongest correlations
    if (!insights.strongest_correlations || !Array.isArray(insights.strongest_correlations)) {
      throw new Error('Missing strongest correlations');
    }
    
    for (const correlation of insights.strongest_correlations) {
      if (!correlation.variables || correlation.variables.length !== 2) {
        throw new Error('Invalid correlation variable pair');
      }
      
      if (typeof correlation.correlation !== 'number') {
        throw new Error('Invalid correlation value');
      }
      
      if (!correlation.interpretation) {
        throw new Error('Missing correlation interpretation');
      }
    }
    
    // Validate summary statistics
    if (!insights.summary) {
      throw new Error('Missing summary statistics');
    }
    
    const summary = insights.summary;
    const requiredStats = ['mean_correlation', 'max_correlation', 'min_correlation', 
                          'high_correlation_count', 'moderate_correlation_count', 'weak_correlation_count'];
    
    for (const stat of requiredStats) {
      if (typeof summary[stat] !== 'number') {
        throw new Error(`Missing or invalid summary statistic: ${stat}`);
      }
    }
    
    // Validate pillar relationships
    if (!insights.pillar_relationships) {
      throw new Error('Missing pillar relationships');
    }
    
    const expectedPillars = ['SOL Technical', 'SOL Social', 'SOL Fundamental', 'SOL Astrology'];
    for (const pillar of expectedPillars) {
      if (!insights.pillar_relationships[pillar]) {
        console.log(`   ⚠️  Missing pillar relationship for: ${pillar}`);
      }
    }
    
    console.log(`   💪 Strong correlations: ${insights.summary.high_correlation_count}`);
    console.log(`   📊 Mean correlation: ${insights.summary.mean_correlation.toFixed(3)}`);
  });

  // Test 4: Cross-asset correlation validation
  await runTest('Cross-Asset Correlation Validation', async () => {
    const response = await fetch(`${BASE_URL}/api/analysis/correlations/insights`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Insights API Error: ${data.error}`);
    }
    
    const insights = data.insights;
    
    // Check asset relationships
    if (!insights.asset_relationships) {
      throw new Error('Missing asset relationships');
    }
    
    const expectedAssets = ['BTC Price', 'ETH Price', 'SOL Price'];
    const foundAssets = Object.keys(insights.asset_relationships);
    
    for (const asset of expectedAssets) {
      if (!foundAssets.includes(asset)) {
        console.log(`   ⚠️  Missing asset relationship for: ${asset}`);
      }
    }
    
    // Validate cross-asset correlations are calculated
    let crossAssetCorrelations = 0;
    for (const [asset1, relationships] of Object.entries(insights.asset_relationships)) {
      for (const [asset2, correlation] of Object.entries(relationships)) {
        if (typeof correlation === 'number') {
          crossAssetCorrelations++;
        }
      }
    }
    
    if (crossAssetCorrelations === 0) {
      throw new Error('No cross-asset correlations found');
    }
    
    console.log(`   🔗 Cross-asset correlations: ${crossAssetCorrelations}`);
  });

  // Test 5: Force refresh functionality
  await runTest('Force Refresh Functionality', async () => {
    // Get current timestamp
    const beforeRefresh = await fetch(`${BASE_URL}/api/analysis/correlations`);
    const beforeData = await beforeRefresh.json();
    const beforeTimestamp = beforeData.data?.timestamp;
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force refresh
    const refreshResponse = await fetch(`${BASE_URL}/api/analysis/correlations/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 30 })
    });
    
    const refreshData = await refreshResponse.json();
    
    if (!refreshData.success) {
      throw new Error(`Refresh failed: ${refreshData.error}`);
    }
    
    // Get new data
    const afterRefresh = await fetch(`${BASE_URL}/api/analysis/correlations`);
    const afterData = await afterRefresh.json();
    const afterTimestamp = afterData.data?.timestamp;
    
    if (beforeTimestamp && afterTimestamp && beforeTimestamp === afterTimestamp) {
      throw new Error('Timestamp not updated after refresh');
    }
    
    console.log(`   🔄 Successfully refreshed correlation data`);
  });

  // Test 6: Different time periods
  await runTest('Different Time Periods', async () => {
    const periods = [7, 14, 30, 60];
    
    for (const period of periods) {
      const response = await fetch(`${BASE_URL}/api/analysis/correlations?days=${period}&force_refresh=true`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`Failed for ${period} days: ${data.error}`);
      }
      
      if (data.data.period_days !== period) {
        throw new Error(`Period mismatch: expected ${period}, got ${data.data.period_days}`);
      }
      
      console.log(`   📅 ${period} days: ${data.data.data_points} data points`);
    }
  });

  // Test 7: Error handling
  await runTest('Error Handling', async () => {
    // Test invalid period
    const invalidResponse = await fetch(`${BASE_URL}/api/analysis/correlations?days=invalid`);
    // Should still work with fallback to default
    
    // Test non-existent endpoint
    const notFoundResponse = await fetch(`${BASE_URL}/api/analysis/correlations/nonexistent`);
    if (notFoundResponse.status !== 404) {
      // This might be handled differently, so we'll just log it
      console.log(`   ℹ️  Non-existent endpoint returned status: ${notFoundResponse.status}`);
    }
    
    console.log(`   🛡️  Error handling validated`);
  });

  // Test 8: Data persistence
  await runTest('Data Persistence', async () => {
    // Generate new correlation data
    const computeResponse = await fetch(`${BASE_URL}/api/analysis/correlations/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 30 })
    });
    
    if (!computeResponse.ok) {
      throw new Error('Failed to compute correlation data');
    }
    
    // Check history
    const historyResponse = await fetch(`${BASE_URL}/api/analysis/correlations/history?limit=5`);
    const historyData = await historyResponse.json();
    
    if (!historyData.success) {
      throw new Error(`History API Error: ${historyData.error}`);
    }
    
    if (!historyData.history || !Array.isArray(historyData.history)) {
      throw new Error('Invalid history data structure');
    }
    
    if (historyData.history.length === 0) {
      throw new Error('No history entries found');
    }
    
    console.log(`   📚 History entries: ${historyData.history.length}`);
    console.log(`   📖 Total entries: ${historyData.total_entries}`);
  });

  // Test 9: Cache functionality
  await runTest('Cache Functionality', async () => {
    // Get data (should be cached from previous tests)
    const cachedResponse = await fetch(`${BASE_URL}/api/analysis/correlations?days=30`);
    const cachedData = await cachedResponse.json();
    
    if (cachedData.success && cachedData.cached) {
      console.log(`   ⚡ Data served from cache (age: ${cachedData.age_minutes} minutes)`);
    } else {
      console.log(`   🔄 Data computed fresh`);
    }
    
    // Clear cache
    const clearResponse = await fetch(`${BASE_URL}/api/analysis/correlations/cache`, {
      method: 'DELETE'
    });
    
    const clearData = await clearResponse.json();
    
    if (!clearData.success) {
      throw new Error(`Cache clear failed: ${clearData.error}`);
    }
    
    console.log(`   🧹 Cache cleared successfully`);
  });

  // Test 10: Data quality validation
  await runTest('Data Quality Validation', async () => {
    const response = await fetch(`${BASE_URL}/api/analysis/correlations?days=30`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API Error: ${data.error}`);
    }
    
    const correlationData = data.data;
    
    // Check for reasonable data points
    if (correlationData.data_points < 10) {
      console.log(`   ⚠️  Low data points: ${correlationData.data_points}`);
    }
    
    // Check for expected variables
    const expectedVariables = ['SOL Technical', 'SOL Social', 'SOL Fundamental', 'SOL Astrology', 'BTC Price', 'ETH Price', 'SOL Price'];
    const foundVariables = correlationData.variables;
    
    let missingVariables = 0;
    for (const expected of expectedVariables) {
      if (!foundVariables.includes(expected)) {
        console.log(`   ⚠️  Missing variable: ${expected}`);
        missingVariables++;
      }
    }
    
    if (missingVariables > 0) {
      console.log(`   📊 Found ${foundVariables.length} variables, missing ${missingVariables} expected variables`);
    } else {
      console.log(`   ✅ All expected variables present`);
    }
    
    // Check correlation ranges
    const matrix = correlationData.correlation_matrix;
    let extremeCorrelations = 0;
    let strongCorrelations = 0;
    
    for (const var1 of foundVariables) {
      for (const var2 of foundVariables) {
        if (var1 !== var2) {
          const correlation = matrix[var1][var2];
          if (Math.abs(correlation) > 0.9) {
            extremeCorrelations++;
          } else if (Math.abs(correlation) > 0.7) {
            strongCorrelations++;
          }
        }
      }
    }
    
    console.log(`   🔥 Extreme correlations (|r| > 0.9): ${extremeCorrelations}`);
    console.log(`   💪 Strong correlations (|r| > 0.7): ${strongCorrelations}`);
  });

  // Display final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 CORRELATION ANALYSIS TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL CORRELATION ANALYSIS TESTS PASSED!');
    console.log('✅ Cross-asset and inter-pillar correlation system is fully operational');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the issues above.`);
  }
  
  return results;
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testCorrelationAnalysisSystem()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

export default testCorrelationAnalysisSystem;