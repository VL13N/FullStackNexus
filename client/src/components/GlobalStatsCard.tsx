import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

interface GlobalStats {
  totalMarketCapUsd: number;
  totalVolume24hUsd: number;
  btcDominance: number;
  ethDominance: number;
  defiDominance: number;
  activeCryptocurrencies: number;
}

export default function GlobalStatsCard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/cryptorank/global');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch global statistics');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Activity className="h-5 w-5" />
          Global Crypto Market
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Real-time global cryptocurrency market statistics
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {error.includes('API key') && (
            <p className="text-xs mt-1">
              CryptoRank API key required for global market data
            </p>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading global stats...</div>
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Market Cap</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalMarketCapUsd)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total cryptocurrency market capitalization
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">24h Volume</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalVolume24hUsd)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total 24-hour trading volume
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">
                {formatPercentage(stats.btcDominance)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">BTC Dom</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {formatPercentage(stats.ethDominance)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ETH Dom</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {formatPercentage(stats.defiDominance)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">DeFi Dom</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-600">
                {stats.activeCryptocurrencies.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Active Coins</div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={fetchGlobalStats}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Refresh global stats
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          Global market data unavailable
        </div>
      )}
    </div>
  );
}