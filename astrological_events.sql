-- Advanced Astrological Events and Indicators Schema
-- For storing detailed astronomical data for backtesting and analysis

-- Lunar phases and eclipse data
CREATE TABLE IF NOT EXISTS lunar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(10) NOT NULL DEFAULT 'SOL',
  
  -- Lunar phase data
  phase_angle DECIMAL(10,6) NOT NULL,
  phase_name VARCHAR(20) NOT NULL,
  illumination DECIMAL(8,6) NOT NULL,
  waxing BOOLEAN NOT NULL,
  lunar_intensity DECIMAL(8,6) NOT NULL,
  lunar_month_position DECIMAL(8,6) NOT NULL,
  
  -- Lunar position
  lunar_longitude DECIMAL(10,6) NOT NULL,
  lunar_latitude DECIMAL(10,6) NOT NULL,
  lunar_declination DECIMAL(8,4) NOT NULL,
  lunar_distance_km DECIMAL(15,3) NOT NULL,
  
  -- Eclipse data
  eclipse_potential BOOLEAN NOT NULL DEFAULT FALSE,
  eclipse_intensity DECIMAL(8,6) DEFAULT 0,
  eclipse_season BOOLEAN NOT NULL DEFAULT FALSE,
  sun_node_distance DECIMAL(8,4) DEFAULT NULL,
  moon_node_distance DECIMAL(8,4) DEFAULT NULL,
  
  -- Lunar nodes
  north_node_longitude DECIMAL(10,6) NOT NULL,
  north_node_sign VARCHAR(15) NOT NULL,
  south_node_longitude DECIMAL(10,6) NOT NULL,
  south_node_sign VARCHAR(15) NOT NULL,
  
  -- Financial significance
  financial_impact INTEGER NOT NULL CHECK (financial_impact >= 1 AND financial_impact <= 10),
  
  -- Upcoming events (stored as JSON for flexibility)
  upcoming_events JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for efficient querying
  UNIQUE(timestamp, symbol)
);

-- Planetary aspects table
CREATE TABLE IF NOT EXISTS planetary_aspects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(10) NOT NULL DEFAULT 'SOL',
  
  -- Aspect details
  planet1 VARCHAR(15) NOT NULL,
  planet2 VARCHAR(15) NOT NULL,
  aspect_type VARCHAR(15) NOT NULL,
  angle DECIMAL(8,4) NOT NULL,
  orb DECIMAL(8,4) NOT NULL,
  exactness DECIMAL(8,6) NOT NULL,
  
  -- Timing
  applying BOOLEAN NOT NULL,
  
  -- Significance ratings
  financial_significance INTEGER NOT NULL CHECK (financial_significance >= 1 AND financial_significance <= 10),
  harmony INTEGER NOT NULL CHECK (harmony >= -3 AND harmony <= 3),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(timestamp, symbol, planet1, planet2, aspect_type)
);

-- Astrological events calendar
CREATE TABLE IF NOT EXISTS astrological_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(10) NOT NULL DEFAULT 'SOL',
  
  -- Event details
  event_type VARCHAR(30) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Planets involved
  primary_planet VARCHAR(15),
  secondary_planet VARCHAR(15),
  
  -- Significance ratings
  financial_impact INTEGER NOT NULL CHECK (financial_impact >= 1 AND financial_impact <= 10),
  market_volatility_potential INTEGER CHECK (market_volatility_potential >= 1 AND market_volatility_potential <= 10),
  
  -- Event-specific data
  event_data JSONB DEFAULT '{}',
  
  -- Timing relative to calculation
  days_from_calculation INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_timestamp TIMESTAMPTZ NOT NULL
);

-- Composite astrological indicators for ML features
CREATE TABLE IF NOT EXISTS astrological_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(10) NOT NULL DEFAULT 'SOL',
  
  -- Composite scores (0-100 scale for ML compatibility)
  lunar_influence_score DECIMAL(8,4) NOT NULL,
  aspect_harmony_score DECIMAL(8,4) NOT NULL,
  aspect_stress_score DECIMAL(8,4) NOT NULL,
  eclipse_influence_score DECIMAL(8,4) NOT NULL,
  
  -- Event proximity scores
  major_event_proximity INTEGER DEFAULT 0,
  high_impact_event_count INTEGER DEFAULT 0,
  
  -- Volatility indicators
  astrological_volatility_index DECIMAL(8,4) NOT NULL,
  market_timing_score DECIMAL(8,4) NOT NULL,
  
  -- Raw feature data for ML (normalized 0-1)
  features JSONB NOT NULL,
  
  -- Quality metrics
  calculation_quality DECIMAL(8,4) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(timestamp, symbol)
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_lunar_events_timestamp ON lunar_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lunar_events_symbol_time ON lunar_events(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_planetary_aspects_timestamp ON planetary_aspects(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_astrological_events_date ON astrological_events(event_date);
CREATE INDEX IF NOT EXISTS idx_astrological_indicators_timestamp ON astrological_indicators(timestamp DESC);