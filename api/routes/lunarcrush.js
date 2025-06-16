const express = require('express');
const { lunarCrushService } = require('../lunarcrush');
const router = express.Router();

// GET /api/lunarcrush/metrics - Get Solana social metrics
router.get('/metrics', async (req, res) => {
  try {
    const { symbol = 'SOL', interval = '1d' } = req.query;
    const data = await lunarCrushService.getSolanaMetrics(symbol, interval);
    
    res.json({
      success: true,
      type: 'social_metrics',
      symbol,
      interval,
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

// GET /api/lunarcrush/social - Get detailed social metrics
router.get('/social', async (req, res) => {
  try {
    const data = await lunarCrushService.getSolanaSocialMetrics();
    
    res.json({
      success: true,
      type: 'detailed_social_metrics',
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

// GET /api/lunarcrush/news - Get Solana news using v1 topic endpoint
router.get('/news', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await lunarCrushService.getSolanaNews(parseInt(limit));
    
    res.json({
      success: true,
      type: 'solana_news',
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

// GET /api/lunarcrush/influencers - Get Solana influencers
router.get('/influencers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await lunarCrushService.getSolanaInfluencers(parseInt(limit));
    
    res.json({
      success: true,
      type: 'influencers',
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

// GET /api/lunarcrush/feed - Get Solana social feed
router.get('/feed', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const data = await lunarCrushService.getSolanaFeed(parseInt(limit));
    
    res.json({
      success: true,
      type: 'social_feed',
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

// GET /api/lunarcrush/timeseries - Get time series data
router.get('/timeseries', async (req, res) => {
  try {
    const { interval = '1d', start, end } = req.query;
    const data = await lunarCrushService.getSolanaTimeSeries(
      interval, 
      start ? parseInt(start) : null, 
      end ? parseInt(end) : null
    );
    
    res.json({
      success: true,
      type: 'time_series',
      interval,
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

// GET /api/lunarcrush/analysis - Comprehensive analysis
router.get('/analysis', async (req, res) => {
  try {
    const data = await lunarCrushService.getComprehensiveSolanaAnalysis();
    
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

// GET /api/lunarcrush/comparison - Multi-asset comparison
router.get('/comparison', async (req, res) => {
  try {
    const { symbols } = req.query;
    const symbolArray = symbols ? symbols.split(',') : ['SOL', 'BTC', 'ETH', 'ADA', 'DOT'];
    const data = await lunarCrushService.getMultiAssetComparison(symbolArray);
    
    res.json({
      success: true,
      type: 'multi_asset_comparison',
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

// GET /api/lunarcrush/market - Market overview
router.get('/market', async (req, res) => {
  try {
    const data = await lunarCrushService.getMarketOverview();
    
    res.json({
      success: true,
      type: 'market_overview',
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