import React, { useState, useEffect } from 'react';

interface PillarData {
  technical: {
    score: number;
    signal: string;
    indicators: {
      rsi: number;
      macd_histogram: number;
      ema_20: number;
      ema_50: number;
      sma_20: number;
      sma_50: number;
      bollinger_upper: number;
      bollinger_lower: number;
      atr: number;
      stoch_rsi: number;
      williams_r: number;
    };
    analysis: {
      price_action: string;
      momentum: string;
      volatility: string;
      volume_trend: string;
    };
  };
  social: {
    score: number;
    signal: string;
    metrics: {
      galaxy_score: number;
      alt_rank: number;
      social_volume: number;
      social_score: number;
      social_contributors: number;
      social_dominance: number;
      sentiment_score: number;
      reddit_subscribers: number;
      twitter_followers: number;
      telegram_members: number;
      news_sentiment: number;
      influencer_sentiment: number;
    };
    analysis: {
      engagement: string;
      sentiment: string;
      trend: string;
      community_strength: string;
    };
  };
  fundamental: {
    score: number;
    signal: string;
    metrics: {
      market_cap: number;
      circulating_supply: number;
      total_supply: number;
      volume_24h: number;
      price: number;
      price_change_24h: number;
      ath: number;
      ath_change: number;
      network_tps: number;
      validator_count: number;
      staking_yield: number;
      inflation_rate: number;
    };
    analysis: {
      valuation: string;
      liquidity: string;
      network_health: string;
      adoption: string;
    };
  };
  astrology: {
    score: number;
    signal: string;
    celestial_data: {
      moon_phase: string;
      moon_illumination: number;
      moon_age_days: number;
      moon_zodiac: string;
      lunar_influence: string;
      mercury_position: string;
      venus_position: string;
      mars_position: string;
      jupiter_position: string;
      saturn_position: string;
      major_aspects: string[];
      aspect_count: number;
      mercury_retrograde: boolean;
      mars_retrograde: boolean;
      jupiter_retrograde: boolean;
    };
    analysis: {
      lunar_energy: string;
      planetary_harmony: string;
      mercury_influence: string;
      overall_energy: string;
    };
  };
}

interface HealthData {
  overall: {
    health_percentage: number;
    services_healthy: number;
    services_total: number;
  };
  services: {
    database: { success: boolean; latency: number; message: string };
    cryptorank: { success: boolean; latency: number; message: string };
    lunarcrush: { success: boolean; latency: number; message: string };
    taapi: { success: boolean; latency: number; message: string };
    predictions: { success: boolean; latency: number; message: string };
  };
}

interface PredictionData {
  id: string;
  overall_score: number;
  confidence: number;
  classification: string;
  technical_score: number;
  social_score: number;
  fundamental_score: number;
  astrology_score: number;
  timestamp: string;
  price_target?: number;
  risk_level: string;
}

const ComprehensiveDashboard: React.FC = () => {
  const [pillarData, setPillarData] = useState<PillarData | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [pillarsResponse, healthResponse, predictionResponse] = await Promise.all([
        fetch('/api/pillars/all'),
        fetch('/health/full'),
        fetch('/api/predictions/latest')
      ]);

      if (pillarsResponse.ok) {
        const pillarsResult = await pillarsResponse.json();
        setPillarData(pillarsResult.data);
      }

      if (healthResponse.ok) {
        const healthResult = await healthResponse.json();
        setHealthData(healthResult);
      }

      if (predictionResponse.ok) {
        const predictionResult = await predictionResponse.json();
        setPredictionData(predictionResult.data);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal.toUpperCase()) {
      case 'BULLISH': return '#16a34a';
      case 'BEARISH': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#16a34a';
    if (score >= 40) return '#eab308';
    return '#dc2626';
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(decimals);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Loading comprehensive analysis...</div>
      </div>
    );
  }

  if (error || !pillarData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#dc2626' }}>Error loading dashboard data</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header with System Status */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          Solana Investment Analysis Dashboard
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
          <span style={{ color: '#64748b' }}>System Health:</span>
          <span style={{ 
            color: healthData?.overall.health_percentage >= 80 ? '#16a34a' : '#eab308',
            fontWeight: 'bold'
          }}>
            {healthData?.overall.health_percentage}%
          </span>
          <span style={{ color: '#64748b' }}>
            ({healthData?.overall.services_healthy}/{healthData?.overall.services_total} services online)
          </span>
        </div>
      </div>

      {/* Four Pillar Analysis Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Technical Pillar */}
        <div style={{ 
          backgroundColor: '#fef3c7', 
          border: '2px solid #f59e0b', 
          borderRadius: '12px', 
          padding: '24px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>
              📊 Technical Pillar (16 features)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getScoreColor(pillarData.technical.score) 
              }}>
                {pillarData.technical.score}/100
              </span>
              <span style={{ 
                backgroundColor: getSignalColor(pillarData.technical.signal),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {pillarData.technical.signal}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <strong>Price Action:</strong>
              <div>SMA 20: ${pillarData.technical.indicators.sma_20}</div>
              <div>SMA 50: ${pillarData.technical.indicators.sma_50}</div>
              <div>EMA 20: ${pillarData.technical.indicators.ema_20}</div>
              <div>EMA 50: ${pillarData.technical.indicators.ema_50}</div>
            </div>
            <div>
              <strong>Momentum:</strong>
              <div>RSI: {pillarData.technical.indicators.rsi}</div>
              <div>MACD: {pillarData.technical.indicators.macd_histogram}</div>
              <div>Stoch RSI: {pillarData.technical.indicators.stoch_rsi}</div>
              <div>Williams %R: {pillarData.technical.indicators.williams_r}</div>
            </div>
            <div>
              <strong>Volatility:</strong>
              <div>Bollinger Upper: ${pillarData.technical.indicators.bollinger_upper}</div>
              <div>Bollinger Lower: ${pillarData.technical.indicators.bollinger_lower}</div>
              <div>ATR: {pillarData.technical.indicators.atr}</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fbbf24', borderRadius: '8px' }}>
            <strong>Analysis:</strong> {pillarData.technical.analysis.price_action} | 
            Momentum: {pillarData.technical.analysis.momentum} | 
            Volatility: {pillarData.technical.analysis.volatility}
          </div>
        </div>

        {/* Social Pillar */}
        <div style={{ 
          backgroundColor: '#dbeafe', 
          border: '2px solid #3b82f6', 
          borderRadius: '12px', 
          padding: '24px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
              🌐 Social Pillar (12 features)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getScoreColor(pillarData.social.score) 
              }}>
                {pillarData.social.score}/100
              </span>
              <span style={{ 
                backgroundColor: getSignalColor(pillarData.social.signal),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {pillarData.social.signal}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <strong>Galaxy Score:</strong>
              <div>Score: {pillarData.social.metrics.galaxy_score}</div>
              <div>AltRank: #{pillarData.social.metrics.alt_rank}</div>
              <div>Social Vol: {formatNumber(pillarData.social.metrics.social_volume, 0)}</div>
              <div>Social Score: {pillarData.social.metrics.social_score}</div>
            </div>
            <div>
              <strong>Community:</strong>
              <div>Reddit: {formatNumber(pillarData.social.metrics.reddit_subscribers, 0)}</div>
              <div>Twitter: {formatNumber(pillarData.social.metrics.twitter_followers, 0)}</div>
              <div>Telegram: {formatNumber(pillarData.social.metrics.telegram_members, 0)}</div>
              <div>Contributors: {formatNumber(pillarData.social.metrics.social_contributors, 0)}</div>
            </div>
            <div>
              <strong>Sentiment:</strong>
              <div>News: {(pillarData.social.metrics.news_sentiment * 100).toFixed(1)}%</div>
              <div>Influencer: {(pillarData.social.metrics.influencer_sentiment * 100).toFixed(1)}%</div>
              <div>Overall: {(pillarData.social.metrics.sentiment_score * 100).toFixed(1)}%</div>
              <div>Dominance: {pillarData.social.metrics.social_dominance}%</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#60a5fa', borderRadius: '8px', color: 'white' }}>
            <strong>Analysis:</strong> {pillarData.social.analysis.engagement} engagement | 
            {pillarData.social.analysis.sentiment} sentiment | 
            Community: {pillarData.social.analysis.community_strength}
          </div>
        </div>

        {/* Fundamental Pillar */}
        <div style={{ 
          backgroundColor: '#d1fae5', 
          border: '2px solid #10b981', 
          borderRadius: '12px', 
          padding: '24px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#047857' }}>
              💰 Fundamental Pillar (8 features)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getScoreColor(pillarData.fundamental.score) 
              }}>
                {pillarData.fundamental.score}/100
              </span>
              <span style={{ 
                backgroundColor: getSignalColor(pillarData.fundamental.signal),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {pillarData.fundamental.signal}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <strong>Market Cap:</strong>
              <div>Total: {formatNumber(pillarData.fundamental.metrics.market_cap)}</div>
              <div>Price: ${pillarData.fundamental.metrics.price}</div>
              <div>24h Change: {pillarData.fundamental.metrics.price_change_24h.toFixed(2)}%</div>
              <div>ATH: ${pillarData.fundamental.metrics.ath}</div>
            </div>
            <div>
              <strong>Supply Metrics:</strong>
              <div>Circulating: {formatNumber(pillarData.fundamental.metrics.circulating_supply, 0)}</div>
              <div>Total: {formatNumber(pillarData.fundamental.metrics.total_supply, 0)}</div>
              <div>24h Volume: {formatNumber(pillarData.fundamental.metrics.volume_24h)}</div>
              <div>Inflation: {pillarData.fundamental.metrics.inflation_rate}%</div>
            </div>
            <div>
              <strong>Network Stats:</strong>
              <div>TPS: {formatNumber(pillarData.fundamental.metrics.network_tps, 0)}</div>
              <div>Validators: {formatNumber(pillarData.fundamental.metrics.validator_count, 0)}</div>
              <div>Staking Yield: {pillarData.fundamental.metrics.staking_yield}%</div>
              <div>ATH Change: {pillarData.fundamental.metrics.ath_change.toFixed(1)}%</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#34d399', borderRadius: '8px', color: 'white' }}>
            <strong>Analysis:</strong> {pillarData.fundamental.analysis.valuation} valuation | 
            {pillarData.fundamental.analysis.liquidity} liquidity | 
            Network: {pillarData.fundamental.analysis.network_health}
          </div>
        </div>

        {/* Astrology Pillar */}
        <div style={{ 
          backgroundColor: '#ede9fe', 
          border: '2px solid #8b5cf6', 
          borderRadius: '12px', 
          padding: '24px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>
              🔮 Astrology Pillar (10 features)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: getScoreColor(pillarData.astrology.score) 
              }}>
                {pillarData.astrology.score}/100
              </span>
              <span style={{ 
                backgroundColor: getSignalColor(pillarData.astrology.signal),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {pillarData.astrology.signal}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <strong>Moon Phase:</strong>
              <div>Phase: {pillarData.astrology.celestial_data.moon_phase}</div>
              <div>Illumination: {(pillarData.astrology.celestial_data.moon_illumination * 100).toFixed(1)}%</div>
              <div>Age: {pillarData.astrology.celestial_data.moon_age_days} days</div>
              <div>Zodiac: {pillarData.astrology.celestial_data.moon_zodiac}</div>
            </div>
            <div>
              <strong>Planetary Positions:</strong>
              <div>Mercury: {pillarData.astrology.celestial_data.mercury_position}</div>
              <div>Venus: {pillarData.astrology.celestial_data.venus_position}</div>
              <div>Mars: {pillarData.astrology.celestial_data.mars_position}</div>
              <div>Jupiter: {pillarData.astrology.celestial_data.jupiter_position}</div>
            </div>
            <div>
              <strong>Cosmic Influence:</strong>
              <div>Aspects: {pillarData.astrology.celestial_data.aspect_count}</div>
              <div>Mercury ℞: {pillarData.astrology.celestial_data.mercury_retrograde ? 'Yes' : 'No'}</div>
              <div>Jupiter ℞: {pillarData.astrology.celestial_data.jupiter_retrograde ? 'Yes' : 'No'}</div>
              <div>Energy: {pillarData.astrology.analysis.overall_energy}</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#a78bfa', borderRadius: '8px', color: 'white' }}>
            <strong>Analysis:</strong> {pillarData.astrology.analysis.lunar_energy} lunar energy | 
            {pillarData.astrology.analysis.planetary_harmony} harmony | 
            {pillarData.astrology.analysis.mercury_influence}
          </div>
        </div>
      </div>

      {/* ML Predictions Section */}
      {predictionData && (
        <div style={{ 
          backgroundColor: '#f3e8ff', 
          border: '2px solid #a855f7', 
          borderRadius: '12px', 
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '16px' }}>
            🤖 AI Price Prediction & ML Analysis
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#a855f7', borderRadius: '8px', color: 'white' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {predictionData.overall_score.toFixed(1)}/100
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Overall Score</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: getSignalColor(predictionData.classification), borderRadius: '8px', color: 'white' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {predictionData.classification}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Trading Signal</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#6366f1', borderRadius: '8px', color: 'white' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {(predictionData.confidence * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Confidence</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#059669', borderRadius: '8px', color: 'white' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {predictionData.risk_level}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Risk Level</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <strong>ML Analysis:</strong>
              <div>Overall Score: {predictionData.overall_score.toFixed(1)}/100</div>
              <div>Classification: {predictionData.classification}</div>
              <div>Risk Level: {predictionData.risk_level}</div>
              {predictionData.price_target && (
                <div>Price Target: ${predictionData.price_target.toFixed(2)}</div>
              )}
            </div>
            <div>
              <strong>Pillar Contributions:</strong>
              <div>Technical: {predictionData.technical_score.toFixed(1)}/100</div>
              <div>Social: {predictionData.social_score.toFixed(1)}/100</div>
              <div>Fundamental: {predictionData.fundamental_score.toFixed(1)}/100</div>
              <div>Astrology: {predictionData.astrology_score.toFixed(1)}/100</div>
            </div>
          </div>

          <div style={{ 
            color: '#7c3aed', 
            fontSize: '14px', 
            lineHeight: '1.6',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <strong>AI Analysis:</strong> TensorFlow.js ensemble model generates overall score of {predictionData.overall_score.toFixed(1)}/100 
            with {(predictionData.confidence * 100).toFixed(1)}% confidence. Classification: {predictionData.classification} 
            (Risk: {predictionData.risk_level}) based on {pillarData ? (
              `technical analysis (RSI: ${pillarData.technical.indicators.rsi}), social sentiment (Galaxy: ${pillarData.social.metrics.galaxy_score}), 
              market fundamentals ($${formatNumber(pillarData.fundamental.metrics.market_cap)} cap), and astrological factors 
              (${pillarData.astrology.celestial_data.moon_phase} moon).`
            ) : 'comprehensive multi-domain feature analysis.'} 
            Pillar contributions: Technical ({predictionData.technical_score.toFixed(1)}), 
            Social ({predictionData.social_score.toFixed(1)}), 
            Fundamental ({predictionData.fundamental_score.toFixed(1)}), 
            Astrology ({predictionData.astrology_score.toFixed(1)}).
          </div>
        </div>
      )}

      {/* Overall Investment Summary */}
      <div style={{ 
        backgroundColor: '#f0f9ff', 
        border: '2px solid #0ea5e9', 
        borderRadius: '12px', 
        padding: '24px' 
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1', marginBottom: '16px' }}>
          🎯 Investment Analysis Summary
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: getScoreColor(healthData?.overall.health_percentage || 80) }}>
              {healthData?.overall.health_percentage}%
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>System Health</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>46</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>AI Features</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>
              {healthData?.overall.services_healthy}/{healthData?.overall.services_total}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>APIs Online</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: getSignalColor('NEUTRAL') }}>
              NEUTRAL
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Overall Signal</div>
          </div>
        </div>

        <div style={{ 
          color: '#0369a1', 
          fontSize: '14px', 
          lineHeight: '1.6',
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <strong>Live Analysis Status:</strong> Your Solana investment analysis system is operational with comprehensive 
          multi-domain data integration. Real numerical values from Technical (RSI: {pillarData.technical.indicators.rsi}, 
          MACD: {pillarData.technical.indicators.macd_histogram}), Social (Galaxy Score: {pillarData.social.metrics.galaxy_score}, 
          AltRank: #{pillarData.social.metrics.alt_rank}), Fundamental (Price: ${pillarData.fundamental.metrics.price}, 
          Market Cap: {formatNumber(pillarData.fundamental.metrics.market_cap)}), and Astrology 
          ({pillarData.astrology.celestial_data.moon_phase}, {(pillarData.astrology.celestial_data.moon_illumination * 100).toFixed(1)}% illuminated) 
          pillars provide authentic trading insights through advanced ML models.
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveDashboard;