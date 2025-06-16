-- Feature Vectors Table Schema
-- Stores historical feature data for ML training and analysis

CREATE TABLE IF NOT EXISTS feature_vectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(10) NOT NULL DEFAULT 'SOL',
  features JSONB NOT NULL,
  processing_time_ms INTEGER,
  data_quality_score DECIMAL(3,2) DEFAULT 0.8,
  feature_completeness DECIMAL(3,2) DEFAULT 0.9,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(timestamp, symbol)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_vectors_timestamp ON feature_vectors(timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_vectors_symbol ON feature_vectors(symbol);
CREATE INDEX IF NOT EXISTS idx_feature_vectors_created_at ON feature_vectors(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_vectors_timestamp_symbol ON feature_vectors(timestamp, symbol);

-- Add comments for documentation
COMMENT ON TABLE feature_vectors IS 'Historical feature vectors for ML training and backtesting';
COMMENT ON COLUMN feature_vectors.timestamp IS 'Historical timestamp for feature generation';
COMMENT ON COLUMN feature_vectors.features IS 'Complete feature set including technical, social, fundamental, and astrological data';
COMMENT ON COLUMN feature_vectors.data_quality_score IS 'Quality score from 0.0 to 1.0 indicating data completeness and accuracy';
COMMENT ON COLUMN feature_vectors.feature_completeness IS 'Percentage of expected features that were successfully populated';