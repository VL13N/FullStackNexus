/**
 * Risk Management API Routes
 * Provides position sizing recommendations and risk analytics
 */

import { Router } from 'express';
import { riskManager } from '../services/riskManager.js';

const router = Router();

/**
 * GET /api/risk/size
 * Calculate recommended position size for current prediction
 */
router.get('/size', async (req, res) => {
  try {
    const {
      prediction = 0.5,
      confidence = 0.7,
      currentPrice = 150,
      accountBalance = 10000,
      priceHistory = []
    } = req.query;

    // Parse numeric parameters
    const parsedPrediction = parseFloat(prediction);
    const parsedConfidence = parseFloat(confidence);
    const parsedPrice = parseFloat(currentPrice);
    const parsedBalance = parseFloat(accountBalance);
    const parsedHistory = Array.isArray(priceHistory) ? priceHistory.map(p => parseFloat(p)) : [];

    const result = riskManager.calculatePositionSize(
      parsedPrediction,
      parsedConfidence,
      parsedPrice,
      parsedBalance,
      parsedHistory
    );

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/risk/size
 * Calculate position size with detailed prediction data
 */
router.post('/size', async (req, res) => {
  try {
    const {
      prediction,
      confidence,
      currentPrice,
      accountBalance,
      priceHistory = [],
      marketData = {}
    } = req.body;

    const result = riskManager.calculatePositionSize(
      prediction,
      confidence,
      currentPrice,
      accountBalance,
      priceHistory
    );

    // Add market context if provided
    if (marketData) {
      result.marketContext = {
        symbol: marketData.symbol || 'SOL',
        timestamp: marketData.timestamp || new Date().toISOString(),
        volume: marketData.volume,
        marketCap: marketData.marketCap
      };
    }

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/risk/settings
 * Get current risk management settings
 */
router.get('/settings', (req, res) => {
  try {
    const settings = riskManager.getRiskSettings();
    res.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/risk/settings
 * Update risk management settings
 */
router.put('/settings', (req, res) => {
  try {
    const updatedSettings = riskManager.updateRiskSettings(req.body);
    res.json({
      success: true,
      data: updatedSettings,
      message: 'Risk settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/risk/stats
 * Get portfolio performance statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = riskManager.getPortfolioStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/risk/performance
 * Add new performance data point
 */
router.post('/performance', (req, res) => {
  try {
    const {
      confidence,
      prediction,
      actualOutcome,
      returnPct,
      volatility,
      positionSize
    } = req.body;

    riskManager.addPerformanceData({
      confidence,
      prediction,
      actualOutcome,
      returnPct,
      volatility,
      positionSize
    });

    res.json({
      success: true,
      message: 'Performance data added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/risk/kelly/:confidence/:expectedReturn/:volatility
 * Calculate Kelly Criterion for specific parameters
 */
router.get('/kelly/:confidence/:expectedReturn/:volatility', (req, res) => {
  try {
    const { confidence, expectedReturn, volatility } = req.params;
    
    const kellyResult = riskManager.calculateKellyCriterion(
      parseFloat(confidence),
      parseFloat(expectedReturn),
      parseFloat(volatility)
    );

    res.json({
      success: true,
      data: kellyResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/risk/simulate
 * Simulate position sizing across different scenarios
 */
router.get('/simulate', (req, res) => {
  try {
    const scenarios = [];
    const confidenceLevels = [0.3, 0.5, 0.7, 0.9];
    const predictions = [-0.8, -0.4, 0, 0.4, 0.8];
    const volatilities = [0.1, 0.2, 0.3, 0.4];
    
    for (const confidence of confidenceLevels) {
      for (const prediction of predictions) {
        for (const volatility of volatilities) {
          const priceHistory = Array.from({ length: 30 }, (_, i) => 
            150 + Math.sin(i * 0.2) * 10 + (Math.random() - 0.5) * volatility * 150
          );
          
          const result = riskManager.calculatePositionSize(
            prediction,
            confidence,
            150, // Current price
            10000, // Account balance
            priceHistory
          );
          
          scenarios.push({
            confidence,
            prediction,
            volatility,
            positionSize: result.positionSize,
            positionValue: result.positionValue,
            recommendation: result.recommendation
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        scenarios,
        summary: {
          totalScenarios: scenarios.length,
          avgPositionSize: scenarios.reduce((sum, s) => sum + s.positionSize, 0) / scenarios.length,
          buySignals: scenarios.filter(s => s.recommendation === 'BUY').length,
          sellSignals: scenarios.filter(s => s.recommendation === 'SELL').length,
          holdSignals: scenarios.filter(s => s.recommendation === 'HOLD').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as riskRoutes };