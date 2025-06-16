-- Backtesting & Automated Retraining Database Schema
-- Stores ML model validation results and retraining history

-- Backtest results table - detailed trade-by-trade results
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

-- Backtest summaries table - aggregate performance metrics
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

-- Retraining history table - model update tracking
CREATE TABLE IF NOT EXISTS retraining_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retrain_id VARCHAR(50) NOT NULL UNIQUE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  ml_training_success BOOLEAN DEFAULT FALSE,
  lstm_training_success BOOLEAN DEFAULT FALSE,
  hpo_optimization_success BOOLEAN DEFAULT FALSE,
  ml_accuracy DECIMAL(6,4),
  lstm_accuracy DECIMAL(6,4),
  training_duration_seconds INTEGER DEFAULT 0,
  triggered_by VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_backtest_results_id ON backtest_results(backtest_id);
CREATE INDEX IF NOT EXISTS idx_backtest_results_timestamp ON backtest_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_backtest_summaries_created_at ON backtest_summaries(created_at);
CREATE INDEX IF NOT EXISTS idx_backtest_summaries_sharpe ON backtest_summaries(sharpe_ratio);
CREATE INDEX IF NOT EXISTS idx_retraining_history_created_at ON retraining_history(created_at);
CREATE INDEX IF NOT EXISTS idx_retraining_history_success ON retraining_history(ml_training_success, lstm_training_success);

-- Table comments for documentation
COMMENT ON TABLE backtest_results IS 'Detailed backtest results showing prediction vs actual performance';
COMMENT ON TABLE backtest_summaries IS 'Aggregate backtest performance metrics and summaries';
COMMENT ON TABLE retraining_history IS 'ML model retraining events and success tracking';

COMMENT ON COLUMN backtest_results.pnl IS 'Profit/Loss for individual prediction (predicted_direction × actual_return)';
COMMENT ON COLUMN backtest_summaries.sharpe_ratio IS 'Risk-adjusted return metric (higher is better, >1.0 triggers retraining)';
COMMENT ON COLUMN retraining_history.triggered_by IS 'Source of retraining trigger: backtest_performance, manual, scheduled';