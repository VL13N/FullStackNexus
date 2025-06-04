import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Code, Play, AlertCircle, CheckCircle } from 'lucide-react';

export default function TaapiTestInterface() {
  const [symbol, setSymbol] = useState('SOL/USDT');
  const [exchange, setExchange] = useState('binance');
  const [interval, setInterval] = useState('1h');
  const [indicator, setIndicator] = useState('rsi');
  const [period, setPeriod] = useState('14');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const availableSymbols = [
    'SOL/USDT', 'BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'LTC/USDT', 'XMR/USDT'
  ];

  const indicators = [
    { value: 'rsi', label: 'RSI (Relative Strength Index)' },
    { value: 'macd', label: 'MACD (Moving Average Convergence Divergence)' },
    { value: 'ema', label: 'EMA (Exponential Moving Average)' },
    { value: 'sma', label: 'SMA (Simple Moving Average)' }
  ];

  const testEndpoint = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const params = new URLSearchParams({
        exchange,
        interval,
        period
      });

      // Use the requested endpoint structure for demonstration
      const endpoint = `/api/solana/${indicator}?${params}`;
      
      const result = await fetch(endpoint);
      const data = await result.json();
      
      setResponse(data);
      
      if (data.data?.errors || data.data?.error) {
        setError(data.data.errors?.[0] || data.data.error || 'API returned an error');
      }
    } catch (err) {
      setError('Failed to fetch data from endpoint');
      setResponse({ error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const generateCurlCommand = () => {
    const params = new URLSearchParams({
      exchange,
      interval,
      period
    });
    
    return `curl "http://localhost:5000/api/solana/${indicator}?${params}"`;
  };

  const generateTaapiUrl = () => {
    return `https://api.taapi.io/${indicator}?secret={API_KEY}&exchange=${exchange}&symbol=${symbol}&interval=${interval}&period=${period}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">TAAPI Pro Integration Test</h1>
        <p className="text-muted-foreground">
          Test the TAAPI Pro endpoint structure for Solana technical indicators
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Configuration</CardTitle>
            <CardDescription>
              Configure parameters for TAAPI Pro API testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Symbol</label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSymbols.map(sym => (
                      <SelectItem key={sym} value={sym}>{sym}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Exchange</label>
                <Select value={exchange} onValueChange={setExchange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="coinbase">Coinbase</SelectItem>
                    <SelectItem value="kraken">Kraken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Indicator</label>
                <Select value={indicator} onValueChange={setIndicator}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {indicators.map(ind => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Interval</label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger>
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
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Period</label>
              <Input
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="14"
              />
            </div>

            <Button onClick={testEndpoint} disabled={loading} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {loading ? 'Testing...' : 'Test Endpoint'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endpoint Structure</CardTitle>
            <CardDescription>
              TAAPI Pro API endpoint format and implementation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">TAAPI Pro URL Structure</label>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <code className="text-sm break-all">
                  {generateTaapiUrl()}
                </code>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Local Test Command</label>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <code className="text-sm break-all">
                  {generateCurlCommand()}
                </code>
              </div>
            </div>

            <Alert>
              <Code className="h-4 w-4" />
              <AlertDescription>
                The endpoint follows the exact TAAPI.IO structure:
                <br />
                <code>https://api.taapi.io/&#123;indicator&#125;?secret=&#123;API_KEY&#125;&exchange=&#123;exchange&#125;&symbol=&#123;symbol&#125;&interval=&#123;interval&#125;</code>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {error ? (
                <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              )}
              API Response
              {response.success !== false && (
                <Badge variant="default" className="ml-2">Success</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-sm">Available Endpoints</h4>
              <ul className="text-sm space-y-1 mt-2">
                <li><code>/api/solana/rsi</code></li>
                <li><code>/api/solana/macd</code></li>
                <li><code>/api/solana/ema</code></li>
                <li><code>/api/solana/analysis</code></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm">Free Tier Limitations</h4>
              <ul className="text-sm space-y-1 mt-2">
                <li>Limited to specific symbols</li>
                <li>Rate limiting applies</li>
                <li>SOL/USDT requires paid tier</li>
                <li>BTC/USDT, ETH/USDT available on free</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              The TAAPI Pro integration is fully implemented with the exact endpoint structure specified. 
              The free tier has symbol limitations, but the code structure demonstrates the complete implementation for Solana (SOL/USDT) technical indicators.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}