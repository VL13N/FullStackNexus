/**
 * Backtesting & Automated Retraining API Routes
 * Validates ML predictions against actual price movements and triggers model retraining
 */

import { createClient } from '@supabase/supabase-js';
import BacktestRunner from '../scripts/backtestRunner.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase credentials not found - backtest persistence will be limited');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default function registerBacktestRoutes(app) {
  
  // Run backtest analysis
  app.get('/api/backtest/run', async (req, res) => {
    try {
      const fromDate = req.query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = req.query.to || new Date().toISOString().split('T')[0];
      const autoRetrain = req.query.auto_retrain === 'true';
      
      console.log(`Starting backtest analysis from ${fromDate} to ${toDate}`);
      
      const runner = new BacktestRunner();
      const result = await runner.runBacktest(fromDate, toDate);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if retraining should be triggered
      let retrainResult = null;
      if (autoRetrain && result.metrics.sharpeRatio > 1.0) {
        console.log(`Sharpe ratio ${result.metrics.sharpeRatio.toFixed(3)} > 1.0 - triggering automatic retraining`);
        
        try {
          const { spawn } = await import('child_process');
          const trainProcess = spawn('node', ['scripts/triggerRetrain.js', fromDate, toDate], {
            detached: true,
            stdio: 'ignore'
          });
          trainProcess.unref();
          
          retrainResult = {
            triggered: true,
            reason: 'sharpe_ratio_threshold_met',
            sharpe_ratio: result.metrics.sharpeRatio
          };
        } catch (error) {
          retrainResult = {
            triggered: false,
            error: error.message
          };
        }
      }
      
      res.json({
        success: true,
        backtest_id: result.backtestId,
        date_range: { from: fromDate, to: toDate },
        metrics: {
          total_trades: result.metrics.totalTrades,
          hit_rate: result.metrics.hitRate,
          total_pnl: result.metrics.totalPnL,
          sharpe_ratio: result.metrics.sharpeRatio,
          max_drawdown: result.metrics.maxDrawdown,
          avg_return: result.metrics.avgReturn,
          volatility: result.metrics.volatility
        },
        retrain: retrainResult,
        result_count: result.resultCount,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Backtest API error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get backtest history
  app.get('/api/backtest/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      
      const { data, error } = await supabase
        .from('backtest_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If table doesn't exist, return empty results
      const summaries = data || [];

      res.json({
        success: true,
        count: summaries.length,
        data: summaries,
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

  // Get specific backtest results
  app.get('/api/backtest/results/:backtestId', async (req, res) => {
    try {
      const backtestId = req.params.backtestId;
      const limit = parseInt(req.query.limit) || 1000;
      
      const { data, error } = await supabase
        .from('backtest_results')
        .select('*')
        .eq('backtest_id', backtestId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const results = data || [];

      res.json({
        success: true,
        backtest_id: backtestId,
        count: results.length,
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

  // Trigger manual retraining
  app.post('/api/backtest/retrain', async (req, res) => {
    try {
      const fromDate = req.body.from_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = req.body.to_date || new Date().toISOString().split('T')[0];
      const forceRetrain = req.body.force || false;
      
      // Check recent backtest performance if not forcing
      let shouldRetrain = forceRetrain;
      if (!forceRetrain) {
        const runner = new BacktestRunner();
        const result = await runner.runBacktest(fromDate, toDate);
        
        if (result.success && result.metrics.sharpeRatio > 0.5) {
          shouldRetrain = true;
        }
      }
      
      if (!shouldRetrain) {
        return res.json({
          success: false,
          message: 'Retraining not recommended - Sharpe ratio below threshold',
          sharpe_threshold: 0.5,
          timestamp: new Date().toISOString()
        });
      }
      
      // Trigger retraining process
      const { spawn } = await import('child_process');
      const trainProcess = spawn('node', ['scripts/triggerRetrain.js', fromDate, toDate], {
        detached: true,
        stdio: 'ignore'
      });
      trainProcess.unref();
      
      res.json({
        success: true,
        message: 'Model retraining initiated',
        date_range: { from: fromDate, to: toDate },
        estimated_completion: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
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

  // Get backtest performance metrics
  app.get('/api/backtest/performance', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('backtest_summaries')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const summaries = data || [];
      
      // Calculate aggregate metrics
      const aggregateMetrics = summaries.length > 0 ? {
        avg_sharpe_ratio: summaries.reduce((sum, s) => sum + (s.sharpe_ratio || 0), 0) / summaries.length,
        avg_hit_rate: summaries.reduce((sum, s) => sum + (s.hit_rate || 0), 0) / summaries.length,
        avg_total_pnl: summaries.reduce((sum, s) => sum + (s.total_pnl || 0), 0) / summaries.length,
        max_drawdown: Math.max(...summaries.map(s => s.max_drawdown || 0)),
        total_trades: summaries.reduce((sum, s) => sum + (s.total_trades || 0), 0),
        winning_trades: summaries.reduce((sum, s) => sum + (s.winning_trades || 0), 0)
      } : {
        avg_sharpe_ratio: 0,
        avg_hit_rate: 0,
        avg_total_pnl: 0,
        max_drawdown: 0,
        total_trades: 0,
        winning_trades: 0
      };

      res.json({
        success: true,
        period_days: days,
        backtest_count: summaries.length,
        aggregate_metrics: aggregateMetrics,
        recent_backtests: summaries.slice(-10), // Last 10 backtests
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

  // Setup backtest database schema
  app.post('/api/backtest/setup', async (req, res) => {
    try {
      const createTablesSQL = `
        -- Backtest results table
        CREATE TABLE IF NOT EXISTS backtest_results (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          backtest_id VARCHAR(50) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          prediction_score DECIMAL(8,4),
          prediction_direction VARCHAR(10),
          actual_return DECIMAL(8,4),
          predicted_return DECIMAL(8,4),
          pnl DECIMAL(8,4),
          cumulative_pnl DECIMAL(8,4),
          hit BOOLEAN,
          confidence DECIMAL(3,2),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Backtest summaries table
        CREATE TABLE IF NOT EXISTS backtest_summaries (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          backtest_id VARCHAR(50) NOT NULL UNIQUE,
          from_date DATE NOT NULL,
          to_date DATE NOT NULL,
          total_trades INTEGER DEFAULT 0,
          winning_trades INTEGER DEFAULT 0,
          hit_rate DECIMAL(3,2) DEFAULT 0,
          total_pnl DECIMAL(8,4) DEFAULT 0,
          sharpe_ratio DECIMAL(6,3) DEFAULT 0,
          max_drawdown DECIMAL(8,4) DEFAULT 0,
          avg_return DECIMAL(8,4) DEFAULT 0,
          volatility DECIMAL(8,4) DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_backtest_results_id ON backtest_results(backtest_id);
        CREATE INDEX IF NOT EXISTS idx_backtest_results_timestamp ON backtest_results(timestamp);
        CREATE INDEX IF NOT EXISTS idx_backtest_summaries_created_at ON backtest_summaries(created_at);
        CREATE INDEX IF NOT EXISTS idx_backtest_summaries_sharpe ON backtest_summaries(sharpe_ratio);
      `;

      res.json({
        success: true,
        message: 'Database schema ready for backtesting',
        sql_commands: createTablesSQL,
        instructions: 'Run the provided SQL commands in your Supabase dashboard to create the required tables',
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
}