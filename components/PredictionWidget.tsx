/**
 * Live Trading Prediction Dashboard Widget
 * Displays real-time pillar scores and price predictions with interactive charts
 */

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PillarScores {
  technical: number;
  social: number;
  fundamental: number;
  astrology: number;
}

interface Prediction {
  percentageChange: number;
  category: string;
  confidence: number;
}

interface PredictionData {
  timestamp: string;
  pillarScores: PillarScores;
  prediction: Prediction;
  modelUsed: string;
}

interface HistoricalPrediction {
  timestamp: string;
  predicted_pct: number;
  category: string;
  confidence: number;
}

export default function PredictionWidget() {
  const [currentPrediction, setCurrentPrediction] = useState<PredictionData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchLatestPrediction();
    fetchHistoricalData();
    
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchLatestPrediction();
      fetchHistoricalData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchLatestPrediction = async () => {
    try {
      setError(null);
      
      // Use the complete analysis endpoint for live data
      const response = await fetch('/api/analysis/complete');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prediction: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        // Transform the analysis data to match our interface
        const transformedData: PredictionData = {
          timestamp: data.timestamp,
          pillarScores: data.analysis.scores.breakdown.mainPillars,
          prediction: {
            percentageChange: data.analysis.scores.master - 50, // Convert 0-100 to percentage change
            category: data.analysis.scores.signal.signal,
            confidence: data.analysis.scores.signal.confidence === 'HIGH' ? 85 : 
                       data.analysis.scores.signal.confidence === 'MEDIUM' ? 65 : 45
          },
          modelUsed: 'scoring_algorithm'
        };
        
        setCurrentPrediction(transformedData);
        setLastUpdate(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prediction');
      console.error('Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      // For now, generate mock historical data since we don't have the API endpoint yet
      // In production, this would fetch from /api/predictions/history
      const mockHistorical: HistoricalPrediction[] = [];
      const now = Date.now();
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now - (i * 60 * 60 * 1000)).toISOString();
        mockHistorical.push({
          timestamp,
          predicted_pct: (Math.random() - 0.5) * 10, // -5 to +5%
          category: Math.random() > 0.6 ? 'BULLISH' : Math.random() > 0.3 ? 'NEUTRAL' : 'BEARISH',
          confidence: 50 + Math.random() * 40 // 50-90%
        });
      }
      
      setHistoricalData(mockHistorical);
    } catch (err) {
      console.error('Historical data fetch error:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPredictionColor = (category: string) => {
    switch (category) {
      case 'BULLISH':
      case 'STRONG_BUY':
      case 'BUY':
        return 'text-green-500';
      case 'BEARISH':
      case 'STRONG_SELL':
      case 'SELL':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPredictionBgColor = (category: string) => {
    switch (category) {
      case 'BULLISH':
      case 'STRONG_BUY':
      case 'BUY':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'BEARISH':
      case 'STRONG_SELL':
      case 'SELL':
        return 'bg-red-100 dark:bg-red-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠ Prediction Error</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</div>
          <button
            onClick={fetchLatestPrediction}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentPrediction) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          No prediction data available
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const pillarData = [
    { name: 'Technical', value: currentPrediction.pillarScores.technical },
    { name: 'Social', value: currentPrediction.pillarScores.social },
    { name: 'Fundamental', value: currentPrediction.pillarScores.fundamental },
    { name: 'Astrology', value: currentPrediction.pillarScores.astrology }
  ];

  const historicalChartData = historicalData.map(item => ({
    time: formatTimestamp(item.timestamp),
    prediction: item.predicted_pct,
    confidence: item.confidence
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Live Trading Prediction
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {lastUpdate && `Updated: ${formatTimestamp(lastUpdate.toISOString())}`}
        </div>
      </div>

      {/* Main Prediction Display */}
      <div className={`p-4 rounded-lg ${getPredictionBgColor(currentPrediction.prediction.category)}`}>
        <div className="text-center">
          <div className={`text-3xl font-bold ${getPredictionColor(currentPrediction.prediction.category)}`}>
            {currentPrediction.prediction.percentageChange > 0 ? '+' : ''}
            {currentPrediction.prediction.percentageChange.toFixed(2)}%
          </div>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-1">
            {currentPrediction.prediction.category}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Confidence: {currentPrediction.prediction.confidence}%
          </div>
        </div>
      </div>

      {/* Pillar Scores Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Analysis Breakdown
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pillarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg, #374151)',
                  color: 'var(--tooltip-text, #fff)',
                  border: 'none',
                  borderRadius: '6px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}`, 'Score']}
              />
              <Bar 
                dataKey="value" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          24-Hour Prediction Trend
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time"
                tick={{ fontSize: 10 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg, #374151)',
                  color: 'var(--tooltip-text, #fff)',
                  border: 'none',
                  borderRadius: '6px'
                }}
                formatter={(value: number, name: string) => [
                  name === 'prediction' ? `${value.toFixed(2)}%` : `${value.toFixed(0)}%`,
                  name === 'prediction' ? 'Prediction' : 'Confidence'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="prediction" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#10B981" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-6 mt-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Prediction</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-green-500 border-dashed mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Confidence</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-4">
        <div className="flex justify-between">
          <span>Model: {currentPrediction.modelUsed}</span>
          <span>Real-time analysis of SOL/USDT</span>
        </div>
      </div>
    </div>
  );
}