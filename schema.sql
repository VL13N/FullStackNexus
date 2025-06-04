-- Comprehensive Supabase Schema for ML/Backtesting Data Persistence
-- Captures all API responses with timestamps for complete trading history

-- 1. Technical Analysis Data (TAAPI Pro)
CREATE TABLE public.technical_data (
  id                uuid                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetched_at        timestamptz          NOT NULL DEFAULT now(),
  coin_symbol       text                 NOT NULL,    -- e.g. 'SOL/USDT'
  interval          text                 NOT NULL,    -- e.g. '1h', '4h'
  raw_response      jsonb                NOT NULL,    -- store full JSON from TAAPI bulk
  rsi_value         numeric(6,3),                     -- parsed RSI
  macd_histogram    numeric(10,5),                     -- parsed MACD.histogram
  ema_value         numeric(10,5),                     -- parsed EMA value
  bollinger_upper   numeric(10,5),                     -- parsed Bollinger Bands
  bollinger_lower   numeric(10,5),
  stoch_rsi         numeric(6,3),                      -- parsed Stochastic RSI
  williams_r        numeric(6,3),                      -- parsed Williams %R
  CONSTRAINT chk_coin_symbol CHECK (coin_symbol <> '')
);

CREATE INDEX idx_technical_data_fetched_at ON public.technical_data (fetched_at);
CREATE INDEX idx_technical_data_symbol_interval ON public.technical_data (coin_symbol, interval);

-- 2. Social Sentiment Data (LunarCrush)
CREATE TABLE public.social_data (
  id                uuid                PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetched_at        timestamptz         NOT NULL DEFAULT now(),
  coin_slug         text                NOT NULL,   -- e.g. 'solana'
  raw_response      jsonb               NOT NULL,   -- full JSON from social endpoints
  galaxy_score      numeric(6,3),                   -- parsed Galaxy Score
  alt_rank          int,                             -- parsed AltRank
  social_volume     numeric(14,2),                   -- parsed social volume
  sentiment         numeric(6,3),                    -- parsed sentiment score
  social_timestamp  timestamptz,                     -- timestamp from response
  price_correlation numeric(6,3),                    -- social-price correlation
  CONSTRAINT chk_coin_slug CHECK (coin_slug <> '')
);

CREATE INDEX idx_social_data_fetched_at ON public.social_data (fetched_at);
CREATE INDEX idx_social_data_slug ON public.social_data (coin_slug);

-- 3. Fundamental Market Data (CryptoRank)
CREATE TABLE public.fundamental_data (
  id                uuid                PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetched_at        timestamptz         NOT NULL DEFAULT now(),
  coin_slug         text                NOT NULL,   -- e.g. 'solana'
  raw_response      jsonb               NOT NULL,   -- full JSON from CryptoRank
  price_usd         numeric(14,6),                  -- current price USD
  market_cap_usd    numeric(18,2),                  -- market cap USD
  volume_24h_usd    numeric(18,2),                  -- 24h volume USD
  circulating_supply numeric(18,2),                 -- circulating supply
  percent_change_24h numeric(10,4),                 -- 24h price change %
  percent_change_7d  numeric(10,4),                 -- 7d price change %
  percent_change_30d numeric(10,4),                 -- 30d price change %
  ath_price         numeric(14,6),                  -- all-time high price
  atl_price         numeric(14,6),                  -- all-time low price
  market_rank       int,                            -- market cap rank
  CONSTRAINT chk_coin_slug2 CHECK (coin_slug <> '')
);

CREATE INDEX idx_fundamental_data_fetched_at ON public.fundamental_data (fetched_at);
CREATE INDEX idx_fundamental_data_slug ON public.fundamental_data (coin_slug);

-- 4. On-Chain Blockchain Data
CREATE TABLE public.onchain_data (
  id                uuid                PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetched_at        timestamptz         NOT NULL DEFAULT now(),
  coin_slug         text                NOT NULL,       -- normally 'solana'
  raw_response      jsonb               NOT NULL,       -- raw JSON from onchain endpoints
  tps               numeric(10,3),                      -- transactions per second
  active_validators int,                                -- active validator count
  staking_yield     numeric(6,3),                       -- current staking yield
  whale_flow        numeric(14,2),                      -- whale transaction flow
  tvl               numeric(18,2),                      -- total value locked
  dex_volume        numeric(18,2),                      -- DEX trading volume
  network_health    numeric(6,3),                       -- overall network health score
  epoch_info        jsonb,                              -- current epoch details
  CONSTRAINT chk_onchain_slug CHECK (coin_slug <> '')
);

CREATE INDEX idx_onchain_data_fetched_at ON public.onchain_data (fetched_at);
CREATE INDEX idx_onchain_data_slug ON public.onchain_data (coin_slug);

-- 5. Basic Astrological Data (moon phases, planetary positions)
CREATE TABLE public.astrology_data (
  id                uuid                PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetched_at        timestamptz         NOT NULL DEFAULT now(),
  raw_moon_phase    jsonb,                          -- raw response from /moon-phase
  raw_planetary     jsonb,                          -- raw response from /planetary-positions
  raw_aspects       jsonb,                          -- raw response from /aspects
  moon_phase_name   text,                           -- parsed moon phase name
  moon_illumination numeric(6,3),                   -- parsed illumination percentage
  mercury_retrograde boolean,                       -- parsed retrograde status
  major_aspects_count int                           -- count of major planetary aspects
);

CREATE INDEX idx_astrology_data_fetched_at ON public.astrology_data (fetched_at);

-- 6. Advanced Financial Astrology Data (composite FAI)
CREATE TABLE public.financial_astrology_data (
  id                  uuid              PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetched_at          timestamptz       NOT NULL DEFAULT now(),
  raw_response        jsonb             NOT NULL,
  weighted_aspect     numeric(6,3)      NOT NULL,    -- weighted planetary aspect score
  ingress_score       numeric(6,3)      NOT NULL,    -- planetary ingress score
  midpoint_score      numeric(6,3)      NOT NULL,    -- midpoint analysis score
  station_score       numeric(6,3)      NOT NULL,    -- planetary station score
  node_score          numeric(6,3)      NOT NULL,    -- lunar node score
  composite_fai       numeric(6,3)      NOT NULL     -- final composite Financial Astrology Index
);

CREATE INDEX idx_fai_fetched_at ON public.financial_astrology_data (fetched_at);

-- 7. Enhanced Predictions Table (with data lineage)
CREATE TABLE public.predictions_enhanced (
  id                uuid              PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_at      timestamptz       NOT NULL DEFAULT now(),
  -- Foreign keys to source data for full lineage tracking
  technical_id      uuid              REFERENCES public.technical_data(id),
  social_id         uuid              REFERENCES public.social_data(id),
  fundamental_id    uuid              REFERENCES public.fundamental_data(id),
  onchain_id        uuid              REFERENCES public.onchain_data(id),
  astrology_id      uuid              REFERENCES public.astrology_data(id),
  fai_id            uuid              REFERENCES public.financial_astrology_data(id),
  -- Computed scores
  tech_score        numeric(6,3)      NOT NULL,
  social_score      numeric(6,3)      NOT NULL,
  fundamental_score numeric(6,3)      NOT NULL,
  astrology_score   numeric(6,3)      NOT NULL,
  composite_score   numeric(6,3)      NOT NULL,
  classification    text              NOT NULL,    -- Bullish/Bearish/Neutral
  confidence        numeric(4,3)      NOT NULL,    -- 0.0 to 1.0
  price_target      numeric(14,6),                 -- predicted price target
  risk_level        text              NOT NULL     -- Low/Medium/High
);

CREATE INDEX idx_predictions_enhanced_generated_at ON public.predictions_enhanced (generated_at);
CREATE INDEX idx_predictions_enhanced_classification ON public.predictions_enhanced (classification);

-- 8. News Sentiment Analysis Data (OpenAI)
CREATE TABLE public.news_scores (
  id                uuid               PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetched_at        timestamptz        NOT NULL DEFAULT now(),
  raw_response      jsonb              NOT NULL,  -- full JSON from OpenAI analysis
  headline          text,                          -- parsed headline
  sentiment_score   numeric(6,3),                  -- parsed sentiment (-1 to 1)
  confidence_level  text,                          -- high/medium/low
  source            text,                          -- news source
  article_url       text,                          -- source URL
  key_topics        text[],                        -- extracted key topics
  market_impact     text                           -- bullish/bearish/neutral
);

CREATE INDEX idx_news_scores_fetched_at ON public.news_scores (fetched_at);
CREATE INDEX idx_news_scores_sentiment ON public.news_scores (sentiment_score);

-- 9. Daily AI Market Updates (OpenAI)
CREATE TABLE public.daily_updates (
  id                uuid              PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_at      timestamptz       NOT NULL DEFAULT now(),
  raw_response      jsonb             NOT NULL,  -- full JSON from OpenAI daily update
  content           text              NOT NULL,  -- parsed summary text
  market_outlook    text,                        -- bullish/bearish/neutral
  key_events        text[],                      -- important events mentioned
  price_prediction  text,                        -- AI price prediction text
  confidence_rating text                         -- AI confidence assessment
);

CREATE INDEX idx_daily_updates_generated_at ON public.daily_updates (generated_at);

-- 10. Dynamic Weight Suggestions (OpenAI)
CREATE TABLE public.dynamic_weights (
  id                uuid              PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_at      timestamptz       NOT NULL DEFAULT now(),
  raw_response      jsonb             NOT NULL,  -- full JSON from OpenAI weights
  technical_pct     numeric(5,2)      NOT NULL,  -- technical analysis weight %
  social_pct        numeric(5,2)      NOT NULL,  -- social sentiment weight %
  fundamental_pct   numeric(5,2)      NOT NULL,  -- fundamental analysis weight %
  astrology_pct     numeric(5,2)      NOT NULL,  -- astrology weight %
  justification     jsonb,                       -- AI reasoning for weights
  market_condition  text,                        -- current market condition
  volatility_factor numeric(6,3)                 -- volatility adjustment factor
);

CREATE INDEX idx_dynamic_weights_generated_at ON public.dynamic_weights (generated_at);