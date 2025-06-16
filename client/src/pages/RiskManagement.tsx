import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PositionSizingWidget } from '../../../components/ui/position-sizing-widget';
import { 
  Target, 
  TrendingUp, 
  Settings, 
  BarChart3, 
  Calculator,
  Shield,
  AlertCircle,
  DollarSign,
  Percent
} from 'lucide-react';

export default function RiskManagement() {
  const [prediction, setPrediction] = useState(0.5);
  const [confidence, setConfidence] = useState(0.7);
  const [currentPrice, setCurrentPrice] = useState(150);
  const [accountBalance, setAccountBalance] = useState(10000);
  const queryClient = useQueryClient();

  // Fetch risk settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['risk-settings'],
    queryFn: async () => {
      const response = await fetch('/api/risk/settings');
      if (!response.ok) throw new Error('Failed to fetch risk settings');
      return response.json();
    }
  });

  // Fetch portfolio stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['risk-stats'],
    queryFn: async () => {
      const response = await fetch('/api/risk/stats');
      if (!response.ok) throw new Error('Failed to fetch portfolio stats');
      return response.json();
    }
  });

  // Fetch simulation data
  const { data: simulationData, isLoading: simulationLoading } = useQuery({
    queryKey: ['risk-simulation'],
    queryFn: async () => {
      const response = await fetch('/api/risk/simulate');
      if (!response.ok) throw new Error('Failed to fetch simulation data');
      return response.json();
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await fetch('/api/risk/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-settings'] });
    }
  });

  const settings = settingsData?.data;
  const stats = statsData?.data;
  const simulation = simulationData?.data;

  const updateSetting = (key: string, value: number) => {
    if (settings) {
      updateSettingsMutation.mutate({ [key]: value });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Risk Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Position sizing with Kelly Criterion and fixed-fraction methods
          </p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator">Position Calculator</TabsTrigger>
          <TabsTrigger value="settings">Risk Settings</TabsTrigger>
          <TabsTrigger value="stats">Portfolio Stats</TabsTrigger>
          <TabsTrigger value="simulation">Scenario Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Prediction Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Prediction Signal: {prediction.toFixed(2)}</Label>
                  <Slider
                    value={[prediction]}
                    onValueChange={(value) => setPrediction(value[0])}
                    min={-1}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Strong Sell (-1.0)</span>
                    <span>Neutral (0.0)</span>
                    <span>Strong Buy (1.0)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confidence: {(confidence * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[confidence]}
                    onValueChange={(value) => setConfidence(value[0])}
                    min={0.1}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Current Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(Number(e.target.value))}
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Account Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Position Sizing Widget */}
            <PositionSizingWidget
              prediction={prediction}
              confidence={confidence}
              currentPrice={currentPrice}
              className="h-fit"
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Risk Management Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : settings ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Max Risk Per Trade: {(settings.maxRiskPerTrade * 100).toFixed(1)}%</Label>
                      <Slider
                        value={[settings.maxRiskPerTrade]}
                        onValueChange={(value) => updateSetting('maxRiskPerTrade', value[0])}
                        min={0.005}
                        max={0.1}
                        step={0.005}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kelly Fraction: {(settings.kellyFraction * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[settings.kellyFraction]}
                        onValueChange={(value) => updateSetting('kellyFraction', value[0])}
                        min={0.1}
                        max={1}
                        step={0.05}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fixed Fraction: {(settings.fixedFraction * 100).toFixed(1)}%</Label>
                      <Slider
                        value={[settings.fixedFraction]}
                        onValueChange={(value) => updateSetting('fixedFraction', value[0])}
                        min={0.001}
                        max={0.05}
                        step={0.001}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Max Position Size: {(settings.maxPositionSize * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[settings.maxPositionSize]}
                        onValueChange={(value) => updateSetting('maxPositionSize', value[0])}
                        min={0.01}
                        max={0.5}
                        step={0.01}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Confidence: {(settings.minConfidence * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[settings.minConfidence]}
                        onValueChange={(value) => updateSetting('minConfidence', value[0])}
                        min={0.1}
                        max={0.8}
                        step={0.05}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Emergency Stop Loss: {(settings.emergencyStopLoss * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[settings.emergencyStopLoss]}
                        onValueChange={(value) => updateSetting('emergencyStopLoss', value[0])}
                        min={0.01}
                        max={0.2}
                        step={0.005}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">Failed to load settings</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : stats ? (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
                        <p className="text-2xl font-bold">{stats.totalTrades}</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                        <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
                      </div>
                      <Target className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Return</p>
                        <p className="text-2xl font-bold">{stats.totalReturn.toFixed(1)}%</p>
                      </div>
                      <TrendingUp className={`w-8 h-8 ${stats.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</p>
                        <p className="text-2xl font-bold">{stats.sharpeRatio.toFixed(2)}</p>
                      </div>
                      <Percent className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="col-span-full text-center text-gray-500">Failed to load statistics</p>
            )}
          </div>

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Winning Trades</div>
                    <div className="text-green-600 dark:text-green-400">{stats.winningTrades}</div>
                  </div>
                  <div>
                    <div className="font-medium">Losing Trades</div>
                    <div className="text-red-600 dark:text-red-400">{stats.losingTrades}</div>
                  </div>
                  <div>
                    <div className="font-medium">Avg Return/Trade</div>
                    <div className={stats.avgReturnPerTrade >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {stats.avgReturnPerTrade.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Risk Level</div>
                    <Badge variant={stats.currentSettings.maxRiskPerTrade > 0.03 ? 'destructive' : 'default'}>
                      {stats.currentSettings.maxRiskPerTrade > 0.03 ? 'High' : 'Conservative'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Scenario Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {simulationLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : simulation ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Total Scenarios</div>
                      <div>{simulation.summary.totalScenarios}</div>
                    </div>
                    <div>
                      <div className="font-medium">Avg Position Size</div>
                      <div>{simulation.summary.avgPositionSize.toFixed(2)} SOL</div>
                    </div>
                    <div>
                      <div className="font-medium">Buy Signals</div>
                      <div className="text-green-600 dark:text-green-400">{simulation.summary.buySignals}</div>
                    </div>
                    <div>
                      <div className="font-medium">Sell Signals</div>
                      <div className="text-red-600 dark:text-red-400">{simulation.summary.sellSignals}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Confidence</th>
                          <th className="text-left p-2">Prediction</th>
                          <th className="text-left p-2">Volatility</th>
                          <th className="text-left p-2">Position Size</th>
                          <th className="text-left p-2">Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulation.scenarios.slice(0, 10).map((scenario: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{(scenario.confidence * 100).toFixed(0)}%</td>
                            <td className="p-2">{scenario.prediction.toFixed(2)}</td>
                            <td className="p-2">{(scenario.volatility * 100).toFixed(0)}%</td>
                            <td className="p-2">{scenario.positionSize.toFixed(2)} SOL</td>
                            <td className="p-2">
                              <Badge 
                                variant={
                                  scenario.recommendation === 'BUY' ? 'default' : 
                                  scenario.recommendation === 'SELL' ? 'destructive' : 'secondary'
                                }
                              >
                                {scenario.recommendation}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">Failed to load simulation data</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}