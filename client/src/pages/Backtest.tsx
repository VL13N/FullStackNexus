import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { CalendarDays, TrendingUp, Target, BarChart3, Play, Download } from 'lucide-react';

interface BacktestMetrics {
  mse: number;
  rmse: number;
  mae: number;
  mape: number;
  directionalAccuracy: number;
  rSquared: number;
  confidenceWeightedError: number;
}

interface BacktestWindow {
  windowId: number;
  trainPeriod: {
    start: string;
    end: string;
    samples: number;
  };
  testPeriod: {
    start: string;
    end: string;
    samples: number;
  };
  metrics: BacktestMetrics;
  pillarCorrelations: Record<string, number>;
  dataPoints: Array<{
    timestamp: string;
    predicted: number;
    actual: number;
    confidence: number;
    category: string;
  }>;
}

interface BacktestResult {
  success: boolean;
  summary: {
    dateRange: { start: string; end: string };
    parameters: { trainDays: number; testDays: number };
    windowCount: number;
    totalDataPoints: number;
    aggregateMetrics: any;
  };
  windows: BacktestWindow[];
  timestamp: string;
}

export default function Backtest() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 60);
    return date.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  
  const [trainDays, setTrainDays] = useState(30);
  const [testDays, setTestDays] = useState(7);
  const [selectedWindow, setSelectedWindow] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Run backtest mutation
  const runBacktestMutation = useMutation({
    mutationFn: async (params: { startDate: string; endDate: string; trainDays: number; testDays: number }) => {
      const response = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Backtest failed');
      }
      
      return response.json() as Promise<BacktestResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backtest/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/backtest/data'] });
    }
  });

  // Get backtest summary
  const { data: summary } = useQuery({
    queryKey: ['/api/backtest/summary'],
    enabled: runBacktestMutation.isSuccess
  });

  // Get backtest data for visualization
  const { data: backtestData } = useQuery({
    queryKey: ['/api/backtest/data'],
    enabled: runBacktestMutation.isSuccess
  });

  const handleRunBacktest = () => {
    runBacktestMutation.mutate({
      startDate: startDate + 'T00:00:00Z',
      endDate: endDate + 'T23:59:59Z',
      trainDays,
      testDays
    });
  };

  const formatMetric = (value: number, decimals = 2) => {
    if (isNaN(value)) return 'N/A';
    return value.toFixed(decimals);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Prepare chart data
  const chartData = backtestData?.success ? backtestData.dataPoints.map((point: any) => ({
    timestamp: new Date(point.timestamp).toLocaleDateString(),
    predicted: point.predicted,
    actual: point.actual,
    confidence: point.confidence * 100,
    error: Math.abs(point.predicted - point.actual),
    errorPercent: Math.abs((point.predicted - point.actual) / point.actual) * 100
  })) : [];

  // Calculate aggregate performance
  const results = runBacktestMutation.data;
  const aggregateMetrics = results?.summary?.aggregateMetrics;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Walk-Forward Backtesting</h1>
          <p className="text-muted-foreground">
            Validate prediction accuracy using rolling train/test windows
          </p>
        </div>
        <Button
          onClick={handleRunBacktest}
          disabled={runBacktestMutation.isPending}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {runBacktestMutation.isPending ? 'Running...' : 'Run Backtest'}
        </Button>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Backtest Configuration
          </CardTitle>
          <CardDescription>
            Configure the date range and window parameters for walk-forward analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainDays">Train Days</Label>
              <Input
                id="trainDays"
                type="number"
                min="7"
                max="90"
                value={trainDays}
                onChange={(e) => setTrainDays(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testDays">Test Days</Label>
              <Input
                id="testDays"
                type="number"
                min="1"
                max="30"
                value={testDays}
                onChange={(e) => setTestDays(parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {runBacktestMutation.isPending && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Running walk-forward backtest...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {runBacktestMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {runBacktestMutation.error?.message || 'Backtest failed'}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {results && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="chart">Predicted vs Actual</TabsTrigger>
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="windows">Window Analysis</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{results.summary.windowCount}</div>
                  <p className="text-xs text-muted-foreground">Walk-Forward Windows</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{results.summary.totalDataPoints}</div>
                  <p className="text-xs text-muted-foreground">Total Data Points</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {aggregateMetrics?.overallDirectionalAccuracy ? 
                      formatMetric(aggregateMetrics.overallDirectionalAccuracy, 1) + '%' : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">Directional Accuracy</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {aggregateMetrics?.metrics?.rmse?.mean ? 
                      '$' + formatMetric(aggregateMetrics.metrics.rmse.mean) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">Avg RMSE</p>
                </CardContent>
              </Card>
            </div>

            {aggregateMetrics?.pillarAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Pillar Performance Analysis</CardTitle>
                  <CardDescription>
                    Correlation between pillar scores and prediction errors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(aggregateMetrics.pillarAnalysis).map(([pillar, analysis]: [string, any]) => (
                      <div key={pillar} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {pillar.replace('_score', '')}
                          </span>
                          <Badge variant={Math.abs(analysis.meanCorrelation) > 0.3 ? 'default' : 'secondary'}>
                            {formatMetric(analysis.meanCorrelation, 3)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {analysis.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Chart Tab */}
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predicted vs Actual Prices
                </CardTitle>
                <CardDescription>
                  Time series comparison of model predictions against actual prices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        typeof value === 'number' ? `$${value.toFixed(2)}` : value,
                        name
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Actual Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Predicted Price"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Error Analysis</CardTitle>
                <CardDescription>
                  Distribution of prediction errors over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="confidence" name="Confidence" />
                    <YAxis dataKey="errorPercent" name="Error %" />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        typeof value === 'number' ? value.toFixed(2) + (name === 'Error %' ? '%' : '') : value,
                        name
                      ]}
                    />
                    <Scatter 
                      name="Prediction Error vs Confidence" 
                      data={chartData} 
                      fill="#8884d8"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            {aggregateMetrics?.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(aggregateMetrics.metrics).map(([metric, stats]: [string, any]) => (
                  <Card key={metric}>
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </CardTitle>
                      <CardDescription>
                        Statistical distribution across all windows
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Mean</div>
                          <div className="text-lg font-semibold">
                            {formatMetric(stats.mean)}
                            {metric.includes('Accuracy') && '%'}
                            {metric.includes('Error') && metric !== 'rSquared' && '$'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Median</div>
                          <div className="text-lg font-semibold">
                            {formatMetric(stats.median)}
                            {metric.includes('Accuracy') && '%'}
                            {metric.includes('Error') && metric !== 'rSquared' && '$'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Min</div>
                          <div className="text-lg font-semibold">
                            {formatMetric(stats.min)}
                            {metric.includes('Accuracy') && '%'}
                            {metric.includes('Error') && metric !== 'rSquared' && '$'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Max</div>
                          <div className="text-lg font-semibold">
                            {formatMetric(stats.max)}
                            {metric.includes('Accuracy') && '%'}
                            {metric.includes('Error') && metric !== 'rSquared' && '$'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Windows Tab */}
          <TabsContent value="windows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Individual Window Performance
                </CardTitle>
                <CardDescription>
                  Detailed metrics for each walk-forward window
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.windows.map((window) => (
                    <Card 
                      key={window.windowId}
                      className={`cursor-pointer transition-colors ${
                        selectedWindow === window.windowId ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedWindow(
                        selectedWindow === window.windowId ? null : window.windowId
                      )}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">Window {window.windowId}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(window.testPeriod.start)} - {formatDate(window.testPeriod.end)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatMetric(window.metrics.directionalAccuracy, 1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Accuracy</div>
                          </div>
                        </div>
                        
                        {selectedWindow === window.windowId && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                            <div>
                              <div className="text-sm text-muted-foreground">RMSE</div>
                              <div className="font-semibold">${formatMetric(window.metrics.rmse)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">MAPE</div>
                              <div className="font-semibold">{formatMetric(window.metrics.mape, 1)}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">R²</div>
                              <div className="font-semibold">{formatMetric(window.metrics.rSquared, 3)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Test Samples</div>
                              <div className="font-semibold">{window.testPeriod.samples}</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}