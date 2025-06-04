import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, TrendingUp, Users, Star, AlertCircle } from 'lucide-react';

interface SocialMetrics {
  symbol: string;
  name: string;
  price: number | null;
  priceChange24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  galaxyScore: number | null;
  altRank: number | null;
  socialVolume: number | null;
  socialScore: number | null;
  socialContributors: number | null;
  socialDominance: number | null;
  marketDominance: number | null;
  correlationRank: number | null;
  volatility: number | null;
}

interface LunarCrushResponse {
  success: boolean;
  type?: string;
  symbol?: string;
  interval?: string;
  data?: SocialMetrics;
  timestamp: string;
  error?: string;
}

export default function LunarCrushDemo() {
  const [metricsData, setMetricsData] = useState<LunarCrushResponse | null>(null);
  const [socialData, setSocialData] = useState<LunarCrushResponse | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async (endpoint: string, setter: Function, key: string) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    
    try {
      const response = await fetch(`/api/lunarcrush/${endpoint}`);
      const data = await response.json();
      setter(data);
      
      if (!data.success) {
        setErrors(prev => ({ ...prev, [key]: data.error || 'API request failed' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [key]: 'Network error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const fetchMetrics = () => fetchData('metrics', setMetricsData, 'metrics');
  const fetchSocial = () => fetchData('social', setSocialData, 'social');

  const fetchAllData = async () => {
    await Promise.all([
      fetchMetrics(),
      fetchSocial()
    ]);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatNumber = (value: number | null, prefix = '', suffix = '') => {
    if (value === null || value === undefined) return 'N/A';
    
    if (value >= 1e9) {
      return `${prefix}${(value / 1e9).toFixed(2)}B${suffix}`;
    } else if (value >= 1e6) {
      return `${prefix}${(value / 1e6).toFixed(2)}M${suffix}`;
    } else if (value >= 1e3) {
      return `${prefix}${(value / 1e3).toFixed(2)}K${suffix}`;
    } else {
      return `${prefix}${value.toFixed(2)}${suffix}`;
    }
  };

  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</span>;
  };

  const getScoreColor = (score: number | null, max = 100) => {
    if (score === null || score === undefined) return 'text-gray-500';
    const percentage = (score / max) * 100;
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            LunarCrush Social Metrics
          </h2>
          <p className="text-muted-foreground">
            Social sentiment analysis and Galaxy Score for cryptocurrency insights
          </p>
        </div>
        <Button onClick={fetchAllData} disabled={Object.values(loading).some(Boolean)}>
          {Object.values(loading).some(Boolean) ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {(errors.metrics || errors.social) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-semibold">API Authentication Issue</div>
              <div className="text-sm">
                LunarCrush API key may be invalid or expired. Please check your API credentials.
              </div>
              {errors.metrics && <div className="text-xs text-red-600">Metrics: {errors.metrics}</div>}
              {errors.social && <div className="text-xs text-red-600">Social: {errors.social}</div>}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Social Metrics
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Sentiment Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Galaxy Score & AltRank
                </CardTitle>
                <CardDescription>
                  LunarCrush proprietary scoring metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.metrics ? (
                  <div className="text-center py-8">Loading metrics...</div>
                ) : metricsData?.success && metricsData.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {metricsData.data.galaxyScore || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">Galaxy Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {metricsData.data.altRank || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">AltRank</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Social Score:</span>
                        <span className={getScoreColor(metricsData.data.socialScore)}>
                          {metricsData.data.socialScore || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Social Volume:</span>
                        <span>{formatNumber(metricsData.data.socialVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contributors:</span>
                        <span>{formatNumber(metricsData.data.socialContributors)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {errors.metrics ? 'Authentication required' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Metrics
                </CardTitle>
                <CardDescription>
                  Price and market data from LunarCrush
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.metrics ? (
                  <div className="text-center py-8">Loading metrics...</div>
                ) : metricsData?.success && metricsData.data ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-mono">
                          {formatNumber(metricsData.data.price, '$')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>24h Change:</span>
                        <span>{formatPercentage(metricsData.data.priceChange24h)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume 24h:</span>
                        <span>{formatNumber(metricsData.data.volume24h, '$')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Cap:</span>
                        <span>{formatNumber(metricsData.data.marketCap, '$')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volatility:</span>
                        <span>{formatPercentage(metricsData.data.volatility)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {errors.metrics ? 'Authentication required' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Social Dominance Analysis
              </CardTitle>
              <CardDescription>
                Market and social positioning metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.metrics || loading.social ? (
                <div className="text-center py-8">Loading analysis...</div>
              ) : metricsData?.success && metricsData.data ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {formatPercentage(metricsData.data.socialDominance)}
                    </div>
                    <div className="text-sm text-muted-foreground">Social Dominance</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {formatPercentage(metricsData.data.marketDominance)}
                    </div>
                    <div className="text-sm text-muted-foreground">Market Dominance</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {metricsData.data.correlationRank || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Correlation Rank</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Social analysis requires valid API authentication
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Database className="h-4 w-4" />
              <span className="font-semibold">Powered by LunarCrush API</span>
            </div>
            <p>
              Social sentiment analysis, Galaxy Score, and AltRank metrics for cryptocurrency insights.
              API authentication required for real-time data access.
            </p>
            {metricsData && (
              <p className="mt-2 text-xs">
                Last updated: {new Date(metricsData.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}