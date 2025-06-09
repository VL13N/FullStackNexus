import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, Play, Square, Database, Activity, TrendingUp } from 'lucide-react';

interface TrainingConfig {
  symbol: string;
  epochs: number;
  batchSize: number;
  validationSplit: number;
}

interface TrainingResults {
  success: boolean;
  training_results: {
    epochs: number;
    finalLoss: number;
    finalAccuracy: number;
    validationLoss: number;
    validationAccuracy: number;
    history: {
      loss: number[];
      acc: number[];
      val_loss: number[];
      val_acc: number[];
    };
  };
  model_saved: string;
}

interface ModelStatus {
  model_available: boolean;
  metadata_available: boolean;
  metadata: {
    trainingDate: string;
    modelVersion: string;
    results: TrainingResults['training_results'];
  } | null;
}

export default function MLTraining() {
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    symbol: 'SOL',
    epochs: 50,
    batchSize: 16,
    validationSplit: 0.2
  });

  const [isTraining, setIsTraining] = useState(false);
  const [trainingResults, setTrainingResults] = useState<TrainingResults | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      const response = await fetch('/api/ml/model/status');
      const data = await response.json();
      setModelStatus(data);
    } catch (error) {
      console.error('Failed to check model status:', error);
    }
  };

  const startTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setCurrentEpoch(0);
    
    try {
      const response = await fetch('/api/ml/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingConfig),
      });

      const data = await response.json();
      setTrainingResults(data);
      checkModelStatus(); // Refresh model status
    } catch (error) {
      console.error('Training failed:', error);
    } finally {
      setIsTraining(false);
    }
  };

  const formatTrainingData = (results: TrainingResults['training_results']) => {
    if (!results.history) return [];
    
    return results.history.loss.map((loss, index) => ({
      epoch: index + 1,
      loss: loss,
      accuracy: results.history.acc[index] * 100,
      val_loss: results.history.val_loss[index],
      val_accuracy: results.history.val_acc[index] * 100
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="h-6 w-6" />
        <h1 className="text-2xl font-bold">TensorFlow.js ML Training</h1>
      </div>

      {/* Model Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Model Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <span>Model Available:</span>
              <Badge variant={modelStatus?.model_available ? "default" : "secondary"}>
                {modelStatus?.model_available ? "Yes" : "No"}
              </Badge>
            </div>
            {modelStatus?.metadata && (
              <>
                <div className="flex items-center space-x-2">
                  <span>Version:</span>
                  <Badge variant="outline">{modelStatus.metadata.modelVersion}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Last Trained:</span>
                  <Badge variant="outline">
                    {new Date(modelStatus.metadata.trainingDate).toLocaleDateString()}
                  </Badge>
                </div>
              </>
            )}
          </div>
          
          {modelStatus?.metadata && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(modelStatus.metadata.results.finalAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Training Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(modelStatus.metadata.results.validationAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Validation Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {modelStatus.metadata.results.finalLoss.toFixed(4)}
                </div>
                <div className="text-sm text-gray-600">Final Loss</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {modelStatus.metadata.results.epochs}
                </div>
                <div className="text-sm text-gray-600">Epochs</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Training Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure LSTM + Transformer model training parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <select
                value={trainingConfig.symbol}
                onChange={(e) => setTrainingConfig({...trainingConfig, symbol: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isTraining}
              >
                <option value="SOL">Solana (SOL)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Epochs</label>
              <input
                type="number"
                value={trainingConfig.epochs}
                onChange={(e) => setTrainingConfig({...trainingConfig, epochs: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="200"
                disabled={isTraining}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Batch Size</label>
              <input
                type="number"
                value={trainingConfig.batchSize}
                onChange={(e) => setTrainingConfig({...trainingConfig, batchSize: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
                min="4"
                max="128"
                disabled={isTraining}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Validation Split</label>
              <input
                type="number"
                value={trainingConfig.validationSplit}
                step="0.1"
                onChange={(e) => setTrainingConfig({...trainingConfig, validationSplit: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
                min="0.1"
                max="0.5"
                disabled={isTraining}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={startTraining}
              disabled={isTraining}
              className="flex items-center space-x-2"
            >
              {isTraining ? (
                <>
                  <Square className="h-4 w-4" />
                  <span>Training...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Training</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Training Progress */}
      {isTraining && (
        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Epoch {currentEpoch} / {trainingConfig.epochs}</span>
                  <span>{trainingProgress.toFixed(1)}%</span>
                </div>
                <Progress value={trainingProgress} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Results */}
      {trainingResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Training Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(trainingResults.training_results.finalAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Final Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(trainingResults.training_results.validationAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Validation Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {trainingResults.training_results.finalLoss.toFixed(4)}
                </div>
                <div className="text-sm text-gray-600">Final Loss</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {trainingResults.training_results.epochs}
                </div>
                <div className="text-sm text-gray-600">Epochs Completed</div>
              </div>
            </div>

            {trainingResults.training_results.history && (
              <div className="h-64">
                <h3 className="text-lg font-semibold mb-4">Training History</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatTrainingData(trainingResults.training_results)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" name="Training Accuracy" />
                    <Line type="monotone" dataKey="val_accuracy" stroke="#10b981" name="Validation Accuracy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Model Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle>Model Architecture</CardTitle>
          <CardDescription>
            LSTM + Transformer hybrid model for cryptocurrency prediction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Input Features (40 total)</h4>
              <ul className="space-y-1 text-sm">
                <li>• Technical Indicators: 14 features (RSI, MACD, EMA, SMA, etc.)</li>
                <li>• Social Metrics: 8 features (Galaxy Score, sentiment, volume)</li>
                <li>• Fundamental Data: 8 features (price changes, market cap)</li>
                <li>• Astrological Factors: 10 features (moon phases, aspects)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Architecture Components</h4>
              <ul className="space-y-1 text-sm">
                <li>• LSTM Layers: 128 → 64 units with dropout</li>
                <li>• Self-Attention: Query/Key/Value mechanism</li>
                <li>• Feed-Forward: 256 → 64 units with residual connections</li>
                <li>• Domain Branches: Specialized processing per data type</li>
                <li>• Output: 3-class classification (Bullish/Neutral/Bearish)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}