import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, BarChart3, RefreshCw, ExternalLink } from 'lucide-react';

interface PredictionResult {
  prediction: number;
  confidence: number;
  features_used?: string[];
  pillar_scores?: {
    technical: number;
    social: number;
    fundamental: number;
    astrology: number;
  };
  timestamp?: string;
}

interface TensorFlowPrediction {
  prediction: string;
  confidence: number;
  direction: string;
  features: Record<string, number>;
}

export default function EnsembleComparison() {
  const [tensorflowPrediction, setTensorflowPrediction] = useState<TensorFlowPrediction | null>(null);
  const [ensemblePrediction, setEnsemblePrediction] = useState<PredictionResult | null>(null);
  const [isLoadingTF, setIsLoadingTF] = useState(false);
  const [isLoadingEnsemble, setIsLoadingEnsemble] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchTensorFlowPrediction = async () => {
    setIsLoadingTF(true);
    try {
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live: true })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTensorflowPrediction(data);
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('TensorFlow prediction failed:', error);
    } finally {
      setIsLoadingTF(false);
    }
  };

  const fetchEnsemblePrediction = async () => {
    setIsLoadingEnsemble(true);
    try {
      // First get current market features
      const featuresResponse = await fetch('/api/ml/features');
      if (!featuresResponse.ok) throw new Error('Failed to fetch features');
      
      const features = await featuresResponse.json();
      
      const response = await fetch('/api/ensemble/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      
      if (response.ok) {
        const data = await response.json();
        setEnsemblePrediction(data);
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Ensemble prediction failed:', error);
    } finally {
      setIsLoadingEnsemble(false);
    }
  };

  const fetchBothPredictions = async () => {
    await Promise.all([
      fetchTensorFlowPrediction(),
      fetchEnsemblePrediction()
    ]);
  };

  useEffect(() => {
    fetchBothPredictions();
  }, []);

  const getPredictionColor = (prediction: number | string) => {
    const value = typeof prediction === 'string' ? parseFloat(prediction) : prediction;
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPredictionDirection = (prediction: number | string) => {
    const value = typeof prediction === 'string' ? parseFloat(prediction) : prediction;
    if (value > 0.5) return 'BULLISH';
    if (value < -0.5) return 'BEARISH';
    return 'NEUTRAL';
  };

  const formatPrediction = (prediction: number | string) => {
    const value = typeof prediction === 'string' ? parseFloat(prediction) : prediction;
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Ensemble Model Comparison
          </h1>
          <p className="text-gray-600 mt-2">
            Compare TensorFlow.js and Python ensemble predictions side by side
          </p>
        </div>
        
        <Button
          onClick={fetchBothPredictions}
          disabled={isLoadingTF || isLoadingEnsemble}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${(isLoadingTF || isLoadingEnsemble) ? 'animate-spin' : ''}`} />
          Refresh Predictions
        </Button>
      </div>

      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated}
        </div>
      )}

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
          <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="explainability">Model Explainability</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TensorFlow Prediction */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  TensorFlow.js Model
                </CardTitle>
                <CardDescription>
                  Real-time neural network prediction with LSTM layers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingTF ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : tensorflowPrediction ? (
                  <>
                    <div className="text-center space-y-2">
                      <div className={`text-4xl font-bold ${getPredictionColor(tensorflowPrediction.prediction)}`}>
                        {formatPrediction(tensorflowPrediction.prediction)}
                      </div>
                      <Badge variant={tensorflowPrediction.direction === 'BULLISH' ? 'default' : 
                                   tensorflowPrediction.direction === 'BEARISH' ? 'destructive' : 'secondary'}>
                        {tensorflowPrediction.direction}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span>{(tensorflowPrediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={tensorflowPrediction.confidence * 100} className="h-2" />
                    </div>

                    {tensorflowPrediction.features && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Key Features</h4>
                        {Object.entries(tensorflowPrediction.features).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="capitalize">{key.replace('_', ' ')}</span>
                            <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-500 p-8">
                    Click refresh to load prediction
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ensemble Prediction */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Python Ensemble Model
                </CardTitle>
                <CardDescription>
                  XGBoost + Random Forest ensemble with meta-learner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingEnsemble ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : ensemblePrediction ? (
                  <>
                    <div className="text-center space-y-2">
                      <div className={`text-4xl font-bold ${getPredictionColor(ensemblePrediction.prediction)}`}>
                        {formatPrediction(ensemblePrediction.prediction)}
                      </div>
                      <Badge variant={getPredictionDirection(ensemblePrediction.prediction) === 'BULLISH' ? 'default' : 
                                   getPredictionDirection(ensemblePrediction.prediction) === 'BEARISH' ? 'destructive' : 'secondary'}>
                        {getPredictionDirection(ensemblePrediction.prediction)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence</span>
                        <span>{(ensemblePrediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={ensemblePrediction.confidence * 100} className="h-2" />
                    </div>

                    {ensemblePrediction.pillar_scores && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Pillar Scores</h4>
                        {Object.entries(ensemblePrediction.pillar_scores).map(([pillar, score]) => (
                          <div key={pillar} className="flex justify-between text-xs">
                            <span className="capitalize">{pillar}</span>
                            <span>{score.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-500 p-8">
                    Click refresh to load prediction
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparison Summary */}
          {tensorflowPrediction && ensemblePrediction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Model Agreement Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.abs(parseFloat(tensorflowPrediction.prediction) - ensemblePrediction.prediction).toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600">Prediction Difference</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.abs(tensorflowPrediction.confidence - ensemblePrediction.confidence).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Confidence Difference</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {tensorflowPrediction.direction === getPredictionDirection(ensemblePrediction.prediction) ? 'AGREE' : 'DISAGREE'}
                    </div>
                    <div className="text-sm text-gray-600">Direction Agreement</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>TensorFlow Model Details</CardTitle>
              </CardHeader>
              <CardContent>
                {tensorflowPrediction?.features ? (
                  <div className="space-y-2">
                    {Object.entries(tensorflowPrediction.features).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        <span>{typeof value === 'number' ? value.toFixed(4) : value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    No detailed features available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ensemble Model Details</CardTitle>
              </CardHeader>
              <CardContent>
                {ensemblePrediction?.features_used ? (
                  <div className="space-y-2">
                    {ensemblePrediction.features_used.map((feature) => (
                      <div key={feature} className="text-sm">
                        <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 p-4">
                    No detailed features available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="explainability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Model Explainability Report
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/shap_report.html', '_blank')}
                  className="ml-auto flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Full Report
                </Button>
              </CardTitle>
              <CardDescription>
                Interactive SHAP analysis showing feature importance and attribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 border rounded-lg overflow-hidden">
                <iframe
                  src="/shap_report.html"
                  className="w-full h-full"
                  title="SHAP Explainability Report"
                  style={{ border: 'none' }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}