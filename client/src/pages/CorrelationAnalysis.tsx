/**
 * Cross-Asset and Inter-Pillar Correlation Analysis Dashboard
 * Interactive heatmap visualization for SOL pillars and crypto asset correlations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Activity, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, Cell } from 'recharts';

interface CorrelationData {
  timestamp: string;
  period_days: number;
  data_points: number;
  correlation_matrix: Record<string, Record<string, number>>;
  variables: string[];
  insights: {
    strongest_correlations: Array<{
      variables: [string, string];
      correlation: number;
      interpretation: string;
    }>;
    weakest_correlations: Array<{
      variables: [string, string];
      correlation: number;
      interpretation: string;
    }>;
    pillar_relationships: Record<string, Record<string, number>>;
    asset_relationships: Record<string, Record<string, number>>;
    summary: {
      mean_correlation: number;
      max_correlation: number;
      min_correlation: number;
      high_correlation_count: number;
      moderate_correlation_count: number;
      weak_correlation_count: number;
    };
  };
}

interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  correlation: number;
}

export default function CorrelationAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Fetch correlation data
  const { data: correlationData, isLoading, error } = useQuery({
    queryKey: ['/api/analysis/correlations', selectedPeriod],
    queryFn: () => apiRequest(`/api/analysis/correlations?days=${selectedPeriod}`),
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 180000 // Consider stale after 3 minutes
  });

  // Fetch correlation matrix for heatmap
  const { data: matrixData } = useQuery({
    queryKey: ['/api/analysis/correlations/matrix'],
    refetchInterval: 300000
  });

  // Fetch insights
  const { data: insightsData } = useQuery({
    queryKey: ['/api/analysis/correlations/insights'],
    refetchInterval: 300000
  });

  // Force refresh mutation
  const refreshMutation = useMutation({
    mutationFn: (days: string) => apiRequest('/api/analysis/correlations/compute', {
      method: 'POST',
      body: JSON.stringify({ days: parseInt(days) })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/correlations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/correlations/matrix'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/correlations/insights'] });
      toast({ title: 'Correlation analysis refreshed successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to refresh correlation analysis',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const data = correlationData?.success ? correlationData.data : null;
  const matrix = matrixData?.success ? matrixData.matrix : null;
  const variables = matrixData?.success ? matrixData.variables : [];
  const insights = insightsData?.success ? insightsData.insights : null;

  const handleRefresh = () => {
    refreshMutation.mutate(selectedPeriod);
  };

  const formatCorrelation = (value: number) => {
    return (value >= 0 ? '+' : '') + value.toFixed(3);
  };

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return correlation > 0 ? '#059669' : '#DC2626'; // Strong positive/negative
    if (abs >= 0.6) return correlation > 0 ? '#10B981' : '#EF4444'; // Moderate positive/negative
    if (abs >= 0.3) return correlation > 0 ? '#34D399' : '#F87171'; // Weak positive/negative
    return '#6B7280'; // No significant correlation
  };

  const getCorrelationIcon = (correlation: number) => {
    if (correlation > 0.3) return <TrendingUp className="h-4 w-4" />;
    if (correlation < -0.3) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getCorrelationStrength = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return 'Strong';
    if (abs >= 0.6) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'None';
  };

  // Create heatmap data
  const heatmapData = matrix && variables ? 
    variables.flatMap((var1, i) => 
      variables.map((var2, j) => ({
        x: var1,
        y: var2,
        value: matrix[var1][var2],
        correlation: matrix[var1][var2],
        xIndex: i,
        yIndex: j
      }))
    ) : [];

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Correlation Analysis Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Failed to load correlation data. Please try refreshing or check the data sources.
            </p>
            <Button onClick={handleRefresh} disabled={refreshMutation.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Correlation Analysis</h1>
          <p className="text-muted-foreground">
            Cross-asset and inter-pillar correlation patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshMutation.isPending}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Analysis Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.period_days} days</div>
              <p className="text-xs text-muted-foreground">
                {data.data_points} data points
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{variables.length}</div>
              <p className="text-xs text-muted-foreground">
                Assets and pillars
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Strong Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights?.summary?.high_correlation_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                |r| ≥ 0.7
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {data.timestamp ? formatDateTime(data.timestamp).split(',')[1] : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {correlationData?.cached ? 'Cached' : 'Fresh'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="heatmap" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="heatmap">Correlation Heatmap</TabsTrigger>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>

        {/* Correlation Heatmap */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Correlation Heatmap
              </CardTitle>
              <CardDescription>
                Pearson correlation coefficients between assets and pillars
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Computing correlations...</p>
                  </div>
                </div>
              ) : matrix && variables.length > 0 ? (
                <div className="space-y-4">
                  {/* Custom Heatmap using CSS Grid */}
                  <div 
                    className="grid gap-1 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    style={{
                      gridTemplateColumns: `120px repeat(${variables.length}, 80px)`,
                      gridTemplateRows: `40px repeat(${variables.length}, 40px)`
                    }}
                  >
                    {/* Empty top-left cell */}
                    <div></div>
                    
                    {/* Column headers */}
                    {variables.map((variable, i) => (
                      <div 
                        key={`col-${i}`}
                        className="text-xs font-medium text-center p-1 transform -rotate-45 origin-center"
                        style={{ writingMode: 'horizontal-tb' }}
                      >
                        {variable.replace('SOL ', '')}
                      </div>
                    ))}
                    
                    {/* Rows */}
                    {variables.map((rowVar, i) => (
                      <React.Fragment key={`row-${i}`}>
                        {/* Row header */}
                        <div className="text-xs font-medium p-1 text-right pr-2">
                          {rowVar.replace('SOL ', '')}
                        </div>
                        
                        {/* Row cells */}
                        {variables.map((colVar, j) => {
                          const correlation = matrix[rowVar][colVar];
                          const isDiagonal = i === j;
                          
                          return (
                            <div
                              key={`cell-${i}-${j}`}
                              className={`
                                w-full h-full flex items-center justify-center text-xs font-medium
                                rounded cursor-pointer transition-all duration-200
                                ${isDiagonal ? 'bg-gray-200 dark:bg-gray-700' : ''}
                                hover:scale-110 hover:z-10 hover:shadow-lg
                              `}
                              style={{
                                backgroundColor: isDiagonal ? undefined : getCorrelationColor(correlation),
                                color: isDiagonal ? undefined : Math.abs(correlation) > 0.5 ? 'white' : 'black'
                              }}
                              onMouseEnter={() => setHoveredCell({
                                x: colVar,
                                y: rowVar,
                                value: correlation,
                                correlation
                              })}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              {isDiagonal ? '1.00' : correlation.toFixed(2)}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Correlation Scale Legend */}
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-600 rounded"></div>
                      <span>Strong Negative (-0.8 to -1.0)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-400 rounded"></div>
                      <span>Moderate Negative (-0.6 to -0.8)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      <span>Weak (-0.3 to 0.3)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-400 rounded"></div>
                      <span>Moderate Positive (0.6 to 0.8)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-600 rounded"></div>
                      <span>Strong Positive (0.8 to 1.0)</span>
                    </div>
                  </div>

                  {/* Hovered Cell Details */}
                  {hoveredCell && (
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              {hoveredCell.y} ↔ {hoveredCell.x}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Correlation: {formatCorrelation(hoveredCell.correlation)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getCorrelationIcon(hoveredCell.correlation)}
                            <Badge variant="outline">
                              {getCorrelationStrength(hoveredCell.correlation)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No correlation data available</p>
                  <p className="text-sm">Click refresh to compute correlations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Insights */}
        <TabsContent value="insights" className="space-y-4">
          {insights ? (
            <>
              {/* Summary Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{insights.summary.mean_correlation.toFixed(3)}</div>
                      <div className="text-sm text-muted-foreground">Mean Correlation</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{insights.summary.max_correlation.toFixed(3)}</div>
                      <div className="text-sm text-muted-foreground">Maximum</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{insights.summary.min_correlation.toFixed(3)}</div>
                      <div className="text-sm text-muted-foreground">Minimum</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strongest Correlations */}
              <Card>
                <CardHeader>
                  <CardTitle>Strongest Correlations</CardTitle>
                  <CardDescription>
                    Variables moving most in sync
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.strongest_correlations.map((correlation, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {correlation.variables[0]} ↔ {correlation.variables[1]}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {correlation.interpretation}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getCorrelationIcon(correlation.correlation)}
                          <Badge 
                            variant="outline"
                            style={{ 
                              backgroundColor: getCorrelationColor(correlation.correlation),
                              color: 'white',
                              borderColor: getCorrelationColor(correlation.correlation)
                            }}
                          >
                            {formatCorrelation(correlation.correlation)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weakest Correlations */}
              <Card>
                <CardHeader>
                  <CardTitle>Independent Variables</CardTitle>
                  <CardDescription>
                    Variables showing little correlation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.weakest_correlations.map((correlation, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {correlation.variables[0]} ↔ {correlation.variables[1]}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {correlation.interpretation}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getCorrelationIcon(correlation.correlation)}
                          <Badge variant="outline">
                            {formatCorrelation(correlation.correlation)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No insights available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Relationships */}
        <TabsContent value="relationships" className="space-y-4">
          {insights ? (
            <>
              {/* Pillar Relationships */}
              <Card>
                <CardHeader>
                  <CardTitle>SOL Pillar Relationships</CardTitle>
                  <CardDescription>
                    Correlations between technical, social, fundamental, and astrology pillars
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(insights.pillar_relationships).map(([pillar1, relationships]) => (
                      <div key={pillar1} className="space-y-2">
                        <h4 className="font-medium text-sm">{pillar1}</h4>
                        <div className="space-y-1">
                          {Object.entries(relationships).map(([pillar2, correlation]) => (
                            <div key={pillar2} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">vs {pillar2.replace('SOL ', '')}</span>
                              <Badge variant="outline" className="text-xs">
                                {formatCorrelation(correlation)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Asset Relationships */}
              <Card>
                <CardHeader>
                  <CardTitle>Cross-Asset Relationships</CardTitle>
                  <CardDescription>
                    Price correlations between BTC, ETH, and SOL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(insights.asset_relationships).map(([asset1, relationships]) => (
                      <div key={asset1} className="space-y-2">
                        <h4 className="font-medium text-sm">{asset1}</h4>
                        <div className="space-y-1">
                          {Object.entries(relationships).map(([asset2, correlation]) => (
                            <div key={asset2} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">vs {asset2.replace(' Price', '')}</span>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{
                                  backgroundColor: Math.abs(correlation) > 0.5 ? getCorrelationColor(correlation) : undefined,
                                  color: Math.abs(correlation) > 0.5 ? 'white' : undefined
                                }}
                              >
                                {formatCorrelation(correlation)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No relationship data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}