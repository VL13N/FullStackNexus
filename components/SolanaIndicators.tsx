import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface IndicatorData {
  success: boolean;
  indicator: string;
  symbol: string;
  exchange: string;
  interval: string;
  period?: number;
  data: any;
  timestamp: string;
  error?: string;
}

export default function SolanaIndicators() {
  const [indicators, setIndicators] = useState<Record<string, IndicatorData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [exchange, setExchange] = useState('binance');
  const [interval, setInterval] = useState('1h');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchIndicator = async (indicatorType: string, params: Record<string, any> = {}) => {
    setLoading(prev => ({ ...prev, [indicatorType]: true }));
    
    try {
      const queryParams = new URLSearchParams({
        exchange,
        interval,
        ...params
      });
      
      const response = await fetch(`/api/solana/${indicatorType}?${queryParams}`);
      const data = await response.json();
      
      setIndicators(prev => ({ ...prev, [indicatorType]: data }));
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(`Failed to fetch ${indicatorType}:`, error);
      setIndicators(prev => ({ 
        ...prev, 
        [indicatorType]: { 
          success: false, 
          error: 'Failed to fetch data',
          indicator: indicatorType,
          symbol: 'SOL/USDT',
          exchange,
          interval,
          timestamp: new Date().toISOString()
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [indicatorType]: false }));
    }
  };

  const fetchAllIndicators = async () => {
    await Promise.all([
      fetchIndicator('rsi', { period: 14 }),
      fetchIndicator('macd', { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }),
      fetchIndicator('ema', { period: 20 }),
    ]);
  };

  const getIndicatorStatus = (data: any) => {
    if (!data || data.error) return { status: 'error', color: 'destructive' };
    
    // RSI interpretation
    if (data.indicator === 'RSI') {
      const value = data.data?.value || data.data;
      if (typeof value === 'number') {
        if (value > 70) return { status: 'Overbought', color: 'destructive' };
        if (value < 30) return { status: 'Oversold', color: 'default' };
        return { status: 'Neutral', color: 'secondary' };
      }
    }
    
    return { status: 'Active', color: 'default' };
  };

  const formatIndicatorValue = (data: any) => {
    if (!data || data.error) return 'Error';
    
    const value = data.data?.value || data.data;
    
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  useEffect(() => {
    fetchAllIndicators();
  }, [exchange, interval]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Solana Technical Indicators</h1>
          <p className="text-muted-foreground">Real-time technical analysis via TAAPI Pro</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={exchange} onValueChange={setExchange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binance">Binance</SelectItem>
              <SelectItem value="coinbase">Coinbase</SelectItem>
              <SelectItem value="kraken">Kraken</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="1d">1d</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchAllIndicators} disabled={Object.values(loading).some(Boolean)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {lastUpdate && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Last updated: {lastUpdate} | Symbol: SOL/USDT | Exchange: {exchange.toUpperCase()} | Interval: {interval}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rsi">RSI</TabsTrigger>
          <TabsTrigger value="macd">MACD</TabsTrigger>
          <TabsTrigger value="ema">EMA</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(indicators).map(([key, data]) => {
              const status = getIndicatorStatus(data);
              return (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {data.indicator || key.toUpperCase()}
                    </CardTitle>
                    <Badge variant={status.color as any}>
                      {status.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading[key] ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : (
                        formatIndicatorValue(data)
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'No data'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rsi">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                RSI (Relative Strength Index)
              </CardTitle>
              <CardDescription>
                Momentum oscillator measuring speed and change of price movements (0-100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {indicators.rsi ? (
                <div className="space-y-4">
                  <div className="text-3xl font-bold">
                    {loading.rsi ? 'Loading...' : formatIndicatorValue(indicators.rsi)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Oversold (&lt; 30)</span>
                      <span>Neutral (30-70)</span>
                      <span>Overbought (&gt; 70)</span>
                    </div>
                    <div className="w-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded" />
                  </div>
                  
                  {indicators.rsi.data?.error && (
                    <Alert>
                      <AlertDescription>{indicators.rsi.data.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Period: 14 | Exchange: {indicators.rsi.exchange} | Interval: {indicators.rsi.interval}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => fetchIndicator('rsi', { period: 14 })}>
                    Load RSI Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="macd">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                MACD (Moving Average Convergence Divergence)
              </CardTitle>
              <CardDescription>
                Trend-following momentum indicator showing relationship between two moving averages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {indicators.macd ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">MACD Line</div>
                      <div className="text-xl font-bold">
                        {loading.macd ? 'Loading...' : formatIndicatorValue(indicators.macd)}
                      </div>
                    </div>
                  </div>
                  
                  {indicators.macd.data?.error && (
                    <Alert>
                      <AlertDescription>{indicators.macd.data.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Fast: 12 | Slow: 26 | Signal: 9 | Exchange: {indicators.macd.exchange} | Interval: {indicators.macd.interval}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => fetchIndicator('macd', { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 })}>
                    Load MACD Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ema">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                EMA (Exponential Moving Average)
              </CardTitle>
              <CardDescription>
                Type of moving average that gives more weight to recent prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {indicators.ema ? (
                <div className="space-y-4">
                  <div className="text-3xl font-bold">
                    {loading.ema ? 'Loading...' : formatIndicatorValue(indicators.ema)}
                  </div>
                  
                  {indicators.ema.data?.error && (
                    <Alert>
                      <AlertDescription>{indicators.ema.data.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Period: 20 | Exchange: {indicators.ema.exchange} | Interval: {indicators.ema.interval}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={() => fetchIndicator('ema', { period: 20 })}>
                    Load EMA Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>API Integration Status</CardTitle>
          <CardDescription>
            TAAPI Pro integration for Solana technical analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Endpoint Structure:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                https://api.taapi.io/&#123;indicator&#125;?secret=&#123;API_KEY&#125;&exchange=binance&symbol=SOL/USDT&interval=1h
              </code>
            </div>
            <div className="flex justify-between">
              <span>Available Indicators:</span>
              <span>RSI, MACD, EMA, SMA, Bollinger Bands, Stochastic RSI, Williams %R</span>
            </div>
            <div className="flex justify-between">
              <span>Rate Limits:</span>
              <span>Varies by TAAPI Pro subscription tier</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}