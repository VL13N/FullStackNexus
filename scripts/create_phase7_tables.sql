-- SQL to create Phase 7 tables in Supabase dashboard
-- Copy and paste this into your Supabase SQL Editor

-- Create historical_metrics table for normalization bounds
CREATE TABLE IF NOT EXISTS historical_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(255) NOT NULL,
  raw_value DECIMAL NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_historical_metrics_name ON historical_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_historical_metrics_timestamp ON historical_metrics(timestamp);

-- Insert sample normalization bounds for key metrics
INSERT INTO historical_metrics (metric_name, raw_value) VALUES
-- Technical Analysis bounds
('rsi', 0), ('rsi', 100),
('macdHistogram', -5), ('macdHistogram', 5),
('ema200', 50), ('ema200', 300),

-- Price & Volume bounds
('price', 50), ('price', 300),
('volume24h', 1000000000), ('volume24h', 8000000000),
('marketCap', 20000000000), ('marketCap', 150000000000),

-- Social Metrics bounds
('galaxyScore', 20), ('galaxyScore', 80),
('altRank', 50), ('altRank', 1500),
('socialVolume', 100), ('socialVolume', 5000),
('socialScore', 30), ('socialScore', 90),

-- Fundamental Analysis bounds
('priceChange24h', -30), ('priceChange24h', 30),
('priceChange7d', -50), ('priceChange7d', 50),
('circulatingSupply', 400000000), ('circulatingSupply', 600000000),

-- On-chain Metrics bounds
('totalValidators', 1200), ('totalValidators', 1800),
('averageApy', 6), ('averageApy', 12),
('totalStake', 350000000), ('totalStake', 450000000),

-- Astrological Metrics bounds
('moonPhase', 0), ('moonPhase', 1),
('moonIllumination', 0), ('moonIllumination', 100),
('planetaryAspectCount', 2), ('planetaryAspectCount', 15)

ON CONFLICT DO NOTHING;

-- Create news_sentiment table for Phase 7 OpenAI integration
CREATE TABLE IF NOT EXISTS news_sentiment (
  id SERIAL PRIMARY KEY,
  article_title TEXT NOT NULL,
  article_content TEXT,
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  sentiment_label VARCHAR(20), -- positive, negative, neutral
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  source VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_market_analysis table
CREATE TABLE IF NOT EXISTS daily_market_analysis (
  id SERIAL PRIMARY KEY,
  analysis_date DATE UNIQUE NOT NULL,
  overall_sentiment VARCHAR(20),
  key_insights TEXT[],
  price_prediction TEXT,
  confidence_level VARCHAR(20),
  market_drivers TEXT[],
  risk_factors TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for news and analysis tables
CREATE INDEX IF NOT EXISTS idx_news_sentiment_date ON news_sentiment(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_news_sentiment_score ON news_sentiment(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_daily_analysis_date ON daily_market_analysis(analysis_date);

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('historical_metrics', 'news_sentiment', 'daily_market_analysis');