const express = require('express');
const { cryptoRankService } = require('../cryptorank');
const router = express.Router();

// GET /api/cryptorank/data - Get Solana fundamental data
router.get('/data', async (req, res) => {
  try {
    const data = await cryptoRankService.getSolanaData();
    
    res.json({
      success: true,
      type: 'fundamental_data',
      data,
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

// GET /api/cryptorank/historical - Get historical price data
router.get('/historical', async (req, res) => {
  try {
    const { timeframe = '30d', currency = 'USD' } = req.query;
    const data = await cryptoRankService.getSolanaHistoricalPrices(timeframe, currency);
    
    res.json({
      success: true,
      type: 'historical_prices',
      timeframe,
      currency,
      data,
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

// GET /api/cryptorank/stats - Get market statistics
router.get('/stats', async (req, res) => {
  try {
    const data = await cryptoRankService.getSolanaMarketStats();
    
    res.json({
      success: true,
      type: 'market_statistics',
      data,
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

// GET /api/cryptorank/price - Get real-time price data
router.get('/price', async (req, res) => {
  try {
    const data = await cryptoRankService.getSolanaRealTimePrice();
    
    res.json({
      success: true,
      type: 'real_time_price',
      data,
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

// GET /api/cryptorank/comparison - Multi-coin comparison
router.get('/comparison', async (req, res) => {
  try {
    const { symbols } = req.query;
    const symbolArray = symbols ? symbols.split(',') : ['solana', 'bitcoin', 'ethereum', 'cardano', 'polkadot'];
    const data = await cryptoRankService.getMultiCoinComparison(symbolArray);
    
    res.json({
      success: true,
      type: 'multi_coin_comparison',
      symbols: symbolArray,
      data,
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

// GET /api/cryptorank/market - Market overview
router.get('/market', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const data = await cryptoRankService.getMarketOverview(parseInt(limit));
    
    res.json({
      success: true,
      type: 'market_overview',
      limit: parseInt(limit),
      data,
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

// GET /api/cryptorank/analysis - Comprehensive analysis
router.get('/analysis', async (req, res) => {
  try {
    const data = await cryptoRankService.getComprehensiveSolanaAnalysis();
    
    res.json({
      success: true,
      type: 'comprehensive_analysis',
      data,
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

module.exports = router;