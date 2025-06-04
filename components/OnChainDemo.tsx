import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Activity, Database, TrendingUp, Clock } from 'lucide-react';

interface NetworkMetrics {
  success: boolean;
  type: string;
  data: {
    timestamp: string;
    source: string;
    network: {
      currentSlot: number | null;
      blockHeight: number | null;
      epoch: number | null;
      slotIndex: number | null;
      slotsInEpoch: number | null;
      absoluteSlot: number | null;
      transactionCount: number | null;
      epochProgress: string | null;
    };
    note?: string;
  };
  timestamp: string;
}

interface ValidatorStats {
  success: boolean;
  type: string;
  data: {
    source: string;
    timestamp: string;
    overview: {
      totalValidators: number | null;
      activeValidators: number | null;
      averageApy: number | null;
      totalStake: number | null;
      averageCommission: number | null;
    };
    topValidators: any[];
  };
  timestamp: string;
}

export default function OnChainDemo() {
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(null);
  const [validatorStats, setValidatorStats] = useState<ValidatorStats | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchNetworkMetrics = async () => {
    setLoading(prev => ({ ...prev, network: true }));
    setErrors(prev => ({ ...prev, network: '' }));
    
    try {
      const response = await fetch('/api/onchain/metrics');
      const data = await response.json();
      
      if (data.success) {
        setNetworkMetrics(data);
      } else {
        setErrors(prev => ({ ...prev, network: data.error || 'Failed to fetch network metrics' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, network: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }));
    } finally {
      setLoading(prev => ({ ...prev, network: false }));
    }
  };

  const fetchValidatorStats = async () => {
    setLoading(prev => ({ ...prev, validators: true }));
    setErrors(prev => ({ ...prev, validators: '' }));
    
    try {
      const response = await fetch('/api/onchain/validators');
      const data = await response.json();
      
      if (data.success) {
        setValidatorStats(data);
      } else {
        setErrors(prev => ({ ...prev, validators: data.error || 'Failed to fetch validator stats' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, validators: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` }));
    } finally {
      setLoading(prev => ({ ...prev, validators: false }));
    }
  };

  const formatNumber = (num: number | null): string => {
    if (num === null) return 'N/A';
    return new Intl.NumberFormat().format(num);
  };

  const formatProgress = (progress: string | null): string => {
    if (!progress) return 'N/A';
    return `${progress}%`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Solana On-Chain Metrics</h1>
        <p className="text-muted-foreground">
          Real-time blockchain data from Solana network including network metrics, validator statistics, and epoch information.
        </p>
      </div>

      <Tabs defaultValue="network" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="network">Network Metrics</TabsTrigger>
          <TabsTrigger value="validators">Validators</TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-Time Network Metrics
              </CardTitle>
              <CardDescription>
                Current Solana blockchain statistics and epoch information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={fetchNetworkMetrics}
                disabled={loading.network}
                className="w-full sm:w-auto"
              >
                {loading.network ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching Metrics...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Fetch Network Metrics
                  </>
                )}
              </Button>

              {errors.network && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.network}</AlertDescription>
                </Alert>
              )}

              {networkMetrics && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Network Status</h3>
                    <Badge variant="outline">
                      Source: {networkMetrics.data.source}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Current Slot</div>
                        <div className="text-2xl font-bold">
                          {formatNumber(networkMetrics.data.network.currentSlot)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Block Height</div>
                        <div className="text-2xl font-bold">
                          {formatNumber(networkMetrics.data.network.blockHeight)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Current Epoch</div>
                        <div className="text-2xl font-bold">
                          {formatNumber(networkMetrics.data.network.epoch)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Epoch Progress</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatProgress(networkMetrics.data.network.epochProgress)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Slot Index</div>
                        <div className="text-2xl font-bold">
                          {formatNumber(networkMetrics.data.network.slotIndex)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Transaction Count</div>
                        <div className="text-2xl font-bold">
                          {formatNumber(networkMetrics.data.network.transactionCount)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {networkMetrics.data.note && (
                    <Alert>
                      <AlertDescription>{networkMetrics.data.note}</AlertDescription>
                    </Alert>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date(networkMetrics.data.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validators">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Validator Statistics
              </CardTitle>
              <CardDescription>
                Solana validator network overview and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={fetchValidatorStats}
                disabled={loading.validators}
                className="w-full sm:w-auto"
              >
                {loading.validators ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching Validators...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Fetch Validator Stats
                  </>
                )}
              </Button>

              {errors.validators && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.validators}</AlertDescription>
                </Alert>
              )}

              {validatorStats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Validator Overview</h3>
                    <Badge variant="outline">
                      Source: {validatorStats.data.source}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total Validators</div>
                        <div className="text-2xl font-bold">
                          {formatNumber(validatorStats.data.overview.totalValidators)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Active Validators</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatNumber(validatorStats.data.overview.activeValidators)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Average APY</div>
                        <div className="text-2xl font-bold">
                          {validatorStats.data.overview.averageApy 
                            ? `${validatorStats.data.overview.averageApy.toFixed(2)}%`
                            : 'N/A'
                          }
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total Stake</div>
                        <div className="text-2xl font-bold">
                          {formatNumber(validatorStats.data.overview.totalStake)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Average Commission</div>
                        <div className="text-2xl font-bold">
                          {validatorStats.data.overview.averageCommission 
                            ? `${validatorStats.data.overview.averageCommission.toFixed(2)}%`
                            : 'N/A'
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {validatorStats.data.overview.totalValidators === null && (
                    <Alert>
                      <AlertDescription>
                        Complete validator metrics require API authentication. Enhanced data sources available with API keys.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date(validatorStats.data.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            API Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Solana RPC (Network Metrics)</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Validator APIs (Enhanced Metrics)</span>
              <Badge variant="secondary">Authentication Required</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}