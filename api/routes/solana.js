const express = require('express');
const { taapiService } = require('../taapi');
const router = express.Router();

// GET /api/solana/rsi - Fetch RSI for Solana
router.get('/rsi', async (req, res) => {
  try {
    const { exchange = 'binance', interval = '1h', period = 14 } = req.query;
    const data = await taapiService.getRSI(exchange, 'SOL/USDT', interval, parseInt(period));
    
    res.json({
      success: true,
      indicator: 'RSI',
      symbol: 'SOL/USDT',
      exchange,
      interval,
      period: parseInt(period),
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

// GET /api/solana/macd - Fetch MACD for Solana
router.get('/macd', async (req, res) => {
  try {
    const { 
      exchange = 'binance', 
      interval = '1h', 
      fastPeriod = 12, 
      slowPeriod = 26, 
      signalPeriod = 9 
    } = req.query;
    
    const data = await taapiService.getMACD(
      exchange, 
      'SOL/USDT', 
      interval, 
      parseInt(fastPeriod),
      parseInt(slowPeriod),
      parseInt(signalPeriod)
    );
    
    res.json({
      success: true,
      indicator: 'MACD',
      symbol: 'SOL/USDT',
      exchange,
      interval,
      parameters: {
        fastPeriod: parseInt(fastPeriod),
        slowPeriod: parseInt(slowPeriod),
        signalPeriod: parseInt(signalPeriod)
      },
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

// GET /api/solana/ema - Fetch EMA for Solana
router.get('/ema', async (req, res) => {
  try {
    const { exchange = 'binance', interval = '1h', period = 20 } = req.query;
    const data = await taapiService.getEMA(exchange, 'SOL/USDT', interval, parseInt(period));
    
    res.json({
      success: true,
      indicator: 'EMA',
      symbol: 'SOL/USDT',
      exchange,
      interval,
      period: parseInt(period),
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

// GET /api/solana/sma - Fetch SMA for Solana
router.get('/sma', async (req, res) => {
  try {
    const { exchange = 'binance', interval = '1h', period = 20 } = req.query;
    const data = await taapiService.getSMA(exchange, 'SOL/USDT', interval, parseInt(period));
    
    res.json({
      success: true,
      indicator: 'SMA',
      symbol: 'SOL/USDT',
      exchange,
      interval,
      period: parseInt(period),
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

// GET /api/solana/bollinger - Fetch Bollinger Bands for Solana
router.get('/bollinger', async (req, res) => {
  try {
    const { exchange = 'binance', interval = '1h', period = 20, stdDev = 2 } = req.query;
    const data = await taapiService.getBollingerBands(
      exchange, 
      'SOL/USDT', 
      interval, 
      parseInt(period),
      parseFloat(stdDev)
    );
    
    res.json({
      success: true,
      indicator: 'Bollinger Bands',
      symbol: 'SOL/USDT',
      exchange,
      interval,
      parameters: {
        period: parseInt(period),
        stdDev: parseFloat(stdDev)
      },
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

// GET /api/solana/stochrsi - Fetch Stochastic RSI for Solana
router.get('/stochrsi', async (req, res) => {
  try {
    const { 
      exchange = 'binance', 
      interval = '1h', 
      rsiPeriod = 14,
      stochPeriod = 14,
      kPeriod = 3,
      dPeriod = 3
    } = req.query;
    
    const data = await taapiService.getStochasticRSI(
      exchange, 
      'SOL/USDT', 
      interval,
      parseInt(rsiPeriod),
      parseInt(stochPeriod),
      parseInt(kPeriod),
      parseInt(dPeriod)
    );
    
    res.json({
      success: true,
      indicator: 'Stochastic RSI',
      symbol: 'SOL/USDT',
      exchange,
      interval,
      parameters: {
        rsiPeriod: parseInt(rsiPeriod),
        stochPeriod: parseInt(stochPeriod),
        kPeriod: parseInt(kPeriod),
        dPeriod: parseInt(dPeriod)
      },
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

// GET /api/solana/williams - Fetch Williams %R for Solana
router.get('/williams', async (req, res) => {
  try {
    const { exchange = 'binance', interval = '1h', period = 14 } = req.query;
    const data = await taapiService.getWilliamsR(exchange, 'SOL/USDT', interval, parseInt(period));
    
    res.json({
      success: true,
      indicator: 'Williams %R',
      symbol: 'SOL/USDT',
      exchange,
      interval,
      period: parseInt(period),
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

// GET /api/solana/bulk - Fetch multiple indicators in one request
router.get('/bulk', async (req, res) => {
  try {
    const { exchange = 'binance', interval = '1h', indicators } = req.query;
    const indicatorList = indicators ? indicators.split(',') : ['rsi', 'macd', 'ema', 'sma'];
    
    const data = await taapiService.getBulkIndicators(exchange, 'SOL/USDT', interval, indicatorList);
    
    res.json({
      success: true,
      type: 'bulk_indicators',
      symbol: 'SOL/USDT',
      exchange,
      interval,
      indicators: indicatorList,
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

// GET /api/solana/analysis - Comprehensive Solana technical analysis
router.get('/analysis', async (req, res) => {
  try {
    const { exchange = 'binance', interval = '1h' } = req.query;
    const data = await taapiService.getSolanaAnalysis(exchange, interval);
    
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

// POST /api/solana/custom - Custom analysis with user-defined parameters
router.post('/custom', async (req, res) => {
  try {
    const config = {
      exchange: 'binance',
      symbol: 'SOL/USDT',
      interval: '1h',
      ...req.body
    };
    
    const data = await taapiService.getCustomAnalysis(config);
    
    res.json({
      success: true,
      type: 'custom_analysis',
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

// GET /api/solana/price - Get current price data for Solana
router.get('/price', async (req, res) => {
  try {
    const { exchange = 'binance', interval = '1h' } = req.query;
    const data = await taapiService.getPriceData(exchange, 'SOL/USDT', interval);
    
    res.json({
      success: true,
      type: 'price_data',
      symbol: 'SOL/USDT',
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

module.exports = router;