const express = require('express');
const { solanaOnChainService } = require('../onchain');
const router = express.Router();

// GET /api/onchain/metrics - Get real-time network metrics including TPS
router.get('/metrics', async (req, res) => {
  try {
    const data = await solanaOnChainService.getNetworkMetrics();
    
    res.json({
      success: true,
      type: 'network_metrics',
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

// GET /api/onchain/validators - Get validator statistics
router.get('/validators', async (req, res) => {
  try {
    const data = await solanaOnChainService.getValidatorStats();
    
    res.json({
      success: true,
      type: 'validator_stats',
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

// GET /api/onchain/staking - Get staking yields and rewards
router.get('/staking', async (req, res) => {
  try {
    const data = await solanaOnChainService.getStakingYields();
    
    res.json({
      success: true,
      type: 'staking_yields',
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

// GET /api/onchain/epoch - Get current epoch information
router.get('/epoch', async (req, res) => {
  try {
    const data = await solanaOnChainService.getEpochInfo();
    
    res.json({
      success: true,
      type: 'epoch_info',
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

// GET /api/onchain/transactions - Get transaction analytics
router.get('/transactions', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const data = await solanaOnChainService.getTransactionAnalytics(timeframe);
    
    res.json({
      success: true,
      type: 'transaction_analytics',
      timeframe,
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

// GET /api/onchain/tps - Get real-time TPS monitoring
router.get('/tps', async (req, res) => {
  try {
    const { samples = 100 } = req.query;
    const data = await solanaOnChainService.getTpsMonitoring(parseInt(samples));
    
    res.json({
      success: true,
      type: 'tps_monitoring',
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

// GET /api/onchain/overview - Get comprehensive blockchain overview
router.get('/overview', async (req, res) => {
  try {
    const data = await solanaOnChainService.getBlockchainOverview();
    
    res.json({
      success: true,
      type: 'blockchain_overview',
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