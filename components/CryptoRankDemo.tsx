import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Clock, AlertCircle } from 'lucide-react';

interface FundamentalData {
  id: string;
  symbol: string;
  name: string;
  currentPrice: {
    usd: number | null;
    btc: number | null;
    eth: number | null;
  };
  marketCap: {
    usd: number | null;
    rank: number | null;
  };
  volume24h: {
    usd: number | null;
  };
  priceChange: {
    percent1h: number | null;
    percent24h: number | null;
    percent7d: number | null;
    percent30d: number | null;
    percent1y: number | null;
  };
  supply: {
    circulating: number | null;
    total: number | null;
    max: number | null;
  };
  allTimeHigh: {
    price: number | null;
    date: string | null;
    percentFromAth: number | null;
  };
  allTimeLow: {
    price: number | null;
    date: string | null;
    percentFromAtl: number | null;
  };
}

interface HistoricalDataPoint {
  timestamp: number;
  date: string;
  price: number;
  volume: number | null;
  marketCap: number | null;
}

interface HistoricalData {
  symbol: string;
  currency: string;
  timeframe: string;
  prices: HistoricalDataPoint[];
  metadata: {
    totalPoints: number;
    startDate: string | null;
    endDate: string | null;
  };
}

interface MarketStats {
  symbol: string;
  name: string;
  marketMetrics: {
    rank: number | null;
    marketCap: number | null;
    volume24h: number | null;
    volumeMarketCapRatio: number | null;
    circulatingSupply: number | null;
    totalSupply: number | null;
    maxSupply: number | null;
    supplyPercentage: number | null;
  };
  priceMetrics: {
    currentPrice: number | null;
    athPrice: number | null;
    athDate: string | null;
    percentFromAth: number | null;
    atlPrice: number | null;
    atlDate: string | null;
    percentFromAtl: number | null;
  };
  performanceMetrics: {
    change1h: number | null;
    change24h: number | null;
    change7d: number | null;
    change30d: number | null;
    change1y: number | null;
  };
}

interface PriceData {
  symbol: string;
  name: string;
  prices: {
    usd: number | null;
    btc: number | null;
    eth: number | null;
  };
  changes: {
    percent1h: number | null;
    percent24h: number | null;
    percent7d: number | null;
  };
  volume: {
    usd24h: number | null;
  };
  marketCap: {
    usd: number | null;
    rank: number | null;
  };
  lastUpdated: string;
}

export default function CryptoRankDemo() {
  const [fundamentalData, setFundamentalData] = useState<FundamentalData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [currency, setCurrency] = useState('USD');

  const formatNumber = (num: number | null, decimals = 2): string => {
    if (num === null) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  const formatPercentage = (num: number | null): string => {
    if (num === null) return 'N/A';
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getPercentageColor = (num: number | null): string => {
    if (num === null) return 'text-gray-500';
    return num >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const fetchFundamentalData = async () => {
    setLoading('fundamental');
    setError(null);
    try {
      const response = await fetch('/api/cryptorank/data');
      const result = await response.json();
      
      if (result.success) {
        setFundamentalData(result.data);
      } else {
        setError(result.error || 'Failed to fetch fundamental data');
      }
    } catch (err) {
      setError('Network error fetching fundamental data');
    } finally {
      setLoading(null);
    }
  };

  const fetchHistoricalData = async () => {
    setLoading('historical');
    setError(null);
    try {
      const response = await fetch(`/api/cryptorank/historical?timeframe=${timeframe}&currency=${currency}`);
      const result = await response.json();
      
      if (result.success) {
        setHistoricalData(result.data);
      } else {
        setError(result.error || 'Failed to fetch historical data');
      }
    } catch (err) {
      setError('Network error fetching historical data');
    } finally {
      setLoading(null);
    }
  };

  const fetchMarketStats = async () => {
    setLoading('stats');
    setError(null);
    try {
      const response = await fetch('/api/cryptorank/stats');
      const result = await response.json();
      
      if (result.success) {
        setMarketStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch market statistics');
      }
    } catch (err) {
      setError('Network error fetching market statistics');
    } finally {
      setLoading(null);
    }
  };

  const fetchPriceData = async () => {
    setLoading('price');
    setError(null);
    try {
      const response = await fetch('/api/cryptorank/price');
      const result = await response.json();
      
      if (result.success) {
        setPriceData(result.data);
      } else {
        setError(result.error || 'Failed to fetch price data');
      }
    } catch (err) {
      setError('Network error fetching price data');
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    fetchFundamentalData();
    fetchMarketStats();
    fetchPriceData();
  }, []);

  useEffect(() => {
    if (timeframe && currency) {
      fetchHistoricalData();
    }
  }, [timeframe, currency]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">CryptoRank API - Solana Fundamental Data</h1>
        <p className="text-gray-600">
          Real-time market cap, volume, and historical price data for Solana (SOL)
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="fundamental" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fundamental">Fundamental Data</TabsTrigger>
          <TabsTrigger value="historical">Historical Prices</TabsTrigger>
          <TabsTrigger value="stats">Market Statistics</TabsTrigger>
          <TabsTrigger value="price">Real-Time Price</TabsTrigger>
        </TabsList>

        <TabsContent value="fundamental" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Fundamental Data</h2>
            <Button 
              onClick={fetchFundamentalData} 
              disabled={loading === 'fundamental'}
            >
              {loading === 'fundamental' ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>

          {fundamentalData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Price</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(fundamentalData.currentPrice.usd)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    BTC: {fundamentalData.currentPrice.btc?.toFixed(8) || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ETH: {fundamentalData.currentPrice.eth?.toFixed(6) || 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(fundamentalData.marketCap.usd, 1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rank #{fundamentalData.marketCap.rank || 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(fundamentalData.volume24h.usd, 1)}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Price Changes</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">1h:</span>
                      <span className={`text-sm font-medium ${getPercentageColor(fundamentalData.priceChange.percent1h)}`}>
                        {formatPercentage(fundamentalData.priceChange.percent1h)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">24h:</span>
                      <span className={`text-sm font-medium ${getPercentageColor(fundamentalData.priceChange.percent24h)}`}>
                        {formatPercentage(fundamentalData.priceChange.percent24h)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">7d:</span>
                      <span className={`text-sm font-medium ${getPercentageColor(fundamentalData.priceChange.percent7d)}`}>
                        {formatPercentage(fundamentalData.priceChange.percent7d)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">30d:</span>
                      <span className={`text-sm font-medium ${getPercentageColor(fundamentalData.priceChange.percent30d)}`}>
                        {formatPercentage(fundamentalData.priceChange.percent30d)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">1y:</span>
                      <span className={`text-sm font-medium ${getPercentageColor(fundamentalData.priceChange.percent1y)}`}>
                        {formatPercentage(fundamentalData.priceChange.percent1y)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Supply Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Circulating:</span>
                    <span className="text-sm font-medium">
                      {fundamentalData.supply.circulating ? 
                        `${(fundamentalData.supply.circulating / 1e6).toFixed(1)}M` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total:</span>
                    <span className="text-sm font-medium">
                      {fundamentalData.supply.total ? 
                        `${(fundamentalData.supply.total / 1e6).toFixed(1)}M` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max:</span>
                    <span className="text-sm font-medium">
                      {fundamentalData.supply.max ? 
                        `${(fundamentalData.supply.max / 1e6).toFixed(1)}M` : 'Unlimited'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">All-Time Records</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">All-Time High</h4>
                    <div className="text-lg font-bold">
                      {formatNumber(fundamentalData.allTimeHigh.price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {fundamentalData.allTimeHigh.date ? 
                        new Date(fundamentalData.allTimeHigh.date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className={`text-sm font-medium ${getPercentageColor(fundamentalData.allTimeHigh.percentFromAth)}`}>
                      {formatPercentage(fundamentalData.allTimeHigh.percentFromAth)} from ATH
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">All-Time Low</h4>
                    <div className="text-lg font-bold">
                      {formatNumber(fundamentalData.allTimeLow.price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {fundamentalData.allTimeLow.date ? 
                        new Date(fundamentalData.allTimeLow.date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className={`text-sm font-medium ${getPercentageColor(fundamentalData.allTimeLow.percentFromAtl)}`}>
                      {formatPercentage(fundamentalData.allTimeLow.percentFromAtl)} from ATL
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Historical Price Data</h2>
            <div className="flex gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="180d">180 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={fetchHistoricalData} 
                disabled={loading === 'historical'}
              >
                {loading === 'historical' ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {historicalData && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historical Data Overview</CardTitle>
                  <CardDescription>
                    {historicalData.metadata.totalPoints} data points from{' '}
                    {historicalData.metadata.startDate ? 
                      new Date(historicalData.metadata.startDate).toLocaleDateString() : 'N/A'} to{' '}
                    {historicalData.metadata.endDate ? 
                      new Date(historicalData.metadata.endDate).toLocaleDateString() : 'N/A'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Data Points</div>
                      <div className="text-2xl font-bold">{historicalData.metadata.totalPoints}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Currency</div>
                      <div className="text-2xl font-bold">{historicalData.currency}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Timeframe</div>
                      <div className="text-2xl font-bold">{historicalData.timeframe}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Symbol</div>
                      <div className="text-2xl font-bold">{historicalData.symbol}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Price History Sample (Latest 10 Points)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {historicalData.prices.slice(-10).map((point, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div className="text-sm">
                          {new Date(point.date).toLocaleDateString()}
                        </div>
                        <div className="font-medium">
                          {currency === 'USD' && formatNumber(point.price)}
                          {currency === 'BTC' && `₿${point.price.toFixed(8)}`}
                          {currency === 'ETH' && `Ξ${point.price.toFixed(6)}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Vol: {point.volume ? formatNumber(point.volume, 0) : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Market Statistics</h2>
            <Button 
              onClick={fetchMarketStats} 
              disabled={loading === 'stats'}
            >
              {loading === 'stats' ? 'Loading...' : 'Refresh Stats'}
            </Button>
          </div>

          {marketStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Market Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Rank:</span>
                    <Badge variant="outline">#{marketStats.marketMetrics.rank || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Market Cap:</span>
                    <span className="text-sm font-medium">
                      {formatNumber(marketStats.marketMetrics.marketCap, 1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">24h Volume:</span>
                    <span className="text-sm font-medium">
                      {formatNumber(marketStats.marketMetrics.volume24h, 1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Vol/MCap Ratio:</span>
                    <span className="text-sm font-medium">
                      {marketStats.marketMetrics.volumeMarketCapRatio ? 
                        (marketStats.marketMetrics.volumeMarketCapRatio * 100).toFixed(2) + '%' : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Supply Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Circulating:</span>
                    <span className="text-sm font-medium">
                      {marketStats.marketMetrics.circulatingSupply ? 
                        `${(marketStats.marketMetrics.circulatingSupply / 1e6).toFixed(1)}M` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total:</span>
                    <span className="text-sm font-medium">
                      {marketStats.marketMetrics.totalSupply ? 
                        `${(marketStats.marketMetrics.totalSupply / 1e6).toFixed(1)}M` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max:</span>
                    <span className="text-sm font-medium">
                      {marketStats.marketMetrics.maxSupply ? 
                        `${(marketStats.marketMetrics.maxSupply / 1e6).toFixed(1)}M` : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Supply %:</span>
                    <span className="text-sm font-medium">
                      {marketStats.marketMetrics.supplyPercentage ? 
                        `${marketStats.marketMetrics.supplyPercentage.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Price Records</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Current Price:</span>
                    <span className="text-sm font-medium">
                      {formatNumber(marketStats.priceMetrics.currentPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ATH Price:</span>
                    <span className="text-sm font-medium">
                      {formatNumber(marketStats.priceMetrics.athPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">ATL Price:</span>
                    <span className="text-sm font-medium">
                      {formatNumber(marketStats.priceMetrics.atlPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">From ATH:</span>
                    <span className={`text-sm font-medium ${getPercentageColor(marketStats.priceMetrics.percentFromAth)}`}>
                      {formatPercentage(marketStats.priceMetrics.percentFromAth)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">1h</div>
                      <div className={`text-lg font-bold ${getPercentageColor(marketStats.performanceMetrics.change1h)}`}>
                        {formatPercentage(marketStats.performanceMetrics.change1h)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">24h</div>
                      <div className={`text-lg font-bold ${getPercentageColor(marketStats.performanceMetrics.change24h)}`}>
                        {formatPercentage(marketStats.performanceMetrics.change24h)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">7d</div>
                      <div className={`text-lg font-bold ${getPercentageColor(marketStats.performanceMetrics.change7d)}`}>
                        {formatPercentage(marketStats.performanceMetrics.change7d)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">30d</div>
                      <div className={`text-lg font-bold ${getPercentageColor(marketStats.performanceMetrics.change30d)}`}>
                        {formatPercentage(marketStats.performanceMetrics.change30d)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">1y</div>
                      <div className={`text-lg font-bold ${getPercentageColor(marketStats.performanceMetrics.change1y)}`}>
                        {formatPercentage(marketStats.performanceMetrics.change1y)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="price" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Real-Time Price Data</h2>
            <Button 
              onClick={fetchPriceData} 
              disabled={loading === 'price'}
            >
              {loading === 'price' ? 'Loading...' : 'Refresh Price'}
            </Button>
          </div>

          {priceData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">USD Price</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatNumber(priceData.prices.usd)}
                  </div>
                  <div className={`text-sm font-medium flex items-center mt-1 ${getPercentageColor(priceData.changes.percent24h)}`}>
                    {priceData.changes.percent24h && priceData.changes.percent24h >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(priceData.changes.percent24h)} (24h)
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">BTC Price</CardTitle>
                  <div className="text-orange-500">₿</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₿{priceData.prices.btc?.toFixed(8) || 'N/A'}
                  </div>
                  <div className={`text-sm font-medium flex items-center mt-1 ${getPercentageColor(priceData.changes.percent1h)}`}>
                    {priceData.changes.percent1h && priceData.changes.percent1h >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(priceData.changes.percent1h)} (1h)
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ETH Price</CardTitle>
                  <div className="text-blue-500">Ξ</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Ξ{priceData.prices.eth?.toFixed(6) || 'N/A'}
                  </div>
                  <div className={`text-sm font-medium flex items-center mt-1 ${getPercentageColor(priceData.changes.percent7d)}`}>
                    {priceData.changes.percent7d && priceData.changes.percent7d >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {formatPercentage(priceData.changes.percent7d)} (7d)
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(priceData.volume.usd24h, 1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trading volume in last 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(priceData.marketCap.usd, 1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rank #{priceData.marketCap.rank || 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {new Date(priceData.lastUpdated).toLocaleTimeString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(priceData.lastUpdated).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}