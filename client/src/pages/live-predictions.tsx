import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Brain, Moon, BarChart3, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionData {
  prediction: number;
  confidence: number;
  category: string;
  timestamp: string;
  pillarScores: {
    technical: number;
    social: number;
    fundamental: number;
    astrology: number;
  };
}

interface MLModelInfo {
  isLoaded: boolean;
  metadata?: {
    version: string;
    features: string[];
    accuracy: number;
    epochs: number;
    validationLoss: number;
  };
}

const PILLAR_COLORS = {
  technical: '#3b82f6',
  social: '#10b981',
  fundamental: '#f59e0b',
  astrology: '#8b5cf6'
};

const CONFIDENCE_COLORS = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444'
};

export default function LivePredictions() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Fetch ML model info
  const { data: modelInfo } = useQuery<MLModelInfo>({
    queryKey: ['/api/ml/model/info'],
    refetchInterval: autoRefresh ? 30000 : false
  });

  // Fetch latest prediction
  const { data: latestPrediction, isLoading: predictionLoading } = useQuery<PredictionData>({
    queryKey: ['/api/predictions/live'],
    refetchInterval: autoRefresh ? 15000 : false,
    retry: false
  });

  // Fetch prediction history
  const { data: predictionHistory } = useQuery<PredictionData[]>({
    queryKey: ['/api/predictions/history'],
    refetchInterval: autoRefresh ? 60000 : false,
    retry: false
  });

  // Manual prediction trigger
  const triggerPrediction = async () => {
    try {
      const response = await fetch('/api/predictions/trigger', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/predictions/live'] });
        queryClient.invalidateQueries({ queryKey: ['/api/predictions/history'] });
      }
    } catch (error) {
      console.error('Failed to trigger prediction:', error);
    }
  };

  const formatPrediction = (value: number) => {
    const percentage = (value * 100).toFixed(3);
    return `${percentage}%`;
  };

  const getPredictionIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'bullish':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  };

  const pillarData = latestPrediction ? [
    { name: 'Technical', value: latestPrediction.pillarScores.technical, color: PILLAR_COLORS.technical, icon: BarChart3 },
    { name: 'Social', value: latestPrediction.pillarScores.social, color: PILLAR_COLORS.social, icon: Activity },
    { name: 'Fundamental', value: latestPrediction.pillarScores.fundamental, color: PILLAR_COLORS.fundamental, icon: Zap },
    { name: 'Astrology', value: latestPrediction.pillarScores.astrology, color: PILLAR_COLORS.astrology, icon: Moon }
  ] : [];

  const confidenceHistory = predictionHistory?.map(p => ({
    timestamp: new Date(p.timestamp).toLocaleTimeString(),
    confidence: Math.round(p.confidence * 100),
    prediction: p.prediction * 100
  })) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Predictions</h1>
          <p className="text-muted-foreground">Real-time ML predictions with multi-pillar analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button onClick={triggerPrediction} size="sm">
            <Brain className="h-4 w-4 mr-2" />
            Run Prediction
          </Button>
        </div>
      </div>

      {/* ML Model Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            ML Model Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={modelInfo?.isLoaded ? "default" : "destructive"}>
                {modelInfo?.isLoaded ? "Loaded" : "Not Loaded"}
              </Badge>
            </div>
            {modelInfo?.metadata && (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="font-semibold">{(modelInfo.metadata.accuracy * 100).toFixed(2)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Epochs</p>
                  <p className="font-semibold">{modelInfo.metadata.epochs}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Validation Loss</p>
                  <p className="font-semibold">{modelInfo.metadata.validationLoss.toFixed(6)}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Latest Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {latestPrediction && getPredictionIcon(latestPrediction.category)}
            Latest Prediction
          </CardTitle>
          <CardDescription>
            {latestPrediction ? new Date(latestPrediction.timestamp).toLocaleString() : 'No prediction available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predictionLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading prediction...</span>
            </div>
          ) : latestPrediction ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Price Movement</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-3xl font-bold",
                    latestPrediction.prediction > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatPrediction(latestPrediction.prediction)}
                  </span>
                  <Badge variant={latestPrediction.category === 'bullish' ? "default" : "destructive"}>
                    {latestPrediction.category}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{Math.round(latestPrediction.confidence * 100)}%</span>
                    <Badge variant={getConfidenceLevel(latestPrediction.confidence) === 'high' ? "default" : 
                                   getConfidenceLevel(latestPrediction.confidence) === 'medium' ? "secondary" : "destructive"}>
                      {getConfidenceLevel(latestPrediction.confidence)}
                    </Badge>
                  </div>
                  <Progress value={latestPrediction.confidence * 100} className="h-2" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <div className="text-2xl font-bold">
                  {Math.round((latestPrediction.pillarScores.technical + 
                              latestPrediction.pillarScores.social + 
                              latestPrediction.pillarScores.fundamental + 
                              latestPrediction.pillarScores.astrology) / 4)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No prediction data available</p>
              <Button onClick={triggerPrediction} className="mt-4">
                Generate First Prediction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pillar Analysis */}
      {latestPrediction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pillar Scores</CardTitle>
              <CardDescription>Individual analysis pillar contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pillarData.map((pillar) => (
                  <div key={pillar.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <pillar.icon className="h-4 w-4" style={{ color: pillar.color }} />
                        <span className="font-medium">{pillar.name}</span>
                      </div>
                      <span className="font-semibold">{Math.round(pillar.value)}</span>
                    </div>
                    <Progress value={pillar.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pillar Distribution</CardTitle>
              <CardDescription>Relative influence of each analysis pillar</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pillarData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({name, value}) => `${name}: ${Math.round(value)}`}
                  >
                    {pillarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prediction History */}
      {confidenceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction History</CardTitle>
            <CardDescription>Confidence and prediction trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={confidenceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Confidence %" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="prediction" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Prediction %" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}