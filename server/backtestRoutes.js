/**
 * Backtesting API Routes
 * Provides endpoints for running backtests and retrieving performance metrics
 */

import express from 'express';
import backtestingService, { runBacktest, getAvailablePeriods } from '../services/backtestingService.js';

const router = express.Router();

// Run a new backtest for specified date range
router.post('/run', async (req, res) => {
  try {
    const { startDate, endDate, symbol = 'SOL' } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'startDate must be before endDate',
        timestamp: new Date().toISOString()
      });
    }
    
    // Run the backtest
    const results = await runBacktest(startDate, endDate, symbol);
    
    res.json({
      success: true,
      data: results,
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

// Get available data periods for backtesting
router.get('/periods', async (req, res) => {
  try {
    const periods = await getAvailablePeriods();
    
    res.json({
      success: true,
      data: periods,
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

// Get quick backtest for last 24 hours
router.get('/quick', async (req, res) => {
  try {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const results = await runBacktest(startDate, endDate, 'SOL');
    
    res.json({
      success: true,
      data: results,
      period: '24h',
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

// Get quick backtest for last 7 days
router.get('/weekly', async (req, res) => {
  try {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const results = await runBacktest(startDate, endDate, 'SOL');
    
    res.json({
      success: true,
      data: results,
      period: '7d',
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

export default router;