import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PredictionData {
  symbol: string;
  prediction: number;
  confidence: number;
  composite_score: number;
  category: string;
  timestamp: string;
}

interface HeatmapProps {
  className?: string;
}

export default function Heatmap({ className = "" }: HeatmapProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/predictions/all'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getScoreColor = (score: number): string => {
    if (score >= 240) return 'bg-green-500 text-white';
    if (score >= 220) return 'bg-green-400 text-white';
    if (score >= 200) return 'bg-green-300 text-black';
    if (score >= 180) return 'bg-yellow-300 text-black';
    if (score >= 160) return 'bg-orange-300 text-black';
    if (score >= 140) return 'bg-orange-400 text-white';
    return 'bg-red-500 text-white';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BULLISH': return <TrendingUp className="w-4 h-4" />;
      case 'BEARISH': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'BULLISH': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'BEARISH': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Multi-Asset Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Multi-Asset Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Failed to load heatmap data. Please check your connection.
          </div>
        </CardContent>
      </Card>
    );
  }

  const predictions: PredictionData[] = data?.data || [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Multi-Asset Heatmap
          <Badge variant="outline" className="text-xs">
            {predictions.length} assets
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No prediction data available. Configure watchlist in environment variables.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.symbol}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 cursor-pointer
                  ${getScoreColor(prediction.composite_score)}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{prediction.symbol}</span>
                  <div className="flex items-center space-x-1">
                    {getCategoryIcon(prediction.category)}
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="font-semibold">{prediction.composite_score.toFixed(0)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Prediction:</span>
                    <span className="font-semibold">
                      {prediction.prediction > 0 ? '+' : ''}{prediction.prediction.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span className="font-semibold">{(prediction.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Badge 
                    className={`text-xs w-full justify-center ${getCategoryColor(prediction.category)}`}
                    variant="secondary"
                  >
                    {prediction.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500 text-center">
          <div className="flex justify-center space-x-4 mb-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Strong Bullish (240+)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-300 rounded"></div>
              <span>Neutral (180-220)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Strong Bearish (<140)</span>
            </div>
          </div>
          <p>Composite scores combine Technical, Social, Fundamental, and Astrological analysis</p>
        </div>
      </CardContent>
    </Card>
  );
}