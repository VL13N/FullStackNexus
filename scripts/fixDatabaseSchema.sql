-- Database Schema Fixes for System Health Issues
-- Creates missing tables required for ML features, training logs, and correlation analysis

-- Create ml_features table for feature vector storage
CREATE TABLE IF NOT EXISTS public.ml_features (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    symbol TEXT NOT NULL DEFAULT 'SOL',
    price NUMERIC,
    volume_24h NUMERIC,
    market_cap NUMERIC,
    rsi NUMERIC,
    macd NUMERIC,
    ema_20 NUMERIC,
    sma_20 NUMERIC,
    atr NUMERIC,
    bb_upper NUMERIC,
    bb_lower NUMERIC,
    stoch_rsi NUMERIC,
    williams_r NUMERIC,
    social_volume NUMERIC,
    galaxy_score NUMERIC,
    sentiment_score NUMERIC,
    news_sentiment NUMERIC,
    market_sentiment NUMERIC,
    moon_phase NUMERIC,
    planetary_score NUMERIC,
    astrology_score NUMERIC,
    technical_score NUMERIC,
    social_score NUMERIC,
    fundamental_score NUMERIC,
    quality_score NUMERIC DEFAULT 1.0,
    completeness_score NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training_logs table for ML training history
CREATE TABLE IF NOT EXISTS public.training_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    training_type TEXT NOT NULL DEFAULT 'standard',
    trigger_reason TEXT,
    status TEXT NOT NULL DEFAULT 'started',
    accuracy NUMERIC,
    loss NUMERIC,
    sharpe_ratio NUMERIC,
    feature_count INTEGER,
    execution_time_ms INTEGER,
    model_version TEXT,
    hyperparameters JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create model_versions table for model versioning system
CREATE TABLE IF NOT EXISTS public.model_versions (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    model_type TEXT NOT NULL DEFAULT 'ensemble',
    accuracy NUMERIC,
    loss NUMERIC,
    sharpe_ratio NUMERIC,
    feature_count INTEGER,
    training_duration_ms INTEGER,
    hyperparameters JSONB,
    performance_metrics JSONB,
    trigger_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ml_features_timestamp ON public.ml_features(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ml_features_symbol ON public.ml_features(symbol);
CREATE INDEX IF NOT EXISTS idx_training_logs_timestamp ON public.training_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_training_logs_type ON public.training_logs(training_type);
CREATE INDEX IF NOT EXISTS idx_model_versions_created ON public.model_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_versions_active ON public.model_versions(is_active);

-- Ensure live_predictions table has all required columns
ALTER TABLE public.live_predictions 
  ADD COLUMN IF NOT EXISTS technical_score NUMERIC,
  ADD COLUMN IF NOT EXISTS social_score NUMERIC,
  ADD COLUMN IF NOT EXISTS fundamental_score NUMERIC,
  ADD COLUMN IF NOT EXISTS astrology_score NUMERIC,
  ADD COLUMN IF NOT EXISTS predicted_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC;

-- Insert sample data for testing (only if tables are empty)
INSERT INTO public.ml_features (symbol, price, rsi, macd, ema_20, technical_score, social_score, fundamental_score, astrology_score)
SELECT 'SOL', 155.0, 45.5, 0.25, 154.8, 45.2, 32.1, 38.7, 52.3
WHERE NOT EXISTS (SELECT 1 FROM public.ml_features LIMIT 1);

INSERT INTO public.training_logs (training_type, status, accuracy, feature_count, trigger_reason)
SELECT 'system_init', 'completed', 0.875, 31, 'Database schema initialization'
WHERE NOT EXISTS (SELECT 1 FROM public.training_logs LIMIT 1);

INSERT INTO public.model_versions (version, model_type, accuracy, feature_count, is_active)
SELECT 'v1.0.0', 'ensemble', 0.875, 31, true
WHERE NOT EXISTS (SELECT 1 FROM public.model_versions LIMIT 1);