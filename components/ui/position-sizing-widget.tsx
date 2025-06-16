import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Settings, DollarSign, AlertTriangle } from 'lucide-react';

interface PositionSizingProps {
  prediction?: number;
  confidence?: number;
  currentPrice?: number;
  className?: string;
}

export function PositionSizingWidget({ 
  prediction = 0.5, 
  confidence = 0.7, 
  currentPrice = 150,
  className = ""
}: PositionSizingProps) {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch position sizing recommendation
  const { data: positionData, isLoading, error, refetch } = useQuery({
    queryKey: ['position-size', prediction, confidence, currentPrice, accountBalance],
    queryFn: async () => {
      const response = await fetch('/api/risk/size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction,
          confidence,
          currentPrice,
          accountBalance
        })
      });
      if (!response.ok) throw new Error('Failed to fetch position sizing');
      return response.json();
    },
    enabled: prediction !== undefined && confidence !== undefined
  });

  // Fetch risk settings
  const { data: settingsData } = useQuery({
    queryKey: ['risk-settings'],
    queryFn: async () => {
      const response = await fetch('/api/risk/settings');
      if (!response.ok) throw new Error('Failed to fetch risk settings');
      return response.json();
    }
  });

  const position = positionData?.data;
  const settings = settingsData?.data;

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SELL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Position Sizing Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-400">
            Failed to calculate position size. Please try again.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Position Sizing
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Balance Setting */}
        {showSettings && (
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Label htmlFor="balance">Account Balance (USD)</Label>
            <Input
              id="balance"
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              placeholder="10000"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : position?.success ? (
          <>
            {/* Main Recommendation */}
            <div className="text-center space-y-2">
              <Badge className={getRecommendationColor(position.recommendation)}>
                <div className="flex items-center gap-1">
                  {getRecommendationIcon(position.recommendation)}
                  {position.recommendation}
                </div>
              </Badge>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {position.positionSize.toFixed(2)} SOL
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ${position.positionValue.toFixed(0)} ({position.positionPercentage.toFixed(1)}% of portfolio)
                </div>
              </div>
            </div>

            <Separator />

            {/* Risk Metrics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Risk per Trade</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {position.riskMetrics.riskPercentage.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="font-medium">Stop Loss</div>
                <div className="text-gray-600 dark:text-gray-400">
                  ${position.riskMetrics.stopLossPrice.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="font-medium">Volatility</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {position.riskMetrics.volatility.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="font-medium">Win Probability</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {(position.modelMetrics.winProbability * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Sizing Method Breakdown */}
            {showSettings && (
              <>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Sizing Methods</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between">
                      <span>Kelly Criterion:</span>
                      <span>{(position.sizing.kellyFraction * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fixed Fraction:</span>
                      <span>{(position.sizing.fixedFraction * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Combined:</span>
                      <span>{(position.sizing.combinedFraction * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span>{(position.modelMetrics.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Risk Warning */}
            {position.riskMetrics.riskPercentage > 3 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  High risk position (>{position.riskMetrics.riskPercentage.toFixed(1)}%)
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            {position?.reason || 'Insufficient data for position sizing'}
          </div>
        )}

        {/* Model Input Display */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
          <div>
            <div>Prediction:</div>
            <div className="font-mono">{prediction.toFixed(2)}</div>
          </div>
          <div>
            <div>Confidence:</div>
            <div className="font-mono">{(confidence * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div>Price:</div>
            <div className="font-mono">${currentPrice.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}