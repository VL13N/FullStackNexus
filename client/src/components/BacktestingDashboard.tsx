import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Target, Activity, Clock, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BacktestResult {
  period: { start: string; end: string };
  symbol: string;
  totalPredictions: number;
  metrics: {
    winRate: number;
    accuracy: number;
    averageReturn: number;
    totalReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    totalTrades: number;
    correctPredictions: number;
    volatility: number;
    bestTrade: number;
    worstTrade: number;
  };
  predictions: Array<{
    timestamp: string;
    predicted_category: string;
    predicted_percentage: number;
    confidence: number;
    actual_price_change: number;
    actual_price: number;
    tech_score: number;
    social_score: number;
    fund_score: number;
    astro_score: number;
  }>;
  summary: {
    performance: string;
    profitability: string;
    riskLevel: string;
    consistency: string;
    bestPillar: string;
    pillarScores: {
      technical: number;
      social: number;
      fundamental: number;
      astrology: number;
    };
  };
}

export function BacktestingDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const queryClient = useQueryClient();

  // Initialize with last 24 hours
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    setEndDate(now.toISOString().split('T')[0]);
    setStartDate(yesterday.toISOString().split('T')[0]);
  }, []);

  // Fetch available periods
  const { data: periods } = useQuery({
    queryKey: ['/api/backtest/periods'],
    staleTime: 5 * 60 * 1000
  });

  // Quick backtest mutations
  const quickBacktest = useMutation({
    mutationFn: async (period: string) => {
      const response = await fetch(`/api/backtest/${period}`);
      if (!response.ok) throw new Error('Backtest failed');
      return response.json();
    },
    onSuccess: (data) => {
      setBacktestResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['/api/backtest'] });
    }
  });

  // Custom date range backtest
  const customBacktest = useMutation({
    mutationFn: async (params: { startDate: string; endDate: string }) => {
      const response = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Custom backtest failed');
      return response.json();
    },
    onSuccess: (data) => {
      setBacktestResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['/api/backtest'] });
    }
  });

  const handleQuickBacktest = (period: string) => {
    setSelectedPeriod(period);
    quickBacktest.mutate(period);
  };

  const handleCustomBacktest = () => {
    if (!startDate || !endDate) return;
    customBacktest.mutate({ startDate, endDate });
  };

  // Format chart data for predictions vs actual
  const chartData = backtestResult?.predictions.map(pred => ({
    time: new Date(pred.timestamp).toLocaleDateString(),
    predicted: pred.predicted_percentage || 0,
    actual: pred.actual_price_change,
    confidence: pred.confidence * 100,
    correct: (pred.predicted_category === 'BULLISH' && pred.actual_price_change > 0) ||
             (pred.predicted_category === 'BEARISH' && pred.actual_price_change < 0) ||
             (pred.predicted_category === 'NEUTRAL' && Math.abs(pred.actual_price_change) < 1)
  })) || [];

  // Pillar performance data
  const pillarData = backtestResult?.summary.pillarScores ? [
    { name: 'Technical', score: backtestResult.summary.pillarScores.technical },
    { name: 'Social', score: backtestResult.summary.pillarScores.social },
    { name: 'Fundamental', score: backtestResult.summary.pillarScores.fundamental },
    { name: 'Astrology', score: backtestResult.summary.pillarScores.astrology }
  ] : [];

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number) => value.toFixed(2);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Strategy Backtesting</h1>
          <p className="text-muted-foreground">
            Replay ML predictions against historical price movements
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {(periods as any)?.data?.dataPoints || 0} Data Points Available
        </Badge>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Backtests
          </CardTitle>
          <CardDescription>
            Run pre-configured backtests for common time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => handleQuickBacktest('quick')}
              disabled={quickBacktest.isPending}
              variant={selectedPeriod === '24h' ? 'default' : 'outline'}
            >
              {quickBacktest.isPending && selectedPeriod === '24h' ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Running...
                </div>
              ) : (
                'Last 24 Hours'
              )}
            </Button>
            <Button
              onClick={() => handleQuickBacktest('weekly')}
              disabled={quickBacktest.isPending}
              variant={selectedPeriod === '7d' ? 'default' : 'outline'}
            >
              {quickBacktest.isPending && selectedPeriod === '7d' ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Running...
                </div>
              ) : (
                'Last 7 Days'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Date Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Custom Date Range
          </CardTitle>
          <CardDescription>
            Select specific start and end dates for detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCustomBacktest}
                disabled={customBacktest.isPending || !startDate || !endDate}
                className="w-full"
              >
                {customBacktest.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Running Backtest...
                  </div>
                ) : (
                  'Run Custom Backtest'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {backtestResult && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="pillars">Pillar Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(backtestResult.metrics.winRate)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {backtestResult.metrics.correctPredictions} of {backtestResult.metrics.totalTrades} correct
                  </p>
                  <Progress 
                    value={backtestResult.metrics.winRate * 100} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                  {backtestResult.metrics.totalReturn >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    backtestResult.metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(backtestResult.metrics.totalReturn)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {formatPercentage(backtestResult.metrics.averageReturn)} per trade
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    -{formatPercentage(backtestResult.metrics.maxDrawdown)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Risk Level: {backtestResult.summary.riskLevel}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(backtestResult.metrics.sharpeRatio)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Consistency: {backtestResult.summary.consistency}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>
                  {backtestResult.period.start} to {backtestResult.period.end}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Badge variant={backtestResult.summary.performance === 'Good' ? 'default' : 
                                  backtestResult.summary.performance === 'Fair' ? 'secondary' : 'destructive'}>
                      {backtestResult.summary.performance} Performance
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={backtestResult.summary.profitability === 'Profitable' ? 'default' : 'destructive'}>
                      {backtestResult.summary.profitability}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={backtestResult.summary.riskLevel === 'Low' ? 'default' : 
                                  backtestResult.summary.riskLevel === 'Medium' ? 'secondary' : 'destructive'}>
                      {backtestResult.summary.riskLevel} Risk
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline">
                      Best Pillar: {backtestResult.summary.bestPillar}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Prediction vs Actual Performance</CardTitle>
                <CardDescription>
                  Overlay of predicted movements against actual price changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${Number(value).toFixed(2)}%`, 
                        name === 'predicted' ? 'Predicted' : name === 'actual' ? 'Actual' : 'Confidence'
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Predicted Change"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Actual Change"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions">
            <Card>
              <CardHeader>
                <CardTitle>Individual Predictions</CardTitle>
                <CardDescription>
                  Detailed view of each prediction and its outcome
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {backtestResult.predictions.slice(0, 20).map((pred, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(pred.timestamp).toLocaleString()}
                        </div>
                        <Badge variant={pred.predicted_category === 'BULLISH' ? 'default' : 
                                      pred.predicted_category === 'BEARISH' ? 'destructive' : 'secondary'}>
                          {pred.predicted_category}
                        </Badge>
                        <div className="text-sm">
                          Confidence: {formatPercentage(pred.confidence)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          Predicted: {formatPercentage(pred.predicted_percentage || 0)}
                        </div>
                        <div className={`text-sm font-medium ${
                          pred.actual_price_change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Actual: {formatPercentage(pred.actual_price_change)}
                        </div>
                        <Badge variant={
                          ((pred.predicted_category === 'BULLISH' && pred.actual_price_change > 0) ||
                           (pred.predicted_category === 'BEARISH' && pred.actual_price_change < 0) ||
                           (pred.predicted_category === 'NEUTRAL' && Math.abs(pred.actual_price_change) < 1))
                          ? 'default' : 'destructive'
                        }>
                          {((pred.predicted_category === 'BULLISH' && pred.actual_price_change > 0) ||
                            (pred.predicted_category === 'BEARISH' && pred.actual_price_change < 0) ||
                            (pred.predicted_category === 'NEUTRAL' && Math.abs(pred.actual_price_change) < 1))
                           ? '✓' : '✗'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pillars">
            <Card>
              <CardHeader>
                <CardTitle>Pillar Performance Analysis</CardTitle>
                <CardDescription>
                  Average scores by analysis pillar during the backtest period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pillarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}`, 'Average Score']} />
                    <Bar dataKey="score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Best performing pillar: <span className="font-medium">{backtestResult.summary.bestPillar}</span></p>
                  <p>Higher scores indicate stronger signals during the backtest period</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}