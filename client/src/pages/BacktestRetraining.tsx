import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, BarChart3, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BacktestResult {
  success: boolean;
  backtest_id: string;
  metrics: {
    total_trades: number;
    hit_rate: number;
    total_pnl: number;
    sharpe_ratio: number;
    max_drawdown: number;
    avg_return: number;
    volatility: number;
  };
  retrain?: {
    triggered: boolean;
    reason?: string;
    error?: string;
  };
}

interface BacktestHistory {
  backtest_id: string;
  from_date: string;
  to_date: string;
  sharpe_ratio: number;
  hit_rate: number;
  total_pnl: number;
  created_at: string;
}

export default function BacktestRetraining() {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [autoRetrain, setAutoRetrain] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch backtest history
  const { data: backtestHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/backtest/history'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch performance metrics
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/backtest/performance'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Run backtest mutation
  const backtestMutation = useMutation({
    mutationFn: async (params: { from: string; to: string; auto_retrain: boolean }) => {
      const response = await fetch(`/api/backtest/run?from=${params.from}&to=${params.to}&auto_retrain=${params.auto_retrain}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: BacktestResult) => {
      queryClient.invalidateQueries({ queryKey: ['/api/backtest/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/backtest/performance'] });
      
      if (data.success) {
        toast({
          title: 'Backtest Completed',
          description: `Sharpe Ratio: ${data.metrics.sharpe_ratio.toFixed(3)} | Hit Rate: ${(data.metrics.hit_rate * 100).toFixed(1)}%`,
        });
        
        if (data.retrain?.triggered) {
          toast({
            title: 'Retraining Triggered',
            description: 'Model retraining initiated based on performance metrics',
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Backtest Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Manual retrain mutation
  const retrainMutation = useMutation({
    mutationFn: async (params: { from_date: string; to_date: string; force: boolean }) => {
      const response = await fetch('/api/backtest/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Retraining Initiated',
          description: 'Model retraining process has started',
        });
      } else {
        toast({
          title: 'Retraining Not Recommended',
          description: data.message || 'Performance metrics below threshold',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Retraining Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRunBacktest = () => {
    backtestMutation.mutate({
      from: fromDate,
      to: toDate,
      auto_retrain: autoRetrain,
    });
  };

  const handleManualRetrain = (force = false) => {
    retrainMutation.mutate({
      from_date: fromDate,
      to_date: toDate,
      force,
    });
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number, decimals = 3) => value.toFixed(decimals);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backtest & Retraining</h1>
          <p className="text-muted-foreground">
            Validate ML predictions against actual price movements and trigger automated retraining
          </p>
        </div>
      </div>

      <Tabs defaultValue="backtest" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backtest">Run Backtest</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="backtest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Backtest Configuration
              </CardTitle>
              <CardDescription>
                Configure date range and retraining parameters for ML model validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRetrain"
                  checked={autoRetrain}
                  onChange={(e) => setAutoRetrain(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="autoRetrain">
                  Auto-trigger retraining if Sharpe ratio > 1.0
                </Label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleRunBacktest}
                  disabled={backtestMutation.isPending}
                  className="flex-1"
                >
                  {backtestMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running Backtest...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Run Backtest
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleManualRetrain(false)}
                  disabled={retrainMutation.isPending}
                >
                  {retrainMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Smart Retrain'
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleManualRetrain(true)}
                  disabled={retrainMutation.isPending}
                >
                  Force Retrain
                </Button>
              </div>

              {backtestMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing backtest...</span>
                    <span>This may take a few minutes</span>
                  </div>
                  <Progress value={undefined} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {backtestMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Latest Backtest Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatNumber(backtestMutation.data.metrics.sharpe_ratio)}
                    </div>
                    <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    <Badge variant={backtestMutation.data.metrics.sharpe_ratio > 1.0 ? 'default' : 'secondary'}>
                      {backtestMutation.data.metrics.sharpe_ratio > 1.0 ? 'Excellent' : 'Good'}
                    </Badge>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatPercentage(backtestMutation.data.metrics.hit_rate)}
                    </div>
                    <div className="text-sm text-muted-foreground">Hit Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatPercentage(backtestMutation.data.metrics.total_pnl)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total P&L</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatPercentage(backtestMutation.data.metrics.max_drawdown)}
                    </div>
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                  </div>
                </div>

                {backtestMutation.data.retrain && (
                  <div className="mt-4 p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                      {backtestMutation.data.retrain.triggered ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="font-medium">
                        Retraining {backtestMutation.data.retrain.triggered ? 'Triggered' : 'Not Triggered'}
                      </span>
                    </div>
                    {backtestMutation.data.retrain.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Reason: {backtestMutation.data.retrain.reason.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backtest History</CardTitle>
              <CardDescription>
                Previous backtest results and performance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">Loading history...</div>
              ) : backtestHistory?.data?.length > 0 ? (
                <div className="space-y-3">
                  {backtestHistory.data.map((backtest: BacktestHistory) => (
                    <div
                      key={backtest.backtest_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {backtest.from_date} to {backtest.to_date}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(backtest.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{formatNumber(backtest.sharpe_ratio)}</div>
                          <div className="text-muted-foreground">Sharpe</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{formatPercentage(backtest.hit_rate)}</div>
                          <div className="text-muted-foreground">Hit Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{formatPercentage(backtest.total_pnl)}</div>
                          <div className="text-muted-foreground">P&L</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No backtest history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aggregate Performance Metrics</CardTitle>
              <CardDescription>
                Overall performance analysis across all backtests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="text-center py-8">Loading performance data...</div>
              ) : performanceData?.aggregate_metrics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {formatNumber(performanceData.aggregate_metrics.avg_sharpe_ratio)}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Sharpe Ratio</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {formatPercentage(performanceData.aggregate_metrics.avg_hit_rate)}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Hit Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {formatPercentage(performanceData.aggregate_metrics.avg_total_pnl)}
                    </div>
                    <div className="text-sm text-muted-foreground">Average P&L</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {performanceData.aggregate_metrics.total_trades}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Trades</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {performanceData.aggregate_metrics.winning_trades}
                    </div>
                    <div className="text-sm text-muted-foreground">Winning Trades</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {formatPercentage(performanceData.aggregate_metrics.max_drawdown)}
                    </div>
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}