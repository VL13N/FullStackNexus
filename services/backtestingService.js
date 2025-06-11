/**
 * Backtesting & Strategy Validation Service
 * Replays ML predictions against historical price movements
 * Calculates performance metrics: win rate, average return, drawdown
 */

import { createClient } from '@supabase/supabase-js';
import { fetchSolanaSparkline } from './cryptoRankService.js';

class BacktestingService {
  constructor() {
    this.supabase = null;
    this.initializeSupabase();
  }

  initializeSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Run comprehensive backtest for specified date range
   */
  async runBacktest(startDate, endDate, symbol = 'SOL') {
    console.log(`Running backtest for ${symbol} from ${startDate} to ${endDate}`);
    
    try {
      // Fetch historical predictions from database
      const predictions = await this.fetchHistoricalPredictions(startDate, endDate);
      
      // Fetch actual price data for the same period
      const priceData = await this.fetchHistoricalPrices(startDate, endDate, symbol);
      
      // Align predictions with price movements
      const alignedData = this.alignPredictionsWithPrices(predictions, priceData);
      
      // Calculate performance metrics
      const metrics = this.calculatePerformanceMetrics(alignedData);
      
      // Generate detailed backtest report
      const report = {
        period: { start: startDate, end: endDate },
        symbol: symbol,
        totalPredictions: alignedData.length,
        metrics: metrics,
        predictions: alignedData,
        summary: this.generateSummary(metrics, alignedData),
        timestamp: new Date().toISOString()
      };

      // Store backtest results
      await this.storeBacktestResults(report);
      
      return report;

    } catch (error) {
      console.error('Backtest failed:', error.message);
      throw error;
    }
  }

  /**
   * Fetch historical predictions from live_predictions table
   */
  async fetchHistoricalPredictions(startDate, endDate) {
    if (!this.supabase) {
      console.warn('No database connection - using mock predictions for demonstration');
      return this.generateMockPredictions(startDate, endDate);
    }

    try {
      const { data, error } = await this.supabase
        .from('live_predictions')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      console.log(`Fetched ${data.length} historical predictions`);
      return data;

    } catch (error) {
      console.warn('Database query failed, using mock data:', error.message);
      return this.generateMockPredictions(startDate, endDate);
    }
  }

  /**
   * Fetch historical price data using CryptoRank sparkline
   */
  async fetchHistoricalPrices(startDate, endDate, symbol) {
    try {
      // Use CryptoRank sparkline for price history
      const sparklineData = await fetchSolanaSparkline();
      
      if (!sparklineData || !sparklineData.values) {
        throw new Error('No sparkline data available');
      }

      // Convert sparkline data to price movements
      const priceMovements = [];
      for (let i = 1; i < sparklineData.values.length; i++) {
        const current = sparklineData.values[i];
        const previous = sparklineData.values[i - 1];
        
        const currentPrice = parseFloat(current.price);
        const previousPrice = parseFloat(previous.price);
        const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
        
        priceMovements.push({
          timestamp: new Date(current.timestamp).toISOString(),
          price: currentPrice,
          priceChange: priceChange,
          volume: parseFloat(current.volume || 0)
        });
      }

      console.log(`Fetched ${priceMovements.length} price data points`);
      return priceMovements;

    } catch (error) {
      console.warn('Price data fetch failed, using mock data:', error.message);
      return this.generateMockPriceData(startDate, endDate);
    }
  }

  /**
   * Align predictions with actual price movements by timestamp
   */
  alignPredictionsWithPrices(predictions, priceData) {
    const aligned = [];
    
    for (const prediction of predictions) {
      // Find closest price data point
      const predictionTime = new Date(prediction.timestamp).getTime();
      
      let closestPrice = null;
      let minTimeDiff = Infinity;
      
      for (const price of priceData) {
        const priceTime = new Date(price.timestamp).getTime();
        const timeDiff = Math.abs(priceTime - predictionTime);
        
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestPrice = price;
        }
      }
      
      if (closestPrice && minTimeDiff < 3600000) { // Within 1 hour
        aligned.push({
          timestamp: prediction.timestamp,
          predicted_category: prediction.category || 'NEUTRAL',
          predicted_percentage: prediction.predicted_pct || 0,
          confidence: prediction.confidence || 0,
          actual_price_change: closestPrice.priceChange,
          actual_price: closestPrice.price,
          volume: closestPrice.volume,
          tech_score: prediction.tech_score || 0,
          social_score: prediction.social_score || 0,
          fund_score: prediction.fund_score || 0,
          astro_score: prediction.astro_score || 0,
          time_diff_minutes: minTimeDiff / 60000
        });
      }
    }
    
    console.log(`Aligned ${aligned.length} prediction-price pairs`);
    return aligned;
  }

  /**
   * Calculate comprehensive performance metrics
   */
  calculatePerformanceMetrics(alignedData) {
    if (!alignedData.length) {
      return {
        winRate: 0,
        averageReturn: 0,
        maxDrawdown: 0,
        totalReturn: 0,
        sharpeRatio: 0,
        accuracy: 0
      };
    }

    let correctPredictions = 0;
    let totalReturn = 0;
    let returns = [];
    let cumulativeReturns = [0];
    let maxPeak = 0;
    let maxDrawdown = 0;

    for (const trade of alignedData) {
      // Check if prediction direction was correct
      const predictedDirection = this.getPredictionDirection(trade.predicted_category, trade.predicted_percentage);
      const actualDirection = trade.actual_price_change > 0 ? 'BULLISH' : 
                            trade.actual_price_change < 0 ? 'BEARISH' : 'NEUTRAL';
      
      if (predictedDirection === actualDirection) {
        correctPredictions++;
      }

      // Calculate hypothetical returns based on predictions
      const tradeReturn = this.calculateTradeReturn(trade);
      returns.push(tradeReturn);
      totalReturn += tradeReturn;
      
      // Track cumulative returns for drawdown calculation
      const cumulativeReturn = cumulativeReturns[cumulativeReturns.length - 1] + tradeReturn;
      cumulativeReturns.push(cumulativeReturn);
      
      if (cumulativeReturn > maxPeak) {
        maxPeak = cumulativeReturn;
      }
      
      const drawdown = maxPeak - cumulativeReturn;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const winRate = correctPredictions / alignedData.length;
    const averageReturn = totalReturn / alignedData.length;
    
    // Calculate Sharpe ratio (simplified)
    const returnVariance = this.calculateVariance(returns);
    const sharpeRatio = returnVariance > 0 ? averageReturn / Math.sqrt(returnVariance) : 0;

    return {
      winRate: winRate,
      accuracy: winRate * 100,
      averageReturn: averageReturn,
      totalReturn: totalReturn,
      maxDrawdown: maxDrawdown,
      sharpeRatio: sharpeRatio,
      totalTrades: alignedData.length,
      correctPredictions: correctPredictions,
      volatility: Math.sqrt(returnVariance),
      bestTrade: Math.max(...returns),
      worstTrade: Math.min(...returns)
    };
  }

  /**
   * Get prediction direction from category and percentage
   */
  getPredictionDirection(category, percentage) {
    if (category) return category;
    if (percentage > 1) return 'BULLISH';
    if (percentage < -1) return 'BEARISH';
    return 'NEUTRAL';
  }

  /**
   * Calculate hypothetical trade return based on prediction confidence
   */
  calculateTradeReturn(trade) {
    const confidence = trade.confidence || 0;
    const actualChange = trade.actual_price_change;
    const predictedDirection = this.getPredictionDirection(trade.predicted_category, trade.predicted_percentage);
    
    // Simple strategy: bet size proportional to confidence
    const betSize = confidence * 0.1; // Max 10% position size
    
    let positionMultiplier = 0;
    if (predictedDirection === 'BULLISH') positionMultiplier = 1;
    if (predictedDirection === 'BEARISH') positionMultiplier = -1;
    
    return betSize * positionMultiplier * actualChange;
  }

  /**
   * Calculate variance of returns array
   */
  calculateVariance(returns) {
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
  }

  /**
   * Generate summary insights from backtest results
   */
  generateSummary(metrics, alignedData) {
    const summary = {
      performance: metrics.accuracy > 60 ? 'Good' : metrics.accuracy > 50 ? 'Fair' : 'Poor',
      profitability: metrics.totalReturn > 0 ? 'Profitable' : 'Unprofitable',
      riskLevel: metrics.maxDrawdown > 10 ? 'High' : metrics.maxDrawdown > 5 ? 'Medium' : 'Low',
      consistency: metrics.sharpeRatio > 1 ? 'High' : metrics.sharpeRatio > 0.5 ? 'Medium' : 'Low'
    };

    // Pillar performance analysis
    if (alignedData.length > 0) {
      const avgScores = {
        technical: alignedData.reduce((sum, d) => sum + (d.tech_score || 0), 0) / alignedData.length,
        social: alignedData.reduce((sum, d) => sum + (d.social_score || 0), 0) / alignedData.length,
        fundamental: alignedData.reduce((sum, d) => sum + (d.fund_score || 0), 0) / alignedData.length,
        astrology: alignedData.reduce((sum, d) => sum + (d.astro_score || 0), 0) / alignedData.length
      };
      
      summary.bestPillar = Object.keys(avgScores).reduce((a, b) => avgScores[a] > avgScores[b] ? a : b);
      summary.pillarScores = avgScores;
    }

    return summary;
  }

  /**
   * Store backtest results in database
   */
  async storeBacktestResults(report) {
    if (!this.supabase) {
      console.log('Backtest results stored locally (no database)');
      return { id: 'local-' + Date.now(), ...report };
    }

    try {
      const { data, error } = await this.supabase
        .from('backtest_results')
        .insert({
          symbol: report.symbol,
          start_date: report.period.start,
          end_date: report.period.end,
          total_predictions: report.totalPredictions,
          win_rate: report.metrics.winRate,
          total_return: report.metrics.totalReturn,
          max_drawdown: report.metrics.maxDrawdown,
          sharpe_ratio: report.metrics.sharpeRatio,
          summary: report.summary,
          full_report: report
        })
        .select();

      if (error) throw error;
      
      console.log('Backtest results stored:', data[0].id);
      return data[0];

    } catch (error) {
      console.warn('Failed to store backtest results:', error.message);
      return { id: 'error-' + Date.now(), error: error.message };
    }
  }

  /**
   * Generate mock predictions for demonstration
   */
  generateMockPredictions(startDate, endDate) {
    const predictions = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let time = start.getTime(); time <= end.getTime(); time += 3600000) { // Every hour
      predictions.push({
        timestamp: new Date(time).toISOString(),
        category: ['BULLISH', 'NEUTRAL', 'BEARISH'][Math.floor(Math.random() * 3)],
        predicted_pct: (Math.random() - 0.5) * 10,
        confidence: Math.random() * 0.8 + 0.2,
        tech_score: Math.random() * 100,
        social_score: Math.random() * 100,
        fund_score: Math.random() * 100,
        astro_score: Math.random() * 100
      });
    }
    
    return predictions;
  }

  /**
   * Generate mock price data for demonstration
   */
  generateMockPriceData(startDate, endDate) {
    const priceData = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let price = 160; // Starting SOL price
    
    for (let time = start.getTime(); time <= end.getTime(); time += 3600000) { // Every hour
      const change = (Math.random() - 0.5) * 6; // ±3% random walk
      price += price * (change / 100);
      
      priceData.push({
        timestamp: new Date(time).toISOString(),
        price: price,
        priceChange: change,
        volume: Math.random() * 1000000 + 500000
      });
    }
    
    return priceData;
  }

  /**
   * Get available backtest periods from stored data
   */
  async getAvailablePeriods() {
    if (!this.supabase) {
      return {
        earliest: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        latest: new Date().toISOString(),
        dataPoints: 168 // 7 days * 24 hours
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('live_predictions')
        .select('timestamp')
        .order('timestamp', { ascending: true })
        .limit(1);

      const { data: latestData, error: latestError } = await this.supabase
        .from('live_predictions')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error || latestError) throw error || latestError;

      const { count } = await this.supabase
        .from('live_predictions')
        .select('*', { count: 'exact', head: true });

      return {
        earliest: data[0]?.timestamp || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        latest: latestData[0]?.timestamp || new Date().toISOString(),
        dataPoints: count || 0
      };

    } catch (error) {
      console.warn('Failed to get available periods:', error.message);
      return {
        earliest: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        latest: new Date().toISOString(),
        dataPoints: 168
      };
    }
  }
}

// Export singleton instance
const backtestingService = new BacktestingService();
export default backtestingService;

// Export main functions
export async function runBacktest(startDate, endDate, symbol = 'SOL') {
  return await backtestingService.runBacktest(startDate, endDate, symbol);
}

export async function getAvailablePeriods() {
  return await backtestingService.getAvailablePeriods();
}