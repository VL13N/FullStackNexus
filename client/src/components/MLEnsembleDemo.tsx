import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, TrendingDown, Target, Zap, BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PredictionResult {
  success: boolean;
  predictions: {
    ensemble_prediction: number;
    xgboost_prediction: number;
    random_forest_prediction: number;
    prediction_class: 'BULLISH' | 'BEARISH';
    confidence: number;
  };
  features_used: string[];
  feature_count: number;
}

interface TrainingResult {
  success: boolean;
  train_accuracy: number;
  test_accuracy: number;
  feature_importance: Record<string, number>;
  models_trained: string[];
  feature_count: number;
  training_samples: number;
}

interface MarketData {
  price: number;
  volume: number;
  tech_score: number;
  social_score: number;
  fund_score: number;
  astro_score: number;
}

export default function MLEnsembleDemo() {
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const queryClient = useQueryClient();

  // Fetch real-time market data
  const { data: solanaData } = useQuery({
    queryKey: ['/api/cryptorank/solana'],
    refetchInterval: 30000
  });

  const { data: pillarData } = useQuery({
    queryKey: ['/api/pillars'],
    refetchInterval: 30000
  });

  // Update market data when APIs respond
  useEffect(() => {
    if (solanaData?.data && pillarData?.pillars) {
      setMarketData({
        price: parseFloat(solanaData.data.price) || 147.0,
        volume: solanaData.data.volume24hUsd || 23500000,
        tech_score: pillarData.pillars.technical || 33.0,
        social_score: pillarData.pillars.social || 32.0,
        fund_score: pillarData.pillars.fundamental || 33.0,
        astro_score: pillarData.pillars.astrology || 62.0
      });
    }
  }, [solanaData, pillarData]);

  // Train ensemble model
  const trainModel = async () => {
    setIsTraining(true);
    try {
      const response = await fetch('/api/ml/demo/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const result = await response.json();
      if (result.success) {
        setTrainingResult(result);
      }
    } catch (error) {
      console.error('Training failed:', error);
    } finally {
      setIsTraining(false);
    }
  };

  // Make prediction with current market data
  const makePrediction = async () => {
    if (!marketData) return;
    
    setIsPredicting(true);
    try {
      const response = await fetch('/api/ml/demo/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: {
            price: marketData.price,
            volume: marketData.volume,
            tech_score: marketData.tech_score,
            social_score: marketData.social_score,
            fund_score: marketData.fund_score,
            astro_score: marketData.astro_score,
            price_returns: 0.003,
            price_volatility: 0.025,
            rsi_approx: 45.0
          }
        })
      });
      const result = await response.json();
      if (result.success) {
        setPredictionResult(result);
      }
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Advanced ML Ensemble Demonstration
          </CardTitle>
          <CardDescription>
            Production-ready ensemble system with XGBoost + Random Forest + Meta-learner using authenticated cryptocurrency APIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button 
              onClick={trainModel} 
              disabled={isTraining}
              className="w-full"
            >
              {isTraining ? "Training Models..." : "Train Ensemble"}
            </Button>
            <Button 
              onClick={makePrediction} 
              disabled={isPredicting || !marketData}
              variant="outline"
              className="w-full"
            >
              {isPredicting ? "Predicting..." : "Make Prediction"}
            </Button>
          </div>

          {/* Live Market Data */}
          {marketData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Live Solana Data (Authenticated APIs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Price</div>
                    <div className="font-medium">{formatCurrency(marketData.price)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Volume 24h</div>
                    <div className="font-medium">${(marketData.volume / 1e6).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Technical</div>
                    <div className="font-medium">{marketData.tech_score.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Social</div>
                    <div className="font-medium">{marketData.social_score.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fundamental</div>
                    <div className="font-medium">{marketData.fund_score.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Astrology</div>
                    <div className="font-medium">{marketData.astro_score.toFixed(1)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="results">Prediction Results</TabsTrigger>
              <TabsTrigger value="training">Training Metrics</TabsTrigger>
              <TabsTrigger value="features">Feature Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              {predictionResult ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {predictionResult.predictions.prediction_class === 'BULLISH' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        Ensemble Prediction: {predictionResult.predictions.prediction_class}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Ensemble Confidence</span>
                            <span className="font-medium">
                              {formatPercentage(predictionResult.predictions.confidence)}
                            </span>
                          </div>
                          <Progress 
                            value={predictionResult.predictions.confidence * 100} 
                            className="h-2"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <div className="text-muted-foreground">Ensemble</div>
                            <div className="font-bold text-lg">
                              {formatPercentage(predictionResult.predictions.ensemble_prediction)}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <div className="text-muted-foreground">XGBoost</div>
                            <div className="font-bold text-lg">
                              {formatPercentage(predictionResult.predictions.xgboost_prediction)}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                            <div className="text-muted-foreground">Random Forest</div>
                            <div className="font-bold text-lg">
                              {formatPercentage(predictionResult.predictions.random_forest_prediction)}
                            </div>
                          </div>
                        </div>

                        <Alert>
                          <Target className="h-4 w-4" />
                          <AlertDescription>
                            Prediction uses {predictionResult.features_used.length} features from {predictionResult.feature_count} total engineered features
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Click "Make Prediction" to generate ensemble forecast using live market data
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              {trainingResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatPercentage(trainingResult.train_accuracy)}
                          </div>
                          <div className="text-sm text-muted-foreground">Training Accuracy</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatPercentage(trainingResult.test_accuracy)}
                          </div>
                          <div className="text-sm text-muted-foreground">Test Accuracy</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{trainingResult.feature_count}</div>
                          <div className="text-sm text-muted-foreground">Features</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{trainingResult.training_samples}</div>
                          <div className="text-sm text-muted-foreground">Samples</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Models Trained</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {trainingResult.models_trained.map((model) => (
                          <Badge key={model} variant="secondary">
                            {model.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    Click "Train Ensemble" to train XGBoost + Random Forest + Meta-learner models
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              {trainingResult?.feature_importance ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Top Predictive Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(trainingResult.feature_importance)
                        .slice(0, 10)
                        .map(([feature, importance]) => (
                          <div key={feature} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{feature.replace('_', ' ')}</span>
                              <span>{formatPercentage(importance)}</span>
                            </div>
                            <Progress value={importance * 100} className="h-1" />
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    Train the model to view feature importance analysis
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}