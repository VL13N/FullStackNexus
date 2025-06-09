import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface SystemConfig {
  predictionInterval: number;
  healthCheckInterval: number;
  dashboardRefreshInterval: number;
  maxRetryAttempts: number;
}

interface ErrorSummary {
  totalErrors: number;
  errorsByContext: Record<string, any[]>;
  lastError: any;
}

export default function Settings() {
  const [config, setConfig] = useState<SystemConfig>({
    predictionInterval: 15,
    healthCheckInterval: 15,
    dashboardRefreshInterval: 30,
    maxRetryAttempts: 3
  });
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [backtestData, setBacktestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchCurrentConfig();
    fetchErrorSummary();
    fetchBacktestData();
  }, []);

  const fetchCurrentConfig = async () => {
    try {
      const response = await fetch('/api/config/scheduler');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const fetchErrorSummary = async () => {
    try {
      const response = await fetch('/api/system/errors');
      if (response.ok) {
        const data = await response.json();
        setErrorSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch error summary:', error);
    }
  };

  const fetchBacktestData = async () => {
    try {
      const response = await fetch('/api/analytics/backtest?days=7');
      if (response.ok) {
        const data = await response.json();
        setBacktestData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch backtest data:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setSaveMessage('Configuration saved successfully');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save configuration');
      }
    } catch (error) {
      setSaveMessage('Error saving configuration');
      console.error('Failed to save config:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      <Tabs defaultValue="intervals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="intervals">Refresh Intervals</TabsTrigger>
          <TabsTrigger value="monitoring">System Health</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="intervals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Refresh Intervals Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prediction-interval">
                    Prediction Generation (minutes)
                  </Label>
                  <Input
                    id="prediction-interval"
                    type="number"
                    min="1"
                    max="60"
                    value={config.predictionInterval}
                    onChange={(e) => setConfig({
                      ...config,
                      predictionInterval: parseInt(e.target.value) || 15
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often new predictions are generated
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dashboard-refresh">
                    Dashboard Refresh (seconds)
                  </Label>
                  <Input
                    id="dashboard-refresh"
                    type="number"
                    min="10"
                    max="300"
                    value={config.dashboardRefreshInterval}
                    onChange={(e) => setConfig({
                      ...config,
                      dashboardRefreshInterval: parseInt(e.target.value) || 30
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How often the dashboard updates automatically
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="health-check">
                    Health Check Interval (minutes)
                  </Label>
                  <Input
                    id="health-check"
                    type="number"
                    min="5"
                    max="60"
                    value={config.healthCheckInterval}
                    onChange={(e) => setConfig({
                      ...config,
                      healthCheckInterval: parseInt(e.target.value) || 15
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    System health monitoring frequency
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">
                    Max Retry Attempts
                  </Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    min="1"
                    max="10"
                    value={config.maxRetryAttempts}
                    onChange={(e) => setConfig({
                      ...config,
                      maxRetryAttempts: parseInt(e.target.value) || 3
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of retries for failed API calls
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveConfig} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
                {saveMessage && (
                  <Alert className="flex-1">
                    <AlertDescription>{saveMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                System Health Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errorSummary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {errorSummary.totalErrors}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Errors (24h)
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Object.keys(errorSummary.errorsByContext).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Affected Services
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {errorSummary.totalErrors === 0 ? '100%' : '85%'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Uptime
                      </div>
                    </div>
                  </div>

                  {errorSummary.lastError && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Last Error:</strong> {errorSummary.lastError.message}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(errorSummary.lastError.timestamp).toLocaleString()}
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Loading health data...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Analytics (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {backtestData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {backtestData.totalPredictions}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Predictions
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {Math.round(backtestData.confidenceStats?.average * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Confidence
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {backtestData.categoryDistribution?.BULLISH || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Bullish Signals
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {backtestData.categoryDistribution?.BEARISH || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Bearish Signals
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Pillar Contributions (Average Scores)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                        <div className="font-bold">{Math.round(backtestData.pillarContributions?.technical || 0)}</div>
                        <div className="text-xs">Technical</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                        <div className="font-bold">{Math.round(backtestData.pillarContributions?.social || 0)}</div>
                        <div className="text-xs">Social</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                        <div className="font-bold">{Math.round(backtestData.pillarContributions?.fundamental || 0)}</div>
                        <div className="text-xs">Fundamental</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded">
                        <div className="font-bold">{Math.round(backtestData.pillarContributions?.astrology || 0)}</div>
                        <div className="text-xs">Astrology</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Loading analytics data...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}