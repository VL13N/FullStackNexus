import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface MarketSentimentData {
  btcDominance: number | null;
  fearGreedIndex: number | null;
  timestamp: string;
  note?: string;
}

export default function MarketSentimentCard() {
  const [data, setData] = useState<MarketSentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchMarketSentiment();
  }, []);

  const fetchMarketSentiment = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/market-sentiment');
      const result = await response.json();
      
      if (result.success) {
        setData({
          btcDominance: result.btcDominance,
          fearGreedIndex: result.fearGreedIndex,
          timestamp: result.timestamp,
          note: result.note
        });
      } else {
        setError(result.error || 'Failed to fetch market sentiment data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFearGreedSentiment = (value: number | null) => {
    if (value === null) return { label: 'Unknown', color: 'bg-gray-500' };
    
    if (value <= 25) return { label: 'Extreme Fear', color: 'bg-red-600' };
    if (value <= 45) return { label: 'Fear', color: 'bg-red-400' };
    if (value <= 55) return { label: 'Neutral', color: 'bg-gray-500' };
    if (value <= 75) return { label: 'Greed', color: 'bg-green-400' };
    return { label: 'Extreme Greed', color: 'bg-green-600' };
  };

  const getDominanceTrend = (value: number | null) => {
    if (value === null) return { icon: Activity, color: 'text-gray-500' };
    
    if (value >= 50) return { icon: TrendingUp, color: 'text-orange-500' };
    return { icon: TrendingDown, color: 'text-blue-500' };
  };

  const fearGreedSentiment = getFearGreedSentiment(data?.fearGreedIndex || null);
  const dominanceTrend = getDominanceTrend(data?.btcDominance || null);
  const DominanceIcon = dominanceTrend.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Activity className="h-5 w-5" />
          Market Sentiment
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Bitcoin dominance and market fear & greed indicators
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading market sentiment...</div>
      ) : data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">BTC Dominance</span>
                <DominanceIcon className={`h-4 w-4 ${dominanceTrend.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.btcDominance !== null 
                  ? `${data.btcDominance.toFixed(1)}%` 
                  : 'N/A'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bitcoin's share of total crypto market cap
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fear & Greed</span>
                <span className={`px-2 py-1 rounded text-xs text-white ${fearGreedSentiment.color}`}>
                  {fearGreedSentiment.label}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.fearGreedIndex !== null 
                  ? data.fearGreedIndex 
                  : 'N/A'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Market sentiment index (0-100)
              </p>
            </div>
          </div>

          {data.note && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-orange-600 dark:text-orange-400">
                ⚠️ {data.note}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No market sentiment data available
        </div>
      )}
    </div>
  );
}