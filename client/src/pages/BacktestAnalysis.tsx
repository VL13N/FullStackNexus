import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

interface BacktestResult {
  backtest_id: string;
  date_range: {
    from: string;
    to: string;
  };
  metrics: {
    total_trades: number;
    hit_rate: number;
    total_pnl: number;
    sharpe_ratio: number;
    max_drawdown: number;
    avg_return: number;
    volatility: number;
  };
  equity_curve?: Array<{
    timestamp: string;
    cumulative_pnl: number;
    daily_return: number;
  }>;
}

interface FeatureImportance {
  feature: string;
  shapValue: number;
}

interface FeatureImportanceResponse {
  success: boolean;
  feature_importance: FeatureImportance[];
  model_info: {
    input_shape: number[];
    total_features: number;
    feature_vector_timestamp: string;
  };
  method: string;
  error?: string;
}

export default function BacktestAnalysis() {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  // Feature importance query
  const { data: featureData, isLoading: featuresLoading, error: featuresError } = useQuery<FeatureImportanceResponse>({
    queryKey: ['/api/ml/feature-importance'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Backtest mutation
  const backtestMutation = useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      const response = await fetch(`/api/backtest/run?from=${from}&to=${to}&auto_retrain=false`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: BacktestResult) => {
      setBacktestResult(data);
    },
  });

  const runBacktest = () => {
    if (!fromDate || !toDate) {
      return;
    }
    backtestMutation.mutate({ from: fromDate, to: toDate });
  };

  // Prepare feature importance chart data
  const featureChartData = featureData?.feature_importance ? {
    labels: featureData.feature_importance.slice(0, 10).map((f: FeatureImportance) => f.feature),
    datasets: [
      {
        label: 'SHAP Value',
        data: featureData.feature_importance.slice(0, 10).map((f: FeatureImportance) => Math.abs(f.shapValue)),
        backgroundColor: featureData.feature_importance.slice(0, 10).map((f: FeatureImportance) => 
          f.shapValue > 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
        ),
        borderColor: featureData.feature_importance.slice(0, 10).map((f: FeatureImportance) => 
          f.shapValue > 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 10 Most Influential Features (SHAP Values)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Absolute SHAP Value',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Features',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  // Prepare equity curve data for Recharts
  const equityCurveData = backtestResult?.equity_curve?.map((point, index) => ({
    day: index + 1,
    pnl: (point.cumulative_pnl * 100).toFixed(2),
    timestamp: new Date(point.timestamp).toLocaleDateString(),
  })) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Backtest & Feature Analysis</h1>
        <p className="text-muted-foreground">
          Analyze strategy performance and discover which features drive ML predictions
        </p>
      </div>

      {/* Backtest Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Strategy Backtesting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={runBacktest}
              disabled={backtestMutation.isPending || !fromDate || !toDate}
              className="w-full"
            >
              {backtestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Backtest...
                </>
              ) : (
                "Run Backtest"
              )}
            </Button>
          </div>

          {backtestMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                Backtest failed: {(backtestMutation.error as Error).message}
              </AlertDescription>
            </Alert>
          )}

          {backtestResult && (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {(backtestResult.metrics.hit_rate * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Hit Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {(backtestResult.metrics.total_pnl * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Total P&L</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {backtestResult.metrics.sharpe_ratio.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {(backtestResult.metrics.max_drawdown * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  </CardContent>
                </Card>
              </div>

              {/* Equity Curve */}
              {equityCurveData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Equity Curve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={equityCurveData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => `Day ${value}`}
                            formatter={(value) => [`${value}%`, 'Cumulative P&L']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="pnl" 
                            stroke="#2563eb" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Importance Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            SHAP Feature Importance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {featuresLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading feature importance analysis...
            </div>
          )}

          {featuresError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load feature importance: {(featuresError as Error).message}
              </AlertDescription>
            </Alert>
          )}

          {featureData?.success === false && (
            <Alert>
              <AlertDescription>
                {featureData.error || "Feature importance analysis unavailable"}
              </AlertDescription>
            </Alert>
          )}

          {featureChartData && (
            <div className="space-y-4">
              <div className="h-96">
                <Bar data={featureChartData} options={chartOptions} />
              </div>
              
              {featureData?.model_info && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Features:</span> {featureData.model_info.total_features}
                  </div>
                  <div>
                    <span className="font-medium">Method:</span> {featureData.method}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {new Date(featureData.model_info.feature_vector_timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}