/**
 * Walk-Forward Backtesting Framework
 * Implements rolling train/test validation with comprehensive performance metrics
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

class WalkForwardBacktester {
  constructor() {
    this.supabase = null;
    this.results = [];
    this.aggregateMetrics = {};
    
    // Initialize Supabase if available
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
  }

  /**
   * Fetch historical predictions and actual prices from Supabase
   */
  async fetchHistoricalData(startDate, endDate) {
    if (!this.supabase) {
      throw new Error('Supabase not configured - cannot fetch historical data');
    }

    try {
      const { data, error } = await this.supabase
        .from('live_predictions')
        .select(`
          created_at,
          predicted_price,
          predicted_pct,
          confidence,
          category,
          technical_score,
          social_score,
          fundamental_score,
          astrology_score
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No historical predictions found for the specified date range');
      }

      console.log(`📊 Fetched ${data.length} historical predictions for backtesting`);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch historical data:', error);
      throw error;
    }
  }

  /**
   * Fetch actual price data from external APIs for comparison
   */
  async fetchActualPrices(startDate, endDate) {
    try {
      // Import CryptoRank service to get historical prices
      const { fetchSolanaCurrent } = await import('../api/cryptorank.js');
      
      // For backtesting, we'll use the current price as a proxy for actual prices
      // In a production system, you'd fetch historical price data from the sparkline endpoint
      const currentData = await fetchSolanaCurrent();
      
      if (!currentData.success) {
        throw new Error('Failed to fetch current price data');
      }

      // Generate synthetic historical prices for demonstration
      // In production, replace with actual historical price API calls
      const prices = this.generateHistoricalPrices(startDate, endDate, currentData.data.price);
      
      console.log(`📈 Generated ${prices.length} historical price points for comparison`);
      return prices;
    } catch (error) {
      console.error('❌ Failed to fetch actual prices:', error);
      throw error;
    }
  }

  /**
   * Generate realistic historical prices for backtesting
   * Replace with actual historical price API in production
   */
  generateHistoricalPrices(startDate, endDate, currentPrice) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    
    const prices = [];
    let price = currentPrice * (0.9 + Math.random() * 0.2); // Start with variation
    
    for (let i = 0; i < hours; i++) {
      const timestamp = new Date(start.getTime() + i * 60 * 60 * 1000);
      
      // Realistic price movement with trend and volatility
      const trend = Math.sin(i * 0.01) * 0.002; // 0.2% trend component
      const volatility = (Math.random() - 0.5) * 0.05; // 5% max volatility
      const momentum = Math.sin(i * 0.05) * 0.001; // Momentum component
      
      price *= (1 + trend + volatility + momentum);
      
      // Ensure price stays within reasonable bounds
      price = Math.max(50, Math.min(500, price));
      
      prices.push({
        timestamp: timestamp.toISOString(),
        actual_price: price
      });
    }
    
    return prices;
  }

  /**
   * Align predictions with actual prices by timestamp
   */
  alignDataByTimestamp(predictions, actualPrices) {
    const aligned = [];
    
    predictions.forEach(pred => {
      const predTime = new Date(pred.created_at);
      
      // Find closest actual price within 1 hour
      const closest = actualPrices.find(price => {
        const priceTime = new Date(price.timestamp);
        const timeDiff = Math.abs(priceTime - predTime);
        return timeDiff <= 60 * 60 * 1000; // 1 hour tolerance
      });
      
      if (closest) {
        aligned.push({
          timestamp: pred.created_at,
          predicted_price: pred.predicted_price,
          actual_price: closest.actual_price,
          predicted_pct: pred.predicted_pct,
          confidence: pred.confidence,
          category: pred.category,
          technical_score: pred.technical_score,
          social_score: pred.social_score,
          fundamental_score: pred.fundamental_score,
          astrology_score: pred.astrology_score
        });
      }
    });
    
    console.log(`🔗 Aligned ${aligned.length} prediction-actual pairs`);
    return aligned;
  }

  /**
   * Split data into rolling windows for walk-forward analysis
   */
  createWalkForwardWindows(alignedData, trainDays = 30, testDays = 7) {
    const windows = [];
    const trainHours = trainDays * 24;
    const testHours = testDays * 24;
    const stepHours = testHours; // Non-overlapping windows
    
    for (let i = 0; i + trainHours + testHours <= alignedData.length; i += stepHours) {
      const trainData = alignedData.slice(i, i + trainHours);
      const testData = alignedData.slice(i + trainHours, i + trainHours + testHours);
      
      if (trainData.length >= 24 && testData.length >= 6) { // Minimum data requirements
        windows.push({
          windowId: windows.length + 1,
          trainStart: trainData[0].timestamp,
          trainEnd: trainData[trainData.length - 1].timestamp,
          testStart: testData[0].timestamp,
          testEnd: testData[testData.length - 1].timestamp,
          trainData: trainData,
          testData: testData
        });
      }
    }
    
    console.log(`📅 Created ${windows.length} walk-forward windows`);
    return windows;
  }

  /**
   * Calculate performance metrics for a single window
   */
  calculateWindowMetrics(window) {
    const { testData } = window;
    
    if (testData.length === 0) {
      return null;
    }

    // Mean Squared Error
    const mse = testData.reduce((sum, point) => {
      const error = point.predicted_price - point.actual_price;
      return sum + (error * error);
    }, 0) / testData.length;

    // Root Mean Squared Error
    const rmse = Math.sqrt(mse);

    // Mean Absolute Error
    const mae = testData.reduce((sum, point) => {
      return sum + Math.abs(point.predicted_price - point.actual_price);
    }, 0) / testData.length;

    // Mean Absolute Percentage Error
    const mape = testData.reduce((sum, point) => {
      if (point.actual_price !== 0) {
        const error = Math.abs((point.predicted_price - point.actual_price) / point.actual_price);
        return sum + error;
      }
      return sum;
    }, 0) / testData.length * 100;

    // Directional Accuracy
    let correctDirections = 0;
    for (let i = 1; i < testData.length; i++) {
      const actualDirection = testData[i].actual_price > testData[i-1].actual_price ? 1 : -1;
      const predictedDirection = testData[i].predicted_price > testData[i-1].actual_price ? 1 : -1;
      
      if (actualDirection === predictedDirection) {
        correctDirections++;
      }
    }
    const directionalAccuracy = testData.length > 1 ? (correctDirections / (testData.length - 1)) * 100 : 0;

    // R-squared
    const actualMean = testData.reduce((sum, point) => sum + point.actual_price, 0) / testData.length;
    const totalSumSquares = testData.reduce((sum, point) => {
      const diff = point.actual_price - actualMean;
      return sum + (diff * diff);
    }, 0);
    
    const residualSumSquares = testData.reduce((sum, point) => {
      const diff = point.actual_price - point.predicted_price;
      return sum + (diff * diff);
    }, 0);
    
    const rSquared = totalSumSquares !== 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

    // Confidence-weighted accuracy
    const confidenceWeightedError = testData.reduce((sum, point) => {
      const error = Math.abs(point.predicted_price - point.actual_price);
      const weight = point.confidence || 0.5;
      return sum + (error * weight);
    }, 0) / testData.length;

    // Pillar score analysis
    const pillarCorrelations = this.calculatePillarCorrelations(testData);

    return {
      windowId: window.windowId,
      trainPeriod: {
        start: window.trainStart,
        end: window.trainEnd,
        samples: window.trainData.length
      },
      testPeriod: {
        start: window.testStart,
        end: window.testEnd,
        samples: testData.length
      },
      metrics: {
        mse: mse,
        rmse: rmse,
        mae: mae,
        mape: mape,
        directionalAccuracy: directionalAccuracy,
        rSquared: rSquared,
        confidenceWeightedError: confidenceWeightedError
      },
      pillarCorrelations: pillarCorrelations,
      dataPoints: testData.map(point => ({
        timestamp: point.timestamp,
        predicted: point.predicted_price,
        actual: point.actual_price,
        confidence: point.confidence,
        category: point.category
      }))
    };
  }

  /**
   * Calculate correlations between pillar scores and prediction accuracy
   */
  calculatePillarCorrelations(testData) {
    const pillars = ['technical_score', 'social_score', 'fundamental_score', 'astrology_score'];
    const correlations = {};

    pillars.forEach(pillar => {
      const errors = testData.map(point => Math.abs(point.predicted_price - point.actual_price));
      const scores = testData.map(point => point[pillar] || 0);

      correlations[pillar] = this.calculateCorrelation(scores, errors);
    });

    return correlations;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator !== 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate aggregate metrics across all windows
   */
  calculateAggregateMetrics(windowResults) {
    if (windowResults.length === 0) {
      return {};
    }

    const validResults = windowResults.filter(result => result !== null);
    
    if (validResults.length === 0) {
      return {};
    }

    const metrics = ['mse', 'rmse', 'mae', 'mape', 'directionalAccuracy', 'rSquared', 'confidenceWeightedError'];
    const aggregated = {};

    metrics.forEach(metric => {
      const values = validResults.map(result => result.metrics[metric]).filter(val => !isNaN(val));
      
      if (values.length > 0) {
        aggregated[metric] = {
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          median: this.calculateMedian(values),
          min: Math.min(...values),
          max: Math.max(...values),
          std: this.calculateStandardDeviation(values)
        };
      }
    });

    // Overall performance statistics
    const totalDataPoints = validResults.reduce((sum, result) => sum + result.dataPoints.length, 0);
    const overallDirectionalAccuracy = validResults.reduce((sum, result) => {
      return sum + (result.metrics.directionalAccuracy * result.dataPoints.length);
    }, 0) / totalDataPoints;

    return {
      windowCount: validResults.length,
      totalDataPoints: totalDataPoints,
      overallDirectionalAccuracy: overallDirectionalAccuracy,
      metrics: aggregated,
      pillarAnalysis: this.aggregatePillarAnalysis(validResults)
    };
  }

  /**
   * Aggregate pillar correlation analysis
   */
  aggregatePillarAnalysis(windowResults) {
    const pillars = ['technical_score', 'social_score', 'fundamental_score', 'astrology_score'];
    const analysis = {};

    pillars.forEach(pillar => {
      const correlations = windowResults
        .map(result => result.pillarCorrelations[pillar])
        .filter(val => !isNaN(val));

      if (correlations.length > 0) {
        analysis[pillar] = {
          meanCorrelation: correlations.reduce((a, b) => a + b, 0) / correlations.length,
          description: this.interpretCorrelation(correlations.reduce((a, b) => a + b, 0) / correlations.length)
        };
      }
    });

    return analysis;
  }

  /**
   * Interpret correlation values
   */
  interpretCorrelation(correlation) {
    const abs = Math.abs(correlation);
    if (abs > 0.7) return 'Strong correlation with prediction errors';
    if (abs > 0.4) return 'Moderate correlation with prediction errors';
    if (abs > 0.2) return 'Weak correlation with prediction errors';
    return 'No significant correlation with prediction errors';
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Run complete walk-forward backtesting
   */
  async runBacktest(startDate, endDate, trainDays = 30, testDays = 7) {
    try {
      console.log(`🚀 Starting walk-forward backtest from ${startDate} to ${endDate}`);
      
      // Fetch historical data
      const predictions = await this.fetchHistoricalData(startDate, endDate);
      const actualPrices = await this.fetchActualPrices(startDate, endDate);
      
      // Align data by timestamp
      const alignedData = this.alignDataByTimestamp(predictions, actualPrices);
      
      if (alignedData.length === 0) {
        throw new Error('No aligned prediction-actual pairs found');
      }
      
      // Create walk-forward windows
      const windows = this.createWalkForwardWindows(alignedData, trainDays, testDays);
      
      if (windows.length === 0) {
        throw new Error('Insufficient data to create walk-forward windows');
      }
      
      // Calculate metrics for each window
      console.log('📊 Calculating performance metrics for each window...');
      const windowResults = windows.map(window => this.calculateWindowMetrics(window));
      
      // Calculate aggregate metrics
      const aggregateMetrics = this.calculateAggregateMetrics(windowResults);
      
      // Store results
      this.results = windowResults;
      this.aggregateMetrics = aggregateMetrics;
      
      // Save results to file for persistence
      await this.saveResults(startDate, endDate);
      
      console.log(`✅ Backtest completed successfully with ${windowResults.length} windows`);
      
      return {
        success: true,
        summary: {
          dateRange: { start: startDate, end: endDate },
          parameters: { trainDays, testDays },
          windowCount: windowResults.length,
          totalDataPoints: alignedData.length,
          aggregateMetrics: aggregateMetrics
        },
        windows: windowResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Backtest failed:', error);
      throw error;
    }
  }

  /**
   * Save backtest results to file
   */
  async saveResults(startDate, endDate) {
    try {
      const resultsDir = './backtest_results';
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      const filename = `backtest_${startDate}_${endDate}_${Date.now()}.json`;
      const filepath = path.join(resultsDir, filename);
      
      const data = {
        dateRange: { start: startDate, end: endDate },
        aggregateMetrics: this.aggregateMetrics,
        windows: this.results,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`💾 Backtest results saved to ${filepath}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error);
    }
  }

  /**
   * Get summary of latest backtest results
   */
  getSummary() {
    return {
      success: true,
      aggregateMetrics: this.aggregateMetrics,
      windowCount: this.results.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get detailed results for specific window
   */
  getWindowDetails(windowId) {
    const window = this.results.find(w => w && w.windowId === windowId);
    
    if (!window) {
      return {
        success: false,
        error: `Window ${windowId} not found`
      };
    }
    
    return {
      success: true,
      window: window,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all data points for visualization
   */
  getAllDataPoints() {
    const allPoints = [];
    
    this.results.forEach(window => {
      if (window && window.dataPoints) {
        allPoints.push(...window.dataPoints.map(point => ({
          ...point,
          windowId: window.windowId
        })));
      }
    });
    
    return {
      success: true,
      dataPoints: allPoints,
      count: allPoints.length,
      timestamp: new Date().toISOString()
    };
  }
}

export default WalkForwardBacktester;