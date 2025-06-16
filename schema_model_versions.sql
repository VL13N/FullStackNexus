-- Model Versions Table for Incremental Retraining System
-- Tracks model training history, performance metrics, and automatic retraining triggers

CREATE TABLE IF NOT EXISTS model_versions (
    id SERIAL PRIMARY KEY,
    version_id VARCHAR(50) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL DEFAULT 'ensemble',
    training_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    accuracy DECIMAL(8,6),
    loss DECIMAL(8,6),
    val_accuracy DECIMAL(8,6),
    val_loss DECIMAL(8,6),
    sharpe_ratio DECIMAL(8,4),
    hit_rate DECIMAL(6,4),
    feature_count INTEGER,
    training_samples INTEGER,
    epochs_trained INTEGER,
    trigger_reason VARCHAR(200),
    trigger_count INTEGER DEFAULT 0,
    model_path VARCHAR(500),
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_model_versions_timestamp ON model_versions(training_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_model_versions_active ON model_versions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_model_versions_type ON model_versions(model_type);
CREATE INDEX IF NOT EXISTS idx_model_versions_version ON model_versions(version_id);

-- Training logs table for detailed retraining history
CREATE TABLE IF NOT EXISTS training_logs (
    id SERIAL PRIMARY KEY,
    log_level VARCHAR(20) NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    component VARCHAR(100),
    trigger_reason VARCHAR(200),
    model_version_id VARCHAR(50),
    execution_time_ms INTEGER,
    success BOOLEAN,
    error_details TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient log queries
CREATE INDEX IF NOT EXISTS idx_training_logs_timestamp ON training_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_logs_level ON training_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_training_logs_success ON training_logs(success);

-- Function to get last training timestamp
CREATE OR REPLACE FUNCTION get_last_training_timestamp()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN (
        SELECT MAX(training_timestamp) 
        FROM model_versions 
        WHERE is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to count new features since last training
CREATE OR REPLACE FUNCTION count_new_features_since_training()
RETURNS INTEGER AS $$
DECLARE
    last_train_time TIMESTAMP WITH TIME ZONE;
    feature_count INTEGER;
BEGIN
    -- Get last training timestamp
    SELECT get_last_training_timestamp() INTO last_train_time;
    
    -- If no previous training, return total count
    IF last_train_time IS NULL THEN
        SELECT COUNT(*) FROM ml_features INTO feature_count;
    ELSE
        SELECT COUNT(*) FROM ml_features 
        WHERE created_at > last_train_time INTO feature_count;
    END IF;
    
    RETURN COALESCE(feature_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Sample initial data for testing
INSERT INTO model_versions (
    version_id, 
    model_type, 
    training_timestamp, 
    accuracy, 
    trigger_reason, 
    feature_count, 
    training_samples,
    metadata
) VALUES (
    'initial_v1.0.0',
    'ensemble',
    NOW() - INTERVAL '1 day',
    0.875,
    'initial_training',
    45,
    1000,
    '{"initial": true, "baseline": true}'
) ON CONFLICT (version_id) DO NOTHING;

-- Log initial setup
INSERT INTO training_logs (
    log_level,
    message,
    component,
    trigger_reason,
    success,
    metadata
) VALUES (
    'INFO',
    'Model versions schema initialized successfully',
    'schema_setup',
    'database_initialization',
    true,
    '{"tables_created": ["model_versions", "training_logs"], "functions_created": ["get_last_training_timestamp", "count_new_features_since_training"]}'
);