const express = require('express');
const router = express.Router();
const tradingApis = require('../../services/tradingApis');
const openaiService = require('../../services/openaiService');

// GET /api/trading/indicators/:symbol
router.get('/indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { exchange = 'binance', interval = '1h', indicators } = req.query;
    
    const indicatorList = indicators ? indicators.split(',') : ['rsi', 'macd', 'sma'];
    const data = await tradingApis.getTechnicalIndicators(symbol, exchange, interval, indicatorList);
    
    res.json({
      success: true,
      symbol,
      exchange,
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

// GET /api/trading/bulk/:symbol
router.get('/bulk/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { exchange = 'binance', interval = '1h' } = req.query;
    
    const data = await tradingApis.getBulkIndicators(symbol, exchange, interval);
    
    res.json({
      success: true,
      symbol,
      exchange,
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

// GET /api/trading/social/:symbol
router.get('/social/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await tradingApis.getSocialMetrics(symbol);
    
    res.json({
      success: true,
      symbol,
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

// GET /api/trading/influencers/:symbol
router.get('/influencers/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;
    
    const data = await tradingApis.getInfluencerData(symbol, parseInt(limit));
    
    res.json({
      success: true,
      symbol,
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

// GET /api/trading/market/:symbol
router.get('/market/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await tradingApis.getCoinData(symbol);
    
    res.json({
      success: true,
      symbol,
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

// GET /api/trading/historical/:symbol
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1D', limit = 100 } = req.query;
    
    const data = await tradingApis.getHistoricalData(symbol, timeframe, parseInt(limit));
    
    res.json({
      success: true,
      symbol,
      timeframe,
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

// GET /api/trading/analysis/:symbol
router.get('/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { exchange = 'binance' } = req.query;
    
    const analysis = await tradingApis.getCompleteAnalysis(symbol, exchange);
    
    res.json({
      success: true,
      analysis,
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

// POST /api/trading/ai-analysis
router.post('/ai-analysis', async (req, res) => {
  try {
    const { marketData, symbol } = req.body;
    
    if (!marketData || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Market data and symbol are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const analysis = await openaiService.analyzeMarketData(marketData, symbol);
    
    res.json({
      success: true,
      symbol,
      aiAnalysis: analysis,
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

// POST /api/trading/strategy
router.post('/strategy', async (req, res) => {
  try {
    const { symbol, timeframe, riskTolerance = 'medium' } = req.body;
    
    if (!symbol || !timeframe) {
      return res.status(400).json({
        success: false,
        error: 'Symbol and timeframe are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const strategy = await openaiService.generateTradingStrategy(symbol, timeframe, riskTolerance);
    
    res.json({
      success: true,
      symbol,
      timeframe,
      riskTolerance,
      strategy,
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

// POST /api/trading/price-prediction
router.post('/price-prediction', async (req, res) => {
  try {
    const { historicalData, technicalIndicators, symbol } = req.body;
    
    if (!historicalData || !technicalIndicators || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Historical data, technical indicators, and symbol are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const prediction = await openaiService.analyzePricePrediction(historicalData, technicalIndicators, symbol);
    
    res.json({
      success: true,
      symbol,
      prediction,
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

// GET /api/trading/markets
router.get('/markets', async (req, res) => {
  try {
    const { limit = 100, sortBy = 'rank' } = req.query;
    const data = await tradingApis.getMarketData(parseInt(limit), sortBy);
    
    res.json({
      success: true,
      limit: parseInt(limit),
      sortBy,
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